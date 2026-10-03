import { supabaseAdmin } from '@/lib/supabase/admin';

export interface RateLimitOptions {
  limit?: number;    // max requests per window (default 20)
  windowMs?: number; // window size in ms (default 60 000)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Postgres-backed sliding-window rate limit (table: rate_limit_events,
 * migrations/2026-07-24_rate_limit_events.sql). Replaces the old in-memory
 * Map, which reset per serverless instance and was not a real limit in
 * production — every cold-started function had its own empty counter.
 *
 * Count-then-insert is not atomic, so concurrent requests can overshoot the
 * cap by a request or two. That's fine here: this is abuse/cost protection,
 * not a hard security boundary (same tolerance the daily email-send cap in
 * lib/email/send.ts already accepts).
 */
export async function checkRateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: RateLimitOptions = {}
): Promise<RateLimitResult> {
  if (!supabaseAdmin) {
    // Local dev without Supabase configured — don't block requests.
    // In production a missing service-role key means we have no counter at all,
    // so "allow" would leave every Gemini/email spender unthrottled. Fail closed.
    if (process.env.NODE_ENV === 'production') {
      console.error('[rateLimit] SUPABASE_SERVICE_ROLE_KEY missing in production — refusing request.');
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: limit };
  }

  const windowStart = new Date(Date.now() - windowMs).toISOString();

  // Opportunistic cleanup of this key's stale rows — keeps the table small
  // without a separate cron job.
  await supabaseAdmin
    .from('rate_limit_events')
    .delete()
    .eq('key', key)
    .lt('created_at', windowStart);

  const { count, error } = await supabaseAdmin
    .from('rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart);

  if (error) {
    // Fail open rather than block the whole app if the table is missing
    // (e.g. migration not yet applied) or Supabase is briefly unreachable.
    console.warn('[rateLimit] count query failed, allowing request:', error.message);
    return { allowed: true, remaining: limit };
  }

  const current = count ?? 0;
  if (current >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await supabaseAdmin.from('rate_limit_events').insert({ key });
  return { allowed: true, remaining: limit - current - 1 };
}

// Returns the IP from standard Next.js / proxy headers; falls back to 'unknown'
export function getIpKey(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
