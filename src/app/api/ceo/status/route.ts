import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';
import { getCeoStatus } from '@/lib/orchestrator/status';
import { gemini } from '@/lib/ai/gemini';
import { isAiError } from '@/lib/ai/errors';

export const dynamic = 'force-dynamic';

/**
 * Deterministic status read-back from the database (what ARIA speaks for "status").
 * ?ping=1 additionally makes one tiny real Gemini call to prove the key/model/network work.
 */
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const url = new URL(req.url);
  const status = await getCeoStatus();
  let ping: { ok: boolean; code?: string; message?: string; hint?: string } | undefined;

  if (url.searchParams.get('ping') === '1') {
    const rl = await checkRateLimit(`ceo-ping:${auth.user.id}`, { limit: 4, windowMs: 60_000, failClosed: true });
    if (!rl.allowed) return rateLimitResponse(rl);
    try {
      const t0 = Date.now();
      await gemini.callRawLLM('Reply with the single word: OK', 'You are a connectivity probe. Reply with exactly: OK');
      ping = { ok: true, message: `Gemini answered in ${Date.now() - t0} ms.` };
    } catch (e: any) {
      ping = isAiError(e)
        ? { ok: false, code: e.code, message: e.message, hint: e.hint }
        : { ok: false, code: 'ERROR', message: String(e?.message || e).slice(0, 200) };
    }
  }
  return NextResponse.json({ success: true, status, ping });
}
