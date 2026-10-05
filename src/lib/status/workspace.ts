import { supabaseAdmin } from '../supabase/admin';
import { getCeoStatus, type CeoStatus } from '../orchestrator/status';
import { geminiConfigured } from '../ai/gemini';
import { asErr } from '../errors';

export interface OnboardingStep {
  id: 'database' | 'owner' | 'ai' | 'email' | 'profile' | 'offer' | 'leads' | 'mission';
  title: string;
  done: boolean;
  /** Plain-language detail: what is done, or exactly what is missing. */
  detail: string;
  /** Env var NAMES that must be set (never values). */
  envVars?: string[];
  /** Where in the app to fix it. */
  href: string;
  cta: string;
}

export interface WorkspaceStatus {
  generatedAt: string;
  database: { configured: boolean; reachable: boolean };
  ai: CeoStatus['ai'];
  email: CeoStatus['email'];
  tasks: CeoStatus['tasks'];
  approvalsPending: number;
  outreach: { drafts: number; approved: number; sent: number; failed: number };
  counts: { leads: number; offers: number };
  onboarding: { steps: OnboardingStep[]; done: number; total: number; complete: boolean };
}

const DEFAULT_PROFILE_NAME = 'PostelOS Operator';

async function count(table: string, userId: string, status?: string): Promise<number | null> {
  if (!supabaseAdmin) return null;
  try {
    const base = supabaseAdmin.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: c, error } = await (status ? base.eq('status', status) : base);
    if (error) return null;
    return c ?? 0;
  } catch { return null; }
}

/** Everything the shell, dashboard, onboarding checklist and Settings health panel need - read from real state only. */
export async function getWorkspaceStatus(userId: string): Promise<WorkspaceStatus> {
  const envOk = (n: string) => !!process.env[n] && process.env[n] !== 'undefined' && process.env[n]!.trim() !== '';
  const dbConfigured = !!supabaseAdmin && envOk('NEXT_PUBLIC_SUPABASE_URL');
  let ceo: CeoStatus;
  try { ceo = await getCeoStatus(); } catch (e) {
    console.warn('[workspace/status] ceo status failed:', asErr(e).message);
    ceo = {
      ai: { configured: geminiConfigured(), envVar: 'GEMINI_API_KEY', model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' },
      tasks: { queued: 0, running: 0, done: 0, failed: 0, blocked: 0, needsApproval: 0, total: 0 },
      approvalsPending: 0,
      email: { ready: false, sentToday: 0, cap: 0, provider: null, problems: ['Status unavailable.'] },
      spoken: '',
    };
  }

  const [leads, offers, drafts, approved, sent, failed] = await Promise.all([
    count('leads', userId),
    count('offers', userId),
    count('outreach_messages', userId, 'Draft'),
    count('outreach_messages', userId, 'Approved'),
    count('outreach_messages', userId, 'Sent'),
    count('outreach_messages', userId, 'Failed'),
  ]);
  const reachable = leads !== null;

  let profileDone = false;
  if (supabaseAdmin) {
    try {
      const { data } = await supabaseAdmin.from('profiles').select('business_name').eq('id', userId).maybeSingle();
      profileDone = !!data?.business_name && data.business_name !== DEFAULT_PROFILE_NAME;
    } catch { /* leaves profileDone false */ }
  }

  const emailMissing = ceo.email.problems.length ? ceo.email.problems[0] : 'Email provider not configured.';
  const steps: OnboardingStep[] = [
    { id: 'database', title: 'Connect the database', done: dbConfigured && reachable,
      detail: dbConfigured ? (reachable ? 'Supabase is reachable.' : 'Supabase is configured but not answering - check the project URL and that the migrations are applied.') : 'Supabase is not configured.',
      envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'], href: '/health', cta: 'Open System Status' },
    { id: 'owner', title: 'Lock the workspace to your account', done: envOk('OWNER_EMAIL'),
      detail: envOk('OWNER_EMAIL') ? 'OWNER_EMAIL is set; only that account can use the APIs.' : 'OWNER_EMAIL is not set - set it to the email you sign in with.',
      envVars: ['OWNER_EMAIL'], href: '/settings', cta: 'See requirements' },
    { id: 'ai', title: 'Connect the AI (Gemini)', done: ceo.ai.configured,
      detail: ceo.ai.configured ? `Gemini key present (model ${ceo.ai.model}).` : 'GEMINI_API_KEY is not set - the CEO agent and ARIA cannot think without it.',
      envVars: ['GEMINI_API_KEY'], href: '/settings', cta: 'Open AI settings' },
    { id: 'email', title: 'Connect email sending', done: ceo.email.ready,
      detail: ceo.email.ready ? `Sending through ${ceo.email.provider}.` : emailMissing,
      envVars: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'OUTREACH_SEND_ENABLED'], href: '/settings', cta: 'Open email settings' },
    { id: 'profile', title: 'Set your business profile', done: profileDone,
      detail: profileDone ? 'Business profile saved.' : 'Your profile still has the placeholder name - add your business name, services and revenue target.',
      href: '/settings', cta: 'Edit profile' },
    { id: 'offer', title: 'Define your first offer', done: (offers ?? 0) > 0,
      detail: (offers ?? 0) > 0 ? `${offers} offer${offers === 1 ? '' : 's'} defined.` : 'No offers yet - agents write outreach and proposals from your offers.',
      href: '/settings', cta: 'Add an offer' },
    { id: 'leads', title: 'Add your first leads', done: (leads ?? 0) > 0,
      detail: (leads ?? 0) > 0 ? `${leads} lead${leads === 1 ? '' : 's'} in the pipeline.` : 'No leads yet - import a CSV, add one manually, or ask the CEO to research some.',
      href: '/leads', cta: 'Add leads' },
    { id: 'mission', title: 'Run your first mission', done: ceo.tasks.total > 0,
      detail: ceo.tasks.total > 0 ? `${ceo.tasks.total} task${ceo.tasks.total === 1 ? '' : 's'} created by agents so far.` : 'Ask the CEO for a goal, e.g. "Find 10 dental clinics in Austin and draft intros".',
      href: '/ceo', cta: 'Open CEO Console' },
  ];
  const done = steps.filter(s => s.done).length;
  return {
    generatedAt: new Date().toISOString(),
    database: { configured: dbConfigured, reachable },
    ai: ceo.ai, email: ceo.email, tasks: ceo.tasks, approvalsPending: ceo.approvalsPending,
    outreach: { drafts: drafts ?? 0, approved: approved ?? 0, sent: sent ?? 0, failed: failed ?? 0 },
    counts: { leads: leads ?? 0, offers: offers ?? 0 },
    onboarding: { steps, done, total: steps.length, complete: done === steps.length },
  };
}
