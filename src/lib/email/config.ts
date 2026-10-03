/**
 * Email provider selection + guardrail configuration. Pure functions over env so the
 * status endpoint, the sender and the tests all agree on one definition of "configured".
 * Only env var NAMES are ever reported - never values.
 */
export type ProviderId = 'gmail-oauth' | 'gmail-smtp' | 'resend';

export interface ProviderStatus {
  id: ProviderId;
  label: string;
  configured: boolean;
  /** Env var names still needed for this provider. */
  missing: string[];
  warning?: string;
}

const has = (env: NodeJS.ProcessEnv, k: string) => !!(env[k] && String(env[k]).trim() && env[k] !== 'undefined');

export function listProviders(env: NodeJS.ProcessEnv = process.env): ProviderStatus[] {
  const need = (names: string[]) => names.filter(n => !has(env, n));
  const from = env.RESEND_FROM_EMAIL || '';
  const resendMissing = need(['RESEND_API_KEY']);
  let resendWarning: string | undefined;
  if (!resendMissing.length) {
    if (!has(env, 'RESEND_FROM_EMAIL') || /onboarding@resend\.dev/i.test(from)) {
      resendWarning =
        'RESEND_FROM_EMAIL is unset or the Resend sandbox sender: Resend will only deliver to your own Resend account email. Verify your domain in Resend and set RESEND_FROM_EMAIL="Name <you@your-domain>".';
    }
  }
  return [
    {
      id: 'gmail-oauth',
      label: 'Gmail (OAuth2 refresh token)',
      missing: need(['GMAIL_USER', 'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN']),
      configured: false,
    },
    {
      id: 'gmail-smtp',
      label: 'Gmail (SMTP app password)',
      missing: need(['GMAIL_USER', 'GMAIL_APP_PASSWORD']),
      configured: false,
    },
    { id: 'resend', label: 'Resend', missing: resendMissing, configured: false, warning: resendWarning },
  ].map(p => ({ ...p, configured: p.missing.length === 0 })) as ProviderStatus[];
}

export interface ProviderSelection {
  provider: ProviderId | null;
  /** Human-readable explanation when provider is null. */
  reason?: string;
  requested: string;
}

export function selectProvider(env: NodeJS.ProcessEnv = process.env): ProviderSelection {
  const requested = (env.EMAIL_PROVIDER || 'auto').trim().toLowerCase();
  const providers = listProviders(env);
  const byId = (id: ProviderId) => providers.find(p => p.id === id)!;

  const explicit: Record<string, ProviderId[]> = {
    resend: ['resend'],
    gmail: ['gmail-oauth', 'gmail-smtp'],
    'gmail-oauth': ['gmail-oauth'],
    'gmail-smtp': ['gmail-smtp'],
  };
  const candidates = explicit[requested] ?? ['gmail-oauth', 'gmail-smtp', 'resend'];
  const ok = candidates.find(id => byId(id).configured);
  if (ok) return { provider: ok, requested };

  const needed = candidates.flatMap(id => byId(id).missing);
  const names = Array.from(new Set(needed)).join(', ');
  return {
    provider: null,
    requested,
    reason: explicit[requested]
      ? `EMAIL_PROVIDER=${requested} but these env vars are missing: ${names}.`
      : `No email provider is configured. Set either (GMAIL_USER + GMAIL_APP_PASSWORD), or (GMAIL_USER + GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET + GMAIL_REFRESH_TOKEN), or (RESEND_API_KEY + RESEND_FROM_EMAIL).`,
  };
}

export interface GuardrailConfig {
  /** true = autonomous/outreach sending is switched OFF. */
  killSwitchEngaged: boolean;
  dailyCap: number;
  blacklist: string[];
}

export function guardrailConfig(env: NodeJS.ProcessEnv = process.env): GuardrailConfig {
  const sw = (env.OUTREACH_SEND_ENABLED || '').trim().toLowerCase();
  const capRaw = parseInt(env.OUTREACH_DAILY_CAP || '15', 10);
  return {
    killSwitchEngaged: ['false', '0', 'off', 'no'].includes(sw),
    dailyCap: Number.isFinite(capRaw) && capRaw >= 0 ? capRaw : 15,
    blacklist: (env.OUTREACH_BLACKLIST || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean),
  };
}

export function isBlacklisted(email: string, list: string[]): boolean {
  if (!list.length) return false;
  const needle = email.trim().toLowerCase();
  const domain = needle.split('@')[1] || '';
  return list.some(
    entry =>
      needle === entry ||
      domain === entry ||
      domain.endsWith(`.${entry}`) ||
      domain.split('.').includes(entry)
  );
}
