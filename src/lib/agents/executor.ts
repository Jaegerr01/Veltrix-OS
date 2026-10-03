import { db } from '../db';
import { gemini } from '../gemini';
import { AGENTS } from './agents';
import { loadCatalogueAgent, findCatalogueAgents } from './catalogue';
import { isAiError } from '../ai/errors';

export interface AgentRunContext {
  /** true when the CEO orchestrator drives this run: it owns the task row; outward actions are approval-gated. */
  orchestrated?: boolean;
  taskId?: string;
}

export interface AgentRunResult {
  success: boolean;
  result?: string;
  error?: string;
  /** set when the agent produced an outward action that now waits in the Approval Queue */
  approvalRequestId?: string;
  needsApproval?: boolean;
}

/**
 * The single executor for every agent. It never fabricates success: an AI/DB failure comes back as
 * { success:false, error } with a plain-language message. Outward actions (email) are only ever
 * drafted + queued here; delivery happens in lib/email/delivery.ts after approval.
 */
export async function runAgentLogic(
  agentKey: string,
  params: any,
  autonomous: boolean = false,
  ctx?: AgentRunContext
): Promise<AgentRunResult> {
  if (!agentKey || !AGENTS[agentKey]) {
    return { success: false, error: 'Valid agentKey is required' };
  }

  const agent = AGENTS[agentKey];
  let resultText = '';
  let logPayload = {};
  let approvalId: string | undefined;
  // When the orchestrator drives a run it owns the task row, so agents must not add duplicates.
  const addTaskIfStandalone = async (t: Parameters<typeof db.addTask>[0]) => (ctx?.orchestrated ? null : db.addTask(t));

  try {
    switch (agentKey) {
      case 'ceo': {
        const profile = await db.getBusinessProfile();
        const leads = await db.getLeads();
        const memories = await db.getMemories();
        const reports = await db.getDailyReports();

        const todayStr = new Date().toISOString().split('T')[0];
        let report = reports.find(r => r.report_date === todayStr);

        if (!report) {
          const activeLeads = leads.slice(0, 10);
          // Pipeline = value of proposals that are genuinely open (drafted, awaiting approval, or confirmed sent). Real rows only.
          const openProposals = await db.getProposals();
          const pipelineValue = openProposals
            .filter(p => ['Draft', 'Pending Approval', 'Approved', 'Sending', 'Sent', 'Viewed'].includes(p.status))
            .reduce((sum, p) => sum + Number(p.price || 0), 0);

          const reportText = await gemini.generateDailyReport(
            profile.target_monthly_revenue,
            profile.current_monthly_revenue,
            pipelineValue,
            activeLeads,
            memories
          );

          const lines = reportText.split('\n');
          let topPriority = 'See the full report.';
          let leadsToContact: string[] = [];
          let followupsDue: string[] = [];
          let contentToPost = '';
          let recommendedAction = 'See the full report.';

          let section = '';
          lines.forEach(line => {
            const trimLine = line.trim();
            if (trimLine.startsWith("Today's Top Priority:")) {
              section = 'priority';
            } else if (trimLine.startsWith('Leads to Contact:')) {
              section = 'leads';
            } else if (trimLine.startsWith('Follow-ups Due:')) {
              section = 'followups';
            } else if (trimLine.startsWith('Content to Post:')) {
              section = 'content';
            } else if (trimLine.startsWith('Recommended Action:')) {
              section = 'action';
            } else if (trimLine.startsWith('Risk / Blocker:') || trimLine.startsWith('Next Step:') || trimLine.startsWith('Revenue Target:') || trimLine.startsWith('Closed Revenue:') || trimLine.startsWith('Pipeline Value:') || trimLine.startsWith('Revenue Gap:')) {
              section = '';
            } else {
              if (section === 'priority' && trimLine) {
                topPriority = trimLine;
              } else if (section === 'leads' && trimLine.match(/^\d+\./)) {
                leadsToContact.push(trimLine.replace(/^\d+\.\s*/, ''));
              } else if (section === 'followups' && trimLine.match(/^\d+\./)) {
                followupsDue.push(trimLine.replace(/^\d+\.\s*/, ''));
              } else if (section === 'content' && trimLine) {
                contentToPost = trimLine;
              } else if (section === 'action' && trimLine) {
                recommendedAction = trimLine;
              }
            }
          });

          report = await db.addDailyReport({
            report_date: todayStr,
            revenue_target: profile.target_monthly_revenue,
            closed_revenue: profile.current_monthly_revenue,
            pipeline_value: pipelineValue,
            revenue_gap: profile.target_monthly_revenue - profile.current_monthly_revenue,
            top_priority: topPriority,
            leads_to_contact: leadsToContact.slice(0, 3),
            followups_due: followupsDue.slice(0, 2),
            content_to_post: contentToPost,
            recommended_action: recommendedAction
          });

          await db.addMemory({
            type: 'Decision',
            content: `PostelOS Daily Command Report generated for ${todayStr}. Recommended action: ${recommendedAction}`,
            tags: ['daily-report', 'automated'],
            importance: 6,
            source: 'AI CEO'
          });

          await addTaskIfStandalone({
            agent_name: 'Outreach Agent',
            title: `Perform recommended action: ${recommendedAction.substring(0, 70)}...`,
            description: `Recommended in Daily Report: ${recommendedAction}. Address leads: ${leadsToContact.join(', ')}`,
            priority: 'High',
            status: 'Pending',
            due_date: todayStr
          });
        }

        resultText = `Hey team, Alex here. I've successfully compiled today's Daily Action Plan:\n\n**Top Priority:** ${report.top_priority}\n\n**Recommended Action:** ${report.recommended_action}\n\nLet's get to work! Check the "Daily Summaries" page for the full layout.`;
        break;
      }

      case 'revenue': {
        const revenues = await db.getRevenue();
        const proposals = await db.getProposals();
        const clients = await db.getClients();
        const profile = await db.getBusinessProfile();

        const closedRevenue = revenues
          .filter(r => r.status === 'Paid')
          .reduce((acc, r) => acc + Number(r.amount), 0);

        const gap = Math.max(0, profile.target_monthly_revenue - closedRevenue);

        const websites = params?.websites || 0;
        const receptionists = params?.receptionists || 0;

        let prompt = `
Analyze the following financial statistics for PostelOS:
- Monthly Target: $${profile.target_monthly_revenue}
- Closed Earnings: $${closedRevenue}
- Earnings Gap: $${gap}
- Active Clients: ${clients.length}
- Active Proposals: ${proposals.length}
`;

        if (websites > 0 || receptionists > 0) {
          prompt += `
The user is simulating closing the following deals:
- ${websites} AI Website Refresh(es) ($1,200/each)
- ${receptionists} AI Receptionist Setup(s) ($1,000/each + $250/mo retainer)

Provide a tactical sales execution playbook explaining how to close these specific deals. Which industries or prospects in our CRM should we target first? What objections will they raise and how do we handle them? Keep it highly structured and actionable.
`;
        } else {
          prompt += `
Provide a short, grounded financial report. Highlight the exact gap math. Calculate how many projects are needed to close the gap:
- Website refresh projects (average $1,200 each)
- AI Receptionist retainers (average $250/month each)
`;
        }

        prompt += `
Respond in character as Marcus, the Revenue Agent. Speak in a precise, helpful, and analytical conversational tone, addressed to Alex and the team naturally.
Output in a concise layout with next actions.
`;
        const generated = await gemini.callRawLLM(prompt, agent.systemPrompt);
        resultText = `**Marcus (Revenue Agent)**: ${generated}`;
        logPayload = { closedRevenue, gap, simulatedWebsites: websites, simulatedReceptionists: receptionists };
        break;
      }

      case 'sales': {
        const { leadId } = params;
        if (!leadId) {
          return { success: false, error: 'leadId is required for Sales Agent' };
        }
        const leads = await db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) {
          return { success: false, error: 'Lead not found' };
        }

        const prompt = `
Analyze this specific lead for PostelOS:
Business Name: ${lead.business_name}
Industry: ${lead.industry || 'Unknown'}
Location: ${lead.location || 'Unknown'}
Pain Points: ${lead.pain_point || 'Unknown'}
Notes: ${lead.notes || 'None'}

Draft a sales pitch recommendation. Outline:
1. Which PostelOS service fits best (AI Website, AI Receptionist, or Growth Package) and why.
2. The exact pitch angle (time-saved, revenue capture, or aesthetics reboot).
3. Objections handling guide for this client.

Respond in character as Sophia, the Sales Agent. Speak in a charismatic, persuasive, and highly professional conversational tone, addressed to Alex and the team naturally.
`;
        const generated = await gemini.callRawLLM(prompt, agent.systemPrompt);
        resultText = `**Sophia (Sales Agent)**: ${generated}`;
        logPayload = { leadId, businessName: lead.business_name };
        break;
      }

      case 'leadResearch': {
        const { leadId } = params;
        if (!leadId) {
          return { success: false, error: 'leadId is required for Lead Research Agent' };
        }
        const leads = await db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) {
          return { success: false, error: 'Lead not found' };
        }

        // ── Real research: fetch their live website and build a brief ──
        // The brief lands in lead.notes so every downstream agent (scoring
        // below, Emma's outreach, Olivia's proposal) works from actual facts
        // about this business instead of whatever was hand-typed.
        let researchNote = '';
        try {
          const { fetchWebsiteSnapshot, briefToNotes } = await import('./research');
          const snapshot = lead.website
            ? await fetchWebsiteSnapshot(lead.website)
            : { ok: false as const, url: '', error: 'No website on record' };
          const brief = await gemini.researchLead(lead, snapshot);
          researchNote = briefToNotes(brief);
          lead.notes = `${lead.notes || ''}\n\n${researchNote}`.trim();
        } catch (err: any) {
          console.warn('[leadResearch] website research skipped:', err.message);
        }

        const scoreResult = await gemini.scoreLead(lead); // real AI score or a visible error - never a heuristic stand-in

        const nextStatus = scoreResult.total_score >= 7 ? 'Qualified' : 'Researched';
        await db.updateLead(leadId, {
          lead_score: scoreResult.total_score,
          status: nextStatus,
          notes: `${lead.notes || ''}\n\n[AI Qualification Score: ${scoreResult.total_score}/10]\n${scoreResult.reasoning}`.trim()
        });

        await db.addMemory({
          type: 'Lead',
          content: `Lead ${lead.business_name} scored ${scoreResult.total_score}/10. Reasoning: ${scoreResult.reasoning}`,
          tags: ['lead-scoring', lead.business_name.toLowerCase().replace(/\s+/g, '-')],
          importance: 7,
          source: 'Lead Research Agent'
        });

        const profile = await db.getBusinessProfile();
        const isAuto = autonomous || profile.autopilot;

        if (isAuto) {
          await addTaskIfStandalone({
            agent_name: 'Lead Research Agent',
            title: `Autonomous research completed for ${lead.business_name}`,
            description: `Automatically researched and qualified ${lead.business_name}. Score: ${scoreResult.total_score}/10. Status set to ${nextStatus}.`,
            priority: 'Medium',
            status: 'Completed',
            related_lead_id: leadId
          });

          // Hand off to Emma ONLY when the master autopilot toggle is on —
          // research-on-import with autopilot off should score leads without
          // ever emailing anyone.
          if (scoreResult.total_score >= 7 && profile.autopilot) {
            const isChatbot = lead.pain_point?.toLowerCase().includes('receptionist') || lead.pain_point?.toLowerCase().includes('call') || lead.industry === 'Dental';
            const offer = isChatbot ? 'AI Receptionist / Lead Booking Agent' : 'AI Website + Brand System';
            runAgentLogic('outreach', { leadId, offerName: offer, channel: 'Email' }, true);
          }
        }

        resultText = `**Daniel (Lead Research Agent)**: Hey Alex, I completed qualifying scoring for lead **${lead.business_name}**.\n\n**Total Score:** ${scoreResult.total_score}/10\n\n**Reasoning:** ${scoreResult.reasoning}`;
        if (isAuto) {
          resultText += `\n\n[AUTONOMOUS OPERATION COMMITTED]: Lead status updated to "${nextStatus}". Research task logged as Completed.`;
          if (scoreResult.total_score >= 7 && profile.autopilot) {
            resultText += ` Handing off to Emma (Outreach) for proposal + send.`;
          }
        }
        break;
      }

      case 'outreach': {
        const { leadId, offerName, channel = 'Email' } = params;
        if (!leadId || !offerName) {
          return { success: false, error: 'leadId and offerName are required for Outreach Agent' };
        }
        const leads = await db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) {
          return { success: false, error: 'Lead not found' };
        }

        // Hand Emma the research brief Daniel left in the lead's notes so the
        // message references real findings instead of generic pain points.
        const researchNotes = lead.notes?.includes('[Research Brief')
          ? lead.notes.slice(lead.notes.indexOf('[Research Brief'))
          : undefined;

        const messageText = await gemini.generateOutreach(lead, offerName, researchNotes, channel); // real AI copy or a visible error

        const profile = await db.getBusinessProfile();
        const isAuto = autonomous || profile.autopilot;

        // ── Entity Phase 1 (propose-then-approve): autonomous mode no longer
        // sends directly. Emma asks Olivia for a custom proposal, composes the
        // full email, and files it as an approval request in Barry's queue.
        // The send executes only after Barry approves — and even then the
        // guarded sender (kill switch, daily cap, blacklist) still applies.
        // Doctrine: Obsidian → Entity/VELTRIX Constitution.md, Article 3.
        let queuedInfo = '';
        let queuedForApproval = false;

        // Every path creates the draft first — single source of truth.
        const draftMessage = await db.addOutreachMessage({
          lead_id: leadId,
          channel: channel as any,
          message: messageText,
          status: 'Draft',
          approval_status: 'Pending Approval'
        });

        const isEmailChannel = channel === 'Email';
        const canQueue = (isAuto || !!ctx?.orchestrated) && (isEmailChannel ? !!lead.email : true);

        if (canQueue) {
          // Email gets the full proposal attached; DMs stay short.
          let proposalSection = '';
          if (isEmailChannel) {
            try {
              const proposalResult = await runAgentLogic('proposal', {
                leadId,
                offerName,
                price: offerName.toLowerCase().includes('receptionist') ? 1000 : 1200,
                skipStatusUpdate: true,
              }, true);
              if (proposalResult.success) {
                const proposals = await db.getProposals();
                const latest = proposals
                  .filter(p => p.lead_id === leadId)
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                if (latest?.solution) {
                  proposalSection = `\n\n---\n\n${latest.solution}`;
                }
              }
            } catch (err: any) {
              console.warn('[outreach] proposal generation failed, queueing outreach alone:', err.message);
            }
          }

          // Social channels: best link we have for the assisted send.
          const profileUrl = lead.social_link
            || (channel === 'LinkedIn'
              ? `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.business_name)}`
              : channel === 'Instagram'
                ? `https://www.google.com/search?q=${encodeURIComponent(lead.business_name + ' instagram')}`
                : `https://www.google.com/search?q=${encodeURIComponent(lead.business_name + ' ' + channel)}`);

          const researchContext = lead.notes?.includes('[Research Brief')
            ? lead.notes.slice(lead.notes.indexOf('[Research Brief')).slice(0, 1500)
            : undefined;

          const { requestApproval } = await import('../entity/approvals');
          const request = await requestApproval({
            type: 'outreach_send',
            department: 'revenue',
            createdByAgent: 'Emma (Outreach Agent)',
            title: isEmailChannel
              ? `Send outreach${proposalSection ? ' + proposal' : ''} to ${lead.business_name}`
              : `${channel} DM to ${lead.business_name} (assisted send)`,
            context: [
              `Lead: ${lead.business_name} (${lead.industry || 'unknown industry'}), score ${lead.lead_score ?? 'n/a'}/10, status ${lead.status}.`,
              `Offer: ${offerName}. Channel: ${channel}.`,
              isEmailChannel ? null : `Assisted send: approve → copy message → open profile → paste-send. No bot automation on social (account safety).`,
              researchContext ? `Research: ${researchContext}` : null,
            ].filter(Boolean).join('\n'),
            payload: {
              leadId,
              outreachMessageId: draftMessage.id,
              channel,
              to: isEmailChannel ? lead.email : undefined,
              profileUrl: isEmailChannel ? undefined : profileUrl,
              subject: isEmailChannel ? `A quick note for ${lead.business_name}` : undefined,
              text: `${messageText}${proposalSection}`,
            },
            recommendation: isEmailChannel
              ? 'Send. Research-informed message; lead scored qualified.'
              : `Copy + send on ${channel}. Message written DM-style.`,
            confidence: lead.lead_score ? Math.min(10, Math.round(lead.lead_score)) : 7,
          });

          queuedForApproval = true;
          approvalId = request.id;
          queuedInfo = `Approval request ${request.id} filed in Barry's queue.`;
        }

        await addTaskIfStandalone({
          agent_name: 'Outreach Agent',
          title: queuedForApproval
            ? `Awaiting approval: outreach to ${lead.business_name}`
            : `Review and approve outreach message for ${lead.business_name}`,
          description: queuedForApproval
            ? `Outreach + proposal composed for ${lead.business_name} via ${channel}. ${queuedInfo} Nothing sends until approved.`
            : `Drafted outreach for ${lead.business_name} via ${channel}. Approve in the Outbox to send.`,
          priority: 'High',
          status: queuedForApproval ? 'Needs Approval' : 'Pending',
          related_lead_id: leadId
        });

        resultText = queuedForApproval
          ? (isEmailChannel
            ? `**Emma (Outreach Agent)**: Hey Alex! I coordinated with Olivia on a custom proposal for **${lead.business_name}** and composed the full email. Per the Constitution it's now in **Barry's Approval Queue** — one click and it sends (guardrails still on). ${queuedInfo}`
            : `**Emma (Outreach Agent)**: Hey Alex! I wrote a ${channel} DM for **${lead.business_name}** — it's in **Barry's Approval Queue** as an assisted send: he approves, copies, opens the profile, and sends in seconds. ${queuedInfo}`)
          : isAuto
            ? `**Emma (Outreach Agent)**: I drafted the outreach for **${lead.business_name}** but couldn't queue a send: no email on record for this lead.\n\nIt's waiting in the Outbox under "Pending Approval".`
            : `**Emma (Outreach Agent)**: Hey Alex! I've generated the outreach draft message for **${lead.business_name}** via ${channel}.\n\nYou can review it in the Outbox under "Pending Approval". Let me know if you want any edits!`;
        break;
      }

      case 'followup': {
        const { leadId, sequenceDay = 3 } = params;
        if (!leadId) {
          return { success: false, error: 'leadId is required for Follow-up Agent' };
        }
        const leads = await db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) {
          return { success: false, error: 'Lead not found' };
        }

        const msgText = await gemini.generateFollowup(lead, Number(sequenceDay));

        const profile = await db.getBusinessProfile();
        const wantsQueue = autonomous || profile.autopilot || !!ctx?.orchestrated;

        // The draft is ALWAYS just a draft. Sending is a separate, approved, confirmed step
        // (lib/email/delivery.ts) - this agent never marks anything Sent.
        const newFup = await db.addFollowup({
          lead_id: leadId,
          followup_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // in 2 days
          followup_type: `Day ${sequenceDay} Follow-up`,
          message: msgText,
          status: 'Drafted'
        });

        let noEmail = false;
        if (wantsQueue) {
          if (!lead.email) {
            noEmail = true;
          } else {
            const { requestApproval } = await import('../entity/approvals');
            const request = await requestApproval({
              type: 'followup_send',
              department: 'revenue',
              createdByAgent: 'Lucas (Follow-up Agent)',
              title: `Send Day ${sequenceDay} follow-up to ${lead.business_name}`,
              context: `Lead: ${lead.business_name} (${lead.industry || 'unknown industry'}), status ${lead.status}. Day ${sequenceDay} check-in.`,
              payload: { leadId, followupId: newFup.id, to: lead.email, subject: `Following up - ${lead.business_name}`, text: msgText },
              recommendation: 'Send. Short, low-pressure check-in.',
              confidence: 6,
            });
            approvalId = request.id;
          }
        }

        await addTaskIfStandalone({
          agent_name: 'Follow-up Agent',
          title: approvalId
            ? `Awaiting approval: Day ${sequenceDay} follow-up to ${lead.business_name}`
            : `Review and send Day ${sequenceDay} follow-up to ${lead.business_name}`,
          description: approvalId
            ? `Draft saved and filed in the Approval Queue. Nothing has been sent.`
            : `Follow-up draft is saved on the Follow-ups page. Nothing has been sent.${noEmail ? ' (No email on record for this lead.)' : ''}`,
          priority: 'Medium',
          status: approvalId ? 'Needs Approval' : 'Pending',
          related_lead_id: leadId
        });

        resultText = approvalId
          ? `**Lucas (Follow-up Agent)**: I drafted the Day ${sequenceDay} follow-up for **${lead.business_name}** and filed it in the Approval Queue. **Nothing has been sent yet** - it goes out only after you approve it.\n\n---\n\n${msgText}`
          : `**Lucas (Follow-up Agent)**: I drafted the Day ${sequenceDay} follow-up for **${lead.business_name}**${noEmail ? ' (no email address on record, so it cannot be queued for sending)' : ''}. **Nothing has been sent** - review it on the Follow-ups page.\n\n---\n\n${msgText}`;
        break;
      }

      case 'proposal': {
        const { leadId, offerName, price = 1200, skipStatusUpdate = false } = params;
        if (!leadId || !offerName) {
          return { success: false, error: 'leadId and offerName are required for Proposal Agent' };
        }
        const leads = await db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) {
          return { success: false, error: 'Lead not found' };
        }

        // Real Gemini output or a visible error - no canned template passed off as AI work.
        const proposalText = await gemini.generateProposal(lead, offerName, price);

        // skipStatusUpdate = "embedded in an outreach email" (the outreach approval carries it).
        const embedded = !!skipStatusUpdate;
        const wantsQueue = !embedded && (autonomous || !!ctx?.orchestrated);
        const canQueue = wantsQueue && !!lead.email;

        const created = await db.addProposal({
          lead_id: leadId,
          title: `${offerName} Proposal - ${lead.business_name}`,
          problem: lead.pain_point || 'Outdated digital interface and conversion leaks.',
          solution: proposalText,
          deliverables: offerName.toLowerCase().includes('receptionist')
            ? ['Custom AI chatbot or receptionist', 'FAQs knowledge base', 'Lead capture database', 'Calendar appointment booking', 'CRM sync']
            : ['5-page website', 'Mobile responsive design', 'Brand direction', 'High-converting copy', 'Contact & Booking integrations'],
          timeline: '2-3 weeks',
          price: Number(price),
          payment_terms: '50% upfront retainer, 50% upon deployment',
          status: canQueue ? 'Pending Approval' : 'Draft'
        });

        if (canQueue) {
          const { requestApproval } = await import('../entity/approvals');
          const request = await requestApproval({
            type: 'proposal_send',
            department: 'revenue',
            createdByAgent: 'Olivia (Proposal Agent)',
            title: `Send "${offerName}" proposal ($${price}) to ${lead.business_name}`,
            context: `Lead: ${lead.business_name} (${lead.industry || 'unknown industry'}), score ${lead.lead_score ?? 'n/a'}/10, status ${lead.status}.`,
            payload: { leadId, proposalId: created.id, to: lead.email, subject: `Proposal: ${created.title}` },
            recommendation: 'Review the scope and price, then send.',
            confidence: 6,
          });
          approvalId = request.id;
        }

        if (!embedded) {
          await addTaskIfStandalone({
            agent_name: 'Proposal Agent',
            title: approvalId
              ? `Awaiting approval: proposal to ${lead.business_name}`
              : `Review and send proposal for ${lead.business_name}`,
            description: approvalId
              ? `Proposal for ${offerName} ($${price}) drafted and filed in the Approval Queue. Nothing has been sent.`
              : `Drafted proposal for ${offerName} ($${price}). Nothing has been sent - review it on the Proposals page and press Approve & send.`,
            priority: 'Medium',
            status: approvalId ? 'Needs Approval' : 'Pending',
            related_lead_id: leadId
          });
        }

        resultText = approvalId
          ? `**Olivia (Proposal Agent)**: I drafted the **${offerName}** proposal ($${price}) for **${lead.business_name}** and filed it in the Approval Queue. **Nothing has been sent** - it goes out only after you approve it.`
          : `**Olivia (Proposal Agent)**: I drafted the **${offerName}** proposal ($${price}) for **${lead.business_name}**. **Nothing has been sent** - review it on the Proposals page and press Approve & send.${wantsQueue && !lead.email ? ' (This lead has no email on record.)' : ''}`;
        break;
      }

      case 'content': {
        const { topic } = params;
        if (!topic) {
          return { success: false, error: 'topic is required for Content Agent' };
        }
        const ideas = await gemini.generateContentIdeas(topic);
        
        for (const idea of ideas) {
          await db.addContentIdea({
            platform: idea.platform,
            title: idea.title,
            hook: idea.hook,
            content: idea.content,
            content_type: idea.content_type,
            status: 'Idea'
          });
        }

        resultText = `**Ryan (Content Agent)**: Hey team! Ryan here. I've successfully generated ${ideas.length} fresh authority content ideas on the topic "${topic}":\n\n` + 
          ideas.map((idea, i) => `${i+1}. **${idea.title}** (${idea.platform})\n*Hook:* ${idea.hook}`).join('\n\n') +
          `\n\nI've saved these drafts directly to the Social Writer page for you.`;
        break;
      }

      case 'delivery': {
        const { projectId } = params;
        if (!projectId) {
          return { success: false, error: 'projectId is required for Delivery Manager Agent' };
        }
        const projects = await db.getProjects();
        const project = projects.find(p => p.id === projectId);
        if (!project) {
          return { success: false, error: 'Project not found' };
        }

        const prompt = `
Generate a project milestone checklist for:
Project Name: ${project.project_name}
Service Type: ${project.service_type}
Status: ${project.status}
Requirements: ${project.requirements}

Respond in character as Mia, the Delivery Manager Agent. Speak in an organized, clear, and reassuring project-management conversational tone. Address your coordinator Alex and the team naturally.
Suggest a 6-item progress roadmap with clear checkboxes to mark in our delivery database.
`;
        const generated = await gemini.callRawLLM(prompt, agent.systemPrompt);
        resultText = `**Mia (Delivery Manager Agent)**: ${generated}`;
        break;
      }

      case 'memory': {
        const { query } = params;
        if (!query) {
          return { success: false, error: 'query is required for Memory Manager Agent' };
        }
        const memories = await db.searchMemories(query);
        resultText = `**Leo (Memory Manager Agent)**: Hello Alex. I've searched our core database for "${query}" and recovered ${memories.length} relevant log entries:\n\n` +
          (memories.length === 0
            ? 'No matching memories or tags found.'
            : memories.map((m, i) => `${i+1}. **[${m.type}]** ${m.content} (Importance: ${m.importance}/10)`).join('\n\n'));

        // Leo also indexes the AgentLand catalogue, so library-tier specialists
        // (not advertised in the CEO roster) stay findable and callable by slug.
        const specialists = findCatalogueAgents(query, 5);
        if (specialists.length > 0) {
          resultText += `\n\n**Specialists available** — invoke with [RUN_AGENT: specialist, {"slug": "…", "task": "…"}]:\n` +
            specialists.map(s => `- \`${s.slug}\` (${s.category}${s.tier === 'library' ? ', library' : ''}) — ${s.description}`).join('\n');
        }
        break;
      }

      case 'specialist': {
        const { slug, task } = params;
        if (!slug || !task) {
          return { success: false, error: 'slug and task are both required for a specialist' };
        }
        const specialist = loadCatalogueAgent(slug);
        if (!specialist) {
          const suggestions = findCatalogueAgents(String(slug).replace(/[-_]/g, ' '), 3);
          return {
            success: false,
            error: `Unknown specialist slug "${slug}".` +
              (suggestions.length ? ` Did you mean: ${suggestions.map(s => s.slug).join(', ')}?` : '')
          };
        }
        // The catalogue agent's own prompt replaces the placeholder in AGENTS.specialist.
        const generated = await gemini.callRawLLM(task, specialist.systemPrompt);
        resultText = `**${specialist.name} (${specialist.category})**: ${generated}`;
        logPayload = { slug, category: specialist.category, tier: specialist.tier };
        break;
      }

      case 'support': {
        const { query } = params;
        if (!query) {
          return { success: false, error: 'query is required for Support Agent' };
        }
        const memories = await db.searchMemories(query);
        const docsContext = memories.map(m => m.content).join('\n');

        const prompt = `
User Question: "${query}"

Here are the relevant documentation snippets retrieved from the company database:
${docsContext || 'No relevant documentation found.'}

Answer the user's question accurately using only the retrieved documentation above. If the answer cannot be found in the documentation, state that clearly and suggest adding it.
`;
        const generated = await gemini.callRawLLM(prompt, agent.systemPrompt);
        resultText = `**Harper (Support Agent)**: ${generated}`;
        break;
      }

      case 'scraper': {
        const { niche, location, limit = 20 } = params;
        if (!niche || !location) {
          return { success: false, error: 'niche and location are required for the Lead Scout Agent' };
        }
        const { runScraper, importScrapedLeads, scraperConfigured } = await import('../scraper/run');
        const check = scraperConfigured();
        if (!check.ok) {
          resultText = `**Victor (Lead Scout Agent)**: I can't run the scraper here — ${check.reason}\n\nUse the Paste Import flow on the Leads page, or run me from the local dev machine.`;
          break;
        }
        const run = await runScraper({ niche, location, limit: Number(limit) });
        if (!run.ok) {
          return { success: false, error: run.error };
        }
        const { imported, skipped } = await importScrapedLeads(run.leads);
        resultText = `**Victor (Lead Scout Agent)**: Scrape complete for **"${niche} in ${location}"**.\n\n- Scraped: ${run.leads.length}\n- Imported: ${imported.length} new leads\n- Skipped: ${skipped} duplicates\n\nFresh leads are in the pipeline as "New" — Daniel picks them up from here.`;
        logPayload = { niche, location, scraped: run.leads.length, imported: imported.length, skipped };
        break;
      }

      default:
        return { success: false, error: 'Agent execution not implemented' };
    }

    await db.logAgentAction(
      agent.name,
      ctx?.orchestrated ? 'Orchestrated Task Run' : 'Agent Run',
      JSON.stringify({ params }),
      resultText,
      'Success'
    );

    return { success: true, result: resultText, approvalRequestId: approvalId, needsApproval: !!approvalId };
  } catch (error: any) {
    console.error('Error running agent in executor:', error);
    const message = isAiError(error) ? (error as any).userMessage : String(error?.message || error).slice(0, 300);
    try {
      await db.logAgentAction(agent.name, ctx?.orchestrated ? 'Orchestrated Task Run' : 'Agent Run', JSON.stringify({ params }), message, 'Failure');
    } catch { /* logging must never mask the real error */ }
    return { success: false, error: message };
  }
}
