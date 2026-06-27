interface WindowEntry {
  timestamps: number[];
}

// In-memory store — keyed by userId or IP
const store = new Map<string, WindowEntry>();

export interface RateLimitOptions {
  limit?: number;    // max requests per window (default 20)
  windowMs?: number; // window size in ms (default 60 000)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export function checkRateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: RateLimitOptions = {}
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };

  // Evict timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= limit) {
    store.set(key, entry);
    return { allowed: false, remaining: 0 };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { allowed: true, remaining: limit - entry.timestamps.length };
}

// Returns the IP from standard Next.js / proxy headers; falls back to 'unknown'
export function getIpKey(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
