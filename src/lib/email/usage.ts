import { db } from '../db';

/** "Today" in the operator's timezone (default Los Angeles), YYYY-MM-DD. */
export function todayKey(date = new Date(), tz = process.env.OUTREACH_TIMEZONE || 'America/Los_Angeles'): string {
  try {
    return date.toLocaleDateString('en-CA', { timeZone: tz });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

interface SendRow {
  status?: string;
  sent_at?: string | null;
  provider_message_id?: string | null;
  provider?: string | null;
}

/**
 * A row counts toward the daily cap ONLY if it is a confirmed send: status 'Sent', sent today,
 * and carries a provider_message_id. (If the column does not exist yet - migration not applied -
 * the value is `undefined`; we then count it, the conservative choice for a safety cap.)
 */
export function isConfirmedSendToday(r: SendRow, today = todayKey()): boolean {
  if (r.status !== 'Sent' || !r.sent_at) return false;
  if (r.provider === 'manual') return false; // owner-attested social DM, not sent by our mailer
  if (r.provider_message_id === null || r.provider_message_id === '') return false;
  return todayKey(new Date(r.sent_at)) === today;
}

export async function countConfirmedSendsToday(): Promise<number> {
  const [messages, followups, proposals] = await Promise.all([
    db.getOutreachMessages(),
    db.getFollowups(),
    db.getProposals(),
  ]);
  const today = todayKey();
  return [...messages, ...followups, ...proposals].filter(r => isConfirmedSendToday(r as SendRow, today)).length;
}
