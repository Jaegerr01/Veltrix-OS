import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gemini } from '@/lib/gemini';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = checkRateLimit(auth.user.id);
  if (!rl.allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });

  try {
    const { leadId, sequenceDay = 3 } = await req.json();
    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
    }

    const leads = await db.getLeads();
    const lead = leads.find(l => l.id === leadId);

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Call Gemini to generate follow-up message
    const messageText = await gemini.generateFollowup(lead, sequenceDay);

    // Save follow-up record in db
    const followupDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]; // scheduled for 2 days out

    const newFollowup = await db.addFollowup({
      lead_id: leadId,
      followup_date: followupDate,
      followup_type: sequenceDay === 3 ? 'Soft Reminder' : sequenceDay === 7 ? 'Value-based' : sequenceDay === 14 ? 'Final Check-in' : 'Re-engagement',
      message: messageText,
      status: 'Drafted'
    });

    // Create a task for follow-up
    await db.addTask({
      agent_name: 'Follow-up Agent',
      title: `Send follow-up to ${lead.business_name} (Sequence Day ${sequenceDay})`,
      description: `Draft follow-up created. Review content: "${messageText.substring(0, 80)}..."`,
      priority: 'Medium',
      status: 'Pending',
      due_date: followupDate,
      related_lead_id: leadId
    });

    // Log action
    await db.logAgentAction(
      'Follow-up Agent',
      'Generate Follow-up Message',
      `leadId=${leadId}, day=${sequenceDay}`,
      messageText,
      'Success'
    );

    return NextResponse.json({ success: true, followup: newFollowup });
  } catch (error: any) {
    console.error('Error generating follow-up API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
