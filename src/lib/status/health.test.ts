import { describe, it, expect } from 'vitest';
import { deriveHealth, type HealthPayload, type WorkspaceProbe } from './health';

const allEnv = { GEMINI_API_KEY: true, NEXT_PUBLIC_SUPABASE_URL: true, NEXT_PUBLIC_SUPABASE_ANON_KEY: true, SUPABASE_SERVICE_ROLE_KEY: true, RESEND_API_KEY: true, RESEND_FROM_EMAIL: true, NOTIFY_EMAIL: true, CRON_SECRET: true, NEXT_PUBLIC_SITE_URL: true };
const okChecks = { supabase: { ok: true, detail: 'Connected' }, supabaseAdmin: { ok: true, detail: 'Service-role client initialized.' }, gemini: { ok: true, detail: 'GEMINI_API_KEY present.' }, resend: { ok: true, detail: 'Provider "resend" selected.' } };
const goodHealth: HealthPayload = { env: allEnv, checks: okChecks };
const goodWs: WorkspaceProbe = { ai: { configured: true, envVar: 'GEMINI_API_KEY', model: 'gemini-2.5-flash' }, email: { ready: true, provider: 'resend', problems: [] }, database: { configured: true, reachable: true } };

describe('deriveHealth never reports green on missing config', () => {
  it('is green only when every probe passes', () => {
    const v = deriveHealth(goodHealth, goodWs);
    expect(v.overall).toBe('ok');
    expect(v.headline).toBe('All systems operational');
    expect(v.cards.every(c => c.tone === 'ok')).toBe(true);
  });

  it('shows nothing green before any data arrives', () => {
    const v = deriveHealth(null, null);
    expect(v.overall).toBe('unknown');
    expect(v.headline).not.toMatch(/operational/i);
    expect(v.cards.every(c => c.tone === 'unknown')).toBe(true);
    expect(v.env.every(r => r.tone !== 'ok')).toBe(true);
  });

  it('is red and names GEMINI_API_KEY when the AI is not configured (matches the top bar flag)', () => {
    const v = deriveHealth(goodHealth, { ...goodWs, ai: { ...goodWs.ai, configured: false } });
    expect(v.overall).toBe('bad');
    expect(v.headline).not.toMatch(/operational/i);
    const ai = v.cards.find(c => c.id === 'ai')!;
    expect(ai.tone).toBe('bad');
    expect(ai.missing).toEqual(['GEMINI_API_KEY']);
    expect(v.needAttention).toContain('GEMINI_API_KEY');
  });

  it('workspace status wins over a stale health probe for the AI card', () => {
    const v = deriveHealth(goodHealth, { ...goodWs, ai: { ...goodWs.ai, configured: false } });
    expect(v.cards.find(c => c.id === 'ai')!.tone).toBe('bad');
  });

  it('is red with exact variable names when no email provider exists', () => {
    const health: HealthPayload = { env: { ...allEnv, RESEND_API_KEY: false, RESEND_FROM_EMAIL: false }, checks: { ...okChecks, resend: { ok: false, detail: 'No email provider configured.' } } };
    const v = deriveHealth(health, { ...goodWs, email: { ready: false, provider: null, problems: ['No email provider is configured.'] } });
    const email = v.cards.find(c => c.id === 'email')!;
    expect(email.tone).toBe('bad');
    expect(email.missing).toEqual(['RESEND_API_KEY', 'RESEND_FROM_EMAIL']);
    expect(v.overall).toBe('bad');
  });

  it('is amber when a provider exists but the send kill switch is off', () => {
    const v = deriveHealth(goodHealth, { ...goodWs, email: { ready: false, provider: 'resend', problems: ['Sending is switched off (OUTREACH_SEND_ENABLED=false).'] } });
    const email = v.cards.find(c => c.id === 'email')!;
    expect(email.tone).toBe('warn');
    expect(email.detail).toMatch(/OUTREACH_SEND_ENABLED/);
    expect(v.overall).toBe('warn');
    expect(v.headline).not.toMatch(/operational/i);
  });

  it('is red when the database is unreachable or the service role is missing', () => {
    const v = deriveHealth({ env: { ...allEnv, SUPABASE_SERVICE_ROLE_KEY: false }, checks: { ...okChecks, supabase: { ok: false, detail: 'Connection error' }, supabaseAdmin: { ok: false, detail: 'SUPABASE_SERVICE_ROLE_KEY missing' } } }, goodWs);
    expect(v.cards.find(c => c.id === 'database')!.tone).toBe('bad');
    expect(v.cards.find(c => c.id === 'writes')!.missing).toEqual(['SUPABASE_SERVICE_ROLE_KEY']);
    expect(v.overall).toBe('bad');
  });

  it('marks missing required env vars red and counts only the ones that are set', () => {
    const v = deriveHealth({ env: { ...allEnv, GEMINI_API_KEY: false, CRON_SECRET: false }, checks: okChecks }, goodWs);
    expect(v.env.find(r => r.name === 'GEMINI_API_KEY')!.tone).toBe('bad');
    expect(v.env.find(r => r.name === 'CRON_SECRET')!.tone).not.toBe('ok');
    expect(v.envSetCount).toBe(7);
  });
});
