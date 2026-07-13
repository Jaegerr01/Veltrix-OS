import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { getCascadeSnapshot, draftMonthlyCascade } from '@/lib/entity/cascade';

// GET /api/entity/goals — current cascade snapshot (month goal + weekly dept goals)
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  try {
    const snapshot = await getCascadeSnapshot();
    return NextResponse.json({ success: true, ...snapshot });
  } catch (error: any) {
    console.error('Error in GET /api/entity/goals:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/entity/goals — draft this month's cascade and file it for
// ratification in Barry's Approval Queue. Nothing activates until approved.
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  try {
    const { requestId, draft } = await draftMonthlyCascade();
    return NextResponse.json({ success: true, requestId, draft });
  } catch (error: any) {
    console.error('Error in POST /api/entity/goals:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
