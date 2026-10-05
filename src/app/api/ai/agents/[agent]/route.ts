import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runAgentLogic } from '@/lib/agents/executor';
import { AGENTS } from '@/lib/agents/agents';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';

const bodySchema = z.object({ params: z.record(z.string(), z.unknown()).optional() }).passthrough();

/**
 * Direct "run this agent now" endpoint. It used to hold a THIRD copy of every agent's logic (and a
 * simulator fallback). It is now a thin wrapper over the single executor, so a result here is
 * identical to the same agent run by the CEO orchestrator or the UI.
 */
export async function POST(req: Request, { params }: { params: Promise<{ agent: string }> }) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = await checkRateLimit(auth.user.id, { limit: 20, windowMs: 60_000, failClosed: true });
  if (!rl.allowed) return rateLimitResponse(rl);

  const { agent } = await params;
  if (!agent || !AGENTS[agent]) {
    return NextResponse.json({ success: false, error: `Unknown agent "${agent}".` }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  const { params: inner, ...rest } = parsed.data as { params?: Record<string, unknown> } & Record<string, unknown>;

  const res = await runAgentLogic(agent, inner ?? rest, false);
  if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
  return NextResponse.json({ success: true, result: res.result, needsApproval: res.needsApproval, approvalRequestId: res.approvalRequestId });
}
