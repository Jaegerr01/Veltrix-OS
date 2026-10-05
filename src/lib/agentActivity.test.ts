import { describe, it, expect } from 'vitest';
import { deriveAgentActivity, agentIdForTask } from './agentActivity';
import type { Task } from './types';

const T = (o: Partial<Task>): Task => ({ id: 'x', title: 't', agent_name: '', priority: 'Low', status: 'Pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...o } as Task);

describe('agent roster is derived from real tasks only', () => {
  it('with no tasks every agent is idle with zero metrics (no invented numbers)', () => {
    const r = deriveAgentActivity([]);
    expect(r).toHaveLength(11);
    expect(r.every(a => a.status === 'idle' && a.metric === '0' && a.metricLabel === 'no tasks yet')).toBe(true);
  });
  it('maps tasks by agent_key, display name and legacy names', () => {
    expect(agentIdForTask(T({ agent_name: 'Emma (Outreach Agent)' }))).toBe('outreach');
    expect(agentIdForTask(T({ agent_name: 'Follow-up Agent' }))).toBe('followup');
    expect(agentIdForTask(T({ agent_name: 'whatever', agent_key: 'proposal' } as any))).toBe('proposal');
    expect(agentIdForTask(T({ agent_name: 'Mystery' }))).toBeNull();
  });
  it('running -> busy; recent failure -> offline; recent success -> active; old -> idle', () => {
    const now = Date.now();
    const old = new Date(now - 3 * 24 * 3600 * 1000).toISOString();
    const r = deriveAgentActivity([
      T({ agent_name: 'Emma (Outreach Agent)', status: 'In Progress' }),
      T({ agent_name: 'Daniel (Lead Research Agent)', status: 'Failed' }),
      T({ agent_name: 'Ryan (Content Agent)', status: 'Completed' }),
      T({ agent_name: 'Leo (Memory Manager Agent)', status: 'Completed', updated_at: old, created_at: old }),
    ], now);
    const by = Object.fromEntries(r.map(a => [a.id, a.status]));
    expect(by).toMatchObject({ outreach: 'busy', leadResearch: 'offline', content: 'active', memory: 'idle', ceo: 'idle' });
  });
});
