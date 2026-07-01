/**
 * VELTRIX Autonomous Agency Pipeline
 *
 * This is the master orchestrator. It runs on a schedule (every 30 min via Netlify Scheduled Functions)
 * and processes ALL leads through the full sales lifecycle with zero human input.
 *
 * Lead State Machine:
 * New → Qualified/Researched → Contacted → Replied → Proposal Sent → Call Booked → Won/Lost
 */

import { db } from '../db';
import { runAgentLogic } from './executor';
import { gemini } from '../ai/gemini';
import { getResendClient, FROM_EMAIL } from '../email/resend';

const BARRY_EMAIL = process.env.NOTIFY_EMAIL || 'tahakh5510@gmail.com';
const MONTHLY_TARGET = 6000;

// Serverless functions time out (~26s). Each lead makes an LLM call, so we can only
// process a handful per invocation. Cap every stage to a small batch; the scheduled
// cron chips away at any backlog across runs instead of timing out on a huge list.
const MAX_PER_RUN = 2;

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipelineRun {
  startedAt: string;
  leadsProcessed: number;
  actionsExecuted: string[];
  errors: string[];
  duration: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

async function notifyBarry(subject: string, body: string) {
  try {
    const resend = getResendClient();
    if (!resend) return;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [BARRY_EMAIL],
      subject: `[VELTRIX] ${subject}`,
      text: body,
    });
  } catch (err) {
    console.warn('[Pipeline] Barry notification failed:', err);
  }
}

async function logAction(action: string, detail: string) {
  try {
    await db.logAgentAction('Pipeline', action, detail, undefined, 'Success');
  } catch {}
}

// ─── Stage 1: Research New Leads ─────────────────────────────────────────────

async function processNewLeads(actions: string[], errors: string[]): Promise<number> {
  const leads = await db.getLeads();
  const newLeads = leads.filter(l => l.status === 'New').slice(0, MAX_PER_RUN);
  let count = 0;

  for (const lead of newLeads) {
    try {
      const result = await runAgentLogic('leadResearch', { leadId: lead.id }, true);
      if (result.success) {
        actions.push(`[Daniel] Researched & scored: ${lead.business_name}`);
        count++;
      }
    } catch (err: any) {
      errors.push(`[Daniel] Failed to research ${lead.business_name}: ${err.message}`);
    }
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300));
  }
  return count;
}

// ─── Stage 2: Outreach to Qualified Leads ────────────────────────────────────

async function processQualifiedLeads(actions: string[], errors: string[]): Promise<number> {
  const leads = await db.getLeads();
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified' && (l.lead_score ?? 0) >= 7).slice(0, MAX_PER_RUN);
  let count = 0;

  for (const lead of qualifiedLeads) {
    try {
      // Pick the right offer based on pain points / industry
      const isChatbot =
        lead.pain_point?.toLowerCase().includes('receptionist') ||
        lead.pain_point?.toLowerCase().includes('call') ||
        lead.industry?.toLowerCase() === 'dental';
      const offerName = isChatbot
        ? 'AI Receptionist / Lead Booking Agent'
        : 'AI Website + Brand System';

      // Decide best channel
      const channel = lead.email ? 'Email' : lead.social_link ? 'LinkedIn' : 'Email';

      const result = await runAgentLogic(
        'outreach',
        { leadId: lead.id, offerName, channel },
        true
      );
      if (result.success) {
        actions.push(`[Emma] Outreach sent to: ${lead.business_name} via ${channel}`);
        count++;

        // If we have a real email and Resend is configured, actually send it
        if (channel === 'Email' && lead.email) {
          const messages = await db.getOutreachMessages();
          const latest = messages
            .filter(m => m.lead_id === lead.id && m.status === 'Sent')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          if (latest) {
            const resend = getResendClient();
            if (resend) {
              try {
                await resend.emails.send({
                  from: FROM_EMAIL,
                  to: [lead.email],
                  subject: `A quick note for ${lead.business_name}`,
                  text: latest.message,
                });
                actions.push(`[Emma] Email delivered to ${lead.email}`);
              } catch (mailErr: any) {
                errors.push(`[Emma] Email delivery failed for ${lead.email}: ${mailErr.message}`);
              }
            } else {
              errors.push(
                `[Emma] Email NOT delivered to ${lead.email} — RESEND_API_KEY is not configured. ` +
                `The message was drafted and logged but never actually sent. ` +
                `Set RESEND_API_KEY (and verify a domain + RESEND_FROM_EMAIL) in Netlify to enable real delivery.`
              );
            }
          }
        }
      }
    } catch (err: any) {
      errors.push(`[Emma] Outreach failed for ${lead.business_name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return count;
}

// ─── Stage 3: Follow-up Sequences ────────────────────────────────────────────

async function processFollowups(actions: string[], errors: string[]): Promise<number> {
  const leads = await db.getLeads();
  const contactedLeads = leads.filter(l =>
    ['Contacted'].includes(l.status)
  ).slice(0, MAX_PER_RUN);
  let count = 0;

  for (const lead of contactedLeads) {
    try {
      const days = daysSince(lead.updated_at || lead.created_at);
      let sequenceDay: number | null = null;

      if (days >= 3 && days < 7) sequenceDay = 3;
      else if (days >= 7 && days < 14) sequenceDay = 7;
      else if (days >= 14 && days < 30) sequenceDay = 14;
      else if (days >= 30) sequenceDay = 30;

      if (!sequenceDay) continue;

      // Check if we already sent this sequence day
      const followups = await db.getFollowups();
      const alreadySent = followups.some(
        f =>
          f.lead_id === lead.id &&
          f.followup_type === `Day ${sequenceDay} Follow-up` &&
          (f.status === 'Sent' || f.status === 'Completed')
      );
      if (alreadySent) continue;

      const result = await runAgentLogic('followup', { leadId: lead.id, sequenceDay }, true);
      if (result.success) {
        actions.push(`[Lucas] Day ${sequenceDay} follow-up sent to: ${lead.business_name}`);
        count++;
      }
    } catch (err: any) {
      errors.push(`[Lucas] Follow-up failed for ${lead.business_name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return count;
}

// ─── Stage 4: Proposal for Replied Leads ─────────────────────────────────────

async function processRepliedLeads(actions: string[], errors: string[]): Promise<number> {
  const leads = await db.getLeads();
  const repliedLeads = leads.filter(l => l.status === 'Replied').slice(0, MAX_PER_RUN);
  let count = 0;

  for (const lead of repliedLeads) {
    try {
      // Check if a proposal already exists
      const proposals = await db.getProposals();
      const hasProposal = proposals.some(p => p.lead_id === lead.id);
      if (hasProposal) continue;

      const isChatbot =
        lead.pain_point?.toLowerCase().includes('receptionist') ||
        lead.pain_point?.toLowerCase().includes('call') ||
        lead.industry?.toLowerCase() === 'dental';

      const offerName = isChatbot
        ? 'AI Receptionist / Lead Booking Agent'
        : 'AI Website + Brand System';
      const price = isChatbot ? 1000 : 1200;

      const result = await runAgentLogic(
        'proposal',
        { leadId: lead.id, offerName, price },
        true
      );
      if (result.success) {
        actions.push(`[Olivia] Proposal sent to: ${lead.business_name} — ${offerName} @ $${price}`);
        count++;
      }
    } catch (err: any) {
      errors.push(`[Olivia] Proposal failed for ${lead.business_name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return count;
}

// ─── Stage 5: Pre-Call Brief for Call Booked Leads ───────────────────────────

export async function generatePreCallBrief(leadId: string): Promise<string> {
  const leads = await db.getLeads();
  const lead = leads.find(l => l.id === leadId);
  if (!lead) throw new Error('Lead not found');

  const messages = await db.getOutreachMessages();
  const leadMessages = messages.filter(m => m.lead_id === leadId);

  const followups = await db.getFollowups();
  const leadFollowups = followups.filter(f => f.lead_id === leadId);

  const proposals = await db.getProposals();
  const leadProposal = proposals.find(p => p.lead_id === leadId);

  const scores = await db.getLeadScores(leadId);
  const latestScore = scores[0];

  const prompt = `
You are preparing a PRE-CALL CLIENT BRIEF for Barry (VELTRIX founder) before he jumps on a discovery call with a potential client.

CLIENT INFORMATION:
- Business Name: ${lead.business_name}
- Contact: ${lead.contact_name || 'Unknown'}
- Industry: ${lead.industry || 'Unknown'}
- Location: ${lead.location || 'Unknown'}
- Website: ${lead.website || 'None'}
- Email: ${lead.email || 'Unknown'}
- Phone: ${lead.phone || 'Unknown'}
- Lead Score: ${lead.lead_score || 0}/10
- Source: ${lead.source || 'Unknown'}
- Pain Points: ${lead.pain_point || 'Not specified'}
- Notes: ${lead.notes || 'None'}

AI RESEARCH SCORES:
${latestScore ? `
- Website Weakness: ${latestScore.website_score}/10
- Brand Weakness: ${latestScore.branding_score}/10
- Automation Need: ${latestScore.automation_need_score}/10
- Ability to Pay: ${latestScore.ability_to_pay_score}/10
- Urgency: ${latestScore.urgency_score}/10
- Reasoning: ${latestScore.reasoning}
` : 'No detailed scoring available'}

OUTREACH HISTORY (${leadMessages.length} messages sent):
${leadMessages.slice(-3).map(m => `[${m.channel}] ${m.message.substring(0, 200)}...`).join('\n\n') || 'No outreach history'}

FOLLOW-UP HISTORY (${leadFollowups.length} follow-ups):
${leadFollowups.map(f => `[${f.followup_type}] ${(f.message || '').substring(0, 150)}...`).join('\n') || 'No follow-ups'}

PROPOSAL SENT:
${leadProposal ? `${leadProposal.title} — $${leadProposal.price} — Status: ${leadProposal.status}` : 'No proposal sent yet'}

Generate a sharp, executive-style pre-call brief for Barry. Include:

1. **WHO THEY ARE** — 2-3 sentences on the business and what they do
2. **WHY THEY'RE TALKING TO US** — The specific pain point that made them engage
3. **WHERE THEY ARE IN THE JOURNEY** — What outreach was sent, what they responded to
4. **WHAT TO PITCH** — The specific VELTRIX offer, price point, and value prop to lead with
5. **LIKELY OBJECTIONS** — Top 3 objections they'll raise and how to handle each
6. **TONE TO USE** — How to approach this person (casual? formal? technical? business-focused?)
7. **DEAL POTENTIAL** — Likelihood of closing (low/medium/high), estimated value
8. **TALK TRACKS** — 3 killer opening questions to ask them on the call
9. **RED FLAGS** — Anything to watch out for (slow payer signals, scope creep risks, etc.)

Keep it sharp, actionable, and under 600 words. Barry needs to be able to read this in 2 minutes before the call starts.
`;

  const brief = await gemini.callRawLLM(
    prompt,
    'You are the VELTRIX CEO Agent preparing a pre-call brief. Be concise, sharp, and strategic. Use clear markdown headers.'
  );

  // Save brief as a high-importance memory
  await db.addMemory({
    type: 'Client',
    content: `PRE-CALL BRIEF — ${lead.business_name}\n\n${brief}`,
    tags: ['pre-call-brief', 'appointment', lead.business_name.toLowerCase().replace(/\s+/g, '-')],
    importance: 10,
    source: 'CEO Agent'
  });

  // Log the action
  await db.logAgentAction(
    'CEO Agent',
    'Pre-Call Brief Generated',
    `leadId=${leadId}, business=${lead.business_name}`,
    brief.substring(0, 500),
    'Success'
  );

  // Notify Barry via email
  await notifyBarry(
    `Pre-Call Brief: ${lead.business_name}`,
    `Hi Barry,\n\nYou have a call coming up with ${lead.business_name}. Here's your brief:\n\n${brief}\n\n— VELTRIX Autonomous Agency`
  );

  return brief;
}

async function processCallBookedLeads(actions: string[], errors: string[]): Promise<number> {
  const leads = await db.getLeads();
  const callLeads = leads.filter(l => l.status === 'Call Booked').slice(0, MAX_PER_RUN);
  let count = 0;

  for (const lead of callLeads) {
    try {
      // Check if brief already generated
      const memories = await db.getMemories();
      const hasBrief = memories.some(
        m =>
          m.tags?.includes('pre-call-brief') &&
          m.content.includes(lead.business_name)
      );
      if (hasBrief) continue;

      await generatePreCallBrief(lead.id);
      actions.push(`[Alex] Pre-call brief generated for: ${lead.business_name} — Barry notified`);
      count++;
    } catch (err: any) {
      errors.push(`[Alex] Pre-call brief failed for ${lead.business_name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return count;
}

// ─── Stage 6: Proposal Follow-up (Proposal Sent → Appointment) ───────────────

async function processProposalSentLeads(actions: string[], errors: string[]): Promise<number> {
  const leads = await db.getLeads();
  const proposalLeads = leads.filter(l => l.status === 'Proposal Sent').slice(0, MAX_PER_RUN);
  let count = 0;

  for (const lead of proposalLeads) {
    try {
      const daysSinceProposal = daysSince(lead.updated_at || lead.created_at);
      if (daysSinceProposal < 5) continue;

      // Check if a followup was already sent after proposal
      const followups = await db.getFollowups();
      const hasProposalFollowup = followups.some(
        f => f.lead_id === lead.id && f.followup_type?.includes('Proposal Follow-up')
      );
      if (hasProposalFollowup) continue;

      // Generate a special "want to hop on a call?" follow-up
      const followupMsg = await gemini.callRawLLM(
        `Draft a brief, casual follow-up message to ${lead.contact_name || 'the owner'} at ${lead.business_name}.
         We sent them a proposal ${daysSinceProposal} days ago and haven't heard back.
         The message should: (1) reference the proposal gently, (2) offer a quick 15-min call to walk through it, (3) be 3 sentences max.
         Do not sound needy. Use a soft "do you have 15 minutes?" CTA.`,
        'You are Emma, the Outreach Agent. Keep it casual and under 4 sentences.'
      );

      await db.addFollowup({
        lead_id: lead.id,
        followup_date: new Date().toISOString().split('T')[0],
        followup_type: 'Proposal Follow-up',
        message: followupMsg,
        status: 'Sent'
      });

      await db.logAgentAction(
        'Follow-up Agent',
        'Proposal Follow-up Sent',
        `leadId=${lead.id}, business=${lead.business_name}`,
        followupMsg,
        'Success'
      );

      actions.push(`[Lucas] Proposal follow-up sent to: ${lead.business_name}`);
      count++;
    } catch (err: any) {
      errors.push(`[Lucas] Proposal follow-up failed for ${lead.business_name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return count;
}

// ─── Master Pipeline Runner ───────────────────────────────────────────────────

export async function runFullPipeline(): Promise<PipelineRun> {
  const start = Date.now();
  const startedAt = new Date().toISOString();
  const actions: string[] = [];
  const errors: string[] = [];

  await logAction('Pipeline Started', `Full autonomous pipeline run initiated at ${startedAt}`);

  try {
    // Stage 1: Research new leads
    const researched = await processNewLeads(actions, errors);

    // Stage 2: Outreach to qualified leads
    const outreached = await processQualifiedLeads(actions, errors);

    // Stage 3: Follow-up sequences
    const followed = await processFollowups(actions, errors);

    // Stage 4: Proposals for replied leads
    const proposed = await processRepliedLeads(actions, errors);

    // Stage 5: Pre-call briefs for call booked leads
    const briefed = await processCallBookedLeads(actions, errors);

    // Stage 6: Proposal follow-ups
    const proposalFollowed = await processProposalSentLeads(actions, errors);

    const leadsProcessed = researched + outreached + followed + proposed + briefed + proposalFollowed;
    const duration = Date.now() - start;

    const summary = {
      startedAt,
      leadsProcessed,
      actionsExecuted: actions,
      errors,
      duration
    };

    await logAction(
      'Pipeline Completed',
      `Processed ${leadsProcessed} leads in ${duration}ms. Actions: ${actions.length}. Errors: ${errors.length}`
    );

    // Save pipeline run result to memory
    if (leadsProcessed > 0 || errors.length > 0) {
      await db.addMemory({
        type: 'Project',
        content: `Autonomous pipeline completed. ${leadsProcessed} leads processed. Actions: ${actions.join('; ')}. ${errors.length > 0 ? 'Errors: ' + errors.join('; ') : ''}`,
        tags: ['pipeline', 'automated', 'run-log'],
        importance: 6,
        source: 'Autonomous Pipeline'
      });
    }

    return summary;
  } catch (err: any) {
    errors.push(`Pipeline fatal error: ${err.message}`);
    await logAction('Pipeline Error', err.message);
    return {
      startedAt,
      leadsProcessed: 0,
      actionsExecuted: actions,
      errors,
      duration: Date.now() - start
    };
  }
}

// ─── Daily Brief Generator ────────────────────────────────────────────────────

export async function generateDailyBrief(): Promise<string> {
  const leads = await db.getLeads();
  const revenues = await db.getRevenue();
  const tasks = await db.getTasks();
  const proposals = await db.getProposals();
  const activities = await db.getAgentLogs();
  const profile = await db.getBusinessProfile();

  const closedRevenue = revenues
    .filter(r => r.status === 'Paid')
    .reduce((acc, r) => acc + Number(r.amount), 0);

  const gap = Math.max(0, (profile.target_monthly_revenue || MONTHLY_TARGET) - closedRevenue);

  const pipelineValue = leads
    .filter(l => ['Qualified', 'Contacted', 'Replied', 'Call Booked', 'Proposal Sent'].includes(l.status))
    .length * 1200; // avg deal value estimate

  const todayActivities = activities
    .filter((a: any) => {
      const d = new Date(a.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    })
    .slice(0, 20);

  const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
  const completedToday = tasks.filter(t => {
    if (t.status !== 'Completed') return false;
    const d = new Date(t.updated_at || t.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  // Leads by stage
  const byStage = {
    new: leads.filter(l => l.status === 'New').length,
    qualified: leads.filter(l => l.status === 'Qualified').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    replied: leads.filter(l => l.status === 'Replied').length,
    proposalSent: leads.filter(l => l.status === 'Proposal Sent').length,
    callBooked: leads.filter(l => l.status === 'Call Booked').length,
    won: leads.filter(l => l.status === 'Won').length
  };

  const prompt = `
Generate a sharp daily operations brief for Barry, the VELTRIX founder. It is 10:00 PM.

TODAY'S METRICS:
- Revenue Target: $${profile.target_monthly_revenue || MONTHLY_TARGET}
- Closed Revenue: $${closedRevenue.toLocaleString()}
- Revenue Gap: $${gap.toLocaleString()}
- Pipeline Value: $${pipelineValue.toLocaleString()}

PIPELINE BREAKDOWN:
- New Leads: ${byStage.new}
- Qualified: ${byStage.qualified}
- Contacted: ${byStage.contacted}
- Replied: ${byStage.replied}
- Proposal Sent: ${byStage.proposalSent}
- Call Booked: ${byStage.callBooked}
- Won: ${byStage.won}

TASK STATUS:
- Completed Today: ${completedToday}
- Pending: ${pendingTasks}
- Total Proposals: ${proposals.length}

TODAY'S AUTONOMOUS ACTIONS (${todayActivities.length} actions):
${todayActivities.slice(0, 10).map(a => `• [${a.actor}] ${a.action}`).join('\n') || 'None logged today.'}

Generate a DAILY BRIEF that includes:
1. **Revenue Snapshot** — where we stand vs. target with the math
2. **Pipeline Status** — what stage leads are at, which ones are hot
3. **What the Agents Did Today** — summary of all autonomous actions
4. **Top 5 Priorities for Tomorrow** — specific, actionable, in order of impact
5. **Leads to Contact Tomorrow** — top 3 leads with specific recommended action
6. **Risk Flags** — anything that needs Barry's attention
7. **Monthly Trajectory** — on track / at risk / behind (with projected close)

Keep it tight, no fluff. Barry reads this in 3 minutes before sleeping.
`;

  const brief = await gemini.callRawLLM(
    prompt,
    'You are Alex, the VELTRIX CEO Agent. Generate the daily brief in clean, sharp markdown. Be direct and data-driven.'
  );

  // Save to daily_reports
  const todayStr = new Date().toISOString().split('T')[0];
  await db.addDailyReport({
    report_date: todayStr,
    revenue_target: profile.target_monthly_revenue || MONTHLY_TARGET,
    closed_revenue: closedRevenue,
    pipeline_value: pipelineValue,
    revenue_gap: gap,
    top_priority: 'See daily brief',
    leads_to_contact: leads.filter(l => l.status === 'Qualified').slice(0, 3).map(l => l.business_name),
    followups_due: [],
    content_to_post: '',
    recommended_action: 'Review daily brief'
  });

  // Save to memory
  await db.addMemory({
    type: 'Project',
    content: `DAILY BRIEF — ${todayStr}\n\n${brief}`,
    tags: ['daily-brief', 'automated', '10pm', todayStr],
    importance: 9,
    source: 'CEO Agent'
  });

  // Email Barry
  await notifyBarry(
    `Daily Brief — ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
    `Hi Barry,\n\nHere's your 10PM daily brief:\n\n${brief}\n\n— VELTRIX Autonomous Agency\n\nPipeline: ${byStage.contacted} contacted, ${byStage.callBooked} calls booked, $${closedRevenue} closed.`
  );

  await logAction('Daily Brief Sent', `10PM brief generated and emailed to Barry`);

  return brief;
}
