'use client';

import React from 'react';
import { authFetch } from '@/lib/authFetch';
import { Button } from '@/components/ds';
import type { EmailStatus } from '@/lib/email/status';
import type { CeoStatus } from '@/lib/orchestrator/status';

const card: React.CSSProperties = {
  padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};
const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };
const h: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' };

function Row({ label, ok, children }: { label: string; ok?: boolean | null; children?: React.ReactNode }) {
  const color = ok === true ? 'var(--signal-400)' : ok === false ? 'var(--danger-400)' : 'var(--text-dim)';
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid var(--hairline)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flex: '0 0 auto', alignSelf: 'center' }} />
      <span style={{ width: 150, flex: '0 0 auto', fontSize: 12.5, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ ...mono, color: 'var(--text-body)', wordBreak: 'break-word' }}>{children}</span>
    </div>
  );
}

/** Settings -> Email. Everything shown comes from the server (/api/email/status); only env var NAMES, never values. */
export function EmailPanel() {
  const [st, setSt] = React.useState<EmailStatus | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; text: string } | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    try {
      const res = await authFetch('/api/email/status');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) setSt(data.status);
      else setErr(data.error || `Status request failed (${res.status}).`);
    } catch (e: any) { setErr(`Could not reach the server: ${e?.message || e}`); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const sendTest = async () => {
    setTesting(true); setResult(null);
    try {
      const res = await authFetch('/api/email/test', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) setResult({ ok: true, text: `Delivered to ${data.to} via ${data.provider} (message id ${data.messageId}). Check your inbox (and spam).` });
      else setResult({ ok: false, text: `NOT sent: ${data.error || res.status}` });
    } catch (e: any) { setResult({ ok: false, text: `NOT sent: ${e?.message || e}` }); }
    setTesting(false); load();
  };

  return (
    <div style={{ ...card, gridColumn: '1 / -1' }} className="vx-glass flex flex-col gap-4" id="email-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={h}>Email (outbound delivery)</div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Live status from the server. Secret values are never shown.</span>
      </div>

      {err && <div style={{ ...mono, color: 'var(--danger-400)' }}>{err}</div>}
      {!st && !err && <div style={{ ...mono, color: 'var(--text-dim)' }}>Loading…</div>}

      {st && (
        <>
          <div style={{ ...mono, padding: '8px 12px', borderRadius: 8, border: `1px solid ${st.ready ? 'rgba(46,230,160,0.3)' : 'rgba(239,68,68,0.3)'}`, color: st.ready ? 'var(--signal-400)' : 'var(--danger-400)' }}>
            {st.ready ? 'READY to send (provider configured, kill switch off, under cap). Configured ≠ delivered - press the test button to prove it.' : 'NOT READY - emails will not be sent until the items below are fixed.'}
          </div>

          <div>
            {st.providers.map(p => (
              <Row key={p.id} label={p.label} ok={p.configured}>
                {p.configured ? 'configured' : `missing env vars: ${p.missing.join(', ')}`}
                {p.warning ? ` - ${p.warning}` : ''}
                {st.selected === p.id ? '  ← in use' : ''}
              </Row>
            ))}
            <Row label="Provider selection" ok={!!st.selected}>
              EMAIL_PROVIDER={st.requested}{st.selected ? ` → using ${st.selected}` : ` → none (${st.selectionReason || 'not configured'})`}
            </Row>
            <Row label="From address" ok={!!st.fromAddress}>{st.fromAddress || 'n/a (no provider)'}</Row>
            <Row label="Reply-to" ok={!!st.replyTo}>{st.replyTo || 'not set (EMAIL_REPLY_TO / OWNER_EMAIL)'}</Row>
            <Row label="Kill switch" ok={!st.killSwitch.engaged}>
              {st.killSwitch.engaged ? `ENGAGED - sending is disabled (${st.killSwitch.envVar}=false)` : `off - sending allowed (${st.killSwitch.envVar})`}
            </Row>
            <Row label="Sent today / cap" ok={st.cap.remaining > 0}>
              {st.cap.sentToday} / {st.cap.limit} confirmed sends ({st.cap.envVar}); counts only provider-confirmed deliveries
            </Row>
            <Row label="Blacklist" ok={null}>{st.blacklistEntries} entr{st.blacklistEntries === 1 ? 'y' : 'ies'} (OUTREACH_BLACKLIST)</Row>
            <Row label="Owner email" ok={!!st.ownerEmail}>{st.ownerEmail || 'OWNER_EMAIL not set'}</Row>
          </div>

          {st.problems.length > 0 && (
            <ul style={{ ...mono, color: 'var(--warn-400)', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {st.problems.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button onClick={sendTest} disabled={testing || !st?.ownerEmail} size="md">
          {testing ? 'Sending…' : 'Send test email to myself'}
        </Button>
        <Button variant="ghost" onClick={load} size="md">Refresh status</Button>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          Sends only to {st?.ownerEmail || 'OWNER_EMAIL'}. Never to a lead.
        </span>
      </div>
      {result && (
        <div role="status" style={{ ...mono, padding: '8px 12px', borderRadius: 8, color: result.ok ? 'var(--signal-400)' : 'var(--danger-400)', border: `1px solid ${result.ok ? 'rgba(46,230,160,0.3)' : 'rgba(239,68,68,0.3)'}`, wordBreak: 'break-word' }}>
          {result.text}
        </div>
      )}
    </div>
  );
}

/** Settings -> AI connection. "Test AI connection" makes one tiny real Gemini call and reports the exact failure. */
export function AiConnectionPanel() {
  const [st, setSt] = React.useState<CeoStatus | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [ping, setPing] = React.useState<{ ok: boolean; message?: string; hint?: string; code?: string } | null>(null);

  const load = React.useCallback(async (withPing: boolean) => {
    setErr(null);
    if (withPing) { setTesting(true); setPing(null); }
    try {
      const res = await authFetch(`/api/ceo/status${withPing ? '?ping=1' : ''}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) { setSt(data.status); if (withPing) setPing(data.ping ?? null); }
      else setErr(data.error || `Status request failed (${res.status}).`);
    } catch (e: any) { setErr(`Could not reach the server: ${e?.message || e}`); }
    setTesting(false);
  }, []);
  React.useEffect(() => { load(false); }, [load]);

  return (
    <div style={card} className="vx-glass flex flex-col gap-4" id="ai-panel">
      <div style={h}>AI connection (CEO agent &amp; ARIA)</div>
      {err && <div style={{ ...mono, color: 'var(--danger-400)' }}>{err}</div>}
      {st && (
        <div>
          <Row label="Gemini API key" ok={st.ai.configured}>
            {st.ai.configured ? `present (${st.ai.envVar}) · model ${st.ai.model}` : `MISSING - set ${st.ai.envVar} in .env.local (and in Netlify → Site settings → Environment variables), then restart/redeploy`}
          </Row>
          <Row label="Tasks" ok={null}>
            {st.tasks.queued} queued · {st.tasks.running} running · {st.tasks.needsApproval} need approval · {st.tasks.failed} failed · {st.tasks.done} done
          </Row>
          <Row label="Approvals pending" ok={null}>{st.approvalsPending}</Row>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button onClick={() => load(true)} disabled={testing} size="md">{testing ? 'Testing…' : 'Test AI connection'}</Button>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Makes one tiny real Gemini call.</span>
      </div>
      {ping && (
        <div role="status" style={{ ...mono, padding: '8px 12px', borderRadius: 8, color: ping.ok ? 'var(--signal-400)' : 'var(--danger-400)', border: `1px solid ${ping.ok ? 'rgba(46,230,160,0.3)' : 'rgba(239,68,68,0.3)'}`, wordBreak: 'break-word' }}>
          {ping.ok ? `Connected. ${ping.message}` : `NOT connected [${ping.code}]: ${ping.message}${ping.hint ? ' - ' + ping.hint : ''}`}
        </div>
      )}
    </div>
  );
}
