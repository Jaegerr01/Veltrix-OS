'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthGate';
import { Avatar, VxIcon, useAppearance } from '@/components/ds';
import type { VxIconName } from '@/components/ds';

/**
 * Command-OS sidebar — glass rail on the deep-space backdrop. Centered
 * wordmark, grouped nav with gradient-glow active pills, and the CEO Agent
 * mini card pinned to the bottom. Information architecture ported from the
 * prototype's NAV_DEFS; routes wired to the existing Next app.
 */

type NavItem = { group?: string; label?: string; icon?: VxIconName; path?: string };

const NAV_DEFS: NavItem[] = [
  { label: 'Dashboard', icon: 'grid', path: '/' },
  { label: 'Command Center', icon: 'terminal', path: '/command-center' },
  { label: 'Revenue', icon: 'dollar', path: '/revenue' },
  { group: 'Pipeline' },
  { label: 'Leads', icon: 'users', path: '/leads' },
  { label: 'Outreach', icon: 'send', path: '/outreach' },
  { label: 'Follow-ups', icon: 'refresh', path: '/follow-ups' },
  { label: 'Proposals', icon: 'doc', path: '/proposals' },
  { label: 'Clients', icon: 'briefcase', path: '/clients' },
  { label: 'Projects', icon: 'folder', path: '/projects' },
  { group: 'Intelligence' },
  { label: 'Memory', icon: 'brain', path: '/memory' },
  { label: 'Reel Intel', icon: 'target', path: '/reel-intel' },
  { label: 'Content', icon: 'doc', path: '/content' },
  { label: 'Reports', icon: 'chartbar', path: '/reports' },
  { group: 'System' },
  { label: 'Tasks', icon: 'usercheck', path: '/tasks' },
  { label: 'System Status', icon: 'activity', path: '/health' },
  { label: 'Settings', icon: 'gear', path: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { avatar } = useAppearance();
  const [displayName, setDisplayName] = React.useState('Operator');

  React.useEffect(() => {
    const savedName = localStorage.getItem('vx_display_name') || 'Operator';
    setDisplayName(savedName);

    const handleStorageChange = () => {
      const updatedName = localStorage.getItem('vx_display_name') || 'Operator';
      setDisplayName(updatedName);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('vx_settings_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('vx_settings_updated', handleStorageChange);
    };
  }, []);

  return (
    <aside
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-6) var(--space-4)',
        borderRight: '1px solid var(--border-subtle)',
        background: 'linear-gradient(180deg, rgba(10,7,26,0.55), rgba(6,4,16,0.35))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 var(--space-2) var(--space-6)' }}>
        <Image
          src="/veltrix-logo.png"
          alt="Veltrix"
          width={104}
          height={40}
          priority
          style={{ width: 104, height: 'auto', display: 'block', filter: 'drop-shadow(0 0 16px rgba(139,92,246,0.35))' }}
        />
      </div>

      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flex: 1,
          overflowY: 'auto',
          margin: '0 calc(-1 * var(--space-2))',
          padding: '0 var(--space-2)',
        }}
      >
        {NAV_DEFS.map((n, i) => {
          if (n.group) {
            return (
              <div
                key={`g-${i}`}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: 'var(--ls-mega)',
                  textTransform: 'uppercase',
                  color: 'var(--text-dim)',
                  padding: 'var(--space-4) 12px 8px',
                  opacity: 0.7,
                }}
              >
                {n.group}
              </div>
            );
          }
          const active = pathname === n.path;
          return (
            <Link
              key={n.path}
              href={n.path!}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textDecoration: 'none',
                color: active ? 'var(--text-strong)' : 'var(--text-muted)',
                background: active ? 'var(--grad-brand)' : 'transparent',
                border: '1px solid transparent',
                boxShadow: active ? 'var(--glow-violet)' : 'none',
                transition: 'all var(--dur-base) var(--ease-out)',
              }}
            >
              <span style={{ display: 'flex', flex: '0 0 auto', color: active ? '#fff' : 'var(--violet-200)' }}>
                <VxIcon name={n.icon!} size={17} />
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, letterSpacing: '0.01em' }}>{n.label}</span>
              <span
                style={{
                  marginLeft: 'auto',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  flex: '0 0 auto',
                  background: active ? '#fff' : 'transparent',
                  boxShadow: active ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
                }}
              />
            </Link>
          );
        })}
      </nav>

      {/* CEO mini card */}
      <div
        className="vx-glass"
        style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--grad-panel)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-md), var(--sheen-top)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name="CEO Agent" size="md" status="active">
            <VxIcon name="crown" size={20} color="#fff" />
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>CEO Agent</div>
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-3)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 'var(--lh-relaxed)' }}>
          Orchestrating 8 agents · all systems nominal
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 'var(--space-3) 0 0',
            borderTop: '1px solid var(--hairline)',
            marginTop: 'var(--space-3)',
          }}
        >
          <Avatar src={avatar || undefined} name={displayName} size="sm" status="active" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
          </div>
          {user ? (
            <button
              onClick={signOut}
              style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px solid var(--hairline)',
                color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Exit
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
