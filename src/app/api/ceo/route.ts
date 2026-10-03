import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';
import { orchestrate, type OrchestratorEvent, type RunResult } from '@/lib/orchestrator/run';
import { runToChatText } from '@/lib/orchestrator/chatText';
import { ndjsonResponse } from '@/lib/api/ndjson';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().trim().min(1, 'Message is required.').max(4000, 'Message is too long (max 4000 characters).'),
  source: z.enum(['ceo', 'aria', 'user']).default('ceo'),
  voice: z.boolean().optional(),
  stream: z.boolean().default(true),
});

async function record(result: RunResult) {
  try {
    return await db.addChatMessage({ sender: 'ai', agentName: result.error ? 'System' : 'Alex (CEO Agent)', message: runToChatText(result) });
  } catch (e) {
    console.warn('[ceo] could not save chat message:', e);
    return null;
  }
}

/**
 * The CEO / ARIA entry point: a plain-language instruction in, real tasks assigned to real agents,
 * live progress streamed out (NDJSON), honest errors (never a simulated answer).
 */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const rl = await checkRateLimit(`ceo:${auth.user.id}`, { limit: 12, windowMs: 60_000, failClosed: true });
  if (!rl.allowed) return rateLimitResponse(rl);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  }
  const { message, source, voice, stream } = parsed.data;

  try { await db.addChatMessage({ sender: 'user', message }); } catch (e) { console.warn('[ceo] could not save user message:', e); }

  if (!stream) {
    const result = await orchestrate({ instruction: message, source, voice });
    const saved = await record(result);
    if (result.error) {
      const status = result.error.code === 'NOT_CONFIGURED' ? 503 : result.error.code === 'QUOTA' ? 429 : 502;
      return NextResponse.json({ success: false, code: result.error.code, error: result.error.message, hint: result.error.hint, message: saved }, { status });
    }
    return NextResponse.json({ success: true, ...result, message: saved });
  }

  return ndjsonResponse(async send => {
    let final: RunResult | null = null;
    const emit = (e: OrchestratorEvent) => {
      if (e.type === 'done') final = e.result;
      send(e);
    };
    const result = await orchestrate({ instruction: message, source, voice, emit });
    const saved = await record(final ?? result);
    if (saved) send({ type: 'chat', message: saved });
  });
}
