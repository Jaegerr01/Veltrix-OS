import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getOwnerEmail } from '@/lib/auth/owner';

export interface AuthedUser {
  id: string;
  email: string | undefined;
}

export type AuthResult =
  | { user: AuthedUser; response: null }
  | { user: null; response: NextResponse };

export async function requireUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  // 1. If we have a token and Supabase is configured, verify it
  if (token && supabaseAdmin) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (user && !error) {
        // Owner allowlist: this is a single-operator system. Any other (e.g. self-registered)
        // account is a valid Supabase user but must not reach any API.
        const owner = getOwnerEmail();
        if (!owner && process.env.NODE_ENV === 'production') {
          console.error('[auth] OWNER_EMAIL is not set - refusing all requests.');
          return {
            user: null,
            response: NextResponse.json(
              { success: false, error: 'Server misconfigured: set OWNER_EMAIL to the email you sign in with.' },
              { status: 403 }
            ),
          };
        }
        if (owner && (user.email || '').toLowerCase() !== owner) {
          return {
            user: null,
            response: NextResponse.json({ success: false, error: 'This account is not authorized for this workspace.' }, { status: 403 }),
          };
        }
        return { user: { id: user.id, email: user.email }, response: null };
      }
    } catch (e) {
      console.warn('[auth] Token getUser check failed:', e);
    }
  }

  // Supabase not configured. In development that means "no backend yet" and we
  // allow through so the app stays workable offline. In production it means the
  // service-role key is missing or typo'd — and allowing through would silently
  // turn every requireUser route into an unauthenticated public endpoint acting
  // as 'local-dev'. Fail CLOSED, the same way /api/autopilot/* already does.
  if (!supabaseAdmin) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[auth] SUPABASE_SERVICE_ROLE_KEY missing in production — refusing all requests.');
      return {
        user: null,
        response: NextResponse.json(
          { success: false, error: 'Service unavailable. Please try again shortly.' },
          { status: 503 }
        ),
      };
    }
    return { user: { id: 'local-dev', email: undefined }, response: null };
  }

  // SECURITY: no owner-impersonation fallback here. A missing/invalid token
  // must always be 401 in a configured environment — a fallback that
  // guesses "the owner" for any unauthenticated request would let anyone
  // who can reach the deployment act as Barry on every requireUser route.
  return {
    user: null,
    response: NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    ),
  };
}
