'use client';

import React from 'react';
import { PageHeaderCard } from '@/components/ds';
import VaultWorkspace from '@/components/VaultWorkspace';
import AgentMemoryFeed from '@/components/AgentMemoryFeed';

export default function MemoryPage() {
  const [tab, setTab] = React.useState<'vault' | 'feed'>('vault');
  const tabBtn = (id: 'vault' | 'feed', label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-default)', background: tab === id ? 'var(--grad-brand)' : 'rgba(255,255,255,0.04)', color: tab === id ? '#fff' : 'var(--text-strong)' }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeaderCard
        icon="brain"
        title="Memory Vault"
        subtitle="PostelOS's built-in second brain: markdown notes with folders, tags and [[wiki-links]]. The CEO agent and ARIA load the Constitution and your pinned notes on every request, and agents file decisions, daily briefs and lead learnings here."
      />
      <div style={{ display: 'flex', gap: 8 }}>
        {tabBtn('vault', 'Vault notes')}
        {tabBtn('feed', 'Agent memory feed')}
      </div>
      {tab === 'vault' ? <VaultWorkspace /> : <AgentMemoryFeed />}
    </div>
  );
}
