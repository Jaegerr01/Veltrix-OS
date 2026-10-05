import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';
import { VaultError } from '@/lib/vault/types';

const STATUS: Record<VaultError['code'], number> = { unavailable: 503, invalid: 400, forbidden: 403, not_found: 404 };

/** Auth (owner only) + rate limit (fails closed) + uniform error mapping for /api/memory routes. */
export async function vaultHandler(
  req: Request,
  opts: { bucket: string; limit?: number },
  run: (user: { id: string }) => Promise<Response>
): Promise<Response> {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = await checkRateLimit(`vault:${opts.bucket}:${auth.user.id}`, { limit: opts.limit ?? 120, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl);
  try {
    return await run(auth.user);
  } catch (e) {
    if (e instanceof VaultError) {
      return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: STATUS[e.code] });
    }
    console.error('[api/memory]', (e as Error).message);
    return NextResponse.json({ success: false, error: 'Memory Vault request failed.' }, { status: 500 });
  }
}
