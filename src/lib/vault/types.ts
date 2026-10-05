export type VaultSource = 'user' | 'agent' | 'system';

export interface VaultNote {
  id: string;
  user_id: string;
  title: string;
  /** Folder path such as "Decisions/2026". Empty string = vault root. */
  path: string;
  /** Markdown. */
  body: string;
  tags: string[];
  pinned: boolean;
  source: VaultSource;
  created_at: string;
  updated_at: string;
}

export type VaultNoteMeta = Omit<VaultNote, 'body'>;

export interface VaultSearchHit extends VaultNoteMeta { snippet: string }

export class VaultError extends Error {
  constructor(public code: 'unavailable' | 'invalid' | 'forbidden' | 'not_found', message: string) {
    super(message);
    this.name = 'VaultError';
  }
}

/** The persistence seam: Supabase in production (lib/db/vault.ts), an in-memory fake in tests. */
export interface VaultStore {
  listMeta(userId: string, limit: number): Promise<VaultNoteMeta[]>;
  listFull(userId: string, limit: number): Promise<VaultNote[]>;
  get(userId: string, id: string): Promise<VaultNote | null>;
  findByPathTitle(userId: string, path: string, title: string): Promise<VaultNote | null>;
  findByTitle(userId: string, title: string): Promise<VaultNote | null>;
  insert(userId: string, fields: Pick<VaultNote, 'title' | 'path' | 'body' | 'tags' | 'pinned' | 'source'>): Promise<VaultNote>;
  update(userId: string, id: string, fields: Partial<Pick<VaultNote, 'title' | 'path' | 'body' | 'tags' | 'pinned'>>): Promise<VaultNote>;
  remove(userId: string, id: string): Promise<void>;
  search(userId: string, query: string, limit: number): Promise<VaultNote[]>;
  setLinks(userId: string, noteId: string, links: { title: string; key: string }[]): Promise<void>;
  outgoing(userId: string, noteId: string): Promise<{ title: string; key: string }[]>;
  backlinks(userId: string, titleKey: string): Promise<VaultNoteMeta[]>;
}
