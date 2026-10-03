import { gemini } from '../ai/gemini';
import { AiError } from '../ai/errors';
import { fence } from '../ai/untrusted';
import { AGENTS } from '../agents/agents';
import { activeRosterForPrompt, loadCatalogueAgent } from '../agents/catalogue';
import { PlanSchema, AGENT_SPECS, type PlanTask } from './schema';

export interface Llm {
  callJson(prompt: string, system?: string): Promise<unknown>;
}

export interface PlanContext {
  /** Workspace summary (metrics, goals…) from the database. */
  contextString: string;
  /** Compact list of real leads the planner may reference by id. */
  leads: { id: string; business_name: string; status: string; lead_score?: number; email?: string; industry?: string }[];
  projects: { id: string; project_name: string; status: string }[];
}

export interface PlannedTask extends PlanTask {
  /** set when the task cannot run; it is still recorded (as Failed) so nothing is silently dropped */
  invalid?: string;
}

export interface ValidatedPlan {
  reply: string;
  tasks: PlannedTask[];
}

const MAX_TASKS = 8;

function rosterText(): string {
  const core = Object.entries(AGENT_SPECS)
    .map(([key, spec]) => `- ${key} (${AGENTS[key]?.name ?? key}): ${spec.describe}`)
    .join('\n');
  let catalogue = '';
  try { catalogue = activeRosterForPrompt(); } catch { /* optional */ }
  return `${core}\n- ANY agent can also be consulted with params {"ask":"question"} for a free-form answer (no side effects).` +
    (catalogue ? `\n\nSPECIALIST CATALOGUE (use agent "specialist" with the exact slug):\n${catalogue}` : '');
}

export function buildPlannerPrompts(instruction: string, ctx: PlanContext, voice: boolean) {
  const leadLines = ctx.leads.slice(0, 40).map(l =>
    `${l.id} | ${l.business_name} | ${l.status} | score ${l.lead_score ?? 'n/a'} | email ${l.email ? 'yes' : 'NO'} | ${l.industry ?? ''}`).join('\n') || '(no leads yet)';
  const projectLines = ctx.projects.slice(0, 20).map(p => `${p.id} | ${p.project_name} | ${p.status}`).join('\n') || '(no projects yet)';

  const system = `You are Alex, the CEO Agent of PostelOS. You ORCHESTRATE a team: you turn the operator's instruction into concrete tasks and assign each to the right specialist agent. You only PLAN - the system executes your tasks and reports real results.

Rules:
1. Output ONLY JSON: {"reply": string, "tasks": [{"key","agent","title","params","priority","dueInDays","dependsOn"}]}.
2. "key" is a short unique id per task (t1, t2...). "dependsOn" lists keys of tasks that must finish first (e.g. research before outreach). No cycles. Max ${MAX_TASKS} tasks.
3. "agent" must be one of the agent keys below. "priority" is Low|Medium|High|Critical. "dueInDays" is days from today.
4. Use ONLY real ids from the DATA blocks. Never invent a lead, project, price or fact. If the request needs a lead/project you cannot identify, return tasks [] and ask which one in "reply".
5. If the operator only asks a question or wants status/advice, return tasks [] and answer in "reply" using only the workspace data.
6. Outreach, follow-up and proposal agents only DRAFT and queue an approval - they never send. Never say anything was sent, completed or started; the system reports that after execution.
7. ${voice ? '"reply" will be spoken aloud: 1-2 short plain sentences, no markdown, no lists.' : '"reply" is one or two sentences describing what you are assigning (or the answer).'}

AGENTS:
${rosterText()}`;

  const prompt = `OPERATOR REQUEST (trusted - from the owner):
${instruction}

WORKSPACE SUMMARY (database facts):
${ctx.contextString.slice(0, 6000)}

LEADS (id | name | status | score | has email | industry):
${fence('LEADS', leadLines, 6000)}

PROJECTS (id | name | status):
${fence('PROJECTS', projectLines, 2000)}

Return the JSON plan now.`;
  return { system, prompt };
}

/** Validate each task against reality (agent exists, params present, ids real, deps acyclic). */
export function validatePlanTasks(rawTasks: PlanTask[], ctx: PlanContext): PlannedTask[] {
  const leadIds = new Set(ctx.leads.map(l => l.id));
  const projectIds = new Set(ctx.projects.map(p => p.id));
  const keys = new Set(rawTasks.map(t => t.key));
  const seen = new Set<string>();

  const tasks: PlannedTask[] = rawTasks.map(t => {
    const out: PlannedTask = { ...t, dependsOn: t.dependsOn.filter(d => d !== t.key) };
    const fail = (msg: string) => { out.invalid = msg; return out; };

    if (seen.has(t.key)) return fail(`Duplicate task key "${t.key}".`);
    seen.add(t.key);

    const spec = AGENT_SPECS[t.agent];
    if (!spec || !AGENTS[t.agent]) return fail(`"${t.agent}" is not an agent on this team.`);
    const p = t.params as Record<string, unknown>;
    const isConsult = typeof p.ask === 'string' && p.ask.trim().length > 0;
    if (!isConsult) {
      for (const r of spec.required) {
        if (p[r] === undefined || p[r] === null || String(p[r]).trim() === '') return fail(`Missing "${r}" for ${t.agent}.`);
      }
      if (spec.required.includes('leadId') && !leadIds.has(String(p.leadId))) return fail(`Lead "${String(p.leadId)}" does not exist in your CRM.`);
      if (spec.required.includes('projectId') && !projectIds.has(String(p.projectId))) return fail(`Project "${String(p.projectId)}" does not exist.`);
      if (t.agent === 'specialist' && !loadCatalogueAgent(String(p.slug))) return fail(`Unknown specialist "${String(p.slug)}".`);
      if (t.agent === 'memory') {
        const note = p.note as { title?: unknown; body?: unknown } | undefined;
        const hasNote = !!note && typeof note.title === 'string' && note.title.trim() !== '' && typeof note.body === 'string' && note.body.trim() !== '';
        const hasQuery = typeof p.query === 'string' && p.query.trim() !== '';
        if (!hasNote && !hasQuery) return fail('memory needs {"query"} to search or {"note":{"title","body"}} to save a note.');
      }
    }
    for (const d of out.dependsOn) if (!keys.has(d)) return fail(`Depends on unknown task "${d}".`);
    return out;
  });

  // cycle detection (Kahn) - tasks inside a cycle are invalid
  const byKey = new Map(tasks.map(t => [t.key, t]));
  const indeg = new Map(tasks.map(t => [t.key, t.dependsOn.filter(d => byKey.has(d)).length]));
  const queue = tasks.filter(t => (indeg.get(t.key) ?? 0) === 0).map(t => t.key);
  const done = new Set<string>();
  while (queue.length) {
    const k = queue.shift()!;
    done.add(k);
    for (const t of tasks) if (t.dependsOn.includes(k)) {
      indeg.set(t.key, (indeg.get(t.key) ?? 1) - 1);
      if ((indeg.get(t.key) ?? 0) === 0 && !done.has(t.key)) queue.push(t.key);
    }
  }
  for (const t of tasks) if (!done.has(t.key) && !t.invalid) t.invalid = 'Circular dependency between tasks.';
  return tasks;
}

/** Ask the LLM for a plan, validate the shape (zod) and every task against the database. */
export async function planInstruction(
  instruction: string,
  ctx: PlanContext,
  opts: { llm?: Llm; voice?: boolean } = {}
): Promise<ValidatedPlan> {
  const llm = opts.llm ?? gemini;
  const { system, prompt } = buildPlannerPrompts(instruction, ctx, !!opts.voice);

  let raw: unknown;
  let parsed = PlanSchema.safeParse(undefined);
  for (let attempt = 1; attempt <= 2; attempt++) {
    raw = await llm.callJson(attempt === 1 ? prompt : `${prompt}\n\nYour previous answer did not match the schema. Return ONLY valid JSON of the exact shape.`, system);
    parsed = PlanSchema.safeParse(raw);
    if (parsed.success) break;
  }
  if (!parsed.success) {
    throw new AiError('BAD_OUTPUT', 'The CEO could not produce a valid plan for that request.', 'Rephrase the instruction more concretely (which lead, which action) and try again.');
  }
  return { reply: parsed.data.reply, tasks: validatePlanTasks(parsed.data.tasks.slice(0, MAX_TASKS), ctx) };
}
