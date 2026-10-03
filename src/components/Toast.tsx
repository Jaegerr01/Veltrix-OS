'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

/**
 * Toast notification system — replaces the browser alert()/confirm() popups
 * that blocked the whole UI. Non-blocking, stacked bottom-right, auto-dismiss
 * with a click-to-dismiss escape hatch.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Lead imported');
 *   toast.error('Import failed', 'Batch too large — max 100 leads.');
 *   const ok = await toast.confirm('Delete this lead?');
 */

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
}

interface ConfirmState {
  message: string;
  detail?: string;
  resolve: (ok: boolean) => void;
}

interface ToastApi {
  success: (title: string, detail?: string) => void;
  error: (title: string, detail?: string) => void;
  info: (title: string, detail?: string) => void;
  warning: (title: string, detail?: string) => void;
  confirm: (message: string, detail?: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/**
 * Tones read from design tokens rather than Tailwind's stock palette
 * (emerald-400 / red-400 / amber-400 / cyan-400), which did not match any other
 * success, danger or warning colour in the product.
 *
 * `label` is the important part: without it the only cue distinguishing an
 * error toast from a success toast is its colour and glyph, which fails
 * WCAG 1.4.1 and tells a screen reader nothing.
 */
const KIND_STYLE: Record<ToastKind, { icon: React.ReactNode; color: string; label: string }> = {
  success: { icon: <CheckCircle2 size={16} />,  color: 'var(--signal-400)', label: 'Success' },
  error:   { icon: <XCircle size={16} />,       color: 'var(--danger-400)', label: 'Error' },
  warning: { icon: <AlertTriangle size={16} />, color: 'var(--warn-400)',   label: 'Warning' },
  info:    { icon: <Info size={16} />,          color: 'var(--cyan-400)',   label: 'Information' },
};

const AUTO_DISMISS_MS = 5000;
let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, title: string, detail?: string) => {
    const id = nextId++;
    setToasts(prev => [...prev.slice(-4), { id, kind, title, detail }]);
    window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [dismiss]);

  const api: ToastApi = {
    success: (t, d) => push('success', t, d),
    error:   (t, d) => push('error', t, d),
    info:    (t, d) => push('info', t, d),
    warning: (t, d) => push('warning', t, d),
    confirm: (message, detail) =>
      new Promise<boolean>(resolve => setConfirmState({ message, detail, resolve })),
  };

  const settleConfirm = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Toast stack */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(22rem,calc(100vw-2.5rem))] pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            const s = KIND_STYLE[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 24, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="pointer-events-auto p-3.5 flex gap-3"
                style={{
                  background: 'var(--surface-card)',
                  border: `1px solid ${s.color}`,
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                }}
                /* Errors interrupt; everything else waits its turn. */
                role={t.kind === 'error' ? 'alert' : 'status'}
              >
                <span style={{ color: s.color, marginTop: 2, flexShrink: 0 }} aria-hidden="true">
                  {s.icon}
                </span>
                <div className="flex-1 min-w-0">
                  {/* Names the tone in text, so it is not carried by colour alone. */}
                  <span className="sr-only">{s.label}: </span>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-strong)', lineHeight: 'var(--lh-snug)' }}>
                    {t.title}
                  </p>
                  {t.detail && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2, lineHeight: 'var(--lh-snug)' }}>
                      {t.detail}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="transition cursor-pointer flex-shrink-0 self-start"
                  style={{ color: 'var(--text-dim)', background: 'none', border: 'none' }}
                  aria-label={`Dismiss ${s.label.toLowerCase()} notification`}
                >
                  <X size={13} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => settleConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-sm p-5"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--elev-popover)',
              }}
              onClick={e => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
            >
              <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-strong)' }}>
                {confirmState.message}
              </p>
              {confirmState.detail && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 6, lineHeight: 'var(--lh-relaxed)' }}>
                  {confirmState.detail}
                </p>
              )}
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => settleConfirm(false)}
                  className="px-4 py-2 transition cursor-pointer"
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => settleConfirm(true)}
                  autoFocus
                  className="px-4 py-2 transition cursor-pointer"
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-on-accent)',
                    background: 'var(--grad-brand)',
                    border: '1px solid transparent',
                  }}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
