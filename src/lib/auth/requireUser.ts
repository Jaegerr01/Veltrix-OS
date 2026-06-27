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

  if (!token) {
    return {
      user: null,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  // Supabase not configured — dev/local environment, allow through
  if (!supabaseAdmin) {
    return { user: { id: 'local-dev', email: undefined }, response: null };
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  return { user: { id: user.id, email: user.email }, response: null };
}
