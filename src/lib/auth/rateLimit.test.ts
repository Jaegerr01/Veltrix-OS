import { describe, it, expect, vi } from 'vitest';

interface FakeEvent {
  key: string;
  created_at: string;
}

function makeFakeAdmin(seed: FakeEvent[] = []) {
  const events: FakeEvent[] = [...seed];
  const client = {
    from: () => ({
      delete: () => ({
        eq: (_c: string, key: string) => ({
          lt: (_c2: string, before: string) => {
            for (let i = events.length - 1; i >= 0; i--) {
              if (events[i].key === key && events[i].created_at < before) events.splice(i, 1);
            }
            return Promise.resolve({ error: null });
          },
        }),
      }),
      select: () => ({
        eq: (_c: string, key: string) => ({
          gte: (_c2: string, since: string) => {
            const count = events.filter((e) => e.key === key && e.created_at >= since).length;
            return Promise.resolve({ count, error: null });
          },
        }),
      }),
      insert: (row: { key: string }) => {
        events.push({ key: row.key, created_at: new Date().toISOString() });
        return Promise.resolve({ error: null });
      },
    }),
  };
  return { client, events };
}

async function loadRateLimit(supabaseAdminMock: any) {
  vi.resetModules();
  vi.doMock('@/lib/supabase/admin', () => ({ supabaseAdmin: supabaseAdminMock }));
  const mod = await import('./rateLimit');
  return mod.checkRateLimit;
}

describe('checkRateLimit', () => {
  it('allows requests under the limit and counts remaining down', async () => {
    const fake = makeFakeAdmin();
    const checkRateLimit = await loadRateLimit(fake.client);
    expect(await checkRateLimit('user:1', { limit: 3, windowMs: 60_000 })).toEqual({ allowed: true, remaining: 2 });
    expect(await checkRateLimit('user:1', { limit: 3, windowMs: 60_000 })).toEqual({ allowed: true, remaining: 1 });
  });

  it('blocks once the limit is reached', async () => {
    const fake = makeFakeAdmin();
    const checkRateLimit = await loadRateLimit(fake.client);
    await checkRateLimit('user:2', { limit: 2, windowMs: 60_000 });
    await checkRateLimit('user:2', { limit: 2, windowMs: 60_000 });
    expect(await checkRateLimit('user:2', { limit: 2, windowMs: 60_000 })).toEqual({ allowed: false, remaining: 0 });
  });

  it('tracks each key independently', async () => {
    const fake = makeFakeAdmin();
    const checkRateLimit = await loadRateLimit(fake.client);
    await checkRateLimit('user:a', { limit: 1, windowMs: 60_000 });
    const r = await checkRateLimit('user:b', { limit: 1, windowMs: 60_000 });
    expect(r.allowed).toBe(true);
  });

  it('evicts events outside the window before counting', async () => {
    const stale = new Date(Date.now() - 120_000).toISOString();
    const fake = makeFakeAdmin([{ key: 'user:c', created_at: stale }]);
    const checkRateLimit = await loadRateLimit(fake.client);
    const r = await checkRateLimit('user:c', { limit: 1, windowMs: 60_000 });
    expect(r.allowed).toBe(true);
    expect(fake.events.some((e) => e.created_at === stale)).toBe(false);
  });

  it('allows requests when Supabase is not configured (local dev)', async () => {
    const checkRateLimit = await loadRateLimit(null);
    const r = await checkRateLimit('user:d', { limit: 5 });
    expect(r.allowed).toBe(true);
  });

  // Without the counter table there is no limit at all, so allowing through in
  // production would leave every Gemini/email spender unthrottled.
  it('blocks requests when Supabase is not configured in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      const checkRateLimit = await loadRateLimit(null);
      const r = await checkRateLimit('user:d', { limit: 5 });
      expect(r.allowed).toBe(false);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('fails CLOSED by default if the count query errors (send/AI routes)', async () => {
    const client = {
      from: () => ({
        delete: () => ({ eq: () => ({ lt: () => Promise.resolve({ error: null }) }) }),
        select: () => ({ eq: () => ({ gte: () => Promise.resolve({ count: null, error: new Error('table missing') }) }) }),
        insert: () => Promise.resolve({ error: null }),
      }),
    };
    const checkRateLimit = await loadRateLimit(client);
    const r = await checkRateLimit('user:e', { limit: 1 });
    expect(r.allowed).toBe(false);
    expect(r.unavailable).toBe(true);
  });

  it('fails open on a limiter error only when a route opts out (failClosed:false)', async () => {
    const client = {
      from: () => ({
        delete: () => ({ eq: () => ({ lt: () => Promise.resolve({ error: null }) }) }),
        select: () => ({ eq: () => ({ gte: () => Promise.resolve({ count: null, error: new Error('table missing') }) }) }),
        insert: () => Promise.resolve({ error: null }),
      }),
    };
    const checkRateLimit = await loadRateLimit(client);
    const r = await checkRateLimit('user:e', { limit: 1, failClosed: false });
    expect(r.allowed).toBe(true);
  });
});
