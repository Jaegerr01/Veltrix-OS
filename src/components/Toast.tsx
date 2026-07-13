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

const KIND_STYLE: Record<ToastKind, { icon: React.ReactNode; ring: string; iconColor: string }> = {
  success: { icon: <CheckCircle2 size={16} />, ring: 'border-emerald-400/30', iconColor: 'text-emerald-400' },
  error:   { icon: <XCircle size={16} />,      ring: 'border-red-400/30',     iconColor: 'text-red-400' },
  warning: { icon: <AlertTriangle size={16} />, ring: 'border-amber-400/30',  iconColor: 'text-amber-400' },
  info:    { icon: <Info size={16} />,          ring: 'border-cyan-400/30',   iconColor: 'text-cyan-400' },
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
                className={`pointer-events-auto rounded-xl border ${s.ring} bg-[#0d0d18]/95 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-3.5 flex gap-3`}
                role="status"
              >
                <span className={`${s.iconColor} mt-0.5 flex-shrink-0`}>{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white/90 leading-snug">{t.title}</p>
                  {t.detail && <p className="text-[11.5px] text-white/50 mt-0.5 leading-snug">{t.detail}</p>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-white/30 hover:text-white/70 transition cursor-pointer flex-shrink-0 self-start"
                  aria-label="Dismiss"
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
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d18] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
            >
              <p className="text-[14px] font-semibold text-white/90">{confirmState.message}</p>
              {confirmState.detail && (
                <p className="text-[12px] text-white/50 mt-1.5 leading-relaxed">{confirmState.detail}</p>
              )}
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => settleConfirm(false)}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium text-white/60 hover:text-white/90 hover:bg-white/5 border border-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => settleConfirm(true)}
                  autoFocus
                  className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-neon-purple hover:bg-neon-purple/85 transition cursor-pointer shadow-[0_0_14px_rgba(168,85,247,0.3)]"
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
