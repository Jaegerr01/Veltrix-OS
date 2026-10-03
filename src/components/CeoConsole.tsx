'use client';

import { asErr } from '@/lib/errors';
import React from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/authFetch';
import { db } from '@/lib/db';
import { streamCeo, continueCeoRun, CeoRequestError } from '@/lib/orchestrator/client';
import type { RunTask, RunTaskStatus, RunResult, OrchestratorEvent } from '@/lib/orchestrator/run';
import type { CeoStatus } from '@/lib/orchestrator/status';
import type { Task } from '@/lib/types';

/**
 * CEO console: Barry types an instruction, the CEO (Gemini) decomposes it into tasks, each task is assigned to a
 * specialist agent and executed through the single executor; progress streams in live. Everything displayed comes
 * from the server stream or the tasks table - no placeholders, no pretend success.
 */

const card: React.CSSProperties = { padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', background: 'var(--grad-panel)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md), var(--sheen-top)' };
const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 12 };

const STATUS_UI: Record<RunTaskStatus, { label: string; fg: string; bg: string }> = {
  queued: { label: 'Queued', fg: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' },
  running: { label: 'Running…', fg: 'var(--violet-300)', bg: 'rgba(139,92,246,0.14)' },
  done: { label: 'Done', fg: 'var(--signal-400)', bg: 'rgba(46,230,160,0.12)' },
  failed: { label: 'Failed', fg: 'var(--danger-400)', bg: 'rgba(239,68,68,0.12)' },
  blocked: { label: 'Blocked', fg: 'var(--warn-400)', bg: 'rgba(245,180,60,0.12)' },
  needs_approval: { label: 'Needs your approval', fg: 'var(--cyan-300)', bg: 'rgba(76,215,246,0.12)' },
};
const DB_STATUS: Record<string, RunTaskStatus> = { Pending: 'queued', 'In Progress': 'running', Completed: 'done', Failed: 'failed', Blocked: 'blocked', 'Needs Approval': 'needs_approval' };

function Pill({ s }: { s: RunTaskStatus }) {
  const u = STATUS_UI[s];
  return <span style={{ ...mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: u.fg, background: u.bg, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{u.label}</span>;
}

interface Turn {
  id: string; instruction: string; reply: string; summary: string; tasks: RunTask[]; runId?: string;
  remaining: number; running: boolean; error?: { code: string; message: string; hint?: string };
}

function groupByAgent<T extends { agentName?: string; agent_name?: string }>(items: T[]) {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = it.agentName || it.agent_name || 'Unassigned';
    m.set(k, [...(m.get(k) || []), it]);
  }
  return [...m.entries()];
}

function TaskLine({ title, status, priority, due, output, error }: { title: string; status: RunTaskStatus; priority?: string; due?: string | null; output?: string | null; error?: string | null }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--ink-700)', border: '1px solid var(--hairline)' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text-strong)', minWidth: 0, wordBreak: 'break-word' }}>{title}</span>
        <Pill s={status} />
      </div>
      <div style={{ ...mono, fontSize: 10.5, color: 'var(--text-dim)', marginTop: 3 }}>
        {priority ? `${priority} priority` : ''}{due ? ` · due ${due}` : ''}
      </div>
      {error && <div style={{ ...mono, color: 'var(--danger-400)', marginTop: 4, wordBreak: 'break-word' }}>{error}</div>}
      {output && (
        <div style={{ marginTop: 4 }}>
          <button type="button" className="vx-tap" aria-expanded={open} onClick={() => setOpen(!open)} style={{ ...mono, fontSize: 11, color: 'var(--cyan-300)', cursor: 'pointer', background: 'none', border: 0, padding: 0, minHeight: 24 }}>{open ? 'Hide output' : 'Show output'}</button>
          {open && <pre style={{ ...mono, whiteSpace: 'pre-wrap', color: 'var(--text-body)', marginTop: 4, maxHeight: 260, overflow: 'auto' }}>{output}</pre>}
        </div>
      )}
    </div>
  );
}

function MissionBoard({ tasks }: { tasks: RunTask[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
      {groupByAgent(tasks).map(([agent, list]) => (
        <div key={agent} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="vx-eyebrow" style={{ color: 'var(--violet-300)' }}>{agent}</div>
          {list.map(t => (
            <TaskLine key={t.id} title={t.title} status={t.status} priority={t.priority} due={t.dueDate} output={t.output} error={t.error} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function CeoConsole() {
  const [status, setStatus] = React.useState<CeoStatus | null>(null);
  const [statusErr, setStatusErr] = React.useState<string | null>(null);
  const [text, setText] = React.useState('');
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [board, setBoard] = React.useState<Task[]>([]);
  const [boardErr, setBoardErr] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const loadStatus = React.useCallback(async () => {
    try {
      const res = await authFetch('/api/ceo/status');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) { setStatus(data.status); setStatusErr(null); }
      else setStatusErr(data.error || `Status check failed (${res.status}).`);
    } catch (raw) { const e = asErr(raw); setStatusErr(`Could not reach the server: ${e?.message || e}`); }
  }, []);

  const loadBoard = React.useCallback(async () => {
    try { setBoard(await db.getTasks()); setBoardErr(null); } catch (raw) { const e = asErr(raw); setBoardErr(`Could not load tasks: ${e?.message || e}`); }
  }, []);

  React.useEffect(() => { const t = setTimeout(() => { loadStatus(); loadBoard(); }, 0); return () => clearTimeout(t); }, [loadStatus, loadBoard]);
  React.useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) loadBoard(); }, busy ? 3000 : 10000);
    return () => clearInterval(t);
  }, [busy, loadBoard]);

  const patchTurn = (id: string, fn: (t: Turn) => Turn) => setTurns(ts => ts.map(t => (t.id === id ? fn(t) : t)));

  const applyEvent = React.useCallback((id: string, e: OrchestratorEvent | { type: 'chat'; message: unknown }) => {
    if (e.type === 'plan') patchTurn(id, t => ({ ...t, runId: e.runId, reply: e.reply, tasks: e.tasks }));
    else if (e.type === 'task') patchTurn(id, t => ({ ...t, runId: e.runId, tasks: t.tasks.some(x => x.id === e.task.id) ? t.tasks.map(x => (x.id === e.task.id ? e.task : x)) : [...t.tasks, e.task] }));
    else if (e.type === 'done') {
      const r: RunResult = e.result;
      patchTurn(id, t => ({ ...t, runId: r.runId, reply: r.reply || t.reply, summary: r.summary, tasks: r.tasks, remaining: r.remaining, error: r.error, running: false }));
    } else if (e.type === 'error') patchTurn(id, t => ({ ...t, error: e.error, running: false }));
  }, []);

  const send = React.useCallback(async (instruction: string) => {
    const msg = instruction.trim();
    if (!msg || busy) return;
    const id = `${Date.now()}`;
    setTurns(ts => [...ts, { id, instruction: msg, reply: '', summary: '', tasks: [], remaining: 0, running: true }]);
    setText(''); setBusy(true);
    const ac = new AbortController(); abortRef.current = ac;
    try {
      await streamCeo(msg, 'ceo', e => applyEvent(id, e), ac.signal);
      patchTurn(id, t => ({ ...t, running: false }));
    } catch (raw) { const e = asErr(raw);
      const err = e instanceof CeoRequestError ? e : null;
      patchTurn(id, t => ({ ...t, running: false, error: { code: err?.code || 'ERROR', message: err?.message || String(e?.message || e), hint: err?.hint } }));
    } finally {
      setBusy(false); loadBoard(); loadStatus();
    }
  }, [busy, applyEvent, loadBoard, loadStatus]);

  const cont = async (turn: Turn) => {
    if (!turn.runId || busy) return;
    setBusy(true); patchTurn(turn.id, t => ({ ...t, running: true }));
    try { await continueCeoRun(turn.runId, e => applyEvent(turn.id, e)); }
    catch (raw) { const e = asErr(raw); patchTurn(turn.id, t => ({ ...t, error: { code: e?.code || 'ERROR', message: e?.message || String(e), hint: e?.hint } })); }
    finally { patchTurn(turn.id, t => ({ ...t, running: false })); setBusy(false); loadBoard(); }
  };

  // ARIA / other components can hand an instruction to this console.
  React.useEffect(() => {
    const h = (e: Event) => { const m = (e as CustomEvent).detail?.message; if (typeof m === 'string' && m.trim()) send(m); };
    window.addEventListener('postelos-ask-agent', h);
    return () => window.removeEventListener('postelos-ask-agent', h);
  }, [send]);

  const aiDown = status && !status.ai.configured;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* One fixed-height status slot: loading, down and connected states all occupy it, so nothing below shifts. */}
      <div style={{ minHeight: 84 }}>
        {statusErr && <div role="alert" style={{ ...card, ...mono, padding: '12px 16px', color: 'var(--danger-400)' }}>{statusErr}</div>}
        {aiDown && (
          <div role="alert" style={{ ...card, padding: '12px 16px', borderColor: 'rgba(239,68,68,0.4)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--danger-400)' }}>The AI is not connected - the CEO cannot plan or run anything.</div>
            <div style={{ ...mono, color: 'var(--text-body)', marginTop: 4, lineHeight: 1.5 }}>
              <b>{status.ai.envVar}</b> is not set on the server. Add it to <b>.env.local</b> (or the environment variables of your host) and restart, then use <Link href="/settings#ai-panel" style={{ color: 'var(--cyan-300)' }}>Test AI connection</Link> in Settings.
            </div>
          </div>
        )}
        {status?.ai.configured && (
          <div style={{ ...card, padding: '12px 16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--signal-400)' }}>AI connected</div>
            <div style={{ ...mono, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>
              model {status.ai.model} · {status.tasks.queued} queued · {status.tasks.running} running · {status.tasks.needsApproval} need approval · {status.tasks.failed} failed · {status.approvalsPending} approval{status.approvalsPending === 1 ? '' : 's'} pending
            </div>
          </div>
        )}
        {!status && !statusErr && (
          <div style={{ ...card, ...mono, padding: '12px 16px', color: 'var(--text-dim)' }}>Checking the AI connection...</div>
        )}
      </div>

      <section style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label className="vx-eyebrow" htmlFor="ceo-input">Instruction for the CEO agent</label>
        <textarea
          id="ceo-input" value={text} onChange={e => setText(e.target.value)} rows={3} disabled={busy}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(text); } }}
          placeholder="e.g. Research my newest qualified lead and draft an outreach email for my approval"
          style={{ width: '100%', padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--ink-700)', border: '1px solid var(--border-default)', color: 'var(--text-strong)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => send(text)} disabled={busy || !text.trim()} style={{ padding: '0 18px', height: 38, borderRadius: 'var(--radius-md)', background: 'var(--grad-brand)', color: '#fff', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 600, cursor: busy || !text.trim() ? 'not-allowed' : 'pointer', opacity: busy || !text.trim() ? 0.55 : 1 }}>
            {busy ? 'Working…' : 'Send to CEO'}
          </button>
          {busy && <button type="button" onClick={() => abortRef.current?.abort()} style={{ height: 38, padding: '0 14px', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-default)', cursor: 'pointer' }}>Stop watching</button>}
          <span style={{ ...mono, color: 'var(--text-dim)' }}>Ctrl/⌘+Enter to send. Anything outward-facing (emails, proposals) is only drafted and waits for your approval.</span>
        </div>
      </section>

      {turns.map(t => (
        <section key={t.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...mono, color: 'var(--text-dim)' }}>You</div>
          <div style={{ color: 'var(--text-strong)', fontSize: 14, whiteSpace: 'pre-wrap' }}>{t.instruction}</div>
          {t.running && !t.tasks.length && !t.reply && <div style={{ ...mono, color: 'var(--violet-300)' }}>The CEO is planning…</div>}
          {t.error && (
            <div role="alert" style={{ ...mono, color: 'var(--danger-400)', lineHeight: 1.6 }}>
              <b>{t.error.code === 'NOT_CONFIGURED' ? 'AI not connected' : t.error.code === 'QUOTA' ? 'AI rate limit / quota' : t.error.code === 'INVALID_KEY' ? 'AI key rejected' : 'Could not complete'}:</b> {t.error.message}
              {t.error.hint && <><br />Fix: {t.error.hint}</>}
            </div>
          )}
          {t.reply && <div><div style={{ ...mono, color: 'var(--violet-300)' }}>Alex (CEO)</div><div style={{ color: 'var(--text-body)', fontSize: 14, whiteSpace: 'pre-wrap' }}>{t.reply}</div></div>}
          {t.tasks.length > 0 && <MissionBoard tasks={t.tasks} />}
          {t.summary && !t.running && <div style={{ ...mono, color: 'var(--text-body)' }}>{t.summary}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {t.remaining > 0 && !t.running && (
              <button type="button" onClick={() => cont(t)} disabled={busy} style={{ ...mono, padding: '6px 12px', borderRadius: 6, background: 'rgba(139,92,246,0.14)', color: 'var(--violet-200)', border: '1px solid var(--border-default)', cursor: 'pointer' }}>
                Continue {t.remaining} queued task{t.remaining === 1 ? '' : 's'}
              </button>
            )}
            {t.tasks.some(x => x.status === 'needs_approval') && (
              <Link href="/command-center" style={{ ...mono, padding: '6px 12px', borderRadius: 6, background: 'rgba(76,215,246,0.12)', color: 'var(--cyan-300)', border: '1px solid rgba(76,215,246,0.3)' }}>Open Approval Queue →</Link>
            )}
          </div>
        </section>
      ))}

      <section style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-strong)' }}>Live task board (database)</div>
          <Link href="/tasks" className="vx-tap" style={{ ...mono, color: 'var(--cyan-300)' }}>All tasks →</Link>
        </div>
        {boardErr && <div style={{ ...mono, color: 'var(--danger-400)' }}>{boardErr}</div>}
        {board.length === 0 && !boardErr && <div style={{ ...mono, color: 'var(--text-dim)' }}>No tasks yet. Give the CEO an instruction above - every task it creates appears here with its real status.</div>}
        {board.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {groupByAgent(board.slice(0, 80)).map(([agent, list]) => (
              <div key={agent} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="vx-eyebrow" style={{ color: 'var(--violet-300)' }}>{agent} · {list.length}</div>
                {list.slice(0, 6).map(tk => (
                  <TaskLine key={tk.id} title={tk.title} status={DB_STATUS[tk.status] || 'queued'} priority={tk.priority} due={tk.due_date} output={tk.result} error={tk.error} />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
