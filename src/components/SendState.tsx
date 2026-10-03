'use client';

import { asErr } from '@/lib/errors';
import React from 'react';
import { authFetch } from '@/lib/authFetch';

/**
 * Truthful delivery state, shared by Outreach / Follow-ups / Proposals / Approval Queue.
 * A record shows "Sent" only when the server stored a provider message id (or an explicit "manual" attestation).
 */

export type SendKind = 'outreach' | 'followups' | 'proposals';


import { describeSendState, type SendFields, type Tone } from '@/lib/sendLabels';
export { describeSendState };
export type { SendFields };

const TONES: Record<Tone, { fg: string; bg: string; bd: string }> = {
  neutral: { fg: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)', bd: 'var(--hairline)' },
  warn: { fg: 'var(--warn-400)', bg: 'rgba(245,180,60,0.10)', bd: 'rgba(245,180,60,0.30)' },
  info: { fg: 'var(--cyan-300)', bg: 'rgba(76,215,246,0.10)', bd: 'rgba(76,215,246,0.28)' },
  busy: { fg: 'var(--violet-300)', bg: 'rgba(139,92,246,0.12)', bd: 'rgba(139,92,246,0.32)' },
  ok: { fg: 'var(--signal-400)', bg: 'rgba(46,230,160,0.10)', bd: 'rgba(46,230,160,0.28)' },
  bad: { fg: 'var(--danger-400)', bg: 'rgba(239,68,68,0.10)', bd: 'rgba(239,68,68,0.30)' },
};

export function SendStateBadge({ record }: { record: SendFields }) {
  const { label, tone } = describeSendState(record);
  const t = TONES[tone];
  return (
    <span
      data-testid="send-state-badge"
      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: t.fg, background: t.bg, border: `1px solid ${t.bd}`, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}
    >
      {label}
    </span>
  );
}

/** Proof line (when/how it was delivered) or the failure/blocked reason. */
export function SendDetails({ record }: { record: SendFields }) {
  const lines: Array<{ text: string; bad?: boolean }> = [];
  if (record.status === 'Sent' && record.provider_message_id) {
    const when = record.sent_at ? new Date(record.sent_at).toLocaleString() : '';
    lines.push({ text: record.provider === 'manual' ? `Recorded as sent by you ${when}` : `Delivered via ${record.provider || 'provider'} ${when} · id ${record.provider_message_id}` });
  }
  if (record.status === 'Sent' && !record.provider_message_id) {
    lines.push({ text: 'Older record marked "Sent" without any delivery proof. It may never have been delivered. Run the data-correction SQL.', bad: true });
  }
  if (record.error && record.status !== 'Sent') lines.push({ text: record.error, bad: true });
  if (record.status === 'Failed' && record.attempts) lines.push({ text: `${record.attempts} attempt${record.attempts === 1 ? '' : 's'} made.` });
  if (!lines.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: l.bad ? 'var(--danger-400)' : 'var(--text-dim)', wordBreak: 'break-word' }}>{l.text}</div>
      ))}
    </div>
  );
}

export interface SendResultInfo { ok: boolean; sent: boolean; text: string }

/** Calls /api/{outreach|followups|proposals}/send. Reports exactly what the server says. */
export async function requestSend(kind: SendKind, id: string, opts: { retry?: boolean; manual?: boolean } = {}): Promise<SendResultInfo> {
  try {
    const res = await authFetch(`/api/${kind}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, retry: opts.retry, manual: opts.manual }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) return { ok: true, sent: true, text: data.note || 'Sent.' };
    return { ok: false, sent: false, text: data.error || data.note || `Request failed (${res.status}).` };
  } catch (raw) { const e = asErr(raw);
    return { ok: false, sent: false, text: `Could not reach the server: ${e?.message || e}` };
  }
}

const btn = (tone: Tone): React.CSSProperties => ({
  background: TONES[tone].bg, border: `1px solid ${TONES[tone].bd}`, color: TONES[tone].fg,
  fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
});

export function SendButton({ label, tone = 'ok', busy, onClick, title }: { label: string; tone?: Tone; busy?: boolean; onClick: () => void; title?: string }) {
  return (
    <button type="button" disabled={busy} title={title} onClick={onClick} style={{ ...btn(tone), opacity: busy ? 0.6 : 1, cursor: busy ? 'wait' : 'pointer' }}>
      {busy ? 'Working…' : label}
    </button>
  );
}

/** Small hook: tracks which record is mid-request and the last server message. */
export function useSendAction(onDone: () => Promise<void> | void) {
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null);
  const run = React.useCallback(async (kind: SendKind, id: string, opts: { retry?: boolean; manual?: boolean } = {}) => {
    setBusyId(id);
    setNotice(null);
    const r = await requestSend(kind, id, opts);
    setNotice({ ok: r.ok, text: r.text });
    setBusyId(null);
    await onDone();
  }, [onDone]);
  return { busyId, notice, setNotice, run };
}

export function Notice({ notice, onClose }: { notice: { ok: boolean; text: string } | null; onClose: () => void }) {
  if (!notice) return null;
  const t = TONES[notice.ok ? 'ok' : 'bad'];
  return (
    <div role="status" style={{ padding: '10px 14px', borderRadius: 8, background: t.bg, border: `1px solid ${t.bd}`, color: t.fg, fontSize: 12.5, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ wordBreak: 'break-word' }}>{notice.text}</span>
      <span onClick={onClose} style={{ cursor: 'pointer' }}>×</span>
    </div>
  );
}
