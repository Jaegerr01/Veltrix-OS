import { db as realDb } from '../db';
import { runAgentLogic, type AgentRunResult } from '../agents/executor';
import { executeAgent } from '../agents/router';
import { AGENTS } from '../agents/agents';
import { loadCatalogueAgent } from '../agents/catalogue';
import { buildBusinessContext } from '../context/buildBusinessContext';
import { gemini } from '../ai/gemini';
import { isAiError, type AiErrorCode } from '../ai/errors';
import { planInstruction, type Llm, type PlanContext, type PlannedTask } from './plan';
import { OUTWARD_AGENTS } from './schema';
import type { Task } from '../types';

/**
 * CEO orchestrator: instruction -> validated plan -> real `tasks` rows (owner agent, priority, due date,
 * dependencies) -> executed through the ONE executor -> real results recorded.
 *
 * Honesty rules (enforced by tests):
 *  - no AI => no plan, no tasks, an explicit error. Never a canned reply.
 *  - a task is Completed only if its agent returned success. Failed carries the error text.
 *  - outward-facing work (outreach / follow-up / proposal) ends as "Needs Approval", never "Completed";
 *    nothing is sent here.
 *  - tasks whose dependency failed are Blocked, not silently skipped.
 *  - a time budget protects serverless limits: unstarted tasks stay queued and can be continued.
 */

export type RunTaskStatus = 'queued' | 'running' | 'done' | 'failed' | 'blocked' | 'needs_approval';

export interface RunTask {
  id: string;
  key: string;
  agent: string;
  agentName: string;
  title: string;
  priority: string;
  dueDate?: string;
  dependsOn: string[]; // task ids
  status: RunTaskStatus;
  output?: string;
  error?: string;
  approvalRequestId?: string;
}

export interface OrchestratorError { code: AiErrorCode | 'ERROR'; message: string; hint?: string }

export interface RunResult {
  ok: boolean;
  runId: string;
  reply: string;
  summary: string;
  tasks: RunTask[];
  /** tasks still queued because the time budget ran out */
  remaining: number;
  error?: OrchestratorError;
}

export type OrchestratorEvent =
  | { type: 'plan'; runId: string; reply: string; tasks: RunTask[] }
  | { type: 'task'; runId: string; task: RunTask }
  | { type: 'done'; result: RunResult }
  | { type: 'error'; error: OrchestratorError };

type DbLike = Pick<typeof realDb, 'addTask' | 'updateTask' | 'getTasks' | 'logAgentAction'>;

export interface Deps {
  llm: Llm;
  db: DbLike;
  runAgent: (key: string, params: any, autonomous: boolean, ctx?: { orchestrated?: boolean; taskId?: string }) => Promise<AgentRunResult>;
  consult: (key: string, question: string) => Promise<string>;
  getContext: () => Promise<PlanContext>;
  now: () => number;
  newRunId: () => string;
}

export function defaultDeps(): Deps {
  return {
    llm: gemini,
    db: realDb,
    runAgent: runAgentLogic,
    consult: async (key, q) => (await executeAgent(key, q, [])).text,
    getContext: async () => {
      const [ctx, leads, projects] = await Promise.all([buildBusinessContext(), realDb.getLeads(), realDb.getProjects()]);
      return {
        contextString: ctx.contextString,
        leads: leads.slice(0, 60).map(l => ({ id: l.id, business_name: l.business_name, status: l.status, lead_score: l.lead_score, email: l.email, industry: l.industry })),
        projects: projects.map(p => ({ id: p.id, project_name: p.project_name, status: p.status })),
      };
    },
    now: () => Date.now(),
    newRunId: () => (globalThis.crypto as Crypto).randomUUID(),
  };
}

export interface OrchestrateOptions {
  instruction: string;
  source: 'ceo' | 'aria' | 'user';
  voice?: boolean;
  /** ms after which no NEW task is started (default ORCHESTRATOR_BUDGET_MS or 20 s) */
  budgetMs?: number;
  emit?: (e: OrchestratorEvent) => void;
  deps?: Partial<Deps>;
}

const STATUS_TO_DB: Record<RunTaskStatus, Task['status']> = {
  queued: 'Pending', running: 'In Progress', done: 'Completed', failed: 'Failed', blocked: 'Blocked', needs_approval: 'Needs Approval',
};
export const DB_TO_STATUS: Record<string, RunTaskStatus> = {
  Pending: 'queued', 'In Progress': 'running', Completed: 'done', Failed: 'failed', Blocked: 'blocked', 'Needs Approval': 'needs_approval',
};

const agentLabel = (key: string, params: Record<string, unknown>) => {
  if (key === 'specialist') {
    const s = loadCatalogueAgent(String(params.slug ?? ''));
    return s ? `${s.name} (Specialist)` : 'Specialist';
  }
  return AGENTS[key]?.name ?? key;
};

const budgetDefault = () => Number(process.env.ORCHESTRATOR_BUDGET_MS) || 20_000;
const clip = (s: string | undefined, n = 4000) => (s && s.length > n ? s.slice(0, n) + '…' : s);

function errMsg(e: unknown): string {
  return isAiError(e) ? (e as any).userMessage : String((e as any)?.message || e).slice(0, 300);
}

export function summarize(tasks: RunTask[], remaining: number): string {
  if (tasks.length === 0) return '';
  const c = (s: RunTaskStatus) => tasks.filter(t => t.status === s);
  const parts: string[] = [];
  parts.push(`${c('done').length} of ${tasks.length} task${tasks.length === 1 ? '' : 's'} completed`);
  if (c('needs_approval').length) parts.push(`${c('needs_approval').length} waiting for your approval (nothing has been sent)`);
  if (c('failed').length) parts.push(`${c('failed').length} failed: ${c('failed').map(t => `${t.title} - ${t.error}`).join('; ')}`);
  if (c('blocked').length) parts.push(`${c('blocked').length} blocked: ${c('blocked').map(t => `${t.title} - ${t.error}`).join('; ')}`);
  if (remaining > 0) parts.push(`${remaining} still queued (time budget reached - press Continue)`);
  return parts.join('. ') + '.';
}

async function persist(deps: Deps, t: RunTask, extra: Partial<Task> = {}) {
  await deps.db.updateTask(t.id, { status: STATUS_TO_DB[t.status], result: t.output, error: t.error ?? null, approval_request_id: t.approvalRequestId ?? null, ...extra });
}

/** Execute queued tasks in dependency order within the time budget. Mutates `tasks`. */
export async function executeTasks(
  runId: string,
  tasks: RunTask[],
  paramsById: Map<string, Record<string, unknown>>,
  deps: Deps,
  budgetMs: number,
  emit?: (e: OrchestratorEvent) => void
): Promise<number> {
  const started = deps.now();
  const byId = new Map(tasks.map(t => [t.id, t]));
  let aiDown: OrchestratorError | null = null;

  const progress = () => tasks.some(t => t.status === 'queued');
  let guard = tasks.length + 2;
  while (progress() && guard-- > 0) {
    let ranAny = false;
    for (const t of tasks) {
      if (t.status !== 'queued') continue;
      const deps_ = t.dependsOn.map(id => byId.get(id)).filter(Boolean) as RunTask[];

      const bad = deps_.find(d => d.status === 'failed' || d.status === 'blocked');
      if (bad) {
        t.status = 'blocked'; t.error = `Blocked: it depends on "${bad.title}" which ${bad.status === 'failed' ? 'failed' : 'was blocked'}.`;
        await persist(deps, t, { finished_at: new Date(deps.now()).toISOString() });
        emit?.({ type: 'task', runId, task: { ...t } });
        ranAny = true; continue;
      }
      const waiting = deps_.find(d => d.status === 'needs_approval');
      if (waiting) {
        t.status = 'blocked'; t.error = `Blocked: waiting for you to approve "${waiting.title}" first.`;
        await persist(deps, t);
        emit?.({ type: 'task', runId, task: { ...t } });
        ranAny = true; continue;
      }
      if (deps_.some(d => d.status === 'queued' || d.status === 'running')) continue; // not ready yet

      if (deps.now() - started > budgetMs) return tasks.filter(x => x.status === 'queued').length;

      if (aiDown) {
        t.status = 'blocked'; t.error = `${aiDown.message} ${aiDown.hint ?? ''}`.trim();
        await persist(deps, t);
        emit?.({ type: 'task', runId, task: { ...t } });
        ranAny = true; continue;
      }

      t.status = 'running';
      await persist(deps, t, { started_at: new Date(deps.now()).toISOString() });
      emit?.({ type: 'task', runId, task: { ...t } });
      ranAny = true;

      const params = paramsById.get(t.id) ?? {};
      try {
        if (typeof params.ask === 'string' && params.ask.trim()) {
          t.output = clip(await deps.consult(t.agent, params.ask));
          t.status = 'done';
        } else {
          const r = await deps.runAgent(t.agent, params, false, { orchestrated: true, taskId: t.id });
          if (!r.success) {
            t.status = 'failed'; t.error = r.error || 'The agent reported a failure without details.';
          } else if (r.needsApproval) {
            t.status = 'needs_approval'; t.output = clip(r.result); t.approvalRequestId = r.approvalRequestId;
          } else {
            t.status = 'done'; t.output = clip(r.result);
          }
        }
      } catch (e) {
        t.status = 'failed'; t.error = errMsg(e);
        if (isAiError(e) && ['NOT_CONFIGURED', 'INVALID_KEY'].includes((e as any).code)) {
          aiDown = { code: (e as any).code, message: (e as any).message, hint: (e as any).hint };
        }
      }
      await persist(deps, t, { finished_at: new Date(deps.now()).toISOString() });
      emit?.({ type: 'task', runId, task: { ...t } });
    }
    if (!ranAny) break; // nothing runnable (should not happen) - avoid spinning
  }
  // anything still queued here is genuinely queued (e.g. budget) or stuck
  return tasks.filter(t => t.status === 'queued').length;
}

export async function orchestrate(opts: OrchestrateOptions): Promise<RunResult> {
  const deps: Deps = { ...defaultDeps(), ...opts.deps };
  const runId = deps.newRunId();
  const emit = opts.emit;
  const fail = (e: unknown): RunResult => {
    const error: OrchestratorError = isAiError(e)
      ? { code: (e as any).code, message: (e as any).message, hint: (e as any).hint }
      : { code: 'ERROR', message: errMsg(e) };
    emit?.({ type: 'error', error });
    return { ok: false, runId, reply: '', summary: '', tasks: [], remaining: 0, error };
  };

  // 1. Plan (needs the real LLM; any failure is reported, nothing is created)
  let plan;
  try {
    const ctx = await deps.getContext();
    plan = await planInstruction(opts.instruction, ctx, { llm: deps.llm, voice: opts.voice });
  } catch (e) {
    return fail(e);
  }

  // 2. Pure question / clarification: no tasks, the reply is the answer
  if (plan.tasks.length === 0) {
    const result: RunResult = { ok: true, runId, reply: plan.reply, summary: '', tasks: [], remaining: 0 };
    emit?.({ type: 'plan', runId, reply: plan.reply, tasks: [] });
    emit?.({ type: 'done', result });
    return result;
  }

  // 3. Create real task rows in dependency order (so depends_on can hold real ids)
  const order = topoOrder(plan.tasks);
  const idByKey = new Map<string, string>();
  const tasks: RunTask[] = [];
  const paramsById = new Map<string, Record<string, unknown>>();
  const today = new Date(deps.now());

  try {
    for (const pt of order) {
      const dueDate = pt.dueInDays !== undefined ? new Date(today.getTime() + pt.dueInDays * 86400000).toISOString().slice(0, 10) : undefined;
      const dependsOn = pt.dependsOn.map(k => idByKey.get(k)).filter(Boolean) as string[];
      const name = agentLabel(pt.agent, pt.params);
      const invalid = pt.invalid;
      const row = await deps.db.addTask({
        agent_name: name,
        title: pt.title,
        description: `Assigned by ${opts.source === 'aria' ? 'ARIA (voice)' : 'CEO'}: "${opts.instruction.slice(0, 300)}"`,
        priority: pt.priority,
        status: invalid ? 'Failed' : 'Pending',
        due_date: dueDate,
        related_lead_id: typeof pt.params.leadId === 'string' ? pt.params.leadId : undefined,
        run_id: runId,
        depends_on: dependsOn,
        requires_approval: OUTWARD_AGENTS.includes(pt.agent),
        error: invalid ?? null,
        created_by: opts.source,
        agent_key: pt.agent,
        params: pt.params,
      } as any);
      idByKey.set(pt.key, row.id);
      paramsById.set(row.id, pt.params);
      tasks.push({
        id: row.id, key: pt.key, agent: pt.agent, agentName: name, title: pt.title, priority: pt.priority, dueDate,
        dependsOn, status: invalid ? 'failed' : 'queued', error: invalid,
      });
    }
  } catch (e) {
    return fail(e);
  }
  emit?.({ type: 'plan', runId, reply: plan.reply, tasks: tasks.map(t => ({ ...t })) });

  // 4. Execute
  const remaining = await executeTasks(runId, tasks, paramsById, deps, opts.budgetMs ?? budgetDefault(), emit);

  const summary = summarize(tasks, remaining);
  const ok = tasks.every(t => t.status === 'done' || t.status === 'needs_approval' || t.status === 'queued');
  try {
    await deps.db.logAgentAction('Alex (CEO Agent)', 'CEO Orchestration', JSON.stringify({ runId, instruction: opts.instruction.slice(0, 200), source: opts.source }), summary, ok ? 'Success' : 'Failure');
  } catch { /* logging never masks results */ }

  const result: RunResult = { ok, runId, reply: plan.reply, summary, tasks, remaining };
  emit?.({ type: 'done', result });
  return result;
}

/** Resume queued tasks of an earlier run (time budget hit) - rebuilt from the tasks table. */
export async function continueRun(runId: string, opts: { budgetMs?: number; emit?: (e: OrchestratorEvent) => void; deps?: Partial<Deps> } = {}): Promise<RunResult> {
  const deps: Deps = { ...defaultDeps(), ...opts.deps };
  const rows = (await deps.db.getTasks()).filter(t => t.run_id === runId);
  if (rows.length === 0) {
    const error: OrchestratorError = { code: 'ERROR', message: 'No tasks found for that run.', hint: 'Apply migrations/2026-10-02_003_task_orchestration.sql so runs can be resumed.' };
    opts.emit?.({ type: 'error', error });
    return { ok: false, runId, reply: '', summary: '', tasks: [], remaining: 0, error };
  }
  const paramsById = new Map<string, Record<string, unknown>>();
  const tasks: RunTask[] = rows.map((r, i) => {
    paramsById.set(r.id, (r.params as Record<string, unknown>) ?? {});
    const key = (r.agent_key as string) || 'ceo';
    return {
      id: r.id, key: `t${i + 1}`, agent: key, agentName: r.agent_name, title: r.title, priority: r.priority, dueDate: r.due_date,
      dependsOn: r.depends_on ?? [], status: DB_TO_STATUS[r.status] ?? 'queued', output: r.result, error: r.error ?? undefined,
      approvalRequestId: r.approval_request_id ?? undefined,
    };
  });
  const remaining = await executeTasks(runId, tasks, paramsById, deps, opts.budgetMs ?? budgetDefault(), opts.emit);
  const summary = summarize(tasks, remaining);
  const result: RunResult = { ok: tasks.every(t => t.status === 'done' || t.status === 'needs_approval' || t.status === 'queued'), runId, reply: '', summary, tasks, remaining };
  opts.emit?.({ type: 'done', result });
  return result;
}

function topoOrder(tasks: PlannedTask[]): PlannedTask[] {
  const byKey = new Map(tasks.map(t => [t.key, t]));
  const out: PlannedTask[] = [];
  const state = new Map<string, 1 | 2>();
  const visit = (t: PlannedTask) => {
    if (state.get(t.key) === 2) return;
    if (state.get(t.key) === 1) return; // cycle (already flagged invalid)
    state.set(t.key, 1);
    for (const d of t.dependsOn) { const dep = byKey.get(d); if (dep) visit(dep); }
    state.set(t.key, 2);
    out.push(t);
  };
  tasks.forEach(visit);
  return out;
}
