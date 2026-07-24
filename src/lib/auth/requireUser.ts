import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
        return { user: { id: user.id, email: user.email }, response: null };
      }
    } catch (e) {
      console.warn('[auth] Token getUser check failed:', e);
    }
  }

  // Supabase not configured — dev/local environment, allow through
  if (!supabaseAdmin) {
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
