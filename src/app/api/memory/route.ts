import { NextResponse } from 'next/server';
import { z } from 'zod';
import { vaultHandler } from '@/lib/api/vaultRoute';
import { parseJson } from '@/lib/api/validate';
import { vault, supabaseVaultStore } from '@/lib/db/vault';
import { ensureConstitution } from '@/lib/vault/service';

export const dynamic = 'force-dynamic';

const noteSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  body: z.string().max(200_000).optional(),
  path: z.string().max(300).optional(),
  tags: z.array(z.string().max(60)).max(30).optional(),
  pinned: z.boolean().optional(),
});

/** GET /api/memory            -> note list (metadata, newest first; seeds the Constitution on first use)
 *  GET /api/memory?q=pricing  -> full-text search with snippets */
export async function GET(req: Request) {
  return vaultHandler(req, { bucket: 'read' }, async (user) => {
    const q = new URL(req.url).searchParams.get('q')?.trim();
    if (q) return NextResponse.json({ success: true, query: q, hits: await vault.search(q.slice(0, 200), 30, user.id) });
    await ensureConstitution(supabaseVaultStore, user.id);
    return NextResponse.json({ success: true, notes: await vault.list(user.id) });
  });
}

/** POST /api/memory -> create or update a note as the owner. */
export async function POST(req: Request) {
  return vaultHandler(req, { bucket: 'write', limit: 60 }, async (user) => {
    const parsed = await parseJson(req, noteSchema);
    if (parsed.response) return parsed.response;
    const note = await vault.save(parsed.data, user.id);
    return NextResponse.json({ success: true, note });
  });
}
