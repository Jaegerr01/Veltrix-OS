import { supabase as supabaseInstance } from '../supabase/client';

export const supabase = supabaseInstance;
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
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) return user.id;
      }
    } catch (e) {
      // Ignore errors during build / non-request paths
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
