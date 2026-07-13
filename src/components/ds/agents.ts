import type { VxIconName } from './VxIcon';

/** Agent roster + telemetry seed data, ported from the design prototype. */

export interface AgentDef {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'busy' | 'idle' | 'offline';
  metric: string;
  metricLabel: string;
  iconName: VxIconName;
}

export const AGENT_DEFS: AgentDef[] = [
  { id: 'sales', name: 'Sales Director', role: 'Pipeline & Deal Strategy', status: 'active', metric: '$284K', metricLabel: 'pipeline', iconName: 'dollar' },
  { id: 'outreach', name: 'Outreach AI', role: 'Cold Email & Sequencing', status: 'active', metric: '142', metricLabel: 'emails sent', iconName: 'mail' },
  { id: 'leadgen', name: 'Lead Gen AI', role: 'Prospecting & Enrichment', status: 'busy', metric: '38', metricLabel: 'new leads', iconName: 'target' },
  { id: 'marketing', name: 'Marketing AI', role: 'Campaigns & Content', status: 'active', metric: '12.4K', metricLabel: 'reach', iconName: 'megaphone' },
  { id: 'finance', name: 'Finance AI', role: 'Invoicing & Collections', status: 'idle', metric: '$92K', metricLabel: 'collected', iconName: 'chartbar' },
  { id: 'pm', name: 'Project Manager AI', role: 'Task & Timeline Ops', status: 'active', metric: '24', metricLabel: 'tasks done', iconName: 'clipboard' },
  { id: 'support', name: 'Customer Support AI', role: 'Tickets & Retention', status: 'active', metric: '97%', metricLabel: 'CSAT', iconName: 'headset' },
  { id: 'appt', name: 'Appointment Setter', role: 'Scheduling & Calendars', status: 'busy', metric: '31', metricLabel: 'booked', iconName: 'calendar' },
];

export const STATUS_COLOR: Record<string, string> = {
  active: 'var(--signal-400)',
  busy: 'var(--warn-400)',
  idle: 'var(--mist-400)',
  offline: 'var(--danger-400)',
};

export const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  busy: 'Working',
  idle: 'Idle',
  offline: 'Offline',
};

export interface ActivityDef {
  time: string;
  tone: 'info' | 'brand' | 'active' | 'warn';
  text: string;
}

export const ACTIVITY_DEFS: ActivityDef[] = [
  { time: '09:41', tone: 'info', text: 'outreach.agent ▸ SENT 142 emails · 38% open' },
  { time: '09:38', tone: 'brand', text: 'lead-gen.agent ▸ QUALIFIED 6 new leads' },
  { time: '09:22', tone: 'active', text: 'finance.agent ▸ INVOICE #2291 paid · $12,400' },
  { time: '09:15', tone: 'active', text: 'support.agent ▸ RESOLVED ticket #884 · CSAT 5/5' },
  { time: '08:57', tone: 'info', text: 'appointment.agent ▸ BOOKED demo · Nordic Retail' },
  { time: '08:40', tone: 'brand', text: 'marketing.agent ▸ CAMPAIGN "Q3 Launch" → 12.4K reach' },
  { time: '08:12', tone: 'warn', text: 'lead-gen.agent ▸ SYNC delayed · retrying' },
];
