import type { VaultNote, VaultNoteMeta, VaultStore } from './types';
import { titleKey } from './links';

/** In-memory VaultStore used by unit tests. */
export function memoryStore() {
  const notes: VaultNote[] = [];
  const links: { userId: string; from: string; title: string; key: string }[] = [];
  let n = 0;
  const meta = ({ body: _b, ...m }: VaultNote): VaultNoteMeta => m;
  const store: VaultStore = {
    async listMeta(u, limit) { return notes.filter(x => x.user_id === u).slice(0, limit).map(meta); },
    async listFull(u, limit) { return notes.filter(x => x.user_id === u).slice(0, limit).map(x => ({ ...x })); },
    async get(u, id) { const x = notes.find(y => y.user_id === u && y.id === id); return x ? { ...x } : null; },
    async findByPathTitle(u, p, t) { const x = notes.find(y => y.user_id === u && y.path.toLowerCase() === p.toLowerCase() && y.title.toLowerCase() === t.toLowerCase()); return x ? { ...x } : null; },
    async findByTitle(u, t) { const x = notes.find(y => y.user_id === u && titleKey(y.title) === titleKey(t)); return x ? { ...x } : null; },
    async insert(u, f) { const now = new Date(2026, 9, 2, 12, 0, ++n).toISOString(); const x: VaultNote = { id: `n${n}`, user_id: u, ...f, created_at: now, updated_at: now }; notes.push(x); return { ...x }; },
    async update(u, id, f) { const x = notes.find(y => y.user_id === u && y.id === id); if (!x) throw new Error('missing'); Object.assign(x, f, { updated_at: new Date().toISOString() }); return { ...x }; },
    async remove(u, id) { const i = notes.findIndex(y => y.user_id === u && y.id === id); if (i >= 0) notes.splice(i, 1); for (let k = links.length - 1; k >= 0; k--) if (links[k].from === id) links.splice(k, 1); },
    async search(u, q, limit) { const terms = q.toLowerCase().split(/\s+/); return notes.filter(x => x.user_id === u && terms.every(t => (x.title + ' ' + x.body).toLowerCase().includes(t))).slice(0, limit).map(x => ({ ...x })); },
    async setLinks(u, id, ls) { for (let k = links.length - 1; k >= 0; k--) if (links[k].from === id) links.splice(k, 1); ls.forEach(l => links.push({ userId: u, from: id, ...l })); },
    async outgoing(u, id) { return links.filter(l => l.userId === u && l.from === id).map(l => ({ title: l.title, key: l.key })); },
    async backlinks(u, key) { const ids = new Set(links.filter(l => l.userId === u && l.key === key).map(l => l.from)); return notes.filter(x => ids.has(x.id)).map(meta); },
  };
  return { store, notes, links };
}
