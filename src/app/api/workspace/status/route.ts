import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { getWorkspaceStatus } from '@/lib/status/workspace';

export const dynamic = 'force-dynamic';

/** Real workspace status for the shell, dashboard, onboarding checklist and Settings health panel. Names only - never secret values. */
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  try {
    return NextResponse.json({ success: true, status: await getWorkspaceStatus(auth.user.id) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[workspace/status]', e);
    return NextResponse.json({ success: false, error: 'Could not read workspace status.' }, { status: 500 });
  }
}
