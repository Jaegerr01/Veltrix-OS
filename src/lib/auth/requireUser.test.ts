import { describe, it, expect, vi } from 'vitest';

async function loadRequireUser(supabaseAdminMock: any) {
  vi.resetModules();
  vi.doMock('@/lib/supabase/admin', () => ({ supabaseAdmin: supabaseAdminMock }));
  const mod = await import('./requireUser');
  return mod.requireUser;
}

function makeRequest(token?: string) {
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return new Request('http://localhost/api/test', { headers });
}

describe('requireUser', () => {
  it('allows through as local-dev when Supabase is not configured', async () => {
    const requireUser = await loadRequireUser(null);
    const result = await requireUser(makeRequest());
    expect(result.response).toBeNull();
    expect(result.user?.id).toBe('local-dev');
  });

  it('authenticates a request with a valid bearer token', async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null });
    const requireUser = await loadRequireUser({ auth: { getUser } });
    const result = await requireUser(makeRequest('good-token'));
    expect(result.response).toBeNull();
    expect(result.user).toEqual({ id: 'u1', email: 'a@b.com' });
    expect(getUser).toHaveBeenCalledWith('good-token');
  });

  // Regression test for the removed fail-soft fallback: an invalid token
  // must return 401, never silently authenticate as the account owner.
  it('returns 401 for an invalid token without impersonating anyone', async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('bad token') });
    const listUsers = vi.fn();
    const requireUser = await loadRequireUser({ auth: { getUser, admin: { listUsers } } });
    const result = await requireUser(makeRequest('bad-token'));
    expect(result.user).toBeNull();
    expect(result.response?.status).toBe(401);
    expect(listUsers).not.toHaveBeenCalled();
  });

  it('returns 401 when no token is present, without impersonating anyone', async () => {
    const listUsers = vi.fn();
    const requireUser = await loadRequireUser({ auth: { getUser: vi.fn(), admin: { listUsers } } });
    const result = await requireUser(makeRequest());
    expect(result.user).toBeNull();
    expect(result.response?.status).toBe(401);
    expect(listUsers).not.toHaveBeenCalled();
  });
});
