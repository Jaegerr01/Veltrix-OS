'use client';

import React from 'react';
import { VxIcon, type VxIconName } from './VxIcon';

/**
 * Command-card page header — a glass panel with an icon badge, title +
 * subtitle, optional stat readouts and a trailing action slot. This is the
 * recurring "cmdCard" header pattern used by Tasks / Reports / Content /
 * Follow-ups / Reel Intel in the prototype.
 */
export default function PageHeaderCard({
  icon,
  title,
  subtitle,
  stats,
  action,
}: {
  icon: VxIconName;
  title: string;
  subtitle?: string;
  stats?: { value: React.ReactNode; label: string; color?: string }[];
  action?: React.ReactNode;
}) {
  return (
    <section
      className="vx-glass"
      style={{
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--grad-panel)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg), var(--sheen-top)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <span
          style={{
            width: 52,
            height: 52,
            flex: '0 0 auto',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--violet-200)',
            background: 'rgba(139,92,246,0.14)',
            border: '1px solid var(--border-default)',
            boxShadow: 'inset 0 0 18px rgba(139,92,246,0.2)',
          }}
        >
          <VxIcon name={icon} size={24} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>
            {title}
          </div>
          {subtitle ? <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</div> : null}
        </div>
        {stats?.length ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginRight: 'var(--space-4)' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: s.color || 'var(--text-strong)' }}>{s.value}</span>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 'var(--ls-wide)', marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {action}
      </div>
    </section>
  );
}
