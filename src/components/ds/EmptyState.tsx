'use client';

import React from 'react';
import { VxIcon, type VxIconName } from './VxIcon';

/**
 * The empty state every list falls back to.
 *
 * Pages each hand-rolled their own "No leads" / "Empty Stage" text, and the one
 * shared component that existed had no importers and sat on the retired neon
 * palette. An empty state should answer three things: what is missing, why it
 * matters, and what to do about it — so `title`, `body` and `action` are the
 * shape, and `body` is deliberately one sentence.
 */

export function EmptyState({
  icon = 'grid',
  title,
  body,
  action,
  compact = false,
  style,
}: {
  icon?: VxIconName;
  title: string;
  /** One sentence: why this matters, or what will appear here. */
  body?: string;
  /** The single next step — usually the same button as the page header. */
  action?: React.ReactNode;
  /** Tighter padding, for inside a column or card rather than a full page. */
  compact?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 'var(--space-3)',
        padding: compact ? 'var(--space-6) var(--space-4)' : 'var(--space-12) var(--space-6)',
        border: '1px dashed var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--ink-800)',
        ...style,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline)',
          color: 'var(--text-dim)',
        }}
      >
        <VxIcon name={icon} size={20} />
      </span>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: compact ? 'var(--text-base)' : 'var(--text-lg)',
          fontWeight: 'var(--fw-semibold)' as unknown as number,
          color: 'var(--text-strong)',
        }}
      >
        {title}
      </h3>

      {body ? (
        <p
          style={{
            maxWidth: '38ch',
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--lh-normal)',
            color: 'var(--text-muted)',
          }}
        >
          {body}
        </p>
      ) : null}

      {action ? <div style={{ marginTop: 'var(--space-2)' }}>{action}</div> : null}
    </div>
  );
}

export default EmptyState;
