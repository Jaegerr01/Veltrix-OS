import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface RateLimitOptions {
  limit?: number;    // max requests per window (default 20)
  windowMs?: number; // window size in ms (default 60 000)
  /**
   * What to do when the limiter itself is broken (table missing, DB down).
   * true  (default) = refuse the request: send / AI routes spend money or reputation.
   * false = allow it (only for cheap read-only routes).
   */
  failClosed?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** true when the request was refused because the limiter is unavailable, not because the caller was too fast. */
  unavailable?: boolean;
}

/** Standard 429 / 503 response for a refused request. */
export function rateLimitResponse(rl: RateLimitResult) {
  if (rl.unavailable) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limiter unavailable, so this request was refused for safety. Apply migrations/2026-10-02_002_core_tables.sql in Supabase (creates rate_limit_events) and check SUPABASE_SERVICE_ROLE_KEY.',
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });
}

/**
 * Postgres-backed sliding-window rate limit (table: rate_limit_events,
 * migrations/2026-10-02_002_core_tables.sql). Replaces the old in-memory
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
  { limit = 20, windowMs = 60_000, failClosed = true }: RateLimitOptions = {}
): Promise<RateLimitResult> {
  if (!supabaseAdmin) {
    // Local dev without Supabase configured — don't block requests.
    // In production a missing service-role key means we have no counter at all,
    // so "allow" would leave every Gemini/email spender unthrottled. Fail closed.
    if (process.env.NODE_ENV === 'production') {
      console.error('[rateLimit] SUPABASE_SERVICE_ROLE_KEY missing in production — refusing request.');
      return { allowed: false, remaining: 0, unavailable: true };
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
    // Limiter broken (table missing / Supabase unreachable). Fail CLOSED by default so a
    // send / AI route can never run unthrottled; routes that opt out get fail-open.
    console.warn('[rateLimit] count query failed:', error.message, failClosed ? '(refusing request)' : '(allowing request)');
    return failClosed ? { allowed: false, remaining: 0, unavailable: true } : { allowed: true, remaining: limit };
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
