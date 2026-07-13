'use client';

import React, { useEffect, useState } from 'react';
import { VxIcon, PageHeaderCard, VeltrixSpinner } from '@/components/ds';
import { db } from '@/lib/db';
import { authFetch } from '@/lib/authFetch';

const settingsCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};

interface Memory {
  id: string;
  content: string;
  tags?: string[];
  created_at: string;
  source?: string;
  importance?: number;
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const loadMemories = async () => {
    try {
      const data = await db.getMemories();
      setMemories(data);
    } catch (err) {
      console.warn('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleSyncObsidian = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await authFetch('/api/obsidian/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`Successfully synced ${data.synced} notes into vector memory.`);
        await loadMemories();
      } else {
        setSyncResult(`Sync failed: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <VeltrixSpinner message="Synchronizing memory banks..." />
      </div>
    );
  }

  // Helper to extract a title from note content (first header or first 40 chars)
  const getNoteTitle = (content: string) => {
    const lines = content.split('\n');
    const headerLine = lines.find(l => l.startsWith('# '));
    if (headerLine) return headerLine.replace('# ', '').trim();
    const firstLine = lines.find(l => l.trim().length > 0) || '';
    if (firstLine.length > 50) return firstLine.substring(0, 47) + '...';
    return firstLine || 'Untitled Memory';
  };

  // Helper to extract body snippet (exclude header line)
  const getNoteSnippet = (content: string) => {
    const lines = content.split('\n');
    const firstHeaderIdx = lines.findIndex(l => l.startsWith('# '));
    const contentLines = lines.filter((_, idx) => idx !== firstHeaderIdx && _.trim().length > 0);
    const bodyText = contentLines.join(' ').replace(/[*#`]/g, '').trim();
    if (bodyText.length > 140) return bodyText.substring(0, 137) + '...';
    return bodyText || 'No text content';
  };

  // Helper to get time elapsed
  const formatTime = (isoString: string) => {
    try {
      const elapsed = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(elapsed / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch {
      return 'recent';
    }
  };

  const getTagColor = (tag: string) => {
    const u = tag.toUpperCase();
    if (u.includes('DEAL') || u.includes('CLIENT')) return 'var(--signal-400)';
    if (u.includes('MEETING') || u.includes('CALL')) return 'var(--cyan-300)';
    if (u.includes('IDEA') || u.includes('CONTENT')) return 'var(--warn-400)';
    if (u.includes('PERSON') || u.includes('CONTACT')) return 'var(--violet-300)';
    return 'var(--text-muted)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <PageHeaderCard
        icon="brain"
        title="Memory Vault"
        subtitle="Manage indexed vector memories, corporate goals, and sync custom Obsidian knowledge vaults."
        stats={[
          { value: String(memories.length), label: 'NOTES INDEXED', color: 'var(--text-strong)' },
          { value: `${(memories.length * 0.03).toFixed(1)} MB`, label: 'STORAGE EST', color: 'var(--cyan-300)' },
          { value: 'Active', label: 'AUTO EMBED', color: 'var(--signal-400)' },
        ]}
        action={
          <button
            onClick={handleSyncObsidian}
            disabled={syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 18px',
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--grad-brand)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              boxShadow: 'var(--glow-violet)',
              whiteSpace: 'nowrap',
              opacity: syncing ? 0.6 : 1,
            }}
          >
            {syncing ? (
              <>
                <VxIcon name="refresh" size={14} style={{ animation: 'vxRingSpin 2s linear infinite' }} />
                Syncing Brain...
              </>
            ) : (
              <>
                <VxIcon name="refresh" size={14} />
                Sync Obsidian Brain
              </>
            )}
          </button>
        }
      />

      {syncResult && (
        <div
          className="vx-glass"
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: syncResult.includes('failed') ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)',
            border: syncResult.includes('failed') ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--border-default)',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            color: syncResult.includes('failed') ? 'var(--danger-400)' : 'var(--violet-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{syncResult}</span>
          <span style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setSyncResult(null)}>×</span>
        </div>
      )}

      {/* Main Workspace grid */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        {/* Recent Memory feed */}
        <div style={settingsCard}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>
              Recent Memory Feed
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-dim)' }}>
              SOURCE · OBSIDIAN
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {memories.length > 0 ? (
              memories.slice(0, 10).map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4) 0',
                    borderBottom: i < Math.min(10, memories.length) - 1 ? '1px solid var(--hairline)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto', width: 90 }}>
                    {m.tags && m.tags.slice(0, 1).map(tag => (
                      <span
                        key={tag}
                        style={{
                          textAlign: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          color: getTagColor(tag),
                          padding: '3px 6px',
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--hairline)',
                        }}
                      >
                        {tag.toUpperCase()}
                      </span>
                    ))}
                    {!m.tags?.length && (
                      <span
                        style={{
                          textAlign: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          padding: '3px 6px',
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--hairline)',
                        }}
                      >
                        KNOWLEDGE
                      </span>
                    )}
                  </div>
                  
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>
                      {getNoteTitle(m.content)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 'var(--lh-normal)' }}>
                      {getNoteSnippet(m.content)}
                    </div>
                  </div>
                  
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {formatTime(m.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-10) 0', color: 'var(--text-dim)', fontSize: 13.5 }}>
                No vector memories indexed. Place markdown files in your vault and hit sync.
              </div>
            )}
          </div>
        </div>

        {/* Sync Controls */}
        <div style={settingsCard}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--space-5)' }}>
            Knowledge Sync Engine
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <div
              style={{
                width: 168,
                height: 168,
                borderRadius: '50%',
                background: `conic-gradient(var(--violet-400) 0% ${Math.min(100, Math.max(15, (memories.length / 50) * 100))}% , rgba(255,255,255,0.06) ${Math.min(100, Math.max(15, (memories.length / 50) * 100))}% 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--glow-violet)',
              }}
            >
              <div style={{ width: 118, height: 118, borderRadius: '50%', background: 'var(--ink-800)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: 'var(--text-strong)', lineHeight: 1 }}>
                  {memories.length}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 3 }}>
                  VECTORS
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Synch Method</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-body)' }}>GitHub Vault Sync</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last Indexed Note</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }} title={memories[0] ? getNoteTitle(memories[0].content) : 'N/A'}>
                {memories[0] ? getNoteTitle(memories[0].content) : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Status</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--signal-400)' }}>ALL VECTORS CACHED</span>
            </div>
          </div>

          <button
            onClick={handleSyncObsidian}
            disabled={syncing}
            style={{
              marginTop: 'var(--space-6)',
              width: '100%',
              padding: '11px 0',
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-body)',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--dur-base) var(--ease-out)',
              opacity: syncing ? 0.6 : 1,
            }}
          >
            Force Re-Index Brain
          </button>
        </div>
      </section>
    </div>
  );
}
