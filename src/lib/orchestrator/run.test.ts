import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiError } from '../ai/errors';

// The orchestrator imports the real executor/router/gemini modules; stub them (no network, no DB).
vi.mock('../db', () => ({ db: {} }));
vi.mock('../agents/executor', () => ({ runAgentLogic: vi.fn() }));
vi.mock('../agents/router', () => ({ executeAgent: vi.fn() }));
vi.mock('../context/buildBusinessContext', () => ({ buildBusinessContext: vi.fn() }));
vi.mock('../ai/gemini', () => ({ gemini: { callJson: vi.fn() } }));
vi.mock('../db/vault', () => ({ journalToVault: vi.fn(), vault: {} }));

import { orchestrate, continueRun, type Deps, type RunTask } from './run';

type Row = Record<string, any>;

function makeEnv(plan: unknown | Error, opts: { runAgent?: Deps['runAgent']; now?: () => number } = {}) {
  const rows: Row[] = [];
  let n = 0;
  const llm = { callJson: vi.fn(async () => { if (plan instanceof Error) throw plan; return plan; }) };
  const db = {
    addTask: vi.fn(async (t: Row) => { const r = { ...t, id: `task-${++n}`, created_at: '', updated_at: '' }; rows.push(r); return r; }),
    updateTask: vi.fn(async (id: string, u: Row) => { Object.assign(rows.find(r => r.id === id)!, u); return rows.find(r => r.id === id); }),
    getTasks: vi.fn(async () => rows),
    logAgentAction: vi.fn(async () => undefined),
  };
  const runAgent = opts.runAgent ?? vi.fn(async () => ({ success: true, result: 'ok' }));
  const events: any[] = [];
  const journal = vi.fn(async (_note: { title: string; folder?: string; body: string; agent?: string }) => null as unknown);
  const deps: Partial<Deps> = {
    llm, db: db as any, runAgent: runAgent as any,
    consult: vi.fn(async () => 'consulted answer'),
    getContext: async () => ({
      contextString: 'ctx',
      leads: [{ id: 'L1', business_name: 'Acme Dental', status: 'Qualified', email: 'a@acme.com' }, { id: 'L2', business_name: 'Beta Co', status: 'New' }],
      projects: [{ id: 'P1', project_name: 'Site', status: 'Design' }],
    }),
    journal,
    now: opts.now ?? (() => Date.now()),
    newRunId: () => '11111111-1111-4111-8111-111111111111',
  };
  return { rows, db, llm, deps, journal, runAgent: runAgent as ReturnType<typeof vi.fn>, events, emit: (e: any) => events.push(e) };
}

const go = (env: ReturnType<typeof makeEnv>, instruction = 'Research Acme then draft outreach', extra: Record<string, unknown> = {}) =>
  orchestrate({ instruction, source: 'ceo', deps: env.deps, emit: env.emit, ...extra });

beforeEach(() => vi.clearAllMocks());

describe('orchestrator - decomposition & assignment', () => {
  it('decomposes an instruction into real task rows with owner agent, priority, due date and dependencies, then runs them in order', async () => {
    const env = makeEnv({
      reply: 'On it: research then outreach.',
      tasks: [
        { key: 't2', agent: 'outreach', title: 'Draft outreach to Acme', params: { leadId: 'L1', offerName: 'AI Receptionist', channel: 'Email' }, priority: 'High', dueInDays: 1, dependsOn: ['t1'] },
        { key: 't1', agent: 'leadResearch', title: 'Research Acme Dental', params: { leadId: 'L1' }, priority: 'High', dueInDays: 0, dependsOn: [] },
      ],
    });
    const order: string[] = [];
    env.runAgent.mockImplementation(async (key: string) => { order.push(key); return key === 'outreach' ? { success: true, result: 'drafted', needsApproval: true, approvalRequestId: 'ap-1' } : { success: true, result: 'scored 8/10' }; });

    const r = await go(env);

    expect(order).toEqual(['leadResearch', 'outreach']); // dependency respected even though outreach was listed first
    expect(env.rows).toHaveLength(2);
    const research = env.rows.find(x => x.agent_key === 'leadResearch')!;
    const outreach = env.rows.find(x => x.agent_key === 'outreach')!;
    expect(research).toMatchObject({ agent_name: 'Daniel (Lead Research Agent)', priority: 'High', run_id: r.runId, created_by: 'ceo', status: 'Completed', result: 'scored 8/10' });
    expect(outreach).toMatchObject({ agent_name: 'Emma (Outreach Agent)', depends_on: [research.id], requires_approval: true, related_lead_id: 'L1' });
    expect(outreach.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.tasks.map(t => t.status)).toEqual(['done', 'needs_approval']);
    expect(env.events.map(e => e.type)).toEqual(expect.arrayContaining(['plan', 'task', 'done']));
  });

  it('outward-facing work ends as Needs Approval - never Completed - and the summary says nothing was sent', async () => {
    const env = makeEnv({ reply: '', tasks: [{ key: 't1', agent: 'outreach', title: 'Outreach', params: { leadId: 'L1', offerName: 'X' }, priority: 'Medium', dependsOn: [] }] });
    env.runAgent.mockResolvedValue({ success: true, result: 'drafted', needsApproval: true, approvalRequestId: 'ap-9' });
    const r = await go(env);
    expect(env.rows[0].status).toBe('Needs Approval');
    expect(env.rows[0].approval_request_id).toBe('ap-9');
    expect(r.summary).toMatch(/waiting for your approval \(nothing has been sent\)/);
    expect(r.summary).toMatch(/0 of 1 task/);
  });

  it('rejects hallucinated assignments loudly: unknown agent, missing params, non-existent lead -> Failed rows, agent never run', async () => {
    const env = makeEnv({
      reply: '',
      tasks: [
        { key: 'a', agent: 'wizard', title: 'Cast a spell', params: {}, priority: 'Low', dependsOn: [] },
        { key: 'b', agent: 'outreach', title: 'Outreach w/o offer', params: { leadId: 'L1' }, priority: 'Low', dependsOn: [] },
        { key: 'c', agent: 'sales', title: 'Pitch ghost lead', params: { leadId: 'NOPE' }, priority: 'Low', dependsOn: [] },
      ],
    });
    const r = await go(env);
    expect(env.runAgent).not.toHaveBeenCalled();
    expect(r.tasks.every(t => t.status === 'failed')).toBe(true);
    expect(r.tasks[0].error).toMatch(/not an agent/);
    expect(r.tasks[1].error).toMatch(/Missing "offerName"/);
    expect(r.tasks[2].error).toMatch(/does not exist in your CRM/);
    expect(r.ok).toBe(false);
  });

  it('a question yields an answer and NO tasks', async () => {
    const env = makeEnv({ reply: 'You have 2 leads.', tasks: [] });
    const r = await go(env, 'How many leads do I have?');
    expect(r.ok).toBe(true);
    expect(r.reply).toBe('You have 2 leads.');
    expect(env.rows).toHaveLength(0);
  });

  it('free-form {ask} consults an agent without side effects', async () => {
    const env = makeEnv({ reply: '', tasks: [{ key: 't1', agent: 'revenue', title: 'Ask Marcus about the gap', params: { ask: 'What is the revenue gap?' }, priority: 'Low', dependsOn: [] }] });
    const r = await go(env);
    expect(env.deps.consult).toHaveBeenCalledWith('revenue', 'What is the revenue gap?');
    expect(env.runAgent).not.toHaveBeenCalled();
    expect(r.tasks[0]).toMatchObject({ status: 'done', output: 'consulted answer' });
  });

  it('detects circular dependencies', async () => {
    const env = makeEnv({ reply: '', tasks: [
      { key: 'a', agent: 'memory', title: 'A task', params: { query: 'x' }, priority: 'Low', dependsOn: ['b'] },
      { key: 'b', agent: 'memory', title: 'B task', params: { query: 'y' }, priority: 'Low', dependsOn: ['a'] },
    ] });
    const r = await go(env);
    expect(r.tasks.every(t => t.status === 'failed' && /Circular/.test(t.error!))).toBe(true);
    expect(env.runAgent).not.toHaveBeenCalled();
  });
});

describe('orchestrator - Memory Vault decision log', () => {
  it('writes a Decisions note describing the real outcomes of a run (best effort)', async () => {
    const env = makeEnv({ reply: '', tasks: [{ key: 't1', agent: 'leadResearch', title: 'Research Acme Dental', params: { leadId: 'L1' }, priority: 'High', dependsOn: [] }] });
    await go(env);
    expect(env.journal).toHaveBeenCalledTimes(1);
    const note = env.journal.mock.calls[0][0];
    expect(note).toMatchObject({ folder: 'Decisions', agent: 'ceo' });
    expect(note.body).toContain('[done] leadResearch: Research Acme Dental');
  });
  it('a failing vault never breaks or masks the run result', async () => {
    const env = makeEnv({ reply: '', tasks: [{ key: 't1', agent: 'leadResearch', title: 'Research Acme Dental', params: { leadId: 'L1' }, priority: 'High', dependsOn: [] }] });
    env.journal.mockRejectedValue(new Error('vault down'));
    const r = await go(env);
    expect(r.ok).toBe(true);
  });
  it('no vault note when nothing was planned (a plain question)', async () => {
    const env = makeEnv({ reply: 'Hello', tasks: [] });
    await go(env);
    expect(env.journal).not.toHaveBeenCalled();
  });
});

describe('orchestrator - failure handling & no fake success', () => {
  it('a failing agent marks its task Failed with the error, blocks dependents, and the run is NOT ok', async () => {
    const env = makeEnv({ reply: '', tasks: [
      { key: 't1', agent: 'leadResearch', title: 'Research', params: { leadId: 'L1' }, priority: 'High', dependsOn: [] },
      { key: 't2', agent: 'proposal', title: 'Proposal', params: { leadId: 'L1', offerName: 'Site', price: 1200 }, priority: 'High', dependsOn: ['t1'] },
      { key: 't3', agent: 'memory', title: 'Search notes', params: { query: 'acme' }, priority: 'Low', dependsOn: [] },
    ] });
    env.runAgent.mockImplementation(async (key: string) => key === 'leadResearch' ? { success: false, error: 'Gemini rate limit / quota reached.' } : { success: true, result: 'found' });
    const r = await go(env);
    const by = Object.fromEntries(r.tasks.map(t => [t.key, t]));
    expect(by.t1).toMatchObject({ status: 'failed', error: 'Gemini rate limit / quota reached.' });
    expect(by.t2.status).toBe('blocked');
    expect(by.t2.error).toMatch(/depends on "Research" which failed/);
    expect(by.t3.status).toBe('done'); // independent work still runs
    expect(r.ok).toBe(false);
    expect(r.summary).toMatch(/1 failed/);
    expect(r.summary).toMatch(/1 blocked/);
    expect(env.rows.find(x => x.agent_key === 'leadResearch')!.status).toBe('Failed');
  });

  it('a thrown AiError is recorded verbatim (with fix hint) and stops further AI tasks when the key is unusable', async () => {
    const env = makeEnv({ reply: '', tasks: [
      { key: 't1', agent: 'content', title: 'Content', params: { topic: 'AI' }, priority: 'Low', dependsOn: [] },
      { key: 't2', agent: 'memory', title: 'Memory', params: { query: 'x' }, priority: 'Low', dependsOn: [] },
    ] });
    env.runAgent.mockRejectedValueOnce(new AiError('INVALID_KEY', 'Google rejected the Gemini API key.', 'Update GEMINI_API_KEY.'));
    const r = await go(env);
    expect(r.tasks[0]).toMatchObject({ status: 'failed' });
    expect(r.tasks[0].error).toMatch(/Update GEMINI_API_KEY/);
    expect(r.tasks[1].status).toBe('blocked');
    expect(env.runAgent).toHaveBeenCalledTimes(1);
  });

  it('AI not configured: no plan, no tasks, an explicit error - never a pretend answer', async () => {
    const env = makeEnv(new AiError('NOT_CONFIGURED', 'The AI is not connected: GEMINI_API_KEY is not set.', 'Add it to .env.local / Netlify.'));
    const r = await go(env);
    expect(r.ok).toBe(false);
    expect(r.error).toMatchObject({ code: 'NOT_CONFIGURED' });
    expect(r.error!.hint).toMatch(/Netlify/);
    expect(r.reply).toBe('');
    expect(env.rows).toHaveLength(0);
    expect(env.runAgent).not.toHaveBeenCalled();
    expect(env.events.find(e => e.type === 'error')).toBeTruthy();
    expect(env.events.find(e => e.type === 'done')).toBeUndefined();
  });

  it('an unreadable plan is retried once, then reported as an error (no tasks)', async () => {
    const env = makeEnv({ nonsense: true, tasks: 'nope' });
    const r = await go(env);
    expect(env.llm.callJson).toHaveBeenCalledTimes(2);
    expect(r.error?.code).toBe('BAD_OUTPUT');
    expect(env.rows).toHaveLength(0);
  });

  it('time budget: tasks that did not start stay Pending/queued and are reported, not marked done', async () => {
    let t = 0;
    const env = makeEnv({ reply: '', tasks: [
      { key: 't1', agent: 'memory', title: 'First', params: { query: 'a' }, priority: 'Low', dependsOn: [] },
      { key: 't2', agent: 'memory', title: 'Second', params: { query: 'b' }, priority: 'Low', dependsOn: [] },
    ] }, { now: () => (t += 15_000) });
    const r = await go(env, 'do both', { budgetMs: 20_000 });
    expect(r.remaining).toBeGreaterThan(0);
    expect(r.summary).toMatch(/still queued/);
    expect(env.rows.some(x => x.status === 'Pending')).toBe(true);
    expect(r.tasks.some(x => x.status === 'queued')).toBe(true);
  });

  it('continueRun resumes queued tasks from the tasks table', async () => {
    const env = makeEnv({ reply: '', tasks: [{ key: 't1', agent: 'memory', title: 'Only', params: { query: 'a' }, priority: 'Low', dependsOn: [] }] });
    let t = 0;
    env.deps.now = () => (t += 30_000);
    await go(env, 'x', { budgetMs: 1000, deps: env.deps });
    expect(env.rows[0].status).toBe('Pending');
    env.deps.now = () => 0;
    const r = await continueRun('11111111-1111-4111-8111-111111111111', { deps: env.deps });
    expect(env.runAgent).toHaveBeenCalledWith('memory', { query: 'a' }, false, expect.objectContaining({ orchestrated: true }));
    expect((r.tasks as RunTask[])[0].status).toBe('done');
    expect(env.rows[0].status).toBe('Completed');
  });
});
