'use client';

import React from 'react';
import { useFocusTrap } from '@/components/shell/useFocusTrap';

/**
 * Accessible overlay for page-level "add / create" dialogs: role=dialog + aria-modal, focus moves in and
 * is trapped, Escape closes, focus returns to the opener, background scroll is locked and tall dialogs scroll.
 * (Simple confirmations use the ds <Modal>.)
 */
export default function DialogOverlay({ onClose, label, children }: { onClose: () => void; label: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref, onClose);
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[50] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ overscrollBehavior: 'contain' }}
    >
      {children}
    </div>
  );
}
