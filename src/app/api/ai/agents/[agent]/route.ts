import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gemini } from '@/lib/ai/gemini';
import { AGENTS } from '@/lib/agents/agents';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agent: string }> }
) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = checkRateLimit(auth.user.id);
  if (!rl.allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });

  // Thread auth header through to any internal sub-route fetches
  const authHeader = req.headers.get('Authorization') ?? '';
  const internalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
  };

  let agentKey = '';
  let reqParameters: any = {};
  try {
    const { agent } = await params;
    agentKey = agent || '';
    const body = await req.json().catch(() => ({}));
    reqParameters = body.params || body || {};

    if (!agentKey || !AGENTS[agentKey]) {
      return NextResponse.json({ success: false, error: `Valid agent key is required. Received: ${agentKey}` }, { status: 400 });
    }
    const agentConfig = AGENTS[agentKey];
    let resultText = '';
    let logPayload = {};

    switch (agentKey) {
      case 'ceo': {
        // Runs Daily Action Plan Report
        const reportRes = await fetch(`${new URL(req.url).origin}/api/ai/report`, { method: 'POST', headers: internalHeaders });
        const reportData = await reportRes.json();
        if (reportData.success) {
          resultText = `Hey team, Alex here. I've successfully compiled today's Daily Action Plan:\n\n**Top Priority:** ${reportData.report.top_priority}\n\n**Recommended Action:** ${reportData.report.recommended_action}\n\nLet's get to work! Check the "Daily Summaries" page for the full layout.`;
        } else {
          throw new Error(reportData.error || 'Failed to generate Daily Report');
        }
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

        const prompt = `
Analyze the following financial statistics for VELTRIX:
- Monthly Target: $${profile.target_monthly_revenue}
- Closed Earnings: $${closedRevenue}
- Earnings Gap: $${gap}
- Active Clients: ${clients.length}
- Active Proposals: ${proposals.length}

Provide a short, grounded financial report. Highlight the exact gap math. Calculate how many projects are needed to close the gap:
- Website refresh projects (average $1,200 each)
- AI Receptionist retainers (average $250/month each)

Respond in character as Marcus, the Revenue Agent. Speak in a precise, helpful, and analytical conversational tone, addressed to Alex and the team naturally.
Output in a concise layout with next actions.
`;
        const generated = await gemini.callRawLLM(prompt, agentConfig.systemPrompt);
        resultText = `**Marcus (Revenue Agent)**: ${generated}`;
        logPayload = { closedRevenue, gap };
        break;
      }

      case 'sales': {
        const leadId = reqParameters.leadId;
        if (!leadId) {
          return NextResponse.json({ success: false, error: 'leadId is required for Sales Agent' }, { status: 400 });
        }
        const leads = await db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) {
          return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
        }

        const prompt = `
Analyze this specific lead for VELTRIX:
Business Name: ${lead.business_name}
Industry: ${lead.industry || 'Unknown'}
Location: ${lead.location || 'Unknown'}
Pain Points: ${lead.pain_point || 'Unknown'}
Notes: ${lead.notes || 'None'}

Draft a sales pitch recommendation. Outline:
1. Which VELTRIX service fits best (AI Website, AI Receptionist, or Growth Package) and why.
2. The exact pitch angle (time-saved, revenue capture, or aesthetics reboot).
3. Objections handling guide for this client.

Respond in character as Sophia, the Sales Agent. Speak in a charismatic, persuasive, and highly professional conversational tone, addressed to Alex and the team naturally.
`;
        const generated = await gemini.callRawLLM(prompt, agentConfig.systemPrompt);
        resultText = `**Sophia (Sales Agent)**: ${generated}`;
        logPayload = { leadId, businessName: lead.business_name };
        break;
      }

      case 'leadResearch': {
        const leadId = reqParameters.leadId;
        if (!leadId) {
          return NextResponse.json({ success: false, error: 'leadId is required for Lead Research Agent' }, { status: 400 });
        }
        const scoreRes = await fetch(`${new URL(req.url).origin}/api/ai/score`, {
          method: 'POST',
          headers: internalHeaders,
          body: JSON.stringify({ leadId })
        });
        const scoreData = await scoreRes.json();
        if (scoreData.success) {
          resultText = `**Daniel (Lead Research Agent)**: Hey Alex, I completed qualifying scoring for lead ID **${leadId}**.\n\n**Total Score:** ${scoreData.score.total_score}/10\n\n**Reasoning:** ${scoreData.score.reasoning}`;
        } else {
          throw new Error(scoreData.error || 'Failed to score lead');
        }
        break;
      }

      case 'outreach': {
        const { leadId, offerName, channel = 'Email' } = reqParameters;
        if (!leadId || !offerName) {
          return NextResponse.json({ success: false, error: 'leadId and offerName are required for Outreach Agent' }, { status: 400 });
        }
        const outreachRes = await fetch(`${new URL(req.url).origin}/api/ai/outreach`, {
          method: 'POST',
          headers: internalHeaders,
          body: JSON.stringify({ leadId, offerName, channel })
        });
        const outreachData = await outreachRes.json();
        if (outreachData.success) {
          resultText = `**Emma (Outreach Agent)**: Hey Alex! I've generated the outreach draft message for lead ID **${leadId}** via ${channel}.\n\nYou can review it in the Outbox under "Pending Approval".`;
        } else {
          throw new Error(outreachData.error || 'Failed to draft outreach');
        }
        break;
      }

      case 'followup': {
        const { leadId, sequenceDay = 3 } = reqParameters;
        if (!leadId) {
          return NextResponse.json({ success: false, error: 'leadId is required for Follow-up Agent' }, { status: 400 });
        }
        const leads = await db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) {
          return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
        }

        const msgText = await gemini.generateFollowup(lead, Number(sequenceDay));

        const newFup = await db.addFollowup({
          lead_id: leadId,
          followup_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // in 2 days
          followup_type: `Day ${sequenceDay} Follow-up`,
          message: msgText,
          status: 'Pending'
        });

        await db.addTask({
          agent_name: 'Follow-up Agent',
          title: `Send Day ${sequenceDay} follow-up to ${lead.business_name}`,
          description: `Follow-up draft is saved. Channel: Check client calendar reminders.`,
          priority: 'Medium',
          status: 'Pending',
          related_lead_id: leadId
        });

        resultText = `**Lucas (Follow-up Agent)**: Hi Alex, I've drafted the Day ${sequenceDay} follow-up check-in message for **${lead.business_name}**:\n\n---\n\n${msgText}\n\n---\n\nI've logged it in the CRM and set up a task for when we're ready to send.`;
        logPayload = { leadId, sequenceDay, followupId: newFup.id };
        break;
      }

      case 'proposal': {
        const { leadId, offerName, price = 1200 } = reqParameters;
        if (!leadId || !offerName) {
          return NextResponse.json({ success: false, error: 'leadId and offerName are required for Proposal Agent' }, { status: 400 });
        }
        const propRes = await fetch(`${new URL(req.url).origin}/api/ai/proposal`, {
          method: 'POST',
          headers: internalHeaders,
          body: JSON.stringify({ leadId, offerName, price })
        });
        const propData = await propRes.json();
        if (propData.success) {
          resultText = `**Olivia (Proposal Agent)**: Hey Alex, I've drafted the proposal for **${offerName}** ($${price}) for lead ID **${leadId}**.\n\nYou can review and finalize it on the Price Quotes page.`;
        } else {
          throw new Error(propData.error || 'Failed to draft proposal');
        }
        break;
      }

      case 'content': {
        const { topic } = reqParameters;
        if (!topic) {
          return NextResponse.json({ success: false, error: 'topic is required for Content Agent' }, { status: 400 });
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
        logPayload = { topic, count: ideas.length };
        break;
      }

      case 'delivery': {
        const { projectId } = reqParameters;
        if (!projectId) {
          return NextResponse.json({ success: false, error: 'projectId is required for Delivery Manager Agent' }, { status: 400 });
        }
        const projects = await db.getProjects();
        const project = projects.find(p => p.id === projectId);
        if (!project) {
          return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
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
        const generated = await gemini.callRawLLM(prompt, agentConfig.systemPrompt);
        resultText = `**Mia (Delivery Manager Agent)**: ${generated}`;
        logPayload = { projectId, projectName: project.project_name };
        break;
      }

      case 'memory': {
        const { query } = reqParameters;
        if (!query) {
          return NextResponse.json({ success: false, error: 'query is required for Memory Manager Agent' }, { status: 400 });
        }
        const memories = await db.searchMemories(query);
        resultText = `**Leo (Memory Manager Agent)**: Hello Alex. I've searched our core database for "${query}" and recovered ${memories.length} relevant log entries:\n\n` +
          (memories.length === 0 
            ? 'No matching memories or tags found.' 
            : memories.map((m, i) => `${i+1}. **[${m.type}]** ${m.content} (Importance: ${m.importance}/10)`).join('\n\n'));
        logPayload = { query, matches: memories.length };
        break;
      }

      case 'support': {
        const { query } = reqParameters;
        if (!query) {
          return NextResponse.json({ success: false, error: 'query is required for Support Agent' }, { status: 400 });
        }
        const memories = await db.searchMemories(query);
        const docsContext = memories.map(m => m.content).join('\n');

        const prompt = `
User Question: "${query}"

Here are the relevant documentation snippets retrieved from the company database:
${docsContext || 'No relevant documentation found.'}

Answer the user's question accurately using only the retrieved documentation above. If the answer cannot be found in the documentation, state that clearly and suggest adding it.
`;
        const generated = await gemini.callRawLLM(prompt, agentConfig.systemPrompt);
        resultText = `**Harper (Support Agent)**: ${generated}`;
        logPayload = { query, docsFound: memories.length };
        break;
      }

      default:
        return NextResponse.json({ success: false, error: `Agent action handler not found for: ${agent}` }, { status: 500 });
    }

    // Save logs to agent_logs
    await db.logAgentAction(
      agentConfig.name,
      'Run Agent Trigger Direct',
      JSON.stringify({ params: reqParameters, logPayload }),
      resultText,
      'Success'
    );

    return NextResponse.json({ success: true, result: resultText });
  } catch (error: any) {
    console.error('Error running agent via dynamic route:', error);
    try {
      if (agentKey && AGENTS[agentKey]) {
        const { generateSimulatedResponse } = await import('@/lib/agents/router');
        const simulated = await generateSimulatedResponse(
          agentKey,
          `Dynamic Route Direct Run: ${JSON.stringify(reqParameters)}`,
          error.message || 'AI request failed'
        );
        
        // Save fallback logs to agent_logs
        await db.logAgentAction(
          AGENTS[agentKey].name,
          'Run Agent Dynamic Trigger Fallback',
          JSON.stringify({ params: reqParameters, error: error.message }),
          simulated.text,
          'Success'
        );
        
        return NextResponse.json({ success: true, result: simulated.text, simulated: true });
      }
    } catch (fallbackError) {
      console.error('Offline simulation fallback failed on dynamic agent route:', fallbackError);
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
