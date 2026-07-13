import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { sendOutreachEmail } from '@/lib/email/send';

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
    let deliveryDetail = '';

    // Human-approved send → unified sender (Gmail first, Resend fallback).
    // autonomous:false because a person explicitly clicked Approve — the
    // daily cap / blacklist guardrails are for unsupervised sends.
    if (message.channel === 'Email' && lead.email) {
      const result = await sendOutreachEmail({
        to: lead.email,
        subject: `A quick note for ${lead.business_name}`,
        text: message.message,
        autonomous: false,
      });
      emailDelivered = result.delivered;
      deliveryDetail = result.delivered
        ? `Delivered via ${result.provider}.`
        : result.reason || 'Delivery failed.';
      if (!result.delivered) console.warn('Outreach delivery failed:', result.reason);
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
            ? `Email delivered. ${deliveryDetail}`
            : `Marked sent in CRM. ${deliveryDetail || 'Email not dispatched (no lead email).'}`,
        });
      }
    } catch (taskErr) {
      console.warn('Failed to complete outreach task:', taskErr);
    }

    // Log action
    await db.logAgentAction(
      'Outreach Agent',
      emailDelivered ? 'Send Email' : 'Approve & Mark Sent (no email dispatch)',
      `messageId=${messageId}, leadId=${lead.id}, channel=${message.channel}`,
      emailDelivered
        ? `Email sent to ${lead.email}. ${deliveryDetail}`
        : `Marked sent. Channel: ${message.channel}. ${deliveryDetail || 'Email dispatch skipped.'}`,
      'Success'
    );

    return NextResponse.json({
      success: true,
      emailDelivered,
      channel: message.channel,
      note: emailDelivered
        ? `Email dispatched to ${lead.email}. ${deliveryDetail}`
        : message.channel === 'Email' && !lead.email
        ? 'Lead has no email address on file — marked sent in CRM only.'
        : message.channel === 'Email'
        ? `Marked sent in CRM only — ${deliveryDetail || 'no email provider configured (set GMAIL_USER + GMAIL_APP_PASSWORD in .env.local)'}.`
        : `Channel ${message.channel} is manual — send via the platform and mark done here.`,
    });
  } catch (error: any) {
    console.error('Error in /api/outreach/send:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
