import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runAgentLogic } from '@/lib/agents/executor';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';

const bodySchema = z.object({
  agentKey: z.string().min(1).max(40),
  params: z.record(z.string(), z.unknown()).default({}),
  autonomous: z.boolean().optional(),
});

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = await checkRateLimit(auth.user.id, { limit: 20, windowMs: 60_000, failClosed: true });
  if (!rl.allowed) return rateLimitResponse(rl);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'agentKey is required.' }, { status: 400 });

  // `autonomous` only changes whether outward drafts are also queued for approval - the executor never sends.
  const res = await runAgentLogic(parsed.data.agentKey, parsed.data.params, parsed.data.autonomous ?? false);
  if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
  return NextResponse.json({ success: true, result: res.result, needsApproval: res.needsApproval, approvalRequestId: res.approvalRequestId });
}
