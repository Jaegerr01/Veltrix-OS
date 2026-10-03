// Throwaway environment for e2e/QA runs: mock Supabase on :54399, every real-service secret blanked.
// The app treats the literal string 'undefined' as "unset" (see lib/email/config.ts, lib/ai/gemini.ts), and on
// Windows an empty env var is deleted, which would let a developer's .env.local leak in - hence the sentinel.
const U = 'undefined';
export const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54399',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'mock-service',
  OWNER_EMAIL: 'qa-owner@example.com',
  NEXT_PUBLIC_ENABLE_DEMO_DATA: 'false',
  OUTREACH_SEND_ENABLED: 'false',
  ...Object.fromEntries([
    'GEMINI_API_KEY', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'GMAIL_APP_PASSWORD', 'GMAIL_USER', 'GMAIL_FROM_NAME',
    'NOTIFY_EMAIL', 'CRON_SECRET', 'GITHUB_TOKEN', 'VOICEBOX_URL', 'VOICEBOX_PROFILE_ID', 'SCRAPER_SCRIPT', 'SCRAPER_PYTHON',
    'ELEVENLABS_API_KEY', 'EMAIL_PROVIDER', 'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN',
  ].map(k => [k, U])),
};
