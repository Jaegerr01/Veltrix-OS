'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { VxIcon, type VxIconName } from '@/components/ds';
import { NAV_ROUTES } from '@/lib/nav';
import { useFocusTrap } from './useFocusTrap';

interface Cmd { id: string; group: 'Go to' | 'Actions'; label: string; hint?: string; icon: VxIconName; keywords: string; run: () => void }

export interface PaletteProps {
  open: boolean;
  onClose: () => void;
  onShowShortcuts: () => void;
  onSignOut?: () => void;
}

function score(c: Cmd, tokens: string[]): number {
  if (!tokens.length) return 1;
  const label = c.label.toLowerCase();
  const hay = `${label} ${c.keywords}`;
  let s = 0;
  for (const t of tokens) {
    if (!hay.includes(t)) return 0;
    s += label.startsWith(t) ? 3 : label.includes(t) ? 2 : 1;
  }
  return s;
}

export default function CommandPalette({ open, onClose, onShowShortcuts, onSignOut }: PaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const all = React.useMemo<Cmd[]>(() => {
    const go = (p: string) => () => router.push(p);
    const pages: Cmd[] = NAV_ROUTES.map(r => ({ id: `go:${r.path}`, group: 'Go to', label: r.label, hint: r.key ? `g ${r.key}` : undefined, icon: r.icon, keywords: `${r.keywords.join(' ')} ${r.eyebrow.toLowerCase()}`, run: go(r.path) }));
    const actions: Cmd[] = [
      { id: 'act:ceo', group: 'Actions', label: 'Ask the CEO agent to do something', icon: 'crown', keywords: 'mission goal chat task run', run: go('/ceo') },
      { id: 'act:aria', group: 'Actions', label: 'Talk to ARIA (voice)', icon: 'mic', keywords: 'voice speak microphone assistant', run: () => window.dispatchEvent(new CustomEvent('postelos-toggle-voice')) },
      { id: 'act:approvals', group: 'Actions', label: 'Review pending approvals', icon: 'check', keywords: 'approve queue waiting send', run: go('/command-center') },
      { id: 'act:lead', group: 'Actions', label: 'Add or import leads', icon: 'plus', keywords: 'new lead csv import scraper', run: go('/leads') },
      { id: 'act:note', group: 'Actions', label: 'New memory note', icon: 'plus', keywords: 'vault markdown write remember', run: go('/memory?new=1') },
      { id: 'act:brief', group: 'Actions', label: "Generate today's brief", icon: 'doc', keywords: 'report daily summary', run: go('/reports') },
      { id: 'act:keys', group: 'Actions', label: 'Show keyboard shortcuts', hint: '?', icon: 'info', keywords: 'help keys hotkeys', run: onShowShortcuts },
    ];
    if (onSignOut) actions.push({ id: 'act:signout', group: 'Actions', label: 'Sign out', icon: 'close', keywords: 'logout exit', run: onSignOut });
    return [...pages, ...actions];
  }, [router, onShowShortcuts, onSignOut]);

  const results = React.useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    return all.map(c => ({ c, s: score(c, tokens) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || (a.c.group === b.c.group ? 0 : a.c.group === 'Go to' ? -1 : 1)).map(x => x.c);
  }, [all, query]);

  React.useEffect(() => { if (open) { const t = setTimeout(() => { setQuery(''); setActive(0); }, 0); return () => clearTimeout(t); } }, [open]);
  React.useEffect(() => { const t = setTimeout(() => setActive(0), 0); return () => clearTimeout(t); }, [query]);
  React.useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active, results]);

  useFocusTrap(open, panelRef, onClose, () => inputRef.current);

  if (!open) return null;

  const choose = (c: Cmd | undefined) => { if (!c) return; onClose(); setTimeout(c.run, 0); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(Math.max(results.length - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]); }
  };

  return (
    <div className="vx-palette-scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} className="vx-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="vx-palette__input">
          <VxIcon name="search" size={18} />
          <input
            ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKey}
            role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" aria-label="Type a page or command"
            aria-activedescendant={results[active] ? `pal-${results[active].id}` : undefined}
            placeholder="Type a page or command..." autoComplete="off" spellCheck={false}
          />
          <kbd className="vx-kbd" aria-hidden="true">Esc</kbd>
        </div>
        <ul ref={listRef} id="palette-list" role="listbox" aria-label="Results" className="vx-palette__list">
          {results.map((c, i) => {
            const head = i === 0 || results[i - 1].group !== c.group ? c.group : null;
            return (
              <React.Fragment key={c.id}>
                {head ? <li role="presentation" className="vx-palette__group">{head}</li> : null}
                <li id={`pal-${c.id}`} role="option" aria-selected={i === active} className="vx-palette__item" onMouseMove={() => setActive(i)} onClick={() => choose(c)}>
                  <VxIcon name={c.icon} size={16} />
                  <span>{c.label}</span>
                  {c.hint ? <span className="vx-palette__hint" aria-hidden="true"><kbd className="vx-kbd">{c.hint}</kbd></span> : null}
                </li>
              </React.Fragment>
            );
          })}
        </ul>
        {results.length === 0 ? <div className="vx-palette__empty">No match for &ldquo;{query}&rdquo;. Try a page name like &ldquo;leads&rdquo; or an action like &ldquo;brief&rdquo;.</div> : null}
        <div className="vx-palette__foot" aria-hidden="true"><span>Up/Down to move</span><span>Enter to open</span><span>Esc to close</span></div>
        <div className="vx-sr-only" role="status" aria-live="polite">{results.length} result{results.length === 1 ? '' : 's'}</div>
      </div>
    </div>
  );
}
