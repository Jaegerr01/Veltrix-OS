import { getGmailTransport, GMAIL_FROM } from './gmail';
import { getResendClient, resendFrom } from './resend';
import { selectProvider, guardrailConfig, isBlacklisted, type ProviderId } from './config';
import { countConfirmedSendsToday } from './usage';
import { getOwnerEmail } from '../auth/owner';
import { asErr } from '@/lib/errors';

/**
 * Unified outbound email. ONE function, honest result.
 *
 *  delivered:true  -> the provider accepted the message AND returned a message id (messageId set).
 *  delivered:false -> NOT sent. `blocked:true` means a guardrail / missing config stopped it before
 *                     any provider call (the record should stay Approved); otherwise the provider
 *                     was tried and failed (the record becomes Failed with `reason`).
 *
 * Guardrails (apply to every outreach-kind send, human-approved or not - approval is for the
 * CONTENT; these protect the sending domain):
 *  1. Kill switch  OUTREACH_SEND_ENABLED=false
 *  2. Blacklist    OUTREACH_BLACKLIST (emails / domains, comma separated)
 *  3. Daily cap    OUTREACH_DAILY_CAP (default 15), counting CONFIRMED sends only
 * `kind: 'test' | 'transactional'` (mail to the owner themself) skips outreach guardrails.
 */

export type SendKind = 'outreach' | 'test' | 'transactional';

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  kind?: SendKind;
  /** Append an unsubscribe line + List-Unsubscribe header. Default: true for outreach. */
  unsubscribe?: boolean;
  maxAttempts?: number;
  /** test seam */
  sleep?: (ms: number) => Promise<void>;
}

export interface SendResult {
  delivered: boolean;
  blocked: boolean;
  provider?: ProviderId;
  messageId?: string;
  reason?: string;
  attempts: number;
}

export class ProviderError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable = false) {
    super(message);
    this.name = 'ProviderError';
    this.retryable = retryable;
  }
}

const EMAIL_RE = /^[^\s@,;<>()"]+@[^\s@,;<>()"]+\.[^\s@,;<>()"]+$/;
export const isValidEmail = (e: string) => EMAIL_RE.test(e.trim()) && e.length <= 254;

const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim().slice(0, 200);
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function textToHtml(text: string): string {
  const paras = text
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a">${paras}</div>`;
}

function unsubscribeFooter(): string {
  const addr = process.env.EMAIL_FOOTER_ADDRESS ? `\n${process.env.EMAIL_FOOTER_ADDRESS}` : '';
  return `\n\n--\nIf you would rather not hear from me, just reply "unsubscribe" and I will not contact you again.${addr}`;
}

export function classifyProviderError(eIn: unknown, provider: ProviderId): ProviderError {
  if (eIn instanceof ProviderError) return eIn;
  const e = asErr(eIn) as ReturnType<typeof asErr> & { responseCode?: number };
  const code = String(e?.code || '');
  const status = Number(e?.responseCode ?? e?.statusCode ?? e?.status ?? 0);
  const raw = String(e?.message || e || 'Unknown email provider error');
  const msg = raw.replace(/\s+/g, ' ').slice(0, 300);
  if (code === 'EAUTH' || status === 535) {
    return new ProviderError(
      provider === 'gmail-oauth'
        ? 'Gmail rejected the OAuth2 login (EAUTH). Re-create GMAIL_REFRESH_TOKEN or check GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'
        : 'Gmail rejected the login (EAUTH). Use a 16-character App Password (not your normal password) in GMAIL_APP_PASSWORD; 2-Step Verification must be on.',
      false
    );
  }
  const transientCodes = ['ETIMEDOUT', 'ECONNRESET', 'ECONNECTION', 'ESOCKET', 'EDNS', 'EAI_AGAIN', 'ECONNREFUSED'];
  const transient = transientCodes.includes(code) || status === 429 || status >= 500;
  // SMTP 4xx (421/450/451/452) are temporary by definition.
  const smtpTemp = typeof e?.responseCode === 'number' && e.responseCode >= 400 && e.responseCode < 500;
  return new ProviderError(msg, transient || smtpTemp);
}

async function dispatch(
  provider: ProviderId,
  m: { to: string; subject: string; text: string; html: string; replyTo?: string; headers: Record<string, string> }
): Promise<string> {
  if (provider === 'resend') {
    const resend = getResendClient();
    if (!resend) throw new ProviderError('Resend is not configured (RESEND_API_KEY).', false);
    // resend v6 does NOT throw on API errors - it returns { data, error }. Ignoring `error`
    // is exactly what used to make failed sends look delivered.
    const { data, error } = await resend.emails.send({
      from: resendFrom(),
      to: [m.to],
      subject: m.subject,
      text: m.text,
      html: m.html,
      replyTo: m.replyTo,
      headers: m.headers,
    });
    if (error) {
      const status = Number((error as { statusCode?: number }).statusCode ?? 0);
      const name = String((error as { name?: string }).name || '');
      const retryable = status === 429 || status >= 500 || name === 'rate_limit_exceeded' || name === 'application_error' || name === 'internal_server_error';
      const hint = /domain|verify|not verified|testing emails/i.test(error.message || '')
        ? ' (Verify your sending domain in Resend and set RESEND_FROM_EMAIL to an address on it.)'
        : '';
      throw new ProviderError(`Resend: ${String(error.message || name || 'send failed').slice(0, 250)}${hint}`, retryable);
    }
    if (!data?.id) throw new ProviderError('Resend accepted the request but returned no message id - delivery NOT confirmed.', false);
    return data.id;
  }

  const transport = getGmailTransport();
  if (!transport) throw new ProviderError('Gmail is not configured.', false);
  const info = await transport.sendMail({
    from: GMAIL_FROM(),
    to: m.to,
    replyTo: m.replyTo,
    subject: m.subject,
    text: m.text,
    html: m.html,
    headers: m.headers,
    textEncoding: 'quoted-printable',
  });
  if (Array.isArray(info?.rejected) && info.rejected.length > 0) {
    throw new ProviderError(`Gmail rejected the recipient: ${info.rejected.join(', ')}`, false);
  }
  if (!info?.messageId) throw new ProviderError('Gmail returned no message id - delivery NOT confirmed.', false);
  return String(info.messageId);
}

const BACKOFF_MS = [800, 2500];

export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const kind: SendKind = input.kind ?? 'outreach';
  const blocked = (reason: string): SendResult => ({ delivered: false, blocked: true, reason, attempts: 0 });
  const failed = (reason: string, attempts = 0, provider?: ProviderId): SendResult => ({
    delivered: false, blocked: false, reason, attempts, provider,
  });

  const to = (input.to || '').trim();
  if (!isValidEmail(to)) return failed(`"${oneLine(to)}" is not a valid recipient email address.`);
  if (!input.text?.trim()) return failed('Message body is empty.');

  // ── Guardrails (outreach only) ────────────────────────────────────────────
  if (kind === 'outreach') {
    const g = guardrailConfig();
    if (g.killSwitchEngaged) return blocked('Sending is switched off (OUTREACH_SEND_ENABLED=false). The message stays Approved - nothing was sent.');
    if (isBlacklisted(to, g.blacklist)) return blocked(`Recipient ${to} is on the OUTREACH_BLACKLIST - never contacted.`);
    const sent = await countConfirmedSendsToday();
    if (sent >= g.dailyCap) return blocked(`Daily send cap reached (${sent}/${g.dailyCap} confirmed sends today, OUTREACH_DAILY_CAP). Try again tomorrow or raise the cap.`);
  }

  // ── Provider ──────────────────────────────────────────────────────────────
  const sel = selectProvider();
  if (!sel.provider) return blocked(sel.reason || 'No email provider configured.');
  const provider = sel.provider;

  // ── Compose (UTF-8 safe, plain + HTML, reply-to, unsubscribe) ────────────
  const withUnsub = input.unsubscribe ?? kind === 'outreach';
  const text = withUnsub ? input.text.trimEnd() + unsubscribeFooter() : input.text;
  const html = input.html ?? textToHtml(text);
  const replyTo = input.replyTo || process.env.EMAIL_REPLY_TO || getOwnerEmail() || process.env.GMAIL_USER || undefined;
  const headers: Record<string, string> = {};
  if (withUnsub && replyTo) headers['List-Unsubscribe'] = `<mailto:${replyTo}?subject=unsubscribe>`;
  const msg = { to, subject: oneLine(input.subject) || '(no subject)', text, html, replyTo, headers };

  // ── Send with bounded retries on transient errors ─────────────────────────
  const sleep = input.sleep ?? ((ms: number) => new Promise<void>(r => setTimeout(r, ms)));
  const max = Math.max(1, input.maxAttempts ?? 3);
  let lastErr = 'Unknown error';
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      const messageId = await dispatch(provider, msg);
      return { delivered: true, blocked: false, provider, messageId, attempts: attempt };
    } catch (eRaw: unknown) { const e = asErr(eRaw);
      const err = classifyProviderError(e, provider);
      lastErr = err.message;
      console.warn(`[email] ${provider} attempt ${attempt}/${max} failed: ${err.message}`);
      if (!err.retryable || attempt === max) return failed(lastErr, attempt, provider);
      await sleep(BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)]);
    }
  }
  return failed(lastErr, max, provider);
}

/** Back-compat wrapper for older call sites. Guardrails now always apply to outreach. */
export async function sendOutreachEmail(opts: {
  to: string; subject: string; text: string; html?: string; autonomous?: boolean;
}): Promise<SendResult> {
  return sendEmail({ to: opts.to, subject: opts.subject, text: opts.text, html: opts.html, kind: 'outreach' });
}
