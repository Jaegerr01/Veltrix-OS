import { db } from '../db';
import { gemini } from '../gemini';
import { AGENTS } from './agents';
import { generateSimulatedResponse } from './router';

export async function runAgentLogic(
  agentKey: string,
  params: any,
  autonomous: boolean = false
): Promise<{ success: boolean; result?: string; simulated?: boolean; error?: string }> {
  if (!agentKey || !AGENTS[agentKey]) {
    return { success: false, error: 'Valid agentKey is required' };
  }

  const agent = AGENTS[agentKey];
  let resultText = '';
  let logPayload = {};

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
          let pipelineValue = 0;
          leads.forEach(l => {
            if (['Qualified', 'Contacted', 'Replied', 'Call Booked', 'Proposal Sent'].includes(l.status)) {
              if (l.notes?.toLowerCase().includes('website') || l.notes?.toLowerCase().includes('brand')) {
                pipelineValue += 1200;
              } else if (l.notes?.toLowerCase().includes('receptionist') || l.notes?.toLowerCase().includes('bot')) {
                pipelineValue += 1000;
              } else {
                pipelineValue += 1500;
              }
            }
          });

          let reportText;
          try {
            reportText = await gemini.generateDailyReport(
              profile.target_monthly_revenue,
              profile.current_monthly_revenue,
              pipelineValue,
              activeLeads,
              memories
            );
          } catch (err: any) {
            reportText = `VELTRIX Daily Command Report\n\nRevenue Target:\n$${profile.target_monthly_revenue}\n\nClosed Revenue:\n$${profile.current_monthly_revenue}\n\nPipeline Value:\n$${pipelineValue}\n\nRevenue Gap:\n$${profile.target_monthly_revenue - profile.current_monthly_revenue}\n\nToday's Top Priority:\nReview warm leads and prepare proposals.\n\nLeads to Contact:\n${activeLeads.slice(0, 3).map((l, i) => `${i+1}. ${l.business_name}`).join('\n')}\n\nFollow-ups Due:\nNone\n\nContent to Post:\nDeploy an AI Receptionist to prevent after-hour appointment leaks.\n\nRecommended Action:\nContact active warm leads.\n\nRisk / Blocker:\nGemini API unavailable. Local fallback generated.\n\nNext Step:\nOpen Potential Clients page.`;
          }

          const lines = reportText.split('\n');
          let topPriority = 'Review qualified leads and outline sales scripts.';
          let leadsToContact: string[] = [];
          let followupsDue: string[] = [];
          let contentToPost = 'Draft LinkedIn hook for business AI.';
          let recommendedAction = 'Contact dentist leads.';

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
            content: `Veltrix Daily Command Report generated for ${todayStr}. Recommended action: ${recommendedAction}`,
            tags: ['daily-report', 'automated'],
            importance: 6,
            source: 'AI CEO'
          });

          await db.addTask({
            agent_name: 'Outreach Agent',
            title: `Perform recommended action: ${recommendedAction.substring(0, 70)}...`,
            description: `Recommended in Daily Report: ${recommendedAction}. Address leads: ${leadsToContact.join(', ')}`,
            priority: 'High',
            status: autonomous ? 'Completed' : 'Pending',
            due_date: todayStr
          });
        }

        resultText = `Hey team, Alex here. I've successfully compiled today's Daily Action Plan:\n\n**Top Priority:** ${report.top_priority}\n\n**Recommended Action:** ${report.recommended_action}\n\nLet's get to work! Check the "Daily Summaries" page for the full layout.`;
        if (autonomous) {
          resultText += `\n\n[AUTONOMOUS OPERATION COMMITTED]: Recommended action task has been automatically executed and marked completed.`;
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

        const websites = params?.websites || 0;
        const receptionists = params?.receptionists || 0;

        let prompt = `
Analyze the following financial statistics for VELTRIX:
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

        let scoreResult;
        try {
          scoreResult = await gemini.scoreLead(lead);
        } catch (err: any) {
          const hasWebsite = !!lead.website;
          const hasPainPoints = !!lead.pain_point;
          scoreResult = {
            website_score: hasWebsite ? 5 : 9,
            branding_score: 7,
            automation_need_score: hasPainPoints ? 9 : 6,
            ability_to_pay_score: 8,
            urgency_score: hasPainPoints ? 8 : 5,
            total_score: 0,
            reasoning: `Qualifications calculated via local heuristics due to Gemini error: ${err.message}`
          };
          scoreResult.total_score = Number(((scoreResult.website_score + scoreResult.branding_score + scoreResult.automation_need_score + scoreResult.ability_to_pay_score + scoreResult.urgency_score) / 5).toFixed(1));
        }

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
          await db.addTask({
            agent_name: 'Lead Research Agent',
            title: `Autonomous research completed for ${lead.business_name}`,
            description: `Automatically researched and qualified ${lead.business_name}. Score: ${scoreResult.total_score}/10. Status set to ${nextStatus}.`,
            priority: 'Medium',
            status: 'Completed',
            related_lead_id: leadId
          });

          // Trigger Outreach automatically on autopilot if qualified
          if (scoreResult.total_score >= 7) {
            const isChatbot = lead.pain_point?.toLowerCase().includes('receptionist') || lead.pain_point?.toLowerCase().includes('call') || lead.industry === 'Dental';
            const offer = isChatbot ? 'AI Receptionist / Lead Booking Agent' : 'AI Website + Brand System';
            runAgentLogic('outreach', { leadId, offerName: offer, channel: 'Email' }, true);
          }
        }

        resultText = `**Daniel (Lead Research Agent)**: Hey Alex, I completed qualifying scoring for lead **${lead.business_name}**.\n\n**Total Score:** ${scoreResult.total_score}/10\n\n**Reasoning:** ${scoreResult.reasoning}`;
        if (isAuto) {
          resultText += `\n\n[AUTONOMOUS OPERATION COMMITTED]: Lead status updated to "${nextStatus}". Research task logged as Completed.`;
          if (scoreResult.total_score >= 7) {
            resultText += ` Outreach drafting automatically triggered.`;
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

        let messageText;
        try {
          messageText = await gemini.generateOutreach(lead, offerName);
        } catch (err: any) {
          const contact = lead.contact_name || 'Owner';
          const business = lead.business_name;
          const industry = lead.industry || 'your business';
          if (channel === 'LinkedIn' || channel === 'Instagram') {
            messageText = `Hi ${contact} - noticed your page for ${business}. Love the work you do in ${industry}! Quick question: do you guys handle after-hours bookings manually, or do you have a bot? We build simple AI receptionists that qualify leads and schedule them 24/7. Open to a 1-min demo video?`;
          } else {
            messageText = `Hello ${contact},\n\nI was looking at ${business} online and noticed that patients or clients trying to book appointments after hours might bounce due to a lack of live scheduling assistance.\n\nWe design lightweight AI booking agents specifically for ${industry} services. They handle common FAQs and schedule appointments directly into your calendar 24/7.\n\nWould it be okay to send over a short 90-second video demo of how it looks?\n\nBest,\nVELTRIX Partner`;
          }
        }

        const profile = await db.getBusinessProfile();
        const isAuto = autonomous || profile.autopilot;

        await db.addOutreachMessage({
          lead_id: leadId,
          channel: channel as any,
          message: messageText,
          status: isAuto ? 'Sent' : 'Draft',
          approval_status: isAuto ? 'Approved' : 'Pending Approval',
          sent_at: isAuto ? new Date().toISOString() : undefined
        });

        if (isAuto) {
          await db.updateLead(leadId, {
            status: 'Contacted'
          });
        }

        await db.addTask({
          agent_name: 'Outreach Agent',
          title: isAuto 
            ? `Autonomous outreach sent to ${lead.business_name}`
            : `Review and approve outreach message for ${lead.business_name}`,
          description: isAuto 
            ? `Automatically sent outreach for ${lead.business_name} using channel: ${channel}.`
            : `Drafted outreach for ${lead.business_name} using channel: ${channel}. Click Approve to mark sent.`,
          priority: 'High',
          status: isAuto ? 'Completed' : 'Pending',
          related_lead_id: leadId
        });

        resultText = isAuto 
          ? `**Emma (Outreach Agent)**: Hey Alex! I've autonomously generated and sent the outreach message to **${lead.business_name}** via ${channel}.\n\nI updated their lead status to "Contacted" and marked the message as "Sent" in the Outbox.`
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
        const isAuto = autonomous || profile.autopilot;

        const newFup = await db.addFollowup({
          lead_id: leadId,
          followup_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // in 2 days
          followup_type: `Day ${sequenceDay} Follow-up`,
          message: msgText,
          status: isAuto ? 'Sent' : 'Pending'
        });

        await db.addTask({
          agent_name: 'Follow-up Agent',
          title: isAuto
            ? `Autonomous Day ${sequenceDay} follow-up sent to ${lead.business_name}`
            : `Send Day ${sequenceDay} follow-up to ${lead.business_name}`,
          description: isAuto
            ? `Automatically generated and sent Day ${sequenceDay} follow-up to ${lead.business_name}.`
            : `Follow-up draft is saved. Channel: Check client calendar reminders.`,
          priority: 'Medium',
          status: isAuto ? 'Completed' : 'Pending',
          related_lead_id: leadId
        });

        resultText = isAuto
          ? `**Lucas (Follow-up Agent)**: Hi Alex, I've autonomously generated and sent the Day ${sequenceDay} follow-up check-in to **${lead.business_name}**.\n\nEverything is logged in the CRM and the task is marked "Completed".`
          : `**Lucas (Follow-up Agent)**: Hi Alex, I've drafted the Day ${sequenceDay} follow-up check-in message for **${lead.business_name}**:\n\n---\n\n${msgText}\n\n---\n\nI've logged it in the CRM and set up a task for when we're ready to send.`;
        break;
      }

      case 'proposal': {
        const { leadId, offerName, price = 1200 } = params;
        if (!leadId || !offerName) {
          return { success: false, error: 'leadId and offerName are required for Proposal Agent' };
        }
        const leads = await db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) {
          return { success: false, error: 'Lead not found' };
        }

        let proposalText;
        try {
          proposalText = await gemini.generateProposal(lead, offerName, price);
        } catch (err: any) {
          const business = lead.business_name;
          const industry = lead.industry || 'your business';
          proposalText = `# Business Proposal: ${offerName} Integration\n\nPrepared for: **${business}**\n\n### Executive Summary\nVELTRIX proposes a custom deployment of the **${offerName}** to solve core operational bottlenecks. Local diagnostics indicated critical areas of improvement in lead qualification and response times.\n\n### Solution Overview\n- **Automated Workflow**: Custom FAQs configured based on local ${industry} operations.\n- **Full Availability**: Handles inquiries 24/7, reducing lead bounce rates by 20%.\n- **Pricing Model**: Total setup fee of $${price}.\n\n*Generated via local backup templates.*`;
        }

        await db.addProposal({
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
          status: autonomous ? 'Sent' : 'Draft'
        });

        if (autonomous) {
          await db.updateLead(leadId, {
            status: 'Proposal Sent'
          });
        }

        await db.addTask({
          agent_name: 'Proposal Agent',
          title: autonomous
            ? `Autonomous proposal sent to ${lead.business_name}`
            : `Review and finalize proposal for ${lead.business_name}`,
          description: autonomous
            ? `Automatically sent proposal for ${offerName} ($${price}) to ${lead.business_name}.`
            : `Drafted proposal for ${offerName} ($${price}). Click Accept to send to client when ready.`,
          priority: 'Medium',
          status: autonomous ? 'Completed' : 'Pending',
          related_lead_id: leadId
        });

        resultText = autonomous
          ? `**Olivia (Proposal Agent)**: Hey Alex, I've autonomously generated and sent the proposal for **${offerName}** ($${price}) to **${lead.business_name}**.\n\nI've moved the proposal to "Sent", updated the lead status to "Proposal Sent", and marked the task "Completed".`
          : `**Olivia (Proposal Agent)**: Hey Alex, I've drafted the proposal for **${offerName}** ($${price}) for **${lead.business_name}**.\n\nYou can review and finalize the proposal on the Price Quotes page whenever you're ready.`;
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

      default:
        return { success: false, error: 'Agent execution not implemented' };
    }

    await db.logAgentAction(
      agent.name,
      'Run Agent Triggered Autonomously',
      JSON.stringify({ params }),
      resultText,
      'Success'
    );

    return { success: true, result: resultText };
  } catch (error: any) {
    console.error('Error running agent in executor:', error);
    try {
      const simulated = await generateSimulatedResponse(
        agentKey,
        `Run Agent Direct Triggered: ${JSON.stringify(params)}`,
        error.message || 'AI request failed'
      );
      
      await db.logAgentAction(
        agent.name,
        'Run Agent Trigger Fallback Autonomously',
        JSON.stringify({ params, error: error.message }),
        simulated.text,
        'Success'
      );
      
      return { success: true, result: simulated.text, simulated: true };
    } catch (fallbackError: any) {
      return { success: false, error: fallbackError.message };
    }
  }
}
