'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, VxIcon, useAppearance } from '@/components/ds';
import { routeFor } from '@/lib/nav';
import { useWorkspaceStatus } from '@/lib/status/useWorkspaceStatus';

interface Props { navOpen: boolean; onToggleNav: () => void; onOpenPalette: () => void }

export default function Topbar({ navOpen, onToggleNav, onOpenPalette }: Props) {
  const pathname = usePathname();
  const meta = routeFor(pathname) ?? { label: 'PostelOS', eyebrow: 'PostelOS' };
  const { avatar } = useAppearance();
  const { status, error } = useWorkspaceStatus();
  const [displayName, setDisplayName] = React.useState('Operator');
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    const read = () => setDisplayName(localStorage.getItem('vx_display_name') || 'Operator');
    read();
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    window.addEventListener('storage', read);
    window.addEventListener('vx_settings_updated', read);
    return () => { window.removeEventListener('storage', read); window.removeEventListener('vx_settings_updated', read); };
  }, []);

  const waiting = status ? status.approvalsPending + status.tasks.needsApproval + status.outreach.drafts : 0;
  const chip: { tone: 'ok' | 'warn' | 'bad'; text: string; href: string } = !status
    ? { tone: error ? 'bad' : 'warn', text: error ? 'Status unavailable' : 'Checking...', href: '/health' }
    : !status.ai.configured ? { tone: 'bad', text: 'AI not connected', href: '/settings' }
    : !status.email.ready ? { tone: 'warn', text: 'Email not ready', href: '/settings' }
    : { tone: 'ok', text: 'All connected', href: '/health' };

  return (
    <header className="vx-topbar">
      <button type="button" className="vx-iconbtn vx-menu-btn" onClick={onToggleNav} aria-label="Open navigation menu" aria-expanded={navOpen} aria-controls="app-nav">
        <VxIcon name="grid" size={18} />
      </button>
      <div className="vx-topbar__title">
        <div className="vx-eyebrow vx-topbar__eyebrow vx-topbar__eyebrow-hide">{meta.eyebrow}</div>
        <h1 className="vx-topbar__h1">{meta.label}</h1>
      </div>
      <div className="vx-topbar__spacer" />
      <button type="button" className="vx-searchbtn" onClick={onOpenPalette} aria-label="Search and run commands" aria-haspopup="dialog">
        <VxIcon name="search" size={16} />
        <span className="vx-searchbtn__label">Search or run a command...</span>
        <span className="vx-searchbtn__kbd" aria-hidden="true"><kbd className="vx-kbd">{isMac ? 'Cmd' : 'Ctrl'} K</kbd></span>
      </button>
      <div className="vx-topbar__actions">
        <Link href={chip.href} className="vx-chip" data-tone={chip.tone} title="Open details">
          <span className="vx-chip__dot" aria-hidden="true" />
          <span className="vx-chip__text">{chip.text}</span>
          <span className="vx-sr-only">System status: {chip.text}</span>
        </Link>
        <Link href="/command-center" className="vx-iconbtn" aria-label={waiting ? `${waiting} items waiting for your approval` : 'Approvals: nothing waiting'}>
          <VxIcon name="bell" size={18} />
          {waiting > 0 ? <span className="vx-badge-dot" aria-hidden="true">{waiting > 99 ? '99+' : waiting}</span> : null}
        </Link>
        <Link href="/settings" aria-label={`${displayName} - open settings`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, borderRadius: '50%' }}>
          <Avatar src={avatar || undefined} name={displayName} size="md" status="active" />
        </Link>
      </div>
    </header>
  );
}
