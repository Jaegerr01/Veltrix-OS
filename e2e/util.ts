import type { Page } from '@playwright/test';
import { session } from './helpers';

const MOCK = 'http://127.0.0.1:54399';

/** Read rows straight from the in-memory mock database (never a real service). */
export async function rows(table: string, query = 'select=*'): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${MOCK}/rest/v1/${table}?${query}`, { headers: { apikey: 'mock', Authorization: `Bearer ${session.access_token}` } });
  return res.json();
}

/** Call an authenticated app API from inside the signed-in page. */
export async function apiGet(page: Page, path: string) {
  return page.evaluate(async ([p, token]) => {
    const r = await fetch(p, { headers: { Authorization: `Bearer ${token}` } });
    return { status: r.status, text: await r.text(), headers: Object.fromEntries(r.headers.entries()) };
  }, [path, session.access_token] as const);
}

export const VIEWPORTS = [360, 390, 768, 1024, 1440, 1920] as const;
