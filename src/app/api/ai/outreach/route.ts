import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gemini } from '@/lib/gemini';

export async function POST(req: Request) {
  let leadId = '';
  let offerName = '';
  let channel: 'Email' | 'LinkedIn' | 'Instagram' | 'WhatsApp' | 'Facebook' = 'Email';
  try {
    const body = await req.json().catch(() => ({}));
    leadId = body.leadId || '';
    offerName = body.offerName || '';
    channel = (body.channel || 'Email') as any;
    if (!leadId || !offerName) {
      return NextResponse.json({ success: false, error: 'leadId and offerName are required' }, { status: 400 });
    }

    const leads = await db.getLeads();
    const lead = leads.find(l => l.id === leadId);

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Call Gemini to generate message
    const messageText = await gemini.generateOutreach(lead, offerName);

    // Save outreach message in db - defaults to Level 4 (Pending Approval / Draft)
    const newOutreach = await db.addOutreachMessage({
      lead_id: leadId,
      channel,
      message: messageText,
      status: 'Draft',
      approval_status: 'Pending Approval'
    });

    // Create a task for the human to review this message
    await db.addTask({
      agent_name: 'Outreach Agent',
      title: `Review and approve outreach message for ${lead.business_name}`,
      description: `Drafted outreach for ${lead.business_name} using channel: ${channel}. Click Approve to mark sent.`,
      priority: 'High',
      status: 'Pending',
      related_lead_id: leadId
    });

    // Log the action
    await db.logAgentAction(
      'Outreach Agent',
      'Generate Outreach Message',
      `leadId=${leadId}, channel=${channel}, offer=${offerName}`,
      messageText,
      'Pending Approval'
    );

    return NextResponse.json({ success: true, outreach: newOutreach });
  } catch (error: any) {
    console.error('Error generating outreach API:', error);
    try {
      if (leadId && offerName) {
        const leads = await db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
          const contact = lead.contact_name || 'Owner';
          const business = lead.business_name;
          const industry = lead.industry || 'your business';
          
          let messageText = '';
          if (channel === 'LinkedIn' || channel === 'Instagram') {
            messageText = `Hi ${contact} - noticed your page for ${business}. Love the work you do in ${industry}! Quick question: do you guys handle after-hours bookings manually, or do you have a bot? We build simple AI receptionists that qualify leads and schedule them 24/7. Open to a 1-min demo video?`;
          } else {
            messageText = `Hello ${contact},\n\nI was looking at ${business} online and noticed that patients or clients trying to book appointments after hours might bounce due to a lack of live scheduling assistance.\n\nWe design lightweight AI booking agents specifically for ${industry} services. They handle common FAQs and schedule appointments directly into your calendar 24/7.\n\nWould it be okay to send over a short 90-second video demo of how it looks?\n\nBest,\nVELTRIX Partner`;
          }

          const newOutreach = await db.addOutreachMessage({
            lead_id: leadId,
            channel,
            message: messageText,
            status: 'Draft',
            approval_status: 'Pending Approval'
          });

          await db.addTask({
            agent_name: 'Outreach Agent',
            title: `Review and approve simulated outreach for ${business}`,
            description: `Offline drafted outreach. Click Approve to finalize. (API Fallback)`,
            priority: 'High',
            status: 'Pending',
            related_lead_id: leadId
          });

          await db.logAgentAction(
            'Outreach Agent',
            'Generate Outreach Message Fallback',
            `leadId=${leadId}, channel=${channel}, offer=${offerName}, error=${error.message}`,
            messageText,
            'Pending Approval'
          );

          return NextResponse.json({ success: true, outreach: newOutreach, simulated: true });
        }
      }
    } catch (fallbackError) {
      console.error('Fallback outreach generation failed:', fallbackError);
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
