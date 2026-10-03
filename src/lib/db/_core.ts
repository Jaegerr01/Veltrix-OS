import { supabase as anonInstance } from '../supabase/client';
import { supabaseAdmin } from '../supabase/admin';
import { asErr } from '@/lib/errors';

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
        const { safeEqual } = await import('../auth/cron');
        if (!cronSecret || !safeEqual(token, cronSecret)) {
          const { data: { user } } = await supabaseAdmin.auth.getUser(token);
          if (user) return user.id;
        }
      }
    } catch {
      // Ignore errors during build / non-request paths
    }

    // Server-side with no user JWT (cron jobs, pipeline, autopilot):
    // act as the account owner identified by OWNER_EMAIL (or legacy NOTIFY_EMAIL).
    // We NEVER fall back to "the first user in the table" - with more than one account
    // that would silently read/write another person's data.
    const ownerEmail = (process.env.OWNER_EMAIL || process.env.NOTIFY_EMAIL || '').trim().toLowerCase();
    if (ownerEmail) {
      try {
        const { supabaseAdmin } = await import('../supabase/admin');
        const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
        const owner = data?.users?.find((u: { email?: string }) => (u.email || '').toLowerCase() === ownerEmail);
        if (owner?.id) return owner.id;
      } catch {
        // Admin lookup failed - fall through to the explicit error below
      }
    }
    throw new Error('Cannot determine the owner account: set OWNER_EMAIL to the email you sign in with.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Session unauthorized. Operator credentials required.');
  }
  return user.id;
};

/** True when a PostgREST/Postgres error says one of `cols` does not exist (migration not applied yet). */
/** A raw PostgREST row: the Supabase client is untyped in this repo (no generated Database type), so rows are narrowed in each mapper. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbRow = Record<string, any>;

export function isMissingColumnError(eIn: unknown, cols: string[]): boolean {
  if (!eIn) return false;
  const e = asErr(eIn);
  const msg = `${e.message || ''} ${e.details || ''} ${e.hint || ''}`;
  const looksMissing = e.code === 'PGRST204' || e.code === '42703' || /column|schema cache/i.test(msg);
  return looksMissing && cols.some(c => msg.includes(c));
}

/**
 * Run a write with `payload`; if it fails only because optional (not-yet-migrated) columns are
 * missing, retry once without them. Lets the app keep working before Barry applies the
 * send-state migration, without ever hiding other errors.
 */
export async function withOptionalColumns<R extends { data: unknown; error: unknown }>(
  payload: Record<string, unknown>,
  optional: string[],
  run: (p: Record<string, unknown>) => PromiseLike<R>
): Promise<R> {
  const first = await run(payload);
  if (!first.error || !isMissingColumnError(first.error, optional)) return first;
  console.warn('[db] optional columns missing (' + optional.join(',') + ') - apply migrations/2026-10-02_001_send_state.sql');
  const stripped: Record<string, unknown> = { ...payload };
  for (const c of optional) delete stripped[c];
  return run(stripped);
}

/**
 * Hard invariant: nothing may be written as 'Sent' without proof of delivery.
 * The only legitimate writers are lib/email/delivery.ts (provider message id) and the
 * owner-attested manual channel (provider='manual').
 */
export function assertTruthfulSent(table: string, updates: { status?: string | null; provider_message_id?: string | null }) {
  if (updates.status === 'Sent' && !updates.provider_message_id) {
    throw new Error(`Refusing to mark ${table} as Sent without a provider_message_id (no confirmed delivery).`);
  }
}

export function checkSchemaError(eIn: unknown) {
  if (!eIn) return;
  const e = asErr(eIn);
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
  } catch (eRaw: unknown) { const e = asErr(eRaw);
    console.warn(`safeRead failure in [${contextName}]:`, e.message || e);
    checkSchemaError(e);
    return fallback;
  }
}

/**
 * Thrown when a write could not be persisted. `message` is safe to show a user;
 * the underlying driver error is kept on `cause` for server logs only, so raw
 * Postgres/PostgREST text never reaches the client.
 */
export class DbWriteError extends Error {
  readonly context: string;

  constructor(context: string, cause?: unknown) {
    super("We couldn't save that. Please try again.");
    this.name = 'DbWriteError';
    this.context = context;
    this.cause = cause;
  }
}

/**
 * Writes must never pretend to succeed.
 *
 * This used to swallow the error and return a caller-supplied fallback object
 * with a synthetic `mock-…` id, so a failed insert looked identical to a real
 * one: the route replied 200 and the user watched their data disappear on the
 * next refresh. A write either persists or it throws.
 *
 * Callers already sit inside a try/catch (API routes and page submit handlers),
 * so throwing surfaces a real error state instead of silent data loss.
 */
export async function safeWrite<T>(fn: () => Promise<T>, contextName: string): Promise<T> {
  try {
    return await fn();
  } catch (eRaw: unknown) { const e = asErr(eRaw);
    console.error(`safeWrite failure in [${contextName}]:`, e?.message || e);
    checkSchemaError(e);
    throw new DbWriteError(contextName, e);
  }
}
