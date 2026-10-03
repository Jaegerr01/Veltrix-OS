'use client';

import React from 'react';
import { VxIcon, type VxIconName } from '@/components/ds';
import { authFetch } from '@/lib/authFetch';
import { useWorkspaceStatus } from '@/lib/status/useWorkspaceStatus';
import { deriveHealth, type HealthPayload } from '@/lib/status/health';

/**
 * System Status. Every tile is derived from real probes: /api/health (live database query, env presence,
 * provider selection) and /api/workspace/status (the same source as the top bar and setup checklist).
 * Nothing is hardcoded green; with no data a tile says "Checking..." and missing config is amber/red with the
 * exact variable names (never values).
 */

const CARD_ICON: Record<string, VxIconName> = { database: 'grid', writes: 'shield', ai: 'brain', email: 'mail' };

export default function HealthPage() {
  const { status, refresh } = useWorkspaceStatus();
  const [health, setHealth] = React.useState<HealthPayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [deepNote, setDeepNote] = React.useState<string | null>(null);

  const load = React.useCallback(async (deep = false) => {
    setBusy(true); setError(null);
    try {
      const res = await authFetch(deep ? '/api/health?deep=1' : '/api/health', { cache: 'no-store' });
      const body = await res.json().catch(() => null);
      // 503 still carries the full report when the caller is signed in; only a body without checks is an error.
      if (body && body.checks && body.env) {
        setHealth(body as HealthPayload);
        if (deep) setDeepNote(body.checks.gemini?.ok ? 'Live AI call succeeded.' : 'Live AI call failed - see the AI card.');
      } else setError(res.status === 401 ? 'Sign in again to read system status.' : `Health report unavailable (HTTP ${res.status}).`);
    } catch { setError('Could not reach the server.'); }
    setBusy(false);
  }, []);
  React.useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, [load]);

  const view = deriveHealth(health, status);
  const refreshAll = () => { void load(); void refresh(); };

  return (
    <>
      <section className="vx-glass vx-health__banner" data-tone={error ? 'bad' : view.overall} aria-live="polite">
        <span className="vx-health__icon"><VxIcon name={view.overall === 'ok' ? 'shield' : view.overall === 'unknown' ? 'refresh' : 'alert'} size={26} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="vx-health__headline">{error ? 'System status unavailable' : view.headline}</h2>
          <p className="vx-health__detail">{error || view.detail}</p>
        </div>
        <div className="vx-health__actions">
          <button type="button" className="vx-linkbtn vx-tap" onClick={refreshAll} disabled={busy}>{busy ? 'Checking...' : 'Refresh'}</button>
          <button type="button" className="vx-linkbtn vx-tap" onClick={() => { setDeepNote(null); void load(true); }} disabled={busy} title="Makes one small real Gemini call to prove the key works">Test AI with a live call</button>
        </div>
      </section>
      {deepNote ? <p role="status" className="vx-health__detail" style={{ margin: 0 }}>{deepNote}</p> : null}

      <section className="vx-health__grid" aria-label="Integrations">
        {view.cards.map(c => (
          <div key={c.id} className="vx-glass vx-health__card" data-tone={c.tone}>
            <div className="vx-health__cardtop">
              <span className="vx-health__icon vx-health__icon--sm"><VxIcon name={CARD_ICON[c.id]} size={20} /></span>
              <h3 className="vx-health__name">{c.name}</h3>
              <span className="vx-health__pill" data-tone={c.tone}>{c.label}</span>
            </div>
            <p className="vx-health__detail">{c.detail}</p>
            {c.missing.length ? <p className="vx-health__missing">Missing: {c.missing.map(m => <code key={m}>{m}</code>)}</p> : null}
          </div>
        ))}
      </section>

      <section className="vx-glass vx-health__envcard" aria-label="Environment variables">
        <div className="vx-health__envhead">
          <VxIcon name="gear" size={18} />
          <h3 className="vx-health__name">Environment variables</h3>
          <span className="vx-health__count">{health ? `(${view.envSetCount}/${view.env.length} set)` : '(checking...)'}</span>
        </div>
        <div className="vx-health__envgrid">
          {view.env.map(r => (
            <div key={r.name} className="vx-health__envrow">
              <span className="vx-health__envname">{r.name}</span>
              <span className="vx-health__pill vx-health__pill--plain" data-tone={r.tone}>{r.label}</span>
            </div>
          ))}
        </div>
        <p className="vx-health__detail" style={{ marginTop: 'var(--space-4)' }}>Only whether a variable is set is shown, never its value.</p>
      </section>
    </>
  );
}
