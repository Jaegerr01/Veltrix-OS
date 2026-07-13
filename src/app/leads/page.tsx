'use client';

import React from 'react';

/**
 * Leads — ported from the "isPipeline" view of the design prototype: a
 * four-stage deal pipeline (Prospecting / Qualified / Proposal / Closed Won)
 * with per-stage totals and deal cards.
 */

const STAGES: { name: string; tone: string; count: number; total: string; deals: { company: string; value: string; owner: string }[] }[] = [
  {
    name: 'Prospecting',
    tone: 'var(--cyan-400)',
    count: 12,
    total: '$420K',
    deals: [
      { company: 'Nordic Retail', value: '$84K', owner: 'AI' },
      { company: 'Apex Logistics', value: '$52K', owner: 'AI' },
      { company: 'Vera Health', value: '$38K', owner: 'AI' },
    ],
  },
  {
    name: 'Qualified',
    tone: 'var(--violet-300)',
    count: 8,
    total: '$310K',
    deals: [
      { company: 'Meridian Bank', value: '$120K', owner: 'AI' },
      { company: 'Solaris Energy', value: '$66K', owner: 'AI' },
    ],
  },
  {
    name: 'Proposal',
    tone: 'var(--warn-400)',
    count: 5,
    total: '$288K',
    deals: [
      { company: 'Cobalt Mfg', value: '$140K', owner: 'AI' },
      { company: 'Lumen Media', value: '$74K', owner: 'AI' },
    ],
  },
  {
    name: 'Closed Won',
    tone: 'var(--signal-400)',
    count: 9,
    total: '$222K',
    deals: [
      { company: 'Orbit Software', value: '$96K', owner: 'AI' },
      { company: 'Delta Foods', value: '$48K', owner: 'AI' },
    ],
  },
];

export default function LeadsPage() {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)', alignItems: 'stretch' }}>
      {STAGES.map((stage) => (
        <div
          key={stage.name}
          className="vx-glass"
          style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', background: 'var(--grad-panel)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md), var(--sheen-top)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.tone, boxShadow: `0 0 8px ${stage.tone}` }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', letterSpacing: '0.01em' }}>{stage.name}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-dim)' }}>{stage.count}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--cyan-300)', marginBottom: 'var(--space-4)', letterSpacing: '-0.01em' }}>{stage.total}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {stage.deals.map((deal) => (
              <div key={deal.company} style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--hairline)', cursor: 'grab' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>{deal.company}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-body)' }}>{deal.value}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{deal.owner}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
