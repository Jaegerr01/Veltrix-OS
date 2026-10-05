import { defineConfig } from '@playwright/test';
import { mockEnv } from './env.mjs';

const PORT = Number(process.env.E2E_PORT || 3100);

/**
 * E2E runs against a production build (`next build` with the same mock env) served by `next start`,
 * with an in-memory Supabase mock. No real service is reachable and nothing can be sent.
 * Local Windows: set PW_CHANNEL=chrome to reuse installed Chrome instead of `playwright install`.
 */
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: process.env.PW_CHANNEL || undefined,
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  webServer: [
    { command: 'node e2e/mock-supabase.mjs', port: 54399, reuseExistingServer: true, env: { MOCK_SEED: '1' } },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://127.0.0.1:${PORT}/privacy`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: { ...mockEnv },
    },
  ],
});
