import type { Task } from './types';

/** The 11 core agents. Identity only - every number/status shown in the UI is derived from real tasks. */
export interface RosterEntry { id: string; first: string; name: string; role: string; keywords: string[] }

export const ROSTER: RosterEntry[] = [
  { id: 'ceo', first: 'alex', name: 'Alex', role: 'CEO Agent - plans & delegates', keywords: ['ceo'] },
  { id: 'revenue', first: 'marcus', name: 'Marcus', role: 'Revenue Agent - targets & gap math', keywords: ['revenue'] },
  { id: 'sales', first: 'sophia', name: 'Sophia', role: 'Sales Agent - pitch & objections', keywords: ['sales'] },
  { id: 'leadResearch', first: 'daniel', name: 'Daniel', role: 'Lead Research Agent - qualify & score', keywords: ['research'] },
  { id: 'outreach', first: 'emma', name: 'Emma', role: 'Outreach Agent - drafts outreach', keywords: ['outreach'] },
  { id: 'followup', first: 'lucas', name: 'Lucas', role: 'Follow-up Agent - sequences', keywords: ['follow'] },
  { id: 'proposal', first: 'olivia', name: 'Olivia', role: 'Proposal Agent - quotes', keywords: ['proposal'] },
  { id: 'content', first: 'ryan', name: 'Ryan', role: 'Content Agent - social ideas', keywords: ['content'] },
  { id: 'delivery', first: 'mia', name: 'Mia', role: 'Delivery Manager - roadmaps', keywords: ['delivery'] },
  { id: 'memory', first: 'leo', name: 'Leo', role: 'Memory Manager - notes search', keywords: ['memory'] },
  { id: 'scraper', first: 'victor', name: 'Victor', role: 'Lead Scout - scraper', keywords: ['scout', 'scraper'] },
];

/** Which core agent a task row belongs to (agent_key first, then the display name). */
export function agentIdForTask(t: Pick<Task, 'agent_name'> & { agent_key?: string | null }): string | null {
  if (t.agent_key && ROSTER.some(r => r.id === t.agent_key)) return t.agent_key;
  const n = (t.agent_name || '').toLowerCase();
  const byFirst = ROSTER.find(r => n.startsWith(r.first));
  if (byFirst) return byFirst.id;
  return ROSTER.find(r => r.keywords.some(k => n.includes(k)))?.id ?? null;
}

export type AgentStatus = 'active' | 'busy' | 'idle' | 'offline';

export interface AgentActivity {
  id: string; name: string; role: string;
  status: AgentStatus; metric: string; metricLabel: string;
  running: number; done: number; failed: number; needsApproval: number; queued: number;
}

const DAY = 24 * 3600 * 1000;

/** busy = a task is running now; offline = latest finished task failed (<24h); active = finished/needs approval <24h; else idle. */
export function deriveAgentActivity(tasks: Task[], now = Date.now()): AgentActivity[] {
  return ROSTER.map(r => {
    const mine = tasks.filter(t => agentIdForTask(t) === r.id);
    const c = (s: string) => mine.filter(t => t.status === s).length;
    const running = c('In Progress'), done = c('Completed'), failed = c('Failed'), needsApproval = c('Needs Approval'), queued = c('Pending');
    const recent = mine
      .filter(t => ['Completed', 'Failed', 'Needs Approval'].includes(t.status))
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
    const last = recent[0];
    const lastAt = last ? new Date(last.updated_at || last.created_at).getTime() : 0;
    let status: AgentStatus = 'idle';
    if (running > 0) status = 'busy';
    else if (last && now - lastAt < DAY) status = last.status === 'Failed' ? 'offline' : 'active';
    return {
      id: r.id, name: r.name, role: r.role, status, running, done, failed, needsApproval, queued,
      metric: String(done), metricLabel: mine.length === 0 ? 'no tasks yet' : `done · ${failed} failed · ${needsApproval} awaiting you`,
    };
  });
}
