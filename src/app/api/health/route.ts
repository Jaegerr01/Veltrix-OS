import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { geminiConfigured } from '@/lib/ai/gemini';
import { listProviders, selectProvider } from '@/lib/email/config';
import { requireUser } from '@/lib/auth/requireUser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PostelOS — System Health / Diagnostics
 *
 * Hit /api/health to see, at a glance, which integrations are wired up and which
 * are missing. NEVER returns secret values — only whether each key is present and
 * whether each live connection works. Add ?deep=1 to also make a real (quota-using)
 * Gemini call to confirm the key is valid.
 *
 * Three tiers, by design:
 *   • anonymous       → liveness only ({ service, ready }). Safe for uptime monitors.
 *   • authenticated   → the full env presence map and per-check detail.
 *   • authenticated
 *     + ?deep=1       → additionally burns a real Gemini call.
 *
 * The env map and check details name every integration the deployment does and
 * does not have, which is a useful reconnaissance list — so they are not public.
 */

type Check = {
  ok: boolean;
  detail: string;
};

function envPresent(name: string): boolean {
  const v = process.env[name];
  return !!v && v !== 'undefined' && v.trim() !== '';
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const deep = url.searchParams.get('deep') === '1';

  // SECURITY: detail is operator-only. ?deep=1 additionally burns a real Gemini
  // call, so it must never be reachable unauthenticated. An anonymous caller
  // gets liveness only.
  const auth = await requireUser(req);
  const isOperator = !auth.response;

  if (deep && !isOperator) return auth.response!;

  const checks: Record<string, Check> = {};

  // ── Environment variables (presence only — never the value) ────────────────
  const envVars = [
    'GEMINI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'NOTIFY_EMAIL',
    'CRON_SECRET',
    'NEXT_PUBLIC_SITE_URL',
  ];
  const env: Record<string, boolean> = {};
  for (const name of envVars) env[name] = envPresent(name);

  // ── Supabase: can we actually reach the database? ──────────────────────────
  if (!supabase) {
    checks.supabase = {
      ok: false,
      detail: 'Supabase client not initialized — NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.',
    };
  } else {
    try {
      const { error } = await supabase.from('leads').select('id').limit(1);
      checks.supabase = error
        ? { ok: false, detail: `Connected, but query failed: ${error.message}. (Have you run supabase_schema.sql?)` }
        : { ok: true, detail: 'Connected and the leads table is reachable.' };
    } catch (e: any) {
      checks.supabase = { ok: false, detail: `Connection error: ${e?.message || e}` };
    }
  }

  // ── Supabase admin (service role) — needed for server-side writes ──────────
  checks.supabaseAdmin = supabaseAdmin
    ? { ok: true, detail: 'Service-role client initialized.' }
    : { ok: false, detail: 'SUPABASE_SERVICE_ROLE_KEY missing — server-side agent writes will fail.' };

  // ── Gemini (the agents' brains) ────────────────────────────────────────────
  if (!geminiConfigured()) {
    checks.gemini = { ok: false, detail: 'GEMINI_API_KEY missing — every agent will fail at stage 1 and the pipeline stalls.' };
  } else if (deep) {
    try {
      const { gemini } = await import('@/lib/ai/gemini');
      const reply = await gemini.callRawLLM('Reply with the single word: OK', 'You are a health check. Reply with one word.');
      checks.gemini = { ok: !!reply, detail: `Key valid — live model responded ("${reply.trim().slice(0, 20)}").` };
    } catch (e: any) {
      checks.gemini = { ok: false, detail: `Key present but live call failed: ${e?.message || e}` };
    }
  } else {
    checks.gemini = { ok: true, detail: 'GEMINI_API_KEY present. Add ?deep=1 to confirm it is valid with a live call.' };
  }

  // ── Resend (real email sending) ────────────────────────────────────────────
  const providerSel = selectProvider();
  const providerInfo = listProviders().find(p => p.id === providerSel.provider);
  if (!providerSel.provider) {
    checks.resend = { ok: false, detail: providerSel.reason || 'No email provider configured. Open Settings -> Email for the exact missing variable names.' };
  } else {
    checks.resend = { ok: !providerInfo?.warning, detail: `Provider "${providerSel.provider}" selected.${providerInfo?.warning ? ' Warning: ' + providerInfo.warning : ''} Configured does not prove deliverability - use Settings -> Email -> "Send test email to myself".` };
  }

  // ── Roll-up ────────────────────────────────────────────────────────────────
  const critical = ['supabase', 'gemini', 'resend'];
  const missing = critical.filter((k) => !checks[k]?.ok);
  const ready = missing.length === 0;
  const status = ready ? 200 : 503;

  // Anonymous callers (uptime monitors) get liveness only — no env map, no
  // per-integration detail, no raw driver error text.
  if (!isOperator) {
    return NextResponse.json(
      { service: 'PostelOS', ready, checkedAt: new Date().toISOString() },
      { status }
    );
  }

  return NextResponse.json(
    {
      service: 'PostelOS',
      ready,
      summary: ready
        ? 'All critical systems are live. The autonomous pipeline can run end-to-end.'
        : `Not yet autonomous. Blocking: ${missing.join(', ')}. Set the missing keys in Netlify → Site settings → Environment variables, then redeploy.`,
      env,
      checks,
      checkedAt: new Date().toISOString(),
    },
    { status }
  );
}
