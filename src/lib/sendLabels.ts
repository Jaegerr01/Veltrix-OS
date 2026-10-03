export type Tone = 'neutral' | 'warn' | 'info' | 'busy' | 'ok' | 'bad';

export interface SendFields {
  status: string;
  approval_status?: string | null;
  provider?: string | null;
  provider_message_id?: string | null;
  sent_at?: string | null;
  error?: string | null;
  attempts?: number | null;
}

/** Pure: maps a stored record to the label the user should see. */
export function describeSendState(r: Pick<SendFields, 'status' | 'approval_status' | 'provider_message_id' | 'provider'>): { label: string; tone: Tone } {
  const s = r.status;
  if (r.approval_status === 'Rejected' && s !== 'Sent') return { label: 'Rejected', tone: 'bad' };
  if (s === 'Sent') {
    if (!r.provider_message_id) return { label: 'Unverified (no delivery proof)', tone: 'warn' }; // legacy rows from before truthful tracking
    return r.provider === 'manual' ? { label: 'Sent manually (you)', tone: 'ok' } : { label: 'Sent', tone: 'ok' };
  }
  if (s === 'Sending') return { label: 'Sending…', tone: 'busy' };
  if (s === 'Failed') return { label: 'Failed', tone: 'bad' };
  if (s === 'Approved') return { label: 'Approved - not sent yet', tone: 'info' };
  if (s === 'Pending Approval' || (s === 'Draft' && r.approval_status === 'Pending Approval')) return { label: 'Awaiting approval', tone: 'warn' };
  if (s === 'Draft' || s === 'Drafted' || s === 'Pending') return { label: 'Draft', tone: 'neutral' };
  if (s === 'Replied') return { label: 'Replied', tone: 'ok' };
  if (s === 'Viewed') return { label: 'Viewed', tone: 'ok' };
  if (s === 'Accepted') return { label: 'Accepted', tone: 'ok' };
  if (s === 'Rejected') return { label: 'Rejected', tone: 'bad' };
  if (s === 'Skipped') return { label: 'Skipped', tone: 'neutral' };
  return { label: s, tone: 'neutral' };
}

