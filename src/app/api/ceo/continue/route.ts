import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';
import { continueRun, type RunResult } from '@/lib/orchestrator/run';
import { ndjsonResponse } from '@/lib/api/ndjson';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const bodySchema = z.object({ runId: z.string().uuid() });

/** Resume the still-queued tasks of an earlier run (e.g. after the time budget was hit or after approving a dependency). */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = await checkRateLimit(`ceo:${auth.user.id}`, { limit: 12, windowMs: 60_000, failClosed: true });
  if (!rl.allowed) return rateLimitResponse(rl);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'runId (uuid) is required.' }, { status: 400 });

  return ndjsonResponse(async send => {
    let final: RunResult | null = null;
    await continueRun(parsed.data.runId, { emit: e => { if (e.type === 'done') final = e.result; send(e); } });
    void final;
  });
}
