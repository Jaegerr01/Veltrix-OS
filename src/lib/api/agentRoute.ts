import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { runAgentLogic } from '@/lib/agents/executor';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';
import { aiErrorResponse } from './aiErrors';

/**
 * Thin HTTP wrapper over the single executor for the "draft one thing for one lead" routes
 * (/api/ai/outreach, /followup, /proposal). These routes only ever DRAFT. When Autopilot is on
 * the executor additionally files an approval request - nothing is ever marked sent here.
 * AI failures come back as explicit errors (code + hint); there is no template fallback.
 */
export function makeDraftRoute<S extends z.ZodType<Record<string, unknown>>>(agentKey: string, schema: S) {
  return async function POST(req: Request) {
    const auth = await requireUser(req);
    if (auth.response) return auth.response;
    const rl = await checkRateLimit(`ai:${auth.user.id}`, { limit: 20, windowMs: 60_000, failClosed: true });
    if (!rl.allowed) return rateLimitResponse(rl);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid request: ' + parsed.error.issues.map(i => `${i.path.join('.') || 'body'} ${i.message}`).join('; ') }, { status: 400 });
    }
    try {
      const leads = await db.getLeads();
      if (!leads.some(l => l.id === parsed.data.leadId)) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
      }
      const profile = await db.getBusinessProfile().catch(() => null);
      const res = await runAgentLogic(agentKey, parsed.data, !!profile?.autopilot);
      if (!res.success) return NextResponse.json({ success: false, error: res.error || 'The agent could not finish.' }, { status: 502 });
      return NextResponse.json({ success: true, result: res.result, needsApproval: !!res.needsApproval, approvalRequestId: res.approvalRequestId, sent: false });
    } catch (e) {
      return aiErrorResponse(e);
    }
  };
}
