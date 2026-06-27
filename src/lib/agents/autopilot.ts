import { db } from '../db';
import { gemini } from '../ai/gemini';

export async function runAutopilotForLead(leadId: string) {
  try {
    const leads = await db.getLeads();
    let lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // 1. Score the Lead (if not scored yet)
    let scoreResult;
    if (!lead.lead_score || lead.lead_score === 0) {
      await db.logAgentAction(
        'Lead Research Agent',
        'Autopilot: Start Lead Research',
        `leadId=${leadId}, name=${lead.business_name}`,
        undefined,
        'Success'
      );
      
      try {
        scoreResult = await gemini.scoreLead(lead);
      } catch (err: any) {
        // Fallback scoring
        const hasWebsite = !!lead.website;
        const hasPainPoints = !!lead.pain_point;
        scoreResult = {
          website_score: hasWebsite ? 5 : 9,
          branding_score: 7,
          automation_need_score: hasPainPoints ? 9 : 6,
          ability_to_pay_score: 8,
          urgency_score: hasPainPoints ? 8 : 5,
          total_score: 0,
          reasoning: `Qualifications calculated via local heuristics due to error: ${err.message}`
        };
        scoreResult.total_score = Number(((scoreResult.website_score + scoreResult.branding_score + scoreResult.automation_need_score + scoreResult.ability_to_pay_score + scoreResult.urgency_score) / 5).toFixed(1));
      }

      const nextStatus = scoreResult.total_score >= 7 ? 'Qualified' : 'Researched';
      lead = await db.updateLead(leadId, {
        lead_score: scoreResult.total_score,
        status: nextStatus,
        notes: `${lead.notes || ''}\n\n[Autopilot: Scored ${scoreResult.total_score}/10]\n${scoreResult.reasoning}`.trim()
      });

      await db.addLeadScore({
        lead_id: leadId,
        website_score: scoreResult.website_score,
        branding_score: scoreResult.branding_score,
        automation_need_score: scoreResult.automation_need_score,
        ability_to_pay_score: scoreResult.ability_to_pay_score,
        urgency_score: scoreResult.urgency_score,
        total_score: scoreResult.total_score,
        reasoning: scoreResult.reasoning
      });

      await db.addMemory({
        type: 'Lead',
        content: `Autopilot: Scored lead ${lead.business_name} as ${scoreResult.total_score}/10. Status set to ${nextStatus}.`,
        tags: ['autopilot', 'lead-scoring', lead.business_name.toLowerCase().replace(/\s+/g, '-')],
        importance: 7,
        source: 'Lead Research Agent'
      });

      await db.logAgentAction(
        'Lead Research Agent',
        'Autopilot: Score Lead Completed',
        `leadId=${leadId}, name=${lead.business_name}`,
        JSON.stringify(scoreResult),
        'Success'
      );
    }

    // Refresh lead state
    const currentLeads = await db.getLeads();
    lead = currentLeads.find(l => l.id === leadId) || lead;

    // 2. Draft & Send Outreach (if status is Qualified)
    if (lead.status === 'Qualified' && lead.lead_score >= 7) {
      await db.logAgentAction(
        'Outreach Agent',
        'Autopilot: Start Outreach Drafting',
        `leadId=${leadId}, name=${lead.business_name}`,
        undefined,
        'Success'
      );

      const isChatbot = lead.pain_point?.toLowerCase().includes('receptionist') || lead.pain_point?.toLowerCase().includes('call') || lead.industry === 'Dental';
      const offer = isChatbot ? 'AI Receptionist / Lead Booking Agent' : 'AI Website + Brand System';
      const channel = 'Email';

      let messageText;
      try {
        messageText = await gemini.generateOutreach(lead, offer);
      } catch (err: any) {
        const contact = lead.contact_name || 'Owner';
        messageText = `Hello ${contact},\n\nI was looking at ${lead.business_name} online and noticed that patients or clients trying to book appointments after hours might bounce due to a lack of live scheduling assistance.\n\nWe design lightweight AI booking agents specifically for ${lead.industry || 'local'} services. They handle common FAQs and schedule appointments directly into your calendar 24/7.\n\nWould it be okay to send over a short 90-second video demo of how it looks?\n\nBest,\nVELTRIX Partner`;
      }

      // Add outreach message directly as SENT/APPROVED under Autopilot
      await db.addOutreachMessage({
        lead_id: leadId,
        channel,
        message: messageText,
        status: 'Sent',
        approval_status: 'Approved',
        sent_at: new Date().toISOString()
      });

      // Update lead status in CRM to Contacted
      await db.updateLead(leadId, {
        status: 'Contacted'
      });

      await db.addTask({
        agent_name: 'Outreach Agent',
        title: `Autopilot outreach sent to ${lead.business_name}`,
        description: `Automatically researched, qualified and emailed ${lead.business_name}. Channel: ${channel}.`,
        priority: 'High',
        status: 'Completed',
        related_lead_id: leadId
      });

      await db.logAgentAction(
        'Outreach Agent',
        'Autopilot: Send Outreach Completed',
        `leadId=${leadId}, channel=${channel}, offer=${offer}`,
        messageText,
        'Success'
      );
    }
  } catch (error: any) {
    console.error('Error running Autopilot for lead:', error);
  }
}
