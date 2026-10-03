'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { authFetch } from '@/lib/authFetch';
import { readZip, bytesToText } from '@/lib/vault/zip';
import { titleKey } from '@/lib/vault/links';
import { buildFolderTree, wikiTargetFromHref, wikiToMarkdownLinks, type FolderNode } from '@/lib/vault/wikiMarkdown';
import type { VaultNote, VaultNoteMeta, VaultSearchHit } from '@/lib/vault/types';

type Detail = {
  note: VaultNote;
  backlinks: VaultNoteMeta[];
  outgoing: { title: string; exists: boolean; id: string | null }[];
};
type Draft = { id?: string; title: string; body: string; path: string; tags: string; pinned: boolean; source?: VaultNote['source'] };

const card: React.CSSProperties = { borderRadius: 'var(--radius-lg)', background: 'var(--grad-panel)', border: '1px solid var(--border-default)' };
const field: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', color: 'var(--text-strong)', fontSize: 13, outline: 'none' };
const btn = (primary = false): React.CSSProperties => ({ padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: primary ? 'none' : '1px solid var(--border-default)', background: primary ? 'var(--grad-brand)' : 'rgba(255,255,255,0.04)', color: primary ? '#fff' : 'var(--text-strong)' });

const EMPTY: Draft = { title: '', body: '', path: '', tags: '', pinned: false };
const toDraft = (n: VaultNote): Draft => ({ id: n.id, title: n.title, body: n.body, path: n.path, tags: n.tags.join(', '), pinned: n.pinned, source: n.source });
const parseTags = (s: string) => s.split(',').map(t => t.trim()).filter(Boolean);

async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T & { success?: boolean; error?: string; code?: string }> {
  const res = await authFetch(url, init);
  return res.json().catch(() => ({ success: false, error: `Server returned ${res.status}` }));
}

export default function VaultWorkspace() {
  const [notes, setNotes] = React.useState<VaultNoteMeta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fatal, setFatal] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [query, setQuery] = React.useState('');
  const [hits, setHits] = React.useState<VaultSearchHit[] | null>(null);
  const [tagFilter, setTagFilter] = React.useState<string | null>(null);
  const [folderFilter, setFolderFilter] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [detail, setDetail] = React.useState<Detail | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [mode, setMode] = React.useState<'edit' | 'preview'>('edit');
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const loadList = React.useCallback(async () => {
    const r = await api<{ notes: VaultNoteMeta[] }>('/api/memory');
    if (r.success) { setNotes(r.notes ?? []); setFatal(null); }
    else setFatal(r.error || 'Could not load the vault.');
    setLoading(false);
  }, []);

  React.useEffect(() => { void loadList(); }, [loadList]);

  // Debounced full-text search
  React.useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const t = setTimeout(async () => {
      const r = await api<{ hits: VaultSearchHit[] }>(`/api/memory?q=${encodeURIComponent(q)}`);
      setHits(r.success ? r.hits ?? [] : []);
      if (!r.success && r.error) setMsg({ ok: false, text: r.error });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const openNote = React.useCallback(async (id: string) => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    const r = await api<Detail>(`/api/memory/${id}`);
    if (!r.success) { setMsg({ ok: false, text: r.error || 'Could not open that note.' }); return; }
    setDetail(r as unknown as Detail);
    setDraft(toDraft((r as unknown as Detail).note));
    setDirty(false);
    setMode('edit');
  }, [dirty]);

  const openByTitle = async (title: string) => {
    const hit = notes.find(n => titleKey(n.title) === titleKey(title));
    if (hit) return openNote(hit.id);
    if (window.confirm(`"${title}" does not exist yet. Create it?`)) {
      setDetail(null);
      setDraft({ ...EMPTY, title });
      setDirty(true);
      setMode('edit');
    }
  };

  const newNote = (path = '') => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    setDetail(null);
    setDraft({ ...EMPTY, path });
    setDirty(false);
    setMode('edit');
  };

  const update = (patch: Partial<Draft>) => { setDraft(d => ({ ...d, ...patch })); setDirty(true); };

  const save = React.useCallback(async () => {
    if (!draft.title.trim()) { setMsg({ ok: false, text: 'Give the note a title first.' }); return; }
    setSaving(true);
    const r = await api<{ note: VaultNote }>('/api/memory', {
      method: 'POST',
      body: JSON.stringify({ id: draft.id, title: draft.title, body: draft.body, path: draft.path, tags: parseTags(draft.tags), pinned: draft.pinned }),
    });
    setSaving(false);
    if (!r.success || !r.note) { setMsg({ ok: false, text: r.error || 'Save failed.' }); return; }
    setMsg({ ok: true, text: `Saved "${r.note.title}".` });
    setDirty(false);
    await loadList();
    const d = await api<Detail>(`/api/memory/${r.note.id}`);
    if (d.success) { setDetail(d as unknown as Detail); setDraft(toDraft((d as unknown as Detail).note)); }
  }, [draft, loadList]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void save(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  const togglePin = async (n: VaultNoteMeta) => {
    const r = await api(`/api/memory/${n.id}`, { method: 'PATCH', body: JSON.stringify({ pinned: !n.pinned }) });
    if (!r.success) setMsg({ ok: false, text: r.error || 'Could not change pin.' });
    await loadList();
    if (draft.id === n.id) setDraft(d => ({ ...d, pinned: !n.pinned }));
  };

  const remove = async () => {
    if (!draft.id || !window.confirm(`Delete "${draft.title}"? This cannot be undone.`)) return;
    const r = await api(`/api/memory/${draft.id}`, { method: 'DELETE' });
    if (!r.success) { setMsg({ ok: false, text: r.error || 'Delete failed.' }); return; }
    setMsg({ ok: true, text: 'Note deleted.' });
    setDetail(null); setDraft(EMPTY); setDirty(false);
    await loadList();
  };

  const exportZip = async () => {
    setBusy(true);
    try {
      const res = await authFetch('/api/memory/export');
      if (!res.ok) { const j = await res.json().catch(() => ({})); setMsg({ ok: false, text: j.error || `Export failed (${res.status}).` }); return; }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `postelos-vault-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setMsg({ ok: true, text: 'Exported a .zip of markdown files - open it in any editor (Obsidian, VS Code, Notion import...).' });
    } finally { setBusy(false); }
  };

  const importFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    try {
      const files: { path: string; content: string }[] = [];
      for (const f of Array.from(list)) {
        if (/\.zip$/i.test(f.name)) {
          for (const e of await readZip(new Uint8Array(await f.arrayBuffer()))) files.push({ path: e.name, content: bytesToText(e.data) });
        } else {
          files.push({ path: f.name, content: await f.text() });
        }
      }
      let created = 0, updated = 0; const skipped: string[] = [];
      for (let i = 0; i < files.length; i += 100) {
        const r = await api<{ created: number; updated: number; skipped: { path: string; reason: string }[] }>('/api/memory/import', { method: 'POST', body: JSON.stringify({ files: files.slice(i, i + 100) }) });
        if (!r.success) { setMsg({ ok: false, text: r.error || 'Import failed.' }); return; }
        created += r.created ?? 0; updated += r.updated ?? 0; skipped.push(...(r.skipped ?? []).map(s => `${s.path} (${s.reason})`));
      }
      setMsg({ ok: true, text: `Imported: ${created} new, ${updated} updated${skipped.length ? `, ${skipped.length} skipped (${skipped.slice(0, 3).join('; ')}${skipped.length > 3 ? '...' : ''})` : ''}.` });
      await loadList();
    } catch (e) {
      setMsg({ ok: false, text: `Import failed: ${(e as Error).message}` });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const allTags = React.useMemo(() => Array.from(new Set(notes.flatMap(n => n.tags))).sort(), [notes]);
  const tree = React.useMemo(() => buildFolderTree(notes.map(n => n.path)), [notes]);
  const visible = notes.filter(n =>
    (!tagFilter || n.tags.includes(tagFilter)) &&
    (folderFilter === null || n.path === folderFilter || n.path.startsWith(folderFilter + '/')));
  const pinned = visible.filter(n => n.pinned);

  const renderNote = (n: VaultNoteMeta, keyPrefix = '') => (
    <div key={keyPrefix + n.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 8, cursor: 'pointer', background: draft.id === n.id ? 'rgba(139,92,246,0.18)' : 'transparent' }}>
      <span onClick={() => openNote(n.id)} style={{ flex: 1, fontSize: 12.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={n.path ? `${n.path}/${n.title}` : n.title}>
        {n.title}
      </span>
      {n.source !== 'user' && <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: n.source === 'agent' ? 'var(--cyan-300)' : 'var(--violet-300)' }}>{n.source}</span>}
      <button type="button" aria-label={n.pinned ? 'Unpin' : 'Pin'} onClick={() => togglePin(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: n.pinned ? 'var(--warn-400)' : 'var(--text-dim)' }}>{n.pinned ? '★' : '☆'}</button>
    </div>
  );

  const renderFolder = (node: FolderNode, depth: number): React.ReactNode => (
    <div key={node.path} style={{ marginLeft: depth ? 12 : 0 }}>
      <div onClick={() => setFolderFilter(folderFilter === node.path ? null : node.path)} style={{ fontSize: 12, fontWeight: 600, padding: '4px 6px', cursor: 'pointer', color: folderFilter === node.path ? 'var(--violet-300)' : 'var(--text-muted)' }}>
        ▸ {node.name}
      </div>
      {notes.filter(n => n.path === node.path && (!tagFilter || n.tags.includes(tagFilter))).map(n => renderNote(n))}
      {node.children.map(c => renderFolder(c, depth + 1))}
    </div>
  );

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 24 }}>Loading the vault...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {fatal && (
        <div role="alert" style={{ ...card, padding: 16, borderColor: 'rgba(239,68,68,0.4)', color: 'var(--danger-400)', fontSize: 13 }}>
          {fatal}
        </div>
      )}
      {msg && (
        <div role="status" style={{ ...card, padding: '10px 14px', fontSize: 12.5, color: msg.ok ? 'var(--signal-400)' : 'var(--danger-400)', borderColor: msg.ok ? 'rgba(46,230,160,0.3)' : 'rgba(239,68,68,0.35)' }}>
          {msg.text} <button type="button" onClick={() => setMsg(null)} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>dismiss</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={query} onChange={e => { setQuery(e.target.value); if (!e.target.value.trim()) setHits(null); }} placeholder="Search the vault (full text)..." aria-label="Search the vault" style={{ ...field, maxWidth: 360 }} />
        <button type="button" style={btn(true)} onClick={() => newNote(folderFilter ?? '')}>+ New note</button>
        <button type="button" style={btn()} disabled={busy} onClick={() => fileRef.current?.click()}>Import (.zip / .md)</button>
        <button type="button" style={btn()} disabled={busy} onClick={exportZip}>Export (.zip)</button>
        <input ref={fileRef} type="file" multiple accept=".zip,.md,.markdown,.txt" style={{ display: 'none' }} onChange={e => importFiles(e.target.files)} />
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{notes.length} note{notes.length === 1 ? '' : 's'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 'var(--space-4)', alignItems: 'start' }}>
        {/* Left: tree / results */}
        <div style={{ ...card, padding: 12, maxHeight: '70vh', overflowY: 'auto' }}>
          {hits !== null ? (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>{hits.length} result{hits.length === 1 ? '' : 's'} for "{query.trim()}"</div>
              {hits.map(h => (
                <div key={h.id} onClick={() => openNote(h.id)} style={{ padding: '6px 8px', borderRadius: 8, cursor: 'pointer' }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text-strong)' }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.snippet}</div>
                </div>
              ))}
              {hits.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No matching notes.</div>}
            </div>
          ) : (
            <>
              {allTags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                  {allTags.map(t => (
                    <button key={t} type="button" onClick={() => setTagFilter(tagFilter === t ? null : t)} style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 999, cursor: 'pointer', border: '1px solid var(--border-default)', background: tagFilter === t ? 'rgba(139,92,246,0.3)' : 'transparent', color: 'var(--text-body)' }}>#{t}</button>
                  ))}
                </div>
              )}
              {pinned.length > 0 && (<><div style={{ fontSize: 11, color: 'var(--warn-400)', fontWeight: 700, margin: '4px 6px' }}>PINNED</div>{pinned.map(n => renderNote(n, 'p'))}</>)}
              <div onClick={() => setFolderFilter(null)} style={{ fontSize: 11, fontWeight: 700, margin: '10px 6px 4px', color: 'var(--text-dim)', cursor: 'pointer' }}>ALL NOTES {folderFilter !== null ? `(folder: ${folderFilter} - click to clear)` : ''}</div>
              {notes.filter(n => !n.path && (!tagFilter || n.tags.includes(tagFilter))).map(n => renderNote(n))}
              {tree.map(f => renderFolder(f, 0))}
              {notes.length === 0 && !fatal && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>The vault is empty. Create a note or import markdown files.</div>}
            </>
          )}
        </div>

        {/* Right: editor */}
        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={draft.title} onChange={e => update({ title: e.target.value })} placeholder="Note title" aria-label="Note title" disabled={draft.source === 'system'} style={{ ...field, flex: '2 1 220px', fontWeight: 700 }} />
            <input value={draft.path} onChange={e => update({ path: e.target.value })} placeholder="Folder (e.g. Decisions/2026)" aria-label="Folder" disabled={draft.source === 'system'} list="vault-folders" style={{ ...field, flex: '1 1 160px' }} />
            <datalist id="vault-folders">{Array.from(new Set(notes.map(n => n.path).filter(Boolean))).map(p => <option key={p} value={p} />)}</datalist>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={draft.tags} onChange={e => update({ tags: e.target.value })} placeholder="tags, comma separated" aria-label="Tags" style={{ ...field, flex: '1 1 220px' }} />
            <label style={{ fontSize: 12.5, color: 'var(--text-body)', display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={draft.pinned} onChange={e => update({ pinned: e.target.checked })} /> Pin (loaded by CEO/ARIA as standing context)
            </label>
            {draft.source && <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>source: {draft.source}</span>}
          </div>
          {draft.source === 'agent' && <div style={{ fontSize: 11.5, color: 'var(--cyan-300)' }}>Written by an agent. You can edit it; agents can only append to or replace notes they wrote themselves.</div>}
          {draft.source === 'system' && <div style={{ fontSize: 11.5, color: 'var(--violet-300)' }}>System note: the CEO agent and ARIA read this on every request. Edit the text to change how they behave; it cannot be renamed or deleted.</div>}

          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" style={btn(mode === 'edit')} onClick={() => setMode('edit')}>Edit</button>
            <button type="button" style={btn(mode === 'preview')} onClick={() => setMode('preview')}>Preview</button>
          </div>

          {mode === 'edit' ? (
            <textarea value={draft.body} onChange={e => update({ body: e.target.value })} placeholder={'Write markdown here. Link notes with [[Note title]]. Add #tags inline.'} aria-label="Note body (markdown)" style={{ ...field, minHeight: 320, fontFamily: 'var(--font-mono)', lineHeight: 1.55, resize: 'vertical' }} />
          ) : (
            <div
              style={{ minHeight: 320, fontSize: 14, lineHeight: 1.65, color: 'var(--text-body)' }}
              onClick={e => {
                const a = (e.target as HTMLElement).closest('a');
                const target = wikiTargetFromHref(a?.getAttribute('href') ?? undefined);
                if (target) { e.preventDefault(); void openByTitle(target); }
              }}
            >
              <ReactMarkdown
                urlTransform={(url) => (/^(https?:|mailto:|#wiki:)/i.test(url) ? url : '')}
                components={{ a: ({ href, children }) => <a href={href} target={href?.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer nofollow" style={{ color: 'var(--violet-300)', textDecoration: 'underline' }}>{children}</a> }}
              >
                {wikiToMarkdownLinks(draft.body) || '*Nothing to preview yet.*'}
              </ReactMarkdown>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" style={btn(true)} disabled={saving || !dirty} onClick={save}>{saving ? 'Saving...' : dirty ? 'Save (Ctrl+S)' : 'Saved'}</button>
            {draft.id && draft.source !== 'system' && <button type="button" style={{ ...btn(), color: 'var(--danger-400)' }} onClick={remove}>Delete</button>}
            {dirty && <span style={{ fontSize: 11.5, color: 'var(--warn-400)' }}>Unsaved changes</span>}
          </div>

          {detail && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid var(--border-default)', paddingTop: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>BACKLINKS ({detail.backlinks.length})</div>
                {detail.backlinks.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No notes link here yet. Use [[{detail.note.title}]] in another note.</div>}
                {detail.backlinks.map(b => <div key={b.id} onClick={() => openNote(b.id)} style={{ fontSize: 12.5, cursor: 'pointer', color: 'var(--violet-300)' }}>{b.path ? b.path + '/' : ''}{b.title}</div>)}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>LINKS OUT ({detail.outgoing.length})</div>
                {detail.outgoing.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This note links to nothing.</div>}
                {detail.outgoing.map(o => (
                  <div key={o.title} onClick={() => openByTitle(o.title)} style={{ fontSize: 12.5, cursor: 'pointer', color: o.exists ? 'var(--violet-300)' : 'var(--warn-400)' }}>
                    {o.title}{o.exists ? '' : ' (not created yet)'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
