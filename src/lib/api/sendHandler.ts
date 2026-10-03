import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';
import { approveAndDeliver, markManuallySent, type DeliveryKind } from '@/lib/email/delivery';

const bodySchema = z.object({
  id: z.string().min(1).max(100).optional(),
  messageId: z.string().min(1).max(100).optional(), // legacy field name used by the Outreach page
  retry: z.boolean().optional(),
  manual: z.boolean().optional(), // owner attests they sent it outside the app (non-email only)
});

/**
 * POST handler factory for "Approve & send" / "Retry" of an outreach message, follow-up or proposal.
 * The click is the human approval; delivery then goes through the single guarded pipeline and the
 * HTTP result states exactly what happened (sent / failed / blocked) - never a pretend success.
 */
export function makeSendHandler(kind: DeliveryKind) {
  return async function POST(req: Request) {
    const auth = await requireUser(req);
    if (auth.response) return auth.response;

    const rl = await checkRateLimit(`send:${auth.user.id}`, { limit: 10, windowMs: 60_000, failClosed: true });
    if (!rl.allowed) return rateLimitResponse(rl);

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    const id = parsed.success ? parsed.data.id || parsed.data.messageId : undefined;
    if (!parsed.success || !id) {
      return NextResponse.json({ success: false, error: 'id is required.' }, { status: 400 });
    }

    try {
      const r = parsed.data.manual ? await markManuallySent(kind, id) : await approveAndDeliver(kind, id, { retry: parsed.data.retry });
      const delivered = r.outcome === 'sent' || r.outcome === 'already_sent';
      const http =
        delivered ? 200 :
        r.outcome === 'not_found' ? 404 :
        r.outcome === 'failed' ? 502 :
        409; // blocked / not approved / in flight / no recipient / manual channel
      return NextResponse.json(
        {
          success: delivered,
          emailDelivered: r.outcome === 'sent',
          outcome: r.outcome,
          note: r.message,
          error: delivered ? undefined : r.message,
          providerMessageId: r.outcome === 'sent' ? r.providerMessageId : undefined,
          provider: r.outcome === 'sent' ? r.provider : undefined,
        },
        { status: http }
      );
    } catch (e: any) {
      console.error(`[send:${kind}]`, e);
      return NextResponse.json({ success: false, error: 'Send failed unexpectedly. Check the server log.' }, { status: 500 });
    }
  };
}
