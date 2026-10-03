import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { getEmailStatus } from '@/lib/email/status';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  try {
    return NextResponse.json({ success: true, status: await getEmailStatus() });
  } catch (e) {
    console.error('[email/status]', e);
    return NextResponse.json({ success: false, error: 'Could not read email status.' }, { status: 500 });
  }
}
