import { db } from '../db';
import { getGmailTransport, GMAIL_FROM } from './gmail';
import { getResendClient, FROM_EMAIL } from './resend';

/**
 * Unified outbound email with autonomy guardrails.
 *
 * Every autonomous send in the OS goes through here, because one bad batch
 * of AI-generated email can permanently damage the sending domain's
 * deliverability. Three independent brakes:
 *
 *  1. Kill switch — OUTREACH_SEND_ENABLED=false halts ALL autonomous sends
 *     instantly (drafts still get created, nothing leaves the building).
 *  2. Daily cap — OUTREACH_DAILY_CAP (default 15) counted from actually-sent
 *     outreach messages today. Gmail app-password accounts get flagged fast
 *     above ~50/day; 15 is a safe warm-up number.
 *  3. Blacklist — OUTREACH_BLACKLIST, comma-separated emails or domains
 *     (e.g. "gov,edu,competitor.com,person@x.com") that must never be
 *     contacted automatically.
 *
 * Provider order: Gmail (if configured) → Resend (if configured) → refuse.
 */

export interface SendResult {
  delivered: boolean;
  provider?: 'gmail' | 'resend';
  reason?: string; // why it was NOT delivered
}

function isBlacklisted(email: string): boolean {
  const raw = process.env.OUTREACH_BLACKLIST || '';
  if (!raw.trim()) return false;
  const needle = email.toLowerCase();
  const domain = needle.split('@')[1] || '';
  return raw
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
    .some(entry =>
      needle === entry ||
      domain === entry ||
      domain.endsWith(`.${entry}`) ||
      domain.split('.').includes(entry)
    );
}

async function sentTodayCount(): Promise<number> {
  const messages = await db.getOutreachMessages();
  const today = new Date().toISOString().slice(0, 10);
  return messages.filter(
    m => m.status === 'Sent' && (m.sent_at || m.created_at || '').slice(0, 10) === today
  ).length;
}

export async function sendOutreachEmail(opts: {
  to: string;
  subject: string;
  text: string;
  /** true when no human approved this specific message */
  autonomous: boolean;
}): Promise<SendResult> {
  const { to, subject, text, autonomous } = opts;

  if (!to || !to.includes('@')) {
    return { delivered: false, reason: 'Invalid recipient address.' };
  }

  if (autonomous) {
    if (process.env.OUTREACH_SEND_ENABLED === 'false') {
      return { delivered: false, reason: 'Kill switch active (OUTREACH_SEND_ENABLED=false). Draft saved, nothing sent.' };
    }
    if (isBlacklisted(to)) {
      return { delivered: false, reason: `Recipient ${to} matches OUTREACH_BLACKLIST.` };
    }
    const cap = Number(process.env.OUTREACH_DAILY_CAP || 15);
    const sent = await sentTodayCount();
    if (sent >= cap) {
      return { delivered: false, reason: `Daily send cap reached (${sent}/${cap}). Raise OUTREACH_DAILY_CAP deliberately, not reactively.` };
    }
  }

  // Provider 1: Gmail
  const gmail = getGmailTransport();
  if (gmail) {
    try {
      await gmail.sendMail({ from: GMAIL_FROM(), to, subject, text });
      return { delivered: true, provider: 'gmail' };
    } catch (err: any) {
      // fall through to Resend, but surface the reason if that also fails
      const gmailError = err?.message || 'Gmail send failed';
      const resend = getResendClient();
      if (!resend) return { delivered: false, reason: `Gmail failed: ${gmailError}. Resend not configured.` };
      try {
        await resend.emails.send({ from: FROM_EMAIL, to: [to], subject, text });
        return { delivered: true, provider: 'resend' };
      } catch (err2: any) {
        return { delivered: false, reason: `Gmail failed: ${gmailError}. Resend failed: ${err2?.message}` };
      }
    }
  }

  // Provider 2: Resend
  const resend = getResendClient();
  if (resend) {
    try {
      await resend.emails.send({ from: FROM_EMAIL, to: [to], subject, text });
      return { delivered: true, provider: 'resend' };
    } catch (err: any) {
      return { delivered: false, reason: `Resend failed: ${err?.message}` };
    }
  }

  return {
    delivered: false,
    reason: 'No email provider configured. Set GMAIL_USER + GMAIL_APP_PASSWORD (or RESEND_API_KEY) in .env.local.',
  };
}
