import { fence } from '../ai/untrusted';
import { CONSTITUTION_PATH, CONSTITUTION_TITLE, DEFAULT_CONSTITUTION } from './constitution';
import { normalizePath, normalizeTags, parseWikiLinks, sanitizeTitle, titleKey } from './links';
import { buildMarkdownFile, parseMarkdownFile, splitFilePath } from './markdown';
import { bytesToText, createZip, readZip } from './zip';
import { VaultError, type VaultNote, type VaultNoteMeta, type VaultSearchHit, type VaultSource, type VaultStore } from './types';

export const VAULT_LIMITS = { title: 200, body: 200_000, agentBody: 20_000, notes: 2000, importFiles: 300 };

export interface SaveInput {
  id?: string;
  title: string;
  body?: string;
  path?: string;
  tags?: string[];
  pinned?: boolean;
}

function clean(input: SaveInput) {
  const title = sanitizeTitle(input.title || '');
  if (!title) throw new VaultError('invalid', 'A note needs a title.');
  const body = (input.body ?? '').replace(/\u0000/g, '');
  if (body.length > VAULT_LIMITS.body) throw new VaultError('invalid', `Note is too long (max ${VAULT_LIMITS.body} characters).`);
  return { title, body, path: normalizePath(input.path), tags: normalizeTags(input.tags ?? []), pinned: !!input.pinned };
}

/** Create or update a note as the OWNER (source 'user' on create; existing source is preserved on update). */
export async function saveNote(store: VaultStore, userId: string, input: SaveInput): Promise<VaultNote> {
  const c = clean(input);
  let saved: VaultNote;
  if (input.id) {
    const existing = await store.get(userId, input.id);
    if (!existing) throw new VaultError('not_found', 'Note not found.');
    // System notes (the Constitution) keep their identity; only the body/tags/pin can change.
    saved = await store.update(userId, input.id, existing.source === 'system' ? { ...c, title: existing.title, path: existing.path } : c);
  } else {
    const same = await store.findByPathTitle(userId, c.path, c.title);
    saved = same
      ? await store.update(userId, same.id, { body: c.body, tags: c.tags.length ? c.tags : same.tags, pinned: input.pinned ?? same.pinned })
      : await store.insert(userId, { ...c, source: 'user' });
  }
  await store.setLinks(userId, saved.id, parseWikiLinks(saved.body));
  return saved;
}

export async function patchNote(store: VaultStore, userId: string, id: string, patch: Partial<SaveInput>): Promise<VaultNote> {
  const existing = await store.get(userId, id);
  if (!existing) throw new VaultError('not_found', 'Note not found.');
  const merged = clean({
    title: patch.title ?? existing.title,
    body: patch.body ?? existing.body,
    path: patch.path ?? existing.path,
    tags: patch.tags ?? existing.tags,
    pinned: patch.pinned ?? existing.pinned,
  });
  const saved = await store.update(userId, id, existing.source === 'system' ? { ...merged, title: existing.title, path: existing.path } : merged);
  if (patch.body !== undefined) await store.setLinks(userId, id, parseWikiLinks(saved.body));
  return saved;
}

export async function readNote(store: VaultStore, userId: string, id: string) {
  const note = await store.get(userId, id);
  if (!note) throw new VaultError('not_found', 'Note not found.');
  const [backlinks, out] = await Promise.all([store.backlinks(userId, titleKey(note.title)), store.outgoing(userId, id)]);
  const outgoing = await Promise.all(out.map(async l => {
    const target = await store.findByTitle(userId, l.title);
    return { title: l.title, exists: !!target, id: target?.id ?? null };
  }));
  return { note, backlinks: backlinks.filter(b => b.id !== id), outgoing };
}

export async function deleteNote(store: VaultStore, userId: string, id: string): Promise<void> {
  const note = await store.get(userId, id);
  if (!note) throw new VaultError('not_found', 'Note not found.');
  if (note.source === 'system' && note.title === CONSTITUTION_TITLE) {
    throw new VaultError('forbidden', 'The Constitution cannot be deleted (edit it instead).');
  }
  await store.remove(userId, id);
}

export function snippetFor(body: string, query: string, len = 160): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const low = flat.toLowerCase();
  const idx = terms.map(t => low.indexOf(t)).filter(i => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, idx - 40);
  return (start > 0 ? '…' : '') + flat.slice(start, start + len) + (start + len < flat.length ? '…' : '');
}

export async function searchVault(store: VaultStore, userId: string, query: string, limit = 20): Promise<VaultSearchHit[]> {
  const q = query.trim().slice(0, 200);
  if (!q) return [];
  const rows = await store.search(userId, q, Math.min(Math.max(limit, 1), 50));
  return rows.map(({ body, ...meta }) => ({ ...meta, snippet: snippetFor(body, q) }));
}

export async function listVault(store: VaultStore, userId: string): Promise<VaultNoteMeta[]> {
  return store.listMeta(userId, VAULT_LIMITS.notes);
}

// ---------- Constitution + standing context ----------

export async function ensureConstitution(store: VaultStore, userId: string): Promise<VaultNote> {
  const existing = await store.findByTitle(userId, CONSTITUTION_TITLE);
  if (existing) return existing;
  const created = await store.insert(userId, {
    title: CONSTITUTION_TITLE, path: CONSTITUTION_PATH, body: DEFAULT_CONSTITUTION,
    tags: ['constitution', 'system'], pinned: true, source: 'system',
  });
  await store.setLinks(userId, created.id, parseWikiLinks(created.body));
  return created;
}

/**
 * Text injected into the CEO agent / ARIA / executor prompts: the Constitution plus pinned notes.
 * Owner/system text is included as-is; agent-written pinned notes are fenced as data (they may quote leads).
 */
export async function getStandingContext(store: VaultStore, userId: string, maxChars = 6000): Promise<string> {
  const constitution = await ensureConstitution(store, userId);
  const metas = (await store.listMeta(userId, VAULT_LIMITS.notes)).filter(m => m.pinned && m.id !== constitution.id).slice(0, 8);
  const parts: string[] = [`## ${constitution.title}\n${constitution.body.slice(0, 3500)}`];
  for (const m of metas) {
    const n = await store.get(userId, m.id);
    if (!n) continue;
    const text = n.body.slice(0, 1200);
    parts.push(`## ${n.title}${n.path ? ` (${n.path})` : ''}\n${n.source === 'agent' ? fence(`vault note: ${n.title}`, text, 1200) : text}`);
  }
  return `=== STANDING CONTEXT (PostelOS Memory Vault: Constitution + pinned notes) ===\n${parts.join('\n\n')}`.slice(0, maxChars);
}

// ---------- Agent access (typed, restricted) ----------

export interface AgentNoteInput {
  title: string;
  body: string;
  folder?: string;
  tags?: string[];
  mode?: 'create' | 'append';
  agent?: string;
}

/**
 * Agents (CEO, ARIA, executor) write here. They may create notes and append to notes THEY wrote earlier,
 * but can never overwrite or append to notes written by the owner or the system (prompt-injection safe).
 */
export async function writeAgentNote(store: VaultStore, userId: string, input: AgentNoteInput): Promise<VaultNote> {
  const title = sanitizeTitle(input.title);
  if (!title) throw new VaultError('invalid', 'A note needs a title.');
  const body = (input.body || '').replace(/\u0000/g, '').slice(0, VAULT_LIMITS.agentBody);
  const path = normalizePath(input.folder || 'Agent Notes');
  const tags = normalizeTags(['agent', ...(input.tags ?? []), ...(input.agent ? [input.agent] : [])]);
  const existing = await store.findByPathTitle(userId, path, title);
  if (existing) {
    if (existing.source !== 'agent') throw new VaultError('forbidden', `"${title}" was written by the owner/system; agents cannot modify it.`);
    const merged = input.mode === 'append' ? `${existing.body}\n\n${body}`.slice(0, VAULT_LIMITS.body) : body;
    const saved = await store.update(userId, existing.id, { body: merged, tags: normalizeTags([...existing.tags, ...tags]) });
    await store.setLinks(userId, saved.id, parseWikiLinks(saved.body));
    return saved;
  }
  const created = await store.insert(userId, { title, path, body, tags, pinned: false, source: 'agent' });
  await store.setLinks(userId, created.id, parseWikiLinks(created.body));
  return created;
}

/** Read access for agents: search first, fall back to nothing (never invents content). */
export async function agentReadVault(store: VaultStore, userId: string, query: string, limit = 5) {
  const hits = await searchVault(store, userId, query, limit);
  const notes = await Promise.all(hits.map(h => store.get(userId, h.id)));
  return notes.filter((n): n is VaultNote => !!n).map(n => ({ id: n.id, title: n.title, path: n.path, source: n.source as VaultSource, tags: n.tags, body: n.body.slice(0, 2000) }));
}

// ---------- Import / export ----------

export async function exportVaultZip(store: VaultStore, userId: string): Promise<Uint8Array> {
  const notes = await store.listFull(userId, VAULT_LIMITS.notes);
  const used = new Set<string>();
  const files = notes.map(n => {
    let name = `${n.path ? n.path + '/' : ''}${sanitizeTitle(n.title) || 'Untitled'}.md`;
    while (used.has(name.toLowerCase())) name = name.replace(/\.md$/, ` (${n.id.slice(0, 4)}).md`);
    used.add(name.toLowerCase());
    return { name, data: buildMarkdownFile(n) };
  });
  return createZip(files);
}

export interface ImportResult { created: number; updated: number; skipped: { path: string; reason: string }[] }

export async function importFiles(store: VaultStore, userId: string, files: { path: string; content: string }[]): Promise<ImportResult> {
  const res: ImportResult = { created: 0, updated: 0, skipped: [] };
  for (const f of files.slice(0, VAULT_LIMITS.importFiles)) {
    if (!/\.(md|markdown|txt)$/i.test(f.path)) { res.skipped.push({ path: f.path, reason: 'not a markdown file' }); continue; }
    const { path, title: fileTitle } = splitFilePath(f.path);
    const parsed = parseMarkdownFile(f.content);
    const title = sanitizeTitle(parsed.title || fileTitle);
    if (!title) { res.skipped.push({ path: f.path, reason: 'no title' }); continue; }
    if (parsed.body.length > VAULT_LIMITS.body) { res.skipped.push({ path: f.path, reason: 'too long' }); continue; }
    const existing = await store.findByPathTitle(userId, path, title);
    if (existing && existing.source === 'system') { res.skipped.push({ path: f.path, reason: 'system note is protected' }); continue; }
    const saved = existing
      ? await store.update(userId, existing.id, { body: parsed.body, tags: parsed.tags, pinned: parsed.pinned ?? existing.pinned })
      : await store.insert(userId, { title, path, body: parsed.body, tags: parsed.tags, pinned: !!parsed.pinned, source: 'user' });
    await store.setLinks(userId, saved.id, parseWikiLinks(saved.body));
    if (existing) res.updated++; else res.created++;
  }
  return res;
}

export async function importZipBytes(store: VaultStore, userId: string, bytes: Uint8Array): Promise<ImportResult> {
  const entries = await readZip(bytes);
  return importFiles(store, userId, entries.map(e => ({ path: e.name, content: bytesToText(e.data) })));
}
