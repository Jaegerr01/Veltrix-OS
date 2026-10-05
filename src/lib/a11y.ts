import type { KeyboardEvent } from 'react';

/**
 * Props that make a non-button element (list row, card, table cell) fully keyboard operable:
 * focusable, announced as a button, activated with Enter or Space. Prefer a real <button>/<a>
 * where the markup allows; use this where the element must stay a div/span.
 */
export function clickable(onActivate: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(); }
    },
  };
}
