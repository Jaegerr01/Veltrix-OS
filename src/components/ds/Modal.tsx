'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { VxIcon } from './VxIcon';

/**
 * The app previously hand-rolled `position: fixed` overlays in eleven places.
 * None of them trapped focus, locked background scroll, closed on Escape, or
 * announced themselves — so a keyboard or screen-reader user could tab straight
 * out of an open dialog into the page behind it and never find their way back.
 *
 * This is the one dialog. Everything else composes it.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const SIZES = {
  sm: '420px',
  md: '560px',
  lg: '760px',
} as const;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** Optional one-line explanation under the title. */
  description?: React.ReactNode;
  size?: keyof typeof SIZES;
  /** Rendered in the sticky footer — usually the primary and cancel actions. */
  footer?: React.ReactNode;
  /** When set, the body is a <form> and this fires on submit. */
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  children?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  onSubmit,
  children,
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  // Portals need the DOM, so nothing renders during SSR.
  const mounted = React.useSyncExternalStore(() => () => {}, () => true, () => false);

  // Lock background scroll, compensating for the scrollbar so the page behind
  // does not visibly jump sideways when the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [open]);

  // Move focus in on open, and put it back where it came from on close.
  React.useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current)?.focus();

    return () => restoreFocusRef.current?.focus?.();
  }, [open]);

  // Escape closes; Tab cycles within the dialog.
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: 'var(--space-6)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  };

  const bodyContent = (
    <>
      {children}

      {footer ? (
        <footer
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-2)',
            paddingTop: 'var(--space-5)',
            borderTop: '1px solid var(--hairline)',
          }}
        >
          {footer}
        </footer>
      ) : null}
    </>
  );

  return createPortal(
    <div
      // Clicking the backdrop dismisses; clicking inside must not.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        background: 'var(--surface-overlay)',
        backdropFilter: 'var(--blur-sm)',
        WebkitBackdropFilter: 'var(--blur-sm)',
        animation: 'vxFadeUp var(--dur-base) var(--ease-out)',
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: SIZES[size],
          maxHeight: 'calc(100dvh - var(--space-8))',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--elev-popover)',
          outline: 'none',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-4)',
            padding: 'var(--space-5) var(--space-6)',
            borderBottom: '1px solid var(--hairline)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id={titleId}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--fw-bold)' as unknown as number,
                lineHeight: 'var(--lh-snug)',
                color: 'var(--text-strong)',
              }}
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descId}
                style={{
                  marginTop: 'var(--space-1)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 'var(--lh-normal)',
                  color: 'var(--text-muted)',
                }}
              >
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              flex: '0 0 auto',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--text-strong)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <VxIcon name="close" size={16} />
          </button>
        </header>

        {onSubmit ? (
          <form onSubmit={onSubmit} style={bodyStyle}>
            {bodyContent}
          </form>
        ) : (
          <div style={bodyStyle}>{bodyContent}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
