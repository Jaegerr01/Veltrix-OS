import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';
import { decideApprovalRequest } from '@/lib/entity/approvals';

const bodySchema = z.object({
  decision: z.enum(['approve', 'reject']),
  editedPayload: z.record(z.string(), z.unknown()).optional(),
  rejectionReason: z.string().max(1000).optional(),
});

// POST /api/entity/approvals/[id]
// Body: { decision: 'approve' | 'reject', editedPayload?: object, rejectionReason?: string }
// Approve executes the action through the guarded delivery pipeline. If the action did NOT happen
// (provider error, kill switch, cap, blacklist, no email on file) the response says so explicitly
// (executed:false, HTTP 409) and the request stays retryable - never a pretend success.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const rl = await checkRateLimit(`approvals:${auth.user.id}`, { limit: 30, windowMs: 60_000, failClosed: true });
  if (!rl.allowed) return rateLimitResponse(rl);

  const { id } = await params;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "decision must be 'approve' or 'reject'." }, { status: 400 });
  }

  try {
    const result = await decideApprovalRequest({ id, ...parsed.data });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    if (result.executed === false) {
      return NextResponse.json(
        { success: false, executed: false, error: result.executionNote || 'The approved action did not complete.', request: result.request, executionNote: result.executionNote },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: true, executed: true, request: result.request, executionNote: result.executionNote });
  } catch (error: any) {
    console.error('Error in POST /api/entity/approvals/[id]:', error);
    return NextResponse.json({ success: false, error: 'Failed to decide approval request. Check the server log.' }, { status: 500 });
  }
}
