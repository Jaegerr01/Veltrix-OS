'use client';

import React from 'react';

/**
 * A tooltip that works for keyboard users.
 *
 * The app used the native `title` attribute, which never appears on focus —
 * only on mouse hover — so the explanation was invisible to anyone navigating
 * by keyboard, and unreadable on touch. This shows on hover *and* focus, hides
 * on Escape, and is wired to the trigger with aria-describedby.
 *
 * A tooltip is supplementary. If a control has no visible text at all, give it
 * an aria-label as well — a tooltip is not an accessible name.
 */

export function Tooltip({
  label,
  side = 'top',
  children,
  style,
}: {
  label: React.ReactNode;
  side?: 'top' | 'bottom';
  children: React.ReactElement;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {React.cloneElement(children, { 'aria-describedby': open ? id : undefined } as never)}

      {open ? (
        <span
          id={id}
          role="tooltip"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            [side === 'top' ? 'bottom' : 'top']: 'calc(100% + var(--space-2))',
            zIndex: 80,
            padding: 'var(--space-2) var(--space-3)',
            maxWidth: 260,
            width: 'max-content',
            background: 'var(--ink-700)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            color: 'var(--text-body)',
            fontSize: 'var(--text-xs)',
            lineHeight: 'var(--lh-normal)',
            pointerEvents: 'none',
          }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}

export default Tooltip;
