'use client';

import React from 'react';
import { VxIcon, type VxIconName } from './VxIcon';

/** Graceful "module online" placeholder — ported from the prototype's
 *  isPlaceholder view. Used for routes without a bespoke design layout. */
export default function PlaceholderModule({
  icon,
  eyebrow,
  title,
  blurb,
}: {
  icon: VxIconName;
  eyebrow: string;
  title: string;
  blurb: string;
}) {
  return (
    <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div
        className="vx-glass"
        style={{
          textAlign: 'center',
          maxWidth: 520,
          padding: 'var(--space-10) var(--space-8)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--grad-panel)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xl), var(--glow-soft)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            width: 68,
            height: 68,
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--violet-200)',
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid var(--border-default)',
            boxShadow: 'inset 0 0 20px rgba(139,92,246,0.2)',
          }}
        >
          <VxIcon name={icon} size={30} color="var(--violet-200)" />
        </span>
        <div className="vx-eyebrow" style={{ color: 'var(--violet-300)', marginTop: 'var(--space-5)' }}>{eyebrow}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-strong)', marginTop: 8 }}>{title}</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 'var(--lh-relaxed)', marginTop: 12, maxWidth: 420 }}>{blurb}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 'var(--space-6)', padding: '8px 16px', borderRadius: 999, background: 'rgba(46,230,160,0.10)', border: '1px solid rgba(46,230,160,0.3)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--signal-400)', boxShadow: '0 0 8px var(--signal-400)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--signal-400)', letterSpacing: '0.04em' }}>MODULE ONLINE</span>
        </div>
      </div>
    </section>
  );
}
