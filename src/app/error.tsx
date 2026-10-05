'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[app error]', error); }, [error]);
  return (
    <div role="alert" style={{ maxWidth: 560, margin: '80px auto', padding: 28, borderRadius: 18, background: 'var(--grad-panel)', border: '1px solid rgba(239,68,68,0.35)', color: 'var(--text-body)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--danger-400)', marginBottom: 8 }}>Something went wrong on this page</h2>
      <p style={{ fontSize: 14, lineHeight: 1.6 }}>
        The page hit an unexpected error. Nothing was sent or changed by this error screen. You can retry, or go back to the dashboard.
      </p>
      {error.digest && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>Reference: {error.digest}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button type="button" onClick={reset} style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--grad-brand)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Try again</button>
        <Link href="/" style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-default)', color: 'var(--text-strong)' }}>Dashboard</Link>
      </div>
    </div>
  );
}
