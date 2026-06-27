import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { getResendClient, FROM_EMAIL } from '@/lib/email/resend';

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const rl = checkRateLimit(`send:${auth.user.id}`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Try again in a minute.' },
      { status: 429 }
    );
  }

  let messageId = '';
  try {
    const body = await req.json().catch(() => ({}));
    messageId = body.messageId || '';
    if (!messageId) {
      return NextResponse.json({ success: false, error: 'messageId is required.' }, { status: 400 });
    }

    // Load message
    const allMessages = await db.getOutreachMessages();
    const message = allMessages.find(m => m.id === messageId);
    if (!message) {
      return NextResponse.json({ success: false, error: 'Outreach message not found.' }, { status: 404 });
    }
    if (message.status === 'Sent') {
      return NextResponse.json({ success: true, emailDelivered: false, note: 'Already sent.' });
    }

    // Load lead for recipient details
    const leads = await db.getLeads();
    const lead = leads.find(l => l.id === message.lead_id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found for this message.' }, { status: 404 });
    }

    let emailDelivered = false;
    let resendId: string | undefined;

    // Attempt real email delivery when channel is Email, lead has email, and Resend is configured
    if (message.channel === 'Email' && lead.email) {
      const resend = getResendClient();
      if (resend) {
        try {
          const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [lead.email],
            subject: `A quick note for ${lead.business_name}`,
            text: message.message,
          });
          if (error) {
            console.warn('Resend delivery error:', error);
          } else {
            emailDelivered = true;
            resendId = data?.id;
          }
        } catch (sendErr) {
          console.warn('Resend threw during send:', sendErr);
        }
      }
    }

    const now = new Date().toISOString();

    // Mark message as sent in DB
    await db.updateOutreachMessage(messageId, {
      approval_status: 'Approved',
      status: 'Sent',
      sent_at: now,
    });

    // Update lead status
    await db.updateLead(lead.id, { status: 'Contacted' });

    // Complete any matching pending outreach task
    try {
      const tasks = await db.getTasks();
      const task = tasks.find(
        t =>
          t.related_lead_id === lead.id &&
          t.status === 'Pending' &&
          t.title.toLowerCase().includes('outreach')
      );
      if (task) {
        await db.updateTask(task.id, {
          status: 'Completed',
          result: emailDelivered
            ? `Email delivered via Resend (id: ${resendId}).`
            : 'Marked sent in CRM. Email not dispatched (no key or no lead email).',
        });
      }
    } catch (taskErr) {
      console.warn('Failed to complete outreach task:', taskErr);
    }

    // Log action
    await db.logAgentAction(
      'Outreach Agent',
      emailDelivered ? 'Send Email via Resend' : 'Approve & Mark Sent (no email dispatch)',
      `messageId=${messageId}, leadId=${lead.id}, channel=${message.channel}`,
      emailDelivered
        ? `Email sent to ${lead.email} (resend id: ${resendId})`
        : `Marked sent. Channel: ${message.channel}. Email dispatch skipped.`,
      'Success'
    );

    return NextResponse.json({
      success: true,
      emailDelivered,
      channel: message.channel,
      note: emailDelivered
        ? `Email dispatched to ${lead.email}.`
        : message.channel === 'Email' && !lead.email
        ? 'Lead has no email address on file — marked sent in CRM only.'
        : message.channel === 'Email' && !process.env.RESEND_API_KEY
        ? 'RESEND_API_KEY not configured — marked sent in CRM only.'
        : `Channel ${message.channel} is manual — send via the platform and mark done here.`,
    });
  } catch (error: any) {
    console.error('Error in /api/outreach/send:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
