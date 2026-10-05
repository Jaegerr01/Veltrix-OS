import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';
import { orchestrate } from '@/lib/orchestrator/run';
import { runToChatText } from '@/lib/orchestrator/chatText';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().trim().min(1, 'Message is required.').max(4000, 'Message is too long (max 4000 characters).'),
  voiceMode: z.boolean().optional(),
});

/**
 * Compatibility (non-streaming) chat endpoint. It no longer parses fragile "[RUN_AGENT: ...]" tags out of
 * model prose: it delegates to the real orchestrator (same as POST /api/ceo) and returns what happened.
 */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = await checkRateLimit(`ceo:${auth.user.id}`, { limit: 12, windowMs: 60_000, failClosed: true });
  if (!rl.allowed) return rateLimitResponse(rl);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  const { message, voiceMode } = parsed.data;

  try { await db.addChatMessage({ sender: 'user', message }); } catch (e) { console.warn('[chat] could not save user message:', e); }

  const result = await orchestrate({ instruction: message, source: voiceMode ? 'aria' : 'ceo', voice: voiceMode });
  let saved = null;
  try {
    saved = await db.addChatMessage({ sender: 'ai', agentName: result.error ? 'System' : 'Alex (CEO Agent)', message: runToChatText(result) });
  } catch (e) { console.warn('[chat] could not save AI message:', e); }

  if (result.error) {
    const status = result.error.code === 'NOT_CONFIGURED' ? 503 : result.error.code === 'QUOTA' ? 429 : 502;
    return NextResponse.json({ success: false, code: result.error.code, error: result.error.message, hint: result.error.hint, message: saved }, { status });
  }
  return NextResponse.json({ success: true, message: saved, run: result });
}
