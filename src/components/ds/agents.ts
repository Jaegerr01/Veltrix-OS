import type { VxIconName } from './VxIcon';

/**
 * Agent roster identity for the UI. NO metrics or statuses live here: those are derived from the
 * tasks table at runtime (see lib/agentActivity.ts + components/useAgentRoster.ts).
 */
export interface AgentDef {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'busy' | 'idle' | 'offline';
  metric: string;
  metricLabel: string;
  iconName: VxIconName;
}

export const AGENT_ICONS: Record<string, VxIconName> = {
  ceo: 'crown', revenue: 'dollar', sales: 'target', leadResearch: 'search', outreach: 'mail', followup: 'refresh',
  proposal: 'doc', content: 'megaphone', delivery: 'clipboard', memory: 'brain', scraper: 'users',
};

export const STATUS_COLOR: Record<string, string> = {
  active: 'var(--signal-400)',
  busy: 'var(--warn-400)',
  idle: 'var(--mist-400)',
  offline: 'var(--danger-400)',
};

export const STATUS_LABEL: Record<string, string> = {
  active: 'Finished work in the last 24h',
  busy: 'Working now',
  idle: 'Idle',
  offline: 'Last task failed',
};
