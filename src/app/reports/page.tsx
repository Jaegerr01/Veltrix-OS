'use client';

import React from 'react';
import { PageHeaderCard, VxIcon } from '@/components/ds';

/**
 * Reports — ported from the "isReports" view of the design prototype: a
 * command-card header plus a stack of daily command reports (metrics grid
 * + priority / recommended action / leads / follow-ups blocks).
 */

const cmdCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};
const block: React.CSSProperties = { padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)' };

const REPORTS: { date: string; metrics: [string, string, string][] }[] = [
  {
    date: 'Saturday, July 11, 2026',
    metrics: [
      ['Revenue Target', '$6,000', 'var(--text-strong)'],
      ['Closed Revenue', '$0', 'var(--signal-400)'],
      ['Pipeline Value', '$74,400', 'var(--cyan-300)'],
      ['Revenue Gap', '$6,000', 'var(--danger-400)'],
    ],
  },
  {
    date: 'Friday, July 10, 2026',
    metrics: [
      ['Revenue Target', '$6,000', 'var(--text-strong)'],
      ['Closed Revenue', '$2,400', 'var(--signal-400)'],
      ['Pipeline Value', '$71,900', 'var(--cyan-300)'],
      ['Revenue Gap', '$3,600', 'var(--danger-400)'],
    ],
  },
];

export default function ReportsPage() {
  return (
    <>
      <PageHeaderCard
        icon="chartbar"
        title="Reports"
        subtitle="Daily command reports — revenue posture, priorities, and the leads that need you."
        action={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)' }}>12 on file</span>}
      />

      {REPORTS.map((rep) => (
        <section key={rep.date} className="vx-glass" style={cmdCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--violet-300)', display: 'flex' }}>
                <VxIcon name="chartbar" size={18} />
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--violet-200)', textTransform: 'uppercase' }}>Veltrix Daily Command Report</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--violet-200)', padding: '5px 14px', borderRadius: 999, background: 'rgba(139,92,246,0.12)', border: '1px solid var(--border-default)' }}>{rep.date}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            {rep.metrics.map(([label, value, color]) => (
              <div key={label} style={{ ...block, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color, marginTop: 8 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div style={block}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--ls-wide)', color: 'var(--violet-300)', textTransform: 'uppercase', marginBottom: 8 }}>Today&apos;s Top Priority</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-strong)' }}>See daily brief</div>
            </div>
            <div style={block}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--ls-wide)', color: 'var(--signal-400)', textTransform: 'uppercase', marginBottom: 8 }}>Recommended Action</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-strong)' }}>Review daily brief</div>
            </div>
            <div style={block}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--ls-wide)', color: 'var(--cyan-300)', textTransform: 'uppercase', marginBottom: 8 }}>Leads to Contact</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No leads queued</div>
            </div>
            <div style={block}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--ls-wide)', color: 'var(--danger-400)', textTransform: 'uppercase', marginBottom: 8 }}>Follow-ups Due</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No follow-ups queued</div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
