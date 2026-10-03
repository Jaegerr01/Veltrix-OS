'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { documentTitle, NAV_ROUTES } from '@/lib/nav';
import { useAuth } from '@/components/AuthGate';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';
import ShortcutsHelp from './ShortcutsHelp';
import SetupBanner from '@/components/SetupBanner';
import VoiceAssistant from '@/components/VoiceAssistant';

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

/** Responsive app chrome: skip link, sidebar/drawer, top bar, <main>, command palette and global shortcuts. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [navOpen, setNavOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Close the drawer on navigation, set the per-route document title, reset scroll.
  React.useEffect(() => {
    const t = setTimeout(() => setNavOpen(false), 0);
    document.title = documentTitle(pathname);
    contentRef.current?.scrollTo({ top: 0 });
    return () => clearTimeout(t);
  }, [pathname]);

  // Body scroll lock while the drawer is open on small screens.
  React.useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [navOpen]);

  // Global shortcuts: Ctrl/Cmd+K palette, ? help, g + key navigation.
  React.useEffect(() => {
    let gAt = 0;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(o => !o); return; }
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target) || paletteOpen || helpOpen) return;
      if (e.key === '?') { e.preventDefault(); setHelpOpen(true); return; }
      const k = e.key.toLowerCase();
      if (k === 'g') { gAt = Date.now(); return; }
      if (gAt && Date.now() - gAt < 1200) {
        const r = NAV_ROUTES.find(x => x.key === k);
        gAt = 0;
        if (r) { e.preventDefault(); router.push(r.path); }
      }
    };
    const open = () => setPaletteOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('postelos-open-palette', open);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('postelos-open-palette', open); };
  }, [router, paletteOpen, helpOpen]);

  const showHelp = React.useCallback(() => { setPaletteOpen(false); setTimeout(() => setHelpOpen(true), 0); }, []);

  return (
    <>
      <a href="#main-content" className="vx-skip">Skip to main content</a>
      <div className="vx-shell">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
        <div className="vx-scrim" data-open={navOpen} onClick={() => setNavOpen(false)} aria-hidden="true" />
        <div className="vx-main">
          <Topbar navOpen={navOpen} onToggleNav={() => setNavOpen(o => !o)} onOpenPalette={() => setPaletteOpen(true)} />
          <main id="main-content" ref={contentRef} tabIndex={-1} className="vx-content">
            <SetupBanner />
            <div key={pathname} className="vx-page">{children}</div>
          </main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onShowShortcuts={showHelp} onSignOut={() => { void signOut(); }} />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <VoiceAssistant />
    </>
  );
}
