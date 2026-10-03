'use client';

import React from 'react';
import { db } from '@/lib/db';
import type { Memory } from '@/lib/types';

/** Read-only feed of facts agents auto-captured into the vector `notes` table (scores, decisions). Real rows only. */
export default function AgentMemoryFeed() {
  const [rows, setRows] = React.useState<Memory[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    db.getMemories()
      .then(m => { if (alive) setRows(m); })
      .catch(e => { if (alive) setError((e as Error).message || 'Could not load agent memories.'); });
    return () => { alive = false; };
  }, []);

  if (error) return <div role="alert" style={{ color: 'var(--danger-400)', fontSize: 13 }}>{error}</div>;
  if (rows === null) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  if (rows.length === 0) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No agent memories captured yet. They appear here when agents score leads, log decisions, or save facts.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map(m => (
        <div key={m.id} style={{ padding: 12, borderRadius: 12, background: 'var(--grad-panel)', border: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-strong)', whiteSpace: 'pre-wrap' }}>{m.content}</div>
          <div style={{ marginTop: 6, fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
            {m.source} · importance {m.importance}/10 · {new Date(m.created_at).toLocaleString()}{m.tags?.length ? ` · ${m.tags.join(', ')}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
