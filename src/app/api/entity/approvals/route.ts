import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/requireUser';

// GET /api/entity/approvals?status=pending
// Lists approval requests for the signed-in operator (Barry's queue).
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const requests = await db.getApprovalRequests(status);
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('Error in GET /api/entity/approvals:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load approval requests.' },
      { status: 500 }
    );
  }
}
