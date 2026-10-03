import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';
import { getOwnerEmail } from '@/lib/auth/owner';
import { sendEmail } from '@/lib/email/send';

/**
 * "Send test email to myself". Takes NO recipient from the request - it can only ever
 * mail OWNER_EMAIL, and only for the signed-in owner. Never touches leads.
 */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const rl = await checkRateLimit(`email-test:${auth.user.id}`, { limit: 3, windowMs: 60_000, failClosed: true });
  if (!rl.allowed) return rateLimitResponse(rl);

  const owner = getOwnerEmail();
  if (!owner) {
    return NextResponse.json({ success: false, error: 'OWNER_EMAIL is not set. Add OWNER_EMAIL=<your email> to the environment, then retry.' }, { status: 400 });
  }
  if (auth.user.email && auth.user.email.toLowerCase() !== owner) {
    return NextResponse.json({ success: false, error: 'Only the workspace owner can send a test email.' }, { status: 403 });
  }

  const r = await sendEmail({
    to: owner,
    kind: 'test',
    subject: 'PostelOS test email',
    text: `This is a test email from your PostelOS workspace, sent ${new Date().toUTCString()}.\n\nIf you can read this, outbound email is working end to end.`,
    unsubscribe: false,
  });

  if (r.delivered) {
    return NextResponse.json({ success: true, provider: r.provider, messageId: r.messageId, to: owner, attempts: r.attempts });
  }
  return NextResponse.json(
    { success: false, blocked: r.blocked, provider: r.provider, error: r.reason || 'Send failed.', attempts: r.attempts },
    { status: r.blocked ? 409 : 502 }
  );
}
