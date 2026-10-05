import type { Page } from '@playwright/test';

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
export const UID = '00000000-0000-0000-0000-000000000001';
const jwt = [b64({ alg: 'none', typ: 'JWT' }), b64({ sub: UID, role: 'authenticated', exp: 4102444800 }), 'x'].join('.');
export const session = {
  access_token: jwt, refresh_token: 'mock', token_type: 'bearer', expires_in: 3.15e7, expires_at: 4102444800,
  user: { id: UID, aud: 'authenticated', role: 'authenticated', email: 'qa-owner@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
};

/** Pre-seed the Supabase session the client SDK reads from localStorage (key = sb-<host first label>-auth-token). */
export async function signIn(page: Page) {
  await page.addInitScript((s) => localStorage.setItem('sb-127-auth-token', JSON.stringify(s)), session);
}

/** Reset the in-memory mock database (seed=true loads QA fixture rows). */
export async function resetMock(seed = true) {
  await fetch('http://127.0.0.1:54399/__reset', { method: 'POST', body: JSON.stringify({ seed }) });
}

export async function mockState(): Promise<Record<string, number>> {
  return (await fetch('http://127.0.0.1:54399/__state')).json();
}
