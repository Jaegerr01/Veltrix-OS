'use client';

import React from 'react';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * While `active`: moves focus into `ref`, keeps Tab/Shift+Tab inside it, closes on Escape and
 * restores focus to the previously focused element on deactivate. Used by the mobile nav drawer
 * and the command palette (the ds Modal has its own equivalent).
 */
export function useFocusTrap(active: boolean, ref: React.RefObject<HTMLElement | null>, onEscape: () => void, initialFocus?: () => HTMLElement | null) {
  const escRef = React.useRef(onEscape);
  React.useEffect(() => { escRef.current = onEscape; });

  React.useEffect(() => {
    if (!active) return;
    const root = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const target = initialFocus?.() ?? root?.querySelector<HTMLElement>(FOCUSABLE) ?? root;
      target?.focus();
    }, 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); escRef.current(); return; }
      if (e.key !== 'Tab' || !root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey, true); previous?.focus?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ref]);
}
