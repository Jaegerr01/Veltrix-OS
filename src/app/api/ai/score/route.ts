import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gemini } from '@/lib/gemini';

export async function POST(req: Request) {
  let leadId = '';
  try {
    const body = await req.json().catch(() => ({}));
    leadId = body.leadId || '';
    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
    }

    const leads = await db.getLeads();
    const lead = leads.find(l => l.id === leadId);

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Call Gemini scoring logic
    const scoreResult = await gemini.scoreLead(lead);

    // Save score result to DB
    const newScore = await db.addLeadScore({
      lead_id: leadId,
      website_score: scoreResult.website_score,
      branding_score: scoreResult.branding_score,
      automation_need_score: scoreResult.automation_need_score,
      ability_to_pay_score: scoreResult.ability_to_pay_score,
      urgency_score: scoreResult.urgency_score,
      total_score: scoreResult.total_score,
      reasoning: scoreResult.reasoning
    });

    // Automatically update the lead's score and status in the CRM
    await db.updateLead(leadId, {
      lead_score: scoreResult.total_score,
      status: 'Researched',
      notes: `${lead.notes || ''}\n\n[AI Qualification Score: ${scoreResult.total_score}/10]\n${scoreResult.reasoning}`.trim()
    });

    // Save as memory context
    await db.addMemory({
      type: 'Lead',
      content: `Lead ${lead.business_name} scored ${scoreResult.total_score}/10. Reasoning: ${scoreResult.reasoning}`,
      tags: ['lead-scoring', lead.business_name.toLowerCase().replace(/\s+/g, '-')],
      importance: 7,
      source: 'Lead Research Agent'
    });

    // Log the agent action
    await db.logAgentAction(
      'Lead Research Agent',
      'Score Lead',
      `leadId=${leadId}, name=${lead.business_name}`,
      JSON.stringify(scoreResult),
      'Success'
    );

    return NextResponse.json({ success: true, score: newScore });
  } catch (error: any) {
    console.error('Error scoring lead API:', error);
    try {
      if (leadId) {
        const leads = await db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
          const hasWebsite = !!lead.website;
          const hasPainPoints = !!lead.pain_point;
          
          const scoreResult = {
            website_score: hasWebsite ? 5 : 9,
            branding_score: 7,
            automation_need_score: hasPainPoints ? 9 : 6,
            ability_to_pay_score: 8,
            urgency_score: hasPainPoints ? 8 : 5,
            total_score: 0,
            reasoning: `Qualifications calculated via local heuristics due to Gemini API error (${error.message}). Lead has active interest.`
          };
          scoreResult.total_score = Number(((scoreResult.website_score + scoreResult.branding_score + scoreResult.automation_need_score + scoreResult.ability_to_pay_score + scoreResult.urgency_score) / 5).toFixed(1));
          
          const newScore = await db.addLeadScore({
            lead_id: leadId,
            website_score: scoreResult.website_score,
            branding_score: scoreResult.branding_score,
            automation_need_score: scoreResult.automation_need_score,
            ability_to_pay_score: scoreResult.ability_to_pay_score,
            urgency_score: scoreResult.urgency_score,
            total_score: scoreResult.total_score,
            reasoning: scoreResult.reasoning
          });

          await db.updateLead(leadId, {
            lead_score: scoreResult.total_score,
            status: 'Researched',
            notes: `${lead.notes || ''}\n\n[Qualifications calculated via local heuristics: ${scoreResult.total_score}/10]\n${scoreResult.reasoning}`.trim()
          });

          await db.addMemory({
            type: 'Lead',
            content: `Lead ${lead.business_name} scored ${scoreResult.total_score}/10 (Fallback). Reasoning: ${scoreResult.reasoning}`,
            tags: ['lead-scoring', 'fallback', lead.business_name.toLowerCase().replace(/\s+/g, '-')],
            importance: 6,
            source: 'Lead Research Agent Simulator'
          });

          await db.logAgentAction(
            'Lead Research Agent',
            'Score Lead Fallback',
            `leadId=${leadId}, name=${lead.business_name}`,
            JSON.stringify(scoreResult),
            'Success'
          );

          return NextResponse.json({ success: true, score: newScore, simulated: true });
        }
      }
    } catch (fallbackError) {
      console.error('Fallback scoring failed:', fallbackError);
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
