'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthGate';
import { Avatar, PostelLogo, VxIcon, useAppearance } from '@/components/ds';
import { NAV_GROUPS, NAV_ROUTES } from '@/lib/nav';
import { useWorkspaceStatus } from '@/lib/status/useWorkspaceStatus';
import { useFocusTrap } from './useFocusTrap';

/** The CEO card tells the truth: it is built only from /api/workspace/status, never from a fixed sentence. */
function CeoCard() {
  const { status, error, loading } = useWorkspaceStatus();
  let text = 'Checking status...';
  let tone: 'active' | 'busy' | 'offline' = 'offline';
  let href: string | null = null;
  if (!loading && error && !status) { text = 'Status unavailable - check System Status.'; href = '/health'; }
  else if (status) {
    const t = status.tasks;
    const waiting = Math.max(t.needsApproval, status.approvalsPending);
    if (!status.ai.configured) { text = 'AI not connected. Add GEMINI_API_KEY to start.'; href = '/settings'; }
    else if (t.running > 0) { text = `${t.running} task${t.running === 1 ? '' : 's'} running${waiting ? `, ${waiting} awaiting you` : ''}.`; tone = 'active'; href = '/tasks'; }
    else if (waiting > 0) { text = `${waiting} item${waiting === 1 ? '' : 's'} awaiting your approval.`; tone = 'busy'; href = '/command-center'; }
    else { text = 'Idle. Nothing running or waiting.'; tone = 'active'; href = '/ceo'; }
  }
  return (
    <>
      <div className="vx-side__card-row">
        <Avatar name="CEO Agent" size="md" status={tone}><VxIcon name="crown" size={20} color="#fff" /></Avatar>
        <p className="vx-side__card-title">CEO Agent</p>
      </div>
      <p className="vx-side__card-text" role="status" aria-live="polite">
        {href ? <Link href={href} style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>{text}</Link> : text}
      </p>
    </>
  );
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { avatar } = useAppearance();
  const [displayName, setDisplayName] = React.useState('Operator');
  const ref = React.useRef<HTMLElement>(null);
  const [isDrawer, setIsDrawer] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsDrawer(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  React.useEffect(() => {
    const read = () => setDisplayName(localStorage.getItem('vx_display_name') || 'Operator');
    read();
    window.addEventListener('storage', read);
    window.addEventListener('vx_settings_updated', read);
    return () => { window.removeEventListener('storage', read); window.removeEventListener('vx_settings_updated', read); };
  }, []);

  useFocusTrap(open && isDrawer, ref, onClose, () => ref.current?.querySelector<HTMLElement>('[aria-current="page"]') ?? null);

  return (
    <aside ref={ref} id="app-nav" className="vx-side" data-open={open} aria-label="Sidebar">
      <div className="vx-side__brand">
        <PostelLogo layout="stacked" markSize={64} suffix="OS" byline />
        <button type="button" className="vx-iconbtn vx-side__close" onClick={onClose} aria-label="Close navigation menu"><VxIcon name="x" size={18} /></button>
      </div>
      <nav className="vx-nav" aria-label="Primary">
        {NAV_GROUPS.map(g => (
          <React.Fragment key={g}>
            <p className="vx-nav__group" id={`nav-g-${g}`}>{g}</p>
            <ul aria-labelledby={`nav-g-${g}`}>
              {NAV_ROUTES.filter(r => r.group === g && r.path !== '/privacy').map(r => (
                <li key={r.path}>
                  <Link href={r.path} className="vx-nav__link" aria-current={pathname === r.path ? 'page' : undefined} onClick={onClose}>
                    <span className="vx-nav__icon"><VxIcon name={r.icon} size={17} /></span>
                    <span>{r.label}</span>
                    <span className="vx-nav__dot" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </React.Fragment>
        ))}
      </nav>
      <div className="vx-side__card vx-glass">
        <CeoCard />
        <div className="vx-side__user">
          <Avatar src={avatar || undefined} name={displayName} size="sm" status="active" />
          <span className="vx-side__user-name">{displayName}</span>
          {user ? <button type="button" onClick={signOut} className="vx-chip" style={{ cursor: 'pointer' }}>Sign out</button> : null}
        </div>
      </div>
    </aside>
  );
}
