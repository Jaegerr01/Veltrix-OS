import { NextResponse } from 'next/server';
import { z } from 'zod';
import { vaultHandler } from '@/lib/api/vaultRoute';
import { parseJson } from '@/lib/api/validate';
import { vault } from '@/lib/db/vault';

export const dynamic = 'force-dynamic';

const importSchema = z.object({
  files: z.array(z.object({
    path: z.string().min(1).max(400),
    content: z.string().max(200_000),
  })).min(1).max(300),
});

/** POST /api/memory/import  { files: [{ path, content }] } - the browser unpacks .zip/.md files and sends their text. */
export async function POST(req: Request) {
  return vaultHandler(req, { bucket: 'import', limit: 10 }, async (user) => {
    const parsed = await parseJson(req, importSchema);
    if (parsed.response) return parsed.response;
    const result = await vault.importFiles(parsed.data.files, user.id);
    return NextResponse.json({ success: true, ...result });
  });
}
