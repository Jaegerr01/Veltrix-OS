import { describe, it, expect } from 'vitest';
import { checkCronAuth, safeEqual } from './cron';

const req = (auth?: string) => new Request('http://x/api/autopilot/run', { headers: auth ? { authorization: auth } : {} });

describe('checkCronAuth', () => {
  it('production without secret fails closed (503)', () => {
    expect(checkCronAuth(req(), { NODE_ENV: 'production' } as any)).toMatchObject({ ok: false, status: 503 });
  });
  it('dev without secret is allowed', () => {
    expect(checkCronAuth(req(), { NODE_ENV: 'development' } as any)).toEqual({ ok: true });
  });
  it('wrong, empty and malformed bearers are 401; the right one passes', () => {
    const env = { CRON_SECRET: 's3cret-value', NODE_ENV: 'production' } as any;
    expect(checkCronAuth(req('Bearer nope'), env)).toMatchObject({ ok: false, status: 401 });
    expect(checkCronAuth(req('Bearer '), env)).toMatchObject({ ok: false, status: 401 });
    expect(checkCronAuth(req('s3cret-value'), env)).toMatchObject({ ok: false, status: 401 });
    expect(checkCronAuth(req(), env)).toMatchObject({ ok: false, status: 401 });
    expect(checkCronAuth(req('Bearer s3cret-value'), env)).toEqual({ ok: true });
  });
  it('safeEqual handles different lengths without throwing', () => {
    expect(safeEqual('a', 'abc')).toBe(false);
    expect(safeEqual('abc', 'abc')).toBe(true);
  });
});
