'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, Input, Switch, VxIcon, useAppearance } from '@/components/ds';

const PAGE_META: Record<string, { title: string; eyebrow: string }> = {
  '/': { title: 'Dashboard', eyebrow: 'WELCOME BACK' },
  '/command-center': { title: 'Command Center', eyebrow: 'VELTRIX OS' },
  '/revenue': { title: 'Revenue', eyebrow: 'REVENUE' },
  '/leads': { title: 'Leads', eyebrow: 'PIPELINE' },
  '/outreach': { title: 'Outreach', eyebrow: 'PIPELINE' },
  '/follow-ups': { title: 'Follow-ups', eyebrow: 'PIPELINE' },
  '/proposals': { title: 'Proposals', eyebrow: 'PIPELINE' },
  '/clients': { title: 'Clients', eyebrow: 'PIPELINE' },
  '/projects': { title: 'Projects', eyebrow: 'PIPELINE' },
  '/memory': { title: 'Memory', eyebrow: 'SECOND BRAIN' },
  '/reel-intel': { title: 'Reel Intel', eyebrow: 'INTELLIGENCE' },
  '/content': { title: 'Content', eyebrow: 'INTELLIGENCE' },
  '/reports': { title: 'Reports', eyebrow: 'INTELLIGENCE' },
  '/tasks': { title: 'Tasks', eyebrow: 'SYSTEM' },
  '/health': { title: 'System Status', eyebrow: 'SYSTEM' },
  '/settings': { title: 'Settings', eyebrow: 'WORKSPACE' },
};

export default function Topbar() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: 'VELTRIX OS', eyebrow: 'VELTRIX OS' };
  const [liveSync, setLiveSync] = React.useState(true);
  const { avatar } = useAppearance();
  const [displayName, setDisplayName] = React.useState('Operator');

  React.useEffect(() => {
    const savedName = localStorage.getItem('vx_display_name') || 'Operator';
    setDisplayName(savedName);
    
    // Listen for name updates in settings
    const handleStorageChange = () => {
      const updatedName = localStorage.getItem('vx_display_name') || 'Operator';
      setDisplayName(updatedName);
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event trigger for same-page settings update
    window.addEventListener('vx_settings_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('vx_settings_updated', handleStorageChange);
    };
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
        minWidth: 0,
        padding: 'var(--space-5) var(--space-8)',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(8,5,24,0.55)',
        backdropFilter: 'var(--blur-md)',
        WebkitBackdropFilter: 'var(--blur-md)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}>
        <div className="vx-eyebrow" style={{ color: 'var(--violet-300)' }}>
          {meta.eyebrow}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-strong)', marginTop: 2 }}>
          {meta.title}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginLeft: 'auto', flexWrap: 'wrap', minWidth: 0 }}>
        <Input placeholder="Search agents, tasks, logs…" size="md" style={{ width: 220, minWidth: 140, flex: '1 1 140px' }} />
        <Switch checked={liveSync} onChange={setLiveSync} label="Live Sync" />
        <Link
          href="/command-center"
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
            boxShadow: 'var(--glow-violet)',
            whiteSpace: 'nowrap',
            textDecoration: 'none',
          }}
        >
          <span style={{ display: 'flex' }}>
            <VxIcon name="plus" size={16} color="#fff" />
          </span>
          Create
        </Link>
        <div
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            flex: '0 0 auto',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-default)',
            cursor: 'pointer',
          }}
        >
          <VxIcon name="bell" size={18} color="var(--text-muted)" />
          <span
            style={{
              position: 'absolute',
              top: 9,
              right: 10,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--danger-400)',
              border: '1.5px solid var(--ink-800)',
              boxShadow: '0 0 6px var(--danger-400)',
            }}
          />
        </div>
        <Avatar src={avatar || undefined} name={displayName} size="md" status="active" />
      </div>
    </header>
  );
}
