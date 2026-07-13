'use client';

import React from 'react';
import { StatCard } from '@/components/ds';

/**
 * Revenue — ported from the "isAnalytics" view of the design prototype: a
 * KPI row, a 12-week pipeline bar chart, and a channel-mix donut with legend.
 */

const KPIS = [
  { label: 'Pipeline Value', value: '1.24', unit: 'M USD', delta: '+18%', accent: 'violet' },
  { label: 'Meetings Booked', value: '86', unit: '', delta: '+12%', accent: 'blue' },
  { label: 'Emails Sent', value: '3,482', unit: '', delta: '+24%', accent: 'cyan' },
  { label: 'Avg Open Rate', value: '41', unit: '%', delta: '-3%', accent: 'magenta' },
] as const;

const BAR_VALS = [42, 55, 48, 63, 58, 72, 68, 80, 76, 88, 84, 96];
const BAR_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

const CHANNELS = [
  { name: 'Outbound', pct: '42%', tone: 'var(--violet-400)' },
  { name: 'Inbound', pct: '26%', tone: 'var(--cyan-400)' },
  { name: 'Referral', pct: '18%', tone: 'var(--signal-400)' },
  { name: 'Partner', pct: '14%', tone: 'var(--mist-500)' },
];

const chartCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
  backdropFilter: 'blur(18px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
};

export default function RevenuePage() {
  return (
    <>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)' }}>
        {KPIS.map((k, i) => (
          <StatCard key={k.label} label={k.label} value={k.value} unit={k.unit} delta={k.delta} accent={k.accent} style={{ animation: 'vxFadeUp 0.6s var(--ease-out) both', animationDelay: `${i * 0.06}s` }} />
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        {/* Bar chart */}
        <div style={chartCard}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
            <div>
              <div className="vx-eyebrow" style={{ color: 'var(--cyan-300)', marginBottom: 6 }}>Revenue Trend</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>Pipeline · Last 12 Weeks</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--signal-400)' }}>+18.4%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 220, paddingTop: 'var(--space-4)' }}>
            {BAR_VALS.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${v}%`,
                    borderRadius: '6px 6px 2px 2px',
                    background: i === BAR_VALS.length - 1 ? 'var(--grad-brand)' : 'linear-gradient(180deg, rgba(139,92,246,0.55), rgba(34,211,238,0.25))',
                    boxShadow: i === BAR_VALS.length - 1 ? 'var(--glow-violet)' : 'none',
                    transition: 'height var(--dur-slow) var(--ease-out)',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-dim)' }}>{BAR_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut */}
        <div style={chartCard}>
          <div className="vx-eyebrow" style={{ color: 'var(--violet-300)', marginBottom: 'var(--space-5)' }}>Channel Mix</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ width: 180, height: 180, borderRadius: '50%', background: 'conic-gradient(var(--violet-400) 0% 42%, var(--cyan-400) 42% 68%, var(--signal-400) 68% 86%, var(--mist-500) 86% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(139,92,246,0.3)' }}>
              <div style={{ width: 118, height: 118, borderRadius: '50%', background: 'var(--ink-800)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--text-strong)', lineHeight: 1 }}>$1.24M</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>TOTAL</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {CHANNELS.map((ch) => (
              <div key={ch.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: ch.tone, flex: '0 0 auto' }} />
                <span style={{ fontSize: 13, color: 'var(--text-body)', flex: 1 }}>{ch.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-muted)' }}>{ch.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
