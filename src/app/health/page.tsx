'use client';

import React from 'react';
import { VxIcon, type VxIconName } from '@/components/ds';

/**
 * System Status — ported from the "isSystemStatus" view of the design
 * prototype: an "all systems operational" banner, integration cards, and
 * the environment-variable checklist.
 */

const cmdCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};

const INTEGRATIONS: { name: string; desc: string; icon: VxIconName }[] = [
  { name: 'Database (Supabase)', desc: 'Connected and the leads table is reachable.', icon: 'grid' },
  { name: 'Server Writes (Service Role)', desc: 'Service-role client initialized.', icon: 'shield' },
  { name: 'Agent Brains (Gemini)', desc: 'GEMINI_API_KEY present. Add ?deep=1 to confirm it is valid with a live call.', icon: 'brain' },
  { name: 'Email Delivery (Resend)', desc: 'Configured with sender VELTRIX OS <noreply@resend.dev>.', icon: 'mail' },
];

const ENV_VARS: [string, boolean][] = [
  ['GEMINI_API_KEY', true],
  ['NEXT_PUBLIC_SUPABASE_URL', true],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', true],
  ['SUPABASE_SERVICE_ROLE_KEY', true],
  ['RESEND_API_KEY', true],
  ['RESEND_FROM_EMAIL', true],
  ['NOTIFY_EMAIL', true],
  ['CRON_SECRET', true],
  ['NEXT_PUBLIC_SITE_URL', false],
];

export default function HealthPage() {
  return (
    <>
      {/* Banner */}
      <section
        className="vx-glass"
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, rgba(46,230,160,0.10), rgba(46,230,160,0.02))', border: '1px solid rgba(46,230,160,0.28)', boxShadow: 'var(--shadow-lg)' }}
      >
        <span style={{ width: 52, height: 52, flex: '0 0 auto', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--signal-400)', background: 'rgba(46,230,160,0.12)', border: '1px solid rgba(46,230,160,0.3)' }}>
          <VxIcon name="shield" size={26} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-strong)' }}>All systems operational</div>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>All critical systems are live. The autonomous pipeline can run end-to-end.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', height: 42, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-default)', color: 'var(--text-body)', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <span style={{ display: 'flex' }}>
            <VxIcon name="refresh" size={18} />
          </span>
          Refresh
        </div>
      </section>

      {/* Integrations */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
        {INTEGRATIONS.map((ig) => (
          <div key={ig.name} className="vx-glass" style={cmdCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 42, height: 42, flex: '0 0 auto', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--signal-400)', background: 'rgba(46,230,160,0.10)', border: '1px solid rgba(46,230,160,0.22)' }}>
                <VxIcon name={ig.icon} size={22} color="var(--signal-400)" />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-strong)' }}>{ig.name}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--signal-400)', padding: '4px 11px', borderRadius: 999, background: 'rgba(46,230,160,0.10)', border: '1px solid rgba(46,230,160,0.28)' }}>Live</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 12, lineHeight: 'var(--lh-normal)' }}>{ig.desc}</div>
          </div>
        ))}
      </section>

      {/* Environment variables */}
      <section className="vx-glass" style={cmdCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-5)' }}>
          <span style={{ color: 'var(--violet-300)', display: 'flex' }}>
            <VxIcon name="gear" size={18} />
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>Environment Variables</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>(8/9 set)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px var(--space-8)' }}>
          {ENV_VARS.map(([name, set]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--hairline)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-body)' }}>{name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: set ? 'var(--signal-400)' : 'var(--danger-400)', display: 'flex', alignItems: 'center', gap: 5 }}>{set ? 'set' : 'missing'}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
