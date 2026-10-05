/**
 * Pure derivation of the System Status view from REAL probe results.
 * Inputs are the operator-only /api/health payload (env presence map + live checks) and the shared
 * /api/workspace/status (the same source the top bar, sidebar, dashboard and setup checklist use).
 * Nothing here is hardcoded green: with no data a card is "unknown", and any missing config is amber/red.
 */

export type Tone = 'ok' | 'warn' | 'bad' | 'unknown';

export interface HealthCheck { ok: boolean; detail: string }
export interface HealthPayload { ready?: boolean; summary?: string; env: Record<string, boolean>; checks: Record<string, HealthCheck> }
export interface WorkspaceProbe {
  ai: { configured: boolean; envVar: string; model: string };
  email: { ready: boolean; provider: string | null; problems: string[] };
  database: { configured: boolean; reachable: boolean };
}

export interface HealthCard { id: 'database' | 'writes' | 'ai' | 'email'; name: string; tone: Tone; label: string; detail: string; missing: string[] }
export interface EnvRow { name: string; tone: Tone; label: string }
export interface HealthView {
  overall: Tone;
  headline: string;
  detail: string;
  cards: HealthCard[];
  env: EnvRow[];
  envSetCount: number;
  needAttention: string[];
}

/** Variables the app cannot run without. Email variables are judged by the email probe instead (several providers exist). */
export const REQUIRED_ENV = ['GEMINI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
export const ENV_ORDER = [
  'GEMINI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'NOTIFY_EMAIL', 'CRON_SECRET', 'NEXT_PUBLIC_SITE_URL',
] as const;
const EMAIL_ENV = ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'];

const rank: Record<Tone, number> = { ok: 0, unknown: 1, warn: 2, bad: 3 };
const worst = (tones: Tone[]): Tone => tones.reduce<Tone>((a, t) => (rank[t] > rank[a] ? t : a), 'ok');

export function deriveHealth(health: HealthPayload | null, ws: WorkspaceProbe | null): HealthView {
  const env = health?.env ?? {};
  const missingOf = (names: readonly string[]) => (health ? names.filter(n => !env[n]) : []);
  const unknownCard = (id: HealthCard['id'], name: string): HealthCard => ({ id, name, tone: 'unknown', label: 'Checking...', detail: 'Waiting for the server to report.', missing: [] });

  const fromCheck = (id: HealthCard['id'], name: string, key: string, envNames: string[]): HealthCard => {
    const c = health?.checks?.[key];
    if (!c) return unknownCard(id, name);
    return { id, name, tone: c.ok ? 'ok' : 'bad', label: c.ok ? 'Connected' : 'Needs attention', detail: c.detail, missing: missingOf(envNames) };
  };

  const database = fromCheck('database', 'Database (Supabase)', 'supabase', ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']);
  if (database.tone === 'ok' && ws && !ws.database.reachable) { database.tone = 'bad'; database.label = 'Needs attention'; database.detail = 'The workspace status probe could not reach the database.'; }
  const writes = fromCheck('writes', 'Server writes (service role)', 'supabaseAdmin', ['SUPABASE_SERVICE_ROLE_KEY']);

  // AI: configured only if BOTH the health probe and the shared workspace status agree - the same flag the top bar shows.
  let ai = fromCheck('ai', 'Agent brains (Gemini)', 'gemini', ['GEMINI_API_KEY']);
  if (ws && !ws.ai.configured) {
    ai = { id: 'ai', name: ai.name, tone: 'bad', label: 'Not connected', detail: `${ws.ai.envVar} is not set on the server - the CEO agent and ARIA cannot think without it.`, missing: [ws.ai.envVar] };
  } else if (!health && ws && ws.ai.configured) {
    ai = { id: 'ai', name: ai.name, tone: 'ok', label: 'Key present', detail: `${ws.ai.envVar} is set (model ${ws.ai.model}).`, missing: [] };
  }

  // Email: no provider = red; provider but not ready (send switch off, cap, owner email) = amber with the exact reasons.
  let email = unknownCard('email', 'Email delivery');
  if (ws) {
    if (ws.email.ready) email = { id: 'email', name: email.name, tone: 'ok', label: 'Ready', detail: `Sending through ${ws.email.provider}.`, missing: [] };
    else if (!ws.email.provider) email = { id: 'email', name: email.name, tone: 'bad', label: 'Not configured', detail: ws.email.problems[0] || 'No email provider is configured.', missing: missingOf(EMAIL_ENV) };
    else email = { id: 'email', name: email.name, tone: 'warn', label: 'Not ready to send', detail: ws.email.problems.join(' ') || 'The provider is configured but sending is not enabled.', missing: [] };
  } else if (health?.checks?.resend) {
    const c = health.checks.resend;
    email = { id: 'email', name: email.name, tone: c.ok ? 'warn' : 'bad', label: c.ok ? 'Provider selected' : 'Not configured', detail: c.detail, missing: c.ok ? [] : missingOf(EMAIL_ENV) };
  }

  const cards = [database, writes, ai, email];
  const overall = worst(cards.map(c => c.tone));
  const bad = cards.filter(c => c.tone === 'bad');
  const warn = cards.filter(c => c.tone === 'warn');
  const needAttention = Array.from(new Set(cards.flatMap(c => (c.tone === 'bad' ? c.missing : []))));

  const headline = overall === 'ok' ? 'All systems operational'
    : overall === 'unknown' ? 'Checking systems...'
    : overall === 'bad' ? `${bad.length} system${bad.length === 1 ? '' : 's'} need${bad.length === 1 ? 's' : ''} attention`
    : 'Working, with warnings';
  const detail = overall === 'ok' ? 'Every probe passed: database, server writes, AI key and email sending.'
    : overall === 'unknown' ? 'Waiting for the server to report real status.'
    : overall === 'bad' ? `Not yet autonomous. ${needAttention.length ? 'Missing: ' + needAttention.join(', ') + '. ' : ''}Fix the red items below.`
    : `${warn.map(c => c.name).join(', ')}: ${warn.map(c => c.detail).join(' ')}`;

  const emailOk = ws?.email.ready === true;
  const rows: EnvRow[] = ENV_ORDER.map(name => {
    if (!health) return { name, tone: 'unknown', label: 'Checking...' };
    if (env[name]) return { name, tone: 'ok', label: 'Set' };
    if ((REQUIRED_ENV as readonly string[]).includes(name)) return { name, tone: 'bad', label: 'Missing (required)' };
    if (EMAIL_ENV.includes(name)) return emailOk ? { name, tone: 'unknown', label: 'Not set (another provider is used)' } : { name, tone: 'warn', label: 'Not set' };
    return { name, tone: 'unknown', label: 'Not set (optional)' };
  });
  return { overall, headline, detail, cards, env: rows, envSetCount: health ? ENV_ORDER.filter(n => env[n]).length : 0, needAttention };
}
