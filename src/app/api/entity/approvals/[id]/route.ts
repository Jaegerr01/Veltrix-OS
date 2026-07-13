import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { decideApprovalRequest } from '@/lib/entity/approvals';

// POST /api/entity/approvals/[id]
// Body: { decision: 'approve' | 'reject', editedPayload?: object, rejectionReason?: string }
// Barry's one-click decision. Approve executes the action (guardrails intact);
// reject archives it with a reason (Phase 4 learning data).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const rl = checkRateLimit(`approvals:${auth.user.id}`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Try again in a minute.' },
      { status: 429 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const decision = body.decision;
    if (decision !== 'approve' && decision !== 'reject') {
      return NextResponse.json(
        { success: false, error: "decision must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    const result = await decideApprovalRequest({
      id,
      decision,
      editedPayload: body.editedPayload,
      rejectionReason: body.rejectionReason,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      request: result.request,
      executionNote: result.executionNote,
    });
  } catch (error: any) {
    console.error('Error in POST /api/entity/approvals/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to decide approval request.' },
      { status: 500 }
    );
  }
}
