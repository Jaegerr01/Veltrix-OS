import { supabase, getUserId } from './_core';
import { VaultError, type VaultNote, type VaultNoteMeta, type VaultStore } from '../vault/types';
import * as svc from '../vault/service';
import type { AgentNoteInput, SaveInput } from '../vault/service';

/**
 * Supabase-backed Memory Vault. Tables: vault_notes / vault_links (migrations/2026-10-02_004_memory_vault.sql).
 * Every query is scoped by user_id; RLS enforces the same in the browser.
 */
const META_COLS: string = 'id,user_id,title,path,tags,pinned,source,created_at,updated_at';
const FULL_COLS: string = META_COLS + ',body';

const MIGRATION_HINT = 'Memory Vault tables are missing. Apply migrations/2026-10-02_004_memory_vault.sql in the Supabase SQL editor.';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fail(e: any): never {
  const msg = `${e?.message || ''} ${e?.details || ''}`;
  if (e?.code === '42P01' || e?.code === 'PGRST205' || /vault_(notes|links)/.test(msg) && /does not exist|schema cache/i.test(msg)) {
    throw new VaultError('unavailable', MIGRATION_HINT);
  }
  if (e?.code === '23505') throw new VaultError('invalid', 'A note with that title already exists in that folder.');
  console.error('[vault] db error:', e?.code, e?.message);
  throw new VaultError('unavailable', 'The Memory Vault could not complete that request. Please try again.');
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, m => '\\' + m);

export const supabaseVaultStore: VaultStore = {
  async listMeta(userId, limit) {
    const { data, error } = await supabase.from('vault_notes').select(META_COLS).eq('user_id', userId).order('updated_at', { ascending: false }).limit(limit);
    if (error) fail(error);
    return (data || []) as unknown as VaultNoteMeta[];
  },
  async listFull(userId, limit) {
    const { data, error } = await supabase.from('vault_notes').select(FULL_COLS).eq('user_id', userId).order('path').limit(limit);
    if (error) fail(error);
    return (data || []) as unknown as VaultNote[];
  },
  async get(userId, id) {
    const { data, error } = await supabase.from('vault_notes').select(FULL_COLS).eq('user_id', userId).eq('id', id).maybeSingle();
    if (error) fail(error);
    return (data as unknown as VaultNote) ?? null;
  },
  async findByPathTitle(userId, path, title) {
    const { data, error } = await supabase.from('vault_notes').select(FULL_COLS).eq('user_id', userId).ilike('path', escapeLike(path)).ilike('title', escapeLike(title)).limit(1);
    if (error) fail(error);
    return ((data || [])[0] as unknown as VaultNote) ?? null;
  },
  async findByTitle(userId, title) {
    const { data, error } = await supabase.from('vault_notes').select(FULL_COLS).eq('user_id', userId).ilike('title', escapeLike(title)).limit(1);
    if (error) fail(error);
    return ((data || [])[0] as unknown as VaultNote) ?? null;
  },
  async insert(userId, fields) {
    const { data, error } = await supabase.from('vault_notes').insert({ user_id: userId, ...fields }).select(FULL_COLS).single();
    if (error) fail(error);
    return data as unknown as VaultNote;
  },
  async update(userId, id, fields) {
    const { data, error } = await supabase.from('vault_notes').update(fields).eq('user_id', userId).eq('id', id).select(FULL_COLS).single();
    if (error) fail(error);
    return data as unknown as VaultNote;
  },
  async remove(userId, id) {
    const { error } = await supabase.from('vault_notes').delete().eq('user_id', userId).eq('id', id);
    if (error) fail(error);
  },
  async search(userId, query, limit) {
    const fts = await supabase.from('vault_notes').select(FULL_COLS).eq('user_id', userId)
      .textSearch('search', query, { type: 'websearch', config: 'english' }).limit(limit);
    if (!fts.error && fts.data && fts.data.length > 0) return fts.data as unknown as VaultNote[];
    // Partial words / FTS unavailable: substring match on title or body.
    const like = `%${escapeLike(query)}%`;
    const { data, error } = await supabase.from('vault_notes').select(FULL_COLS).eq('user_id', userId)
      .or(`title.ilike.${like},body.ilike.${like}`).limit(limit);
    if (error) fail(error);
    return (data || []) as unknown as VaultNote[];
  },
  async setLinks(userId, noteId, links) {
    const del = await supabase.from('vault_links').delete().eq('user_id', userId).eq('from_note_id', noteId);
    if (del.error) fail(del.error);
    if (!links.length) return;
    const { error } = await supabase.from('vault_links').insert(links.map(l => ({ user_id: userId, from_note_id: noteId, to_title: l.title, to_key: l.key })));
    if (error) fail(error);
  },
  async outgoing(userId, noteId) {
    const { data, error } = await supabase.from('vault_links').select('to_title,to_key').eq('user_id', userId).eq('from_note_id', noteId);
    if (error) fail(error);
    return (data || []).map((r: { to_title: string; to_key: string }) => ({ title: r.to_title, key: r.to_key }));
  },
  async backlinks(userId, key) {
    const { data, error } = await supabase.from('vault_links').select('from_note_id').eq('user_id', userId).eq('to_key', key);
    if (error) fail(error);
    const ids = Array.from(new Set((data || []).map((r: { from_note_id: string }) => r.from_note_id)));
    if (!ids.length) return [];
    const notes = await supabase.from('vault_notes').select(META_COLS).eq('user_id', userId).in('id', ids);
    if (notes.error) fail(notes.error);
    return (notes.data || []) as unknown as VaultNoteMeta[];
  },
};

/** Typed vault API for server code (routes, orchestrator, executor, ARIA). userId defaults to the current request's owner. */
export const vault = {
  list: async (userId?: string) => svc.listVault(supabaseVaultStore, userId ?? await getUserId()),
  read: async (id: string, userId?: string) => svc.readNote(supabaseVaultStore, userId ?? await getUserId(), id),
  save: async (input: SaveInput, userId?: string) => svc.saveNote(supabaseVaultStore, userId ?? await getUserId(), input),
  patch: async (id: string, patch: Partial<SaveInput>, userId?: string) => svc.patchNote(supabaseVaultStore, userId ?? await getUserId(), id, patch),
  remove: async (id: string, userId?: string) => svc.deleteNote(supabaseVaultStore, userId ?? await getUserId(), id),
  search: async (q: string, limit?: number, userId?: string) => svc.searchVault(supabaseVaultStore, userId ?? await getUserId(), q, limit),
  ensureConstitution: async (userId?: string) => svc.ensureConstitution(supabaseVaultStore, userId ?? await getUserId()),
  standingContext: async (userId?: string) => svc.getStandingContext(supabaseVaultStore, userId ?? await getUserId()),
  /** Agent-side read/write (restricted: agents cannot modify owner/system notes). */
  agentRead: async (query: string, limit?: number, userId?: string) => svc.agentReadVault(supabaseVaultStore, userId ?? await getUserId(), query, limit),
  agentWrite: async (input: AgentNoteInput, userId?: string) => svc.writeAgentNote(supabaseVaultStore, userId ?? await getUserId(), input),
  exportZip: async (userId?: string) => svc.exportVaultZip(supabaseVaultStore, userId ?? await getUserId()),
  importFiles: async (files: { path: string; content: string }[], userId?: string) => svc.importFiles(supabaseVaultStore, userId ?? await getUserId(), files),
};

/**
 * Best-effort agent journaling: never throws (a missing vault table or DB hiccup must not break the agent's real work).
 * Returns the note title written, or null.
 */
export async function journalToVault(input: AgentNoteInput): Promise<string | null> {
  try {
    const n = await vault.agentWrite(input);
    return n.title;
  } catch (e) {
    console.warn('[vault] journal skipped:', (e as Error).message);
    return null;
  }
}
