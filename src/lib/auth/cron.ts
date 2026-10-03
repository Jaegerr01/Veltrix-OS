import { createHash, timingSafeEqual } from 'crypto';

/** Constant-time string comparison (hashes both sides so lengths never leak). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export type CronCheck = { ok: true } | { ok: false; status: number; error: string };

/**
 * Cron/autopilot gate. Production without CRON_SECRET => 503 (fail closed); a wrong/missing bearer => 401.
 * Local dev without a secret is allowed so `npm run dev` keeps working.
 */
export function checkCronAuth(req: Request, env: NodeJS.ProcessEnv = process.env): CronCheck {
  const secret = env.CRON_SECRET;
  if (!secret) {
    if (env.NODE_ENV === 'production') return { ok: false, status: 503, error: 'CRON_SECRET not configured' };
    return { ok: true };
  }
  const header = req.headers.get('authorization') || '';
  const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!presented || !safeEqual(presented, secret)) return { ok: false, status: 401, error: 'Unauthorized' };
  return { ok: true };
}
