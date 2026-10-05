'use client';

import React from 'react';

/**
 * Tabs following the WAI-ARIA tabs pattern: arrow keys move between tabs,
 * Home/End jump to the ends, and only the active tab is in the tab order.
 * Pages previously tracked an `activeTab` string and rendered plain buttons,
 * so keyboard users had to tab through every option one at a time and nothing
 * announced which panel was showing.
 */

export interface TabItem {
  id: string;
  label: React.ReactNode;
  /** Optional trailing count, e.g. the number of rows behind the tab. */
  badge?: React.ReactNode;
}

export function Tabs({
  items,
  value,
  onChange,
  ariaLabel,
  style,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  style?: React.CSSProperties;
}) {
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = items.findIndex((t) => t.id === value);
    if (idx === -1) return;

    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;

    e.preventDefault();
    const id = items[next].id;
    onChange(id);
    refs.current[id]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      style={{
        display: 'flex',
        gap: 'var(--space-1)',
        padding: 'var(--space-1)',
        background: 'var(--ink-800)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius-md)',
        overflowX: 'auto',
        ...style,
      }}
    >
      {items.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active}
            aria-controls={`panel-${t.id}`}
            // Only the selected tab is reachable by Tab; arrows move within.
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              height: 'var(--control-h-sm)',
              padding: '0 var(--space-4)',
              whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--fw-semibold)' as unknown as number,
              background: active ? 'var(--surface-card)' : 'transparent',
              color: active ? 'var(--text-strong)' : 'var(--text-muted)',
              boxShadow: active ? 'var(--sheen-top)' : 'none',
              transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
            }}
          >
            {t.label}
            {t.badge != null ? (
              <span
                style={{
                  fontSize: 'var(--text-2xs)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-pill)',
                  background: active ? 'var(--surface-hover)' : 'transparent',
                  color: 'var(--text-dim)',
                }}
              >
                {t.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  active,
  children,
  style,
}: {
  id: string;
  active: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  if (!active) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0} style={style}>
      {children}
    </div>
  );
}
