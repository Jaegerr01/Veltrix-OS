'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { Button, Modal } from '@/components/ds';

/**
 * Toast notification system - replaces the browser alert()/confirm() popups that blocked the whole UI.
 * Non-blocking, stacked bottom-right (full-width above the safe area on phones), auto-dismiss with a
 * click-to-dismiss escape hatch. One persistent polite live region announces everything; errors use role=alert.
 *
 *   const toast = useToast();
 *   toast.success('Lead imported');
 *   toast.error('Import failed', 'Batch too large - max 100 leads.');
 *   toast.undoable('Goal archived', () => restore());          // 8s window with an Undo button
 *   const ok = await toast.confirm('Send this email?', 'It goes to dana@example.com.', { confirmLabel: 'Send' });
 */

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
  action?: { label: string; run: () => void };
}

interface ConfirmState {
  message: string;
  detail?: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

export interface ConfirmOptions { confirmLabel?: string; danger?: boolean }

interface ToastApi {
  success: (title: string, detail?: string) => void;
  error: (title: string, detail?: string) => void;
  info: (title: string, detail?: string) => void;
  warning: (title: string, detail?: string) => void;
  /** Shows an info toast with an Undo button for `windowMs` (default 8s). */
  undoable: (title: string, onUndo: () => void | Promise<void>, detail?: string, windowMs?: number) => void;
  confirm: (message: string, detail?: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/** `label` names the tone in text so it is not carried by colour and glyph alone (WCAG 1.4.1). */
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
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) { window.clearTimeout(t); timers.current.delete(id); }
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, title: string, detail?: string, action?: ToastItem['action'], ms = AUTO_DISMISS_MS) => {
    const id = nextId++;
    setToasts(prev => [...prev.slice(-3), { id, kind, title, detail, action }]);
    timers.current.set(id, window.setTimeout(() => dismiss(id), ms));
  }, [dismiss]);

  const api: ToastApi = {
    success: (t, d) => push('success', t, d),
    error:   (t, d) => push('error', t, d, undefined, 8000),
    info:    (t, d) => push('info', t, d),
    warning: (t, d) => push('warning', t, d, undefined, 7000),
    undoable: (title, onUndo, detail, windowMs = 8000) => {
      const id = nextId;
      push('info', title, detail, { label: 'Undo', run: () => { dismiss(id); void onUndo(); } }, windowMs);
    },
    confirm: (message, detail, options) =>
      new Promise<boolean>(resolve => setConfirmState({ message, detail, confirmLabel: options?.confirmLabel ?? 'Confirm', danger: !!options?.danger, resolve })),
  };

  const settleConfirm = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={api}>
      <MotionConfig reducedMotion="user">
        {children}

        {/* Toast stack: one persistent polite live region. */}
        <div
          className="vx-toasts"
          role="region"
          aria-label="Notifications"
          aria-live="polite"
        >
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
                  className="vx-toast"
                  style={{ borderColor: s.color }}
                  role={t.kind === 'error' ? 'alert' : undefined}
                >
                  <span style={{ color: s.color, marginTop: 2, flexShrink: 0 }} aria-hidden="true">{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="vx-sr-only">{s.label}: </span>
                    <p className="vx-toast__title">{t.title}</p>
                    {t.detail ? <p className="vx-toast__detail">{t.detail}</p> : null}
                  </div>
                  {t.action ? <button type="button" className="vx-toast__action" onClick={t.action.run}>{t.action.label}</button> : null}
                  <button type="button" className="vx-toast__x" onClick={() => dismiss(t.id)} aria-label={`Dismiss ${s.label.toLowerCase()} notification`}>
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Confirm dialog: the ds Modal supplies focus trap, Escape, scroll lock and focus restore. */}
        <Modal
          open={!!confirmState}
          onClose={() => settleConfirm(false)}
          title={confirmState?.message ?? ''}
          description={confirmState?.detail}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => settleConfirm(false)}>Cancel</Button>
              <Button variant={confirmState?.danger ? 'danger' : 'primary'} onClick={() => settleConfirm(true)}>{confirmState?.confirmLabel ?? 'Confirm'}</Button>
            </>
          }
        />
      </MotionConfig>
    </ToastContext.Provider>
  );
}
