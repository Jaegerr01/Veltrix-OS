import { db } from '../db';
import { sendEmail, type SendResult } from './send';
import type { Lead, OutreachMessage, Followup, Proposal } from '../types';

/**
 * THE only place that moves a record to Sent / Failed.
 *
 *   Draft -> (Pending Approval) -> Approved -> Sending -> Sent | Failed
 *
 * - 'Sent' is written only with provider + provider_message_id + sent_at from a confirmed send.
 * - 'Failed' carries the provider error text and an attempts counter; retry = deliverRecord(..., {retry:true}).
 * - A guardrail/config block (kill switch, cap, blacklist, no provider) is NOT a failure and NOT a send:
 *   the record goes back to Approved with the reason in `error`.
 * - Lead / task bookkeeping (Contacted, Proposal Sent, task Completed) happens here and only on success.
 */

export type DeliveryKind = 'outreach' | 'followup' | 'proposal';

export type DeliveryOutcome =
  | { outcome: 'sent'; message: string; provider?: string; providerMessageId: string }
  | { outcome: 'failed'; message: string }
  | { outcome: 'blocked'; message: string }
  | { outcome: 'not_approved' | 'already_sent' | 'in_flight' | 'no_recipient' | 'manual_channel' | 'not_found'; message: string };

const TABLE = { outreach: 'outreach_messages', followup: 'followups', proposal: 'proposals' } as const;
const AGENT = { outreach: 'Outreach Agent', followup: 'Follow-up Agent', proposal: 'Proposal Agent' } as const;
const KEYWORD = { outreach: 'outreach', followup: 'follow', proposal: 'proposal' } as const;

/** Split an optional leading "Subject: ..." line off a drafted message. */
export function splitSubject(text: string, fallback: string): { subject: string; body: string } {
  const m = text.match(/^\s*subject:\s*(.+)\r?\n+([\s\S]*)$/i);
  if (m && m[1].trim()) return { subject: m[1].trim().slice(0, 200), body: m[2].trim() || text };
  return { subject: fallback, body: text.trim() };
}

export function proposalToText(p: Proposal, lead?: Lead): string {
  const parts: string[] = [];
  parts.push(`Hi${lead?.contact_name ? ' ' + lead.contact_name.split(' ')[0] : ''},`, '', `Please find my proposal: ${p.title}`);
  if (p.problem) parts.push('', 'What I found', p.problem);
  if (p.solution) parts.push('', 'Recommended solution', p.solution);
  if (p.deliverables?.length) parts.push('', 'Deliverables', ...p.deliverables.map(d => `- ${d}`));
  if (p.timeline) parts.push('', 'Timeline', p.timeline);
  if (p.price) parts.push('', 'Investment', `$${p.price}`);
  if (p.payment_terms) parts.push('', 'Payment terms', p.payment_terms);
  parts.push('', 'Happy to walk through it on a quick call whenever suits you.');
  return parts.join('\n');
}

async function loadRecord(kind: DeliveryKind, id: string): Promise<(OutreachMessage | Followup | Proposal) | undefined> {
  if (kind === 'outreach') return (await db.getOutreachMessages()).find(m => m.id === id);
  if (kind === 'followup') return (await db.getFollowups()).find(f => f.id === id);
  return (await db.getProposals()).find(p => p.id === id);
}

async function patchRecord(kind: DeliveryKind, id: string, patch: Record<string, unknown>) {
  if (kind === 'outreach') return db.updateOutreachMessage(id, patch as Partial<OutreachMessage>);
  if (kind === 'followup') return db.updateFollowup(id, patch as Partial<Followup>);
  return db.updateProposal(id, patch as Partial<Proposal>);
}

async function bookkeepAfterSend(kind: DeliveryKind, lead: Lead, detail: string) {
  try {
    const early = ['New', 'Researched', 'Qualified', 'Follow-up Later'];
    if (kind === 'proposal') {
      if (!['Won', 'Lost'].includes(lead.status)) await db.updateLead(lead.id, { status: 'Proposal Sent' });
    } else if (early.includes(lead.status)) {
      await db.updateLead(lead.id, { status: 'Contacted' });
    }
  } catch (e) {
    console.warn('[delivery] lead status update failed after confirmed send:', e);
  }
  try {
    const tasks = await db.getTasks();
    const t = tasks.find(
      x => x.related_lead_id === lead.id && ['Pending', 'Needs Approval', 'In Progress'].includes(x.status) &&
        x.title.toLowerCase().includes(KEYWORD[kind])
    );
    if (t) await db.updateTask(t.id, { status: 'Completed', result: detail, error: null, finished_at: new Date().toISOString() });
  } catch (e) {
    console.warn('[delivery] task completion failed after confirmed send:', e);
  }
}

export async function deliverRecord(
  kind: DeliveryKind,
  id: string,
  opts: { retry?: boolean; send?: typeof sendEmail } = {}
): Promise<DeliveryOutcome> {
  const send = opts.send ?? sendEmail;
  const rec = await loadRecord(kind, id);
  if (!rec) return { outcome: 'not_found', message: `${kind} record not found.` };

  const status = rec.status as string;
  if (status === 'Sent') return { outcome: 'already_sent', message: 'Already sent (delivery was confirmed earlier).' };
  if (status === 'Sending' && !opts.retry) return { outcome: 'in_flight', message: 'A send for this record is already in progress.' };
  const allowedFrom = opts.retry ? ['Approved', 'Failed', 'Sending'] : ['Approved'];
  if (!allowedFrom.includes(status)) {
    return { outcome: 'not_approved', message: `Not approved to send (status: ${status}). Approve it first.` };
  }
  if (kind === 'outreach' && (rec as OutreachMessage).approval_status === 'Rejected') {
    return { outcome: 'not_approved', message: 'This message was rejected.' };
  }

  const leadId = (rec as { lead_id?: string }).lead_id;
  const lead = leadId ? (await db.getLeads()).find(l => l.id === leadId) : undefined;
  if (!lead) return { outcome: 'not_found', message: 'The lead for this record no longer exists.' };

  if (kind === 'outreach' && (rec as OutreachMessage).channel !== 'Email') {
    return { outcome: 'manual_channel', message: `${(rec as OutreachMessage).channel} is a manual channel: send it yourself, then use "Mark sent (I sent it)".` };
  }
  if (!lead.email) return { outcome: 'no_recipient', message: `${lead.business_name} has no email address on file.` };

  // Build the email
  let subject: string; let body: string;
  if (kind === 'proposal') {
    const p = rec as Proposal;
    subject = `Proposal: ${p.title}`; body = proposalToText(p, lead);
  } else if (kind === 'followup') {
    const s = splitSubject((rec as Followup).message || '', `Following up - ${lead.business_name}`);
    subject = s.subject; body = s.body;
  } else {
    const s = splitSubject((rec as OutreachMessage).message, `A quick note for ${lead.business_name}`);
    subject = s.subject; body = s.body;
  }

  // Claim (atomic) -> Sending
  const claimFrom = opts.retry ? ['Approved', 'Failed', 'Sending'] : ['Approved'];
  const claimed = await db.claimForSending(TABLE[kind], id, claimFrom);
  if (!claimed) return { outcome: 'in_flight', message: 'Another request is already sending this record.' };

  const prevAttempts = Number((rec as { attempts?: number }).attempts || 0);
  let result: SendResult;
  try {
    result = await send({ to: lead.email, subject, text: body, kind: 'outreach' });
  } catch (e: any) {
    result = { delivered: false, blocked: false, reason: String(e?.message || e).slice(0, 300), attempts: 1 };
  }

  if (result.delivered && result.messageId) {
    const sentAt = new Date().toISOString();
    await patchRecord(kind, id, {
      status: 'Sent',
      provider: result.provider ?? null,
      provider_message_id: result.messageId,
      sent_at: sentAt,
      error: null,
      attempts: prevAttempts + result.attempts,
      ...(kind === 'outreach' ? { approval_status: 'Approved' } : {}),
    });
    const detail = `Delivered via ${result.provider} to ${lead.email} (message id ${result.messageId}).`;
    await bookkeepAfterSend(kind, lead, detail);
    await db.logAgentAction(AGENT[kind], 'Send Email', `${kind}Id=${id}, leadId=${lead.id}`, detail, 'Success');
    return { outcome: 'sent', message: detail, provider: result.provider, providerMessageId: result.messageId };
  }

  if (result.blocked) {
    await patchRecord(kind, id, { status: 'Approved', error: `Not sent: ${result.reason}` });
    await db.logAgentAction(AGENT[kind], 'Send Blocked', `${kind}Id=${id}, leadId=${lead.id}`, result.reason || 'blocked', 'Failure');
    return { outcome: 'blocked', message: `Not sent - ${result.reason}` };
  }

  const reason = result.reason || 'Email provider reported a failure.';
  await patchRecord(kind, id, { status: 'Failed', error: reason, attempts: prevAttempts + (result.attempts || 1), provider: result.provider ?? null });
  await db.logAgentAction(AGENT[kind], 'Send Email', `${kind}Id=${id}, leadId=${lead.id}`, `FAILED: ${reason}`, 'Failure');
  return { outcome: 'failed', message: `Send failed - ${reason}` };
}

/** Human clicked "Approve & send": mark Approved, then deliver. Used by the /api send routes. */
export async function approveAndDeliver(kind: DeliveryKind, id: string, opts: { retry?: boolean; send?: typeof sendEmail } = {}): Promise<DeliveryOutcome> {
  const rec = await loadRecord(kind, id);
  if (!rec) return { outcome: 'not_found', message: `${kind} record not found.` };
  const status = rec.status as string;
  if (status === 'Sent') return { outcome: 'already_sent', message: 'Already sent.' };
  if (['Draft', 'Pending Approval', 'Pending', 'Drafted'].includes(status)) {
    await patchRecord(kind, id, { status: 'Approved', error: null, ...(kind === 'outreach' ? { approval_status: 'Approved' } : {}) });
  }
  return deliverRecord(kind, id, opts);
}

/**
 * Owner attestation: "I sent this myself, outside the app" (LinkedIn/Instagram DM, WhatsApp, a proposal
 * handed over on a call...). Recorded as provider='manual' with an id of `manual:<recordId>` so the UI
 * labels it honestly, it never counts toward the email daily cap, and the DB proof constraint holds.
 * Refused for Email-channel outreach: for email, only a provider-confirmed send counts.
 */
export async function markManuallySent(kind: DeliveryKind, id: string): Promise<DeliveryOutcome> {
  const rec = await loadRecord(kind, id);
  if (!rec) return { outcome: 'not_found', message: `${kind} record not found.` };
  if ((rec.status as string) === 'Sent') return { outcome: 'already_sent', message: 'Already recorded as sent.' };
  if (kind === 'outreach' && (rec as OutreachMessage).channel === 'Email') {
    return { outcome: 'not_approved', message: 'Email must be sent through the app so delivery can be confirmed. Use "Approve & send".' };
  }
  const sentAt = new Date().toISOString();
  await patchRecord(kind, id, {
    status: 'Sent', provider: 'manual', provider_message_id: `manual:${id}`, sent_at: sentAt, error: null,
    ...(kind === 'outreach' ? { approval_status: 'Approved' } : {}),
  });
  const leadId = (rec as { lead_id?: string }).lead_id;
  const lead = leadId ? (await db.getLeads()).find(l => l.id === leadId) : undefined;
  if (lead) await bookkeepAfterSend(kind, lead, 'Marked as sent manually by the owner (not sent by PostelOS).');
  await db.logAgentAction(AGENT[kind], 'Marked Sent (manual)', `${kind}Id=${id}`, 'Owner attested the message was sent outside the app.', 'Success');
  return { outcome: 'sent', message: 'Recorded as sent manually (owner-attested).', provider: 'manual', providerMessageId: `manual:${id}` };
}
