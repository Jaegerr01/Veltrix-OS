'use client';

import React from 'react';
import { StatCard, AgentCard, VxIcon, AGENT_DEFS, ACTIVITY_DEFS } from '@/components/ds';
import ApprovalQueue from '@/components/ApprovalQueue';
import GoalCascadePanel from '@/components/GoalCascadePanel';
import ScraperControl from '@/components/ScraperControl';

/**
 * Command Center — ported from the "isCommand" view of the design prototype:
 * Approval Queue, Goal Cascade + Lead Scraper controls, Live Data pipeline,
 * a KPI row, and the Agent Roster paired with Live Telemetry.
 *
 * The Approval Queue, Goal Cascade and Lead Scraper panels render the real
 * wired components (each talks to its own API route). The prototype's
 * simulated versions were removed — they only faked a 2.2s spinner.
 */

const cmdCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};

const KPIS = [
  { label: 'Pipeline Value', value: '1.24', unit: 'M USD', delta: '+18%', accent: 'violet' },
  { label: 'Meetings Booked', value: '86', unit: '', delta: '+12%', accent: 'blue' },
  { label: 'Emails Sent', value: '3,482', unit: '', delta: '+24%', accent: 'cyan' },
  { label: 'Avg Open Rate', value: '41', unit: '%', delta: '-3%', accent: 'magenta' },
] as const;

const LIVE_PIPELINE = [
  { label: 'New', value: '863', color: 'var(--cyan-300)' },
  { label: 'Contacted', value: '0', color: 'var(--text-strong)' },
  { label: 'Replied', value: '62', color: 'var(--violet-300)' },
  { label: 'Booked', value: '0', color: 'var(--text-strong)' },
  { label: 'Proposal', value: '0', color: 'var(--text-strong)' },
  { label: 'Won', value: '0', color: 'var(--signal-400)' },
  { label: 'Lost', value: '0', color: 'var(--text-strong)' },
  { label: 'Nurture', value: '0', color: 'var(--text-strong)' },
];

const telemetryDot = (tone: string) =>
  tone === 'active' ? 'var(--signal-400)' : tone === 'warn' ? 'var(--warn-400)' : tone === 'brand' ? 'var(--violet-300)' : 'var(--cyan-400)';

export default function CommandCenterPage() {
  return (
    <>
      {/* Approval Queue — real component, reads /api/entity/approvals */}
      <ApprovalQueue />

      {/* Goal Cascade + Lead Scraper — both real components, each wired to its API */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        <GoalCascadePanel />
        <ScraperControl />
      </section>

      {/* Live Data */}
      <section className="vx-glass" style={cmdCard}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <div>
            <div className="vx-eyebrow" style={{ color: 'var(--cyan-300)' }}>Live Data</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginTop: 4 }}>Lead Pipeline</div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>Today: 0 tasks · 0 follow-ups</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 'var(--space-3)' }}>
          {LIVE_PIPELINE.map((lp) => (
            <div key={lp.label} style={{ padding: 'var(--space-4) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: lp.color, lineHeight: 1 }}>{lp.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 8 }}>{lp.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* KPI row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)' }}>
        {KPIS.map((k, i) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            unit={k.unit}
            delta={k.delta}
            accent={k.accent}
            style={{ animation: 'vxFadeUp 0.6s var(--ease-out) both', animationDelay: `${i * 0.06}s` }}
          />
        ))}
      </section>

      {/* Agent Roster + Live Telemetry */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--violet-300)', marginBottom: 6 }}>Workforce</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-strong)' }}>Agent Roster</div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>8 AGENTS · 5 ACTIVE</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
            {AGENT_DEFS.map((a, i) => (
              <AgentCard key={a.id} agent={a} index={i} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>Live Telemetry</div>
          <div className="vx-glass" style={{ ...cmdCard, padding: 0, overflow: 'hidden' }}>
            {ACTIVITY_DEFS.map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '54px 1fr',
                  columnGap: 12,
                  rowGap: 2,
                  alignItems: 'baseline',
                  padding: '13px 20px',
                  borderBottom: i < ACTIVITY_DEFS.length - 1 ? '1px solid var(--hairline)' : 'none',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{row.time}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-body)', lineHeight: 1.5 }}>{row.text}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-5)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="vx-glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--grad-panel)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md), var(--sheen-top)' }}>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>System Load</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 500, color: 'var(--signal-400)', marginTop: 8, lineHeight: 1 }}>
                32<span style={{ fontSize: 14, color: 'var(--text-dim)' }}>%</span>
              </div>
              <div style={{ height: 4, borderRadius: 999, background: 'var(--ink-500)', marginTop: 12, overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: '32%', background: 'var(--grad-brand)', boxShadow: 'var(--glow-violet)' }} />
              </div>
            </div>
            <div className="vx-glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--grad-panel)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md), var(--sheen-top)' }}>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>Uptime</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 500, color: 'var(--cyan-300)', marginTop: 8, lineHeight: 1 }}>
                99.98<span style={{ fontSize: 14, color: 'var(--text-dim)' }}>%</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 14, fontFamily: 'var(--font-mono)' }}>14d 06h · no incidents</div>
            </div>
          </div>

          <div
            className="vx-glass"
            style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(34,211,238,0.06))',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-md), var(--sheen-top)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <span style={{ width: 42, height: 42, flex: '0 0 auto', borderRadius: 'var(--radius-md)', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: 'var(--glow-violet)' }}>
              <VxIcon name="mic" size={22} color="#fff" />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>Talk to your CEO Agent</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Voice command the workforce</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--cyan-300)' }}>▸ Listening…</span>
          </div>
        </div>
      </section>
    </>
  );
}
