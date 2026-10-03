import { vaultHandler } from '@/lib/api/vaultRoute';
import { vault } from '@/lib/db/vault';

export const dynamic = 'force-dynamic';

/** GET /api/memory/export -> a .zip of .md files (folders preserved, front matter included) that opens in any editor. */
export async function GET(req: Request) {
  return vaultHandler(req, { bucket: 'export', limit: 10 }, async (user) => {
    const zip = await vault.exportZip(user.id);
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(zip as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="postelos-vault-${stamp}.zip"`,
        'Cache-Control': 'no-store',
      },
    });
  });
}
