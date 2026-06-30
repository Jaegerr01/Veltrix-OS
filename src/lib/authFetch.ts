import { supabase } from './supabase/client';

// Wraps fetch() and automatically attaches the current user's Supabase JWT
// as an Authorization: Bearer header. Use for all /api/ calls from the frontend.
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  let token: string | null = null;

  try {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token ?? null;
    }
  } catch {
    // No session — proceed without token (server will return 401 if required)
  }

  const headers = new Headers(init.headers);
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
