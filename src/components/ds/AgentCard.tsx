'use client';

import React from 'react';
import { VxIcon } from './VxIcon';
import { STATUS_COLOR, STATUS_LABEL, type AgentDef } from './agents';

/** Signature agent tile — glass panel, glowing icon orb, live status dot,
 *  headline metric. Ported from the prototype's `agents` card rendering. */
export default function AgentCard({ agent, index = 0 }: { agent: AgentDef; index?: number }) {
  const color = STATUS_COLOR[agent.status];
  return (
    <div
      className="vx-glass"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
        padding: 'var(--space-6)',
        minHeight: 172,
        background: 'var(--grad-panel)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md), var(--sheen-top)',
        animation: 'vxFadeUp 0.6s var(--ease-out) both',
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <span
          style={{
            width: 48,
            height: 48,
            flex: '0 0 auto',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid var(--border-default)',
            color: 'var(--violet-200)',
            boxShadow: 'inset 0 0 16px rgba(139,92,246,0.18)',
          }}
        >
          <VxIcon name={agent.iconName} size={22} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-strong)', lineHeight: 'var(--lh-snug)' }}>
            {agent.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, lineHeight: 'var(--lh-normal)' }}>{agent.role}</div>
        </div>
        <span
          title={STATUS_LABEL[agent.status]}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flex: '0 0 auto',
            alignSelf: 'flex-start',
            background: color,
            boxShadow: agent.status === 'active' ? `0 0 8px ${color}` : 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--hairline)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--text-strong)' }}>
          {agent.metric}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10.5, fontWeight: 600, letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
          {agent.metricLabel}
        </span>
      </div>
    </div>
  );
}
