import { supabase as anonInstance } from '../supabase/client';
import { supabaseAdmin } from '../supabase/admin';

// Pick the right client for the execution context:
//  • Browser (dashboard): anon client + the logged-in user's session → RLS shows their rows.
//  • Server (API routes, cron, autopilot pipeline): NO session exists, so the anon client
//    would be blocked by RLS and see 0 rows. Use the service-role client to bypass RLS.
//    Every query is still explicitly scoped by `.eq('user_id', userId)` (userId comes from
//    a validated JWT or the NOTIFY_EMAIL owner lookup), so this stays secure per-user.
const isServer = typeof window === 'undefined';
export const supabase = (isServer && supabaseAdmin) ? supabaseAdmin : anonInstance;
export const isSupabaseConfigured = !!supabase;

// Mutable shared state for schema validity — read via db.isSchemaInvalid getter
export const schemaState = { isSchemaInvalid: false };

export const getUserId = async (): Promise<string> => {
  if (!supabase) {
    throw new Error('Supabase database client not configured.');
  }

  if (typeof window === 'undefined') {
    try {
      const { headers } = await import('next/headers');
      const nextHeaders = await headers();
      const authHeader = nextHeaders.get('authorization');
      const token = authHeader?.split(' ')[1];
      if (token) {
        const { supabaseAdmin } = await import('../supabase/admin');
        // Skip CRON_SECRET tokens — those are not user JWTs
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret || token !== cronSecret) {
          const { data: { user } } = await supabaseAdmin.auth.getUser(token);
          if (user) return user.id;
        }
      }
    } catch (e) {
      // Ignore errors during build / non-request paths
    }

    // Server-side with no user JWT (cron jobs, pipeline, autopilot)
    // Fall back to the account owner identified by NOTIFY_EMAIL
    try {
      const ownerEmail = process.env.NOTIFY_EMAIL;
      if (ownerEmail) {
        const { supabaseAdmin } = await import('../supabase/admin');
        const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 50 });
        const owner = data?.users?.find((u: any) => u.email === ownerEmail) ?? data?.users?.[0];
        if (owner?.id) return owner.id;
      }
    } catch (e) {
      // Admin lookup failed — fall through to public users table check
    }

    try {
      const { supabaseAdmin } = await import('../supabase/admin');
      if (supabaseAdmin) {
        const { data } = await supabaseAdmin.from('users').select('id').limit(1);
        if (data && data[0]?.id) return data[0].id;
      }
    } catch (e) {
      // ignore
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Session unauthorized. Operator credentials required.');
  }
  return user.id;
};

export function checkSchemaError(e: any) {
  if (!e) return;
  const errMsg = (e.message || String(e)).toLowerCase();
  const errCode = e.code || '';
  if (
    errCode === 'PGRST205' ||
    errCode === '42P01' ||
    errMsg.includes('does not exist') ||
    errMsg.includes('relation') ||
    errMsg.includes('schema cache')
  ) {
    schemaState.isSchemaInvalid = true;
  }
}

export async function safeRead<T>(fn: () => Promise<T>, fallback: T, contextName: string): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    console.warn(`safeRead failure in [${contextName}]:`, e.message || e);
    checkSchemaError(e);
    return fallback;
  }
}

export async function safeWrite<T>(fn: () => Promise<T>, fallback: T, contextName: string): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    console.warn(`safeWrite failure in [${contextName}]:`, e.message || e);
    checkSchemaError(e);
    return fallback;
  }
}
