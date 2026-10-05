import type { VxIconName } from '@/components/ds/VxIcon';

/**
 * Single registry of every page in the app. The sidebar, the top bar title, the command palette,
 * the document <title> and the "go to" keyboard shortcuts are all derived from this list, so a route
 * can never exist in one place and be missing from another.
 */
export type NavGroup = 'Overview' | 'Pipeline' | 'Intelligence' | 'System';

export interface NavRoute {
  path: string;
  label: string;
  /** Short section label shown above the page title. */
  eyebrow: string;
  icon: VxIconName;
  group: NavGroup;
  /** Extra words the command palette matches on. */
  keywords: string[];
  /** Press "g" then this key to jump here. */
  key?: string;
}

export const NAV_ROUTES: NavRoute[] = [
  { path: '/', label: 'Dashboard', eyebrow: 'Overview', icon: 'grid', group: 'Overview', keywords: ['home', 'status', 'overview'], key: 'd' },
  { path: '/ceo', label: 'CEO Console', eyebrow: 'Overview', icon: 'crown', group: 'Overview', keywords: ['agent', 'chat', 'mission', 'ai', 'ask'], key: 'c' },
  { path: '/command-center', label: 'Command Center', eyebrow: 'Overview', icon: 'terminal', group: 'Overview', keywords: ['approvals', 'queue', 'autopilot'], key: 'a' },
  { path: '/revenue', label: 'Revenue', eyebrow: 'Overview', icon: 'dollar', group: 'Overview', keywords: ['money', 'income', 'paid'], key: 'r' },
  { path: '/leads', label: 'Leads', eyebrow: 'Pipeline', icon: 'users', group: 'Pipeline', keywords: ['prospects', 'crm', 'scraper'], key: 'l' },
  { path: '/outreach', label: 'Outreach', eyebrow: 'Pipeline', icon: 'send', group: 'Pipeline', keywords: ['email', 'drafts', 'send', 'messages'], key: 'o' },
  { path: '/follow-ups', label: 'Follow-ups', eyebrow: 'Pipeline', icon: 'refresh', group: 'Pipeline', keywords: ['reminders', 'bump'], key: 'f' },
  { path: '/proposals', label: 'Proposals', eyebrow: 'Pipeline', icon: 'doc', group: 'Pipeline', keywords: ['quote', 'pricing'], key: 'p' },
  { path: '/clients', label: 'Clients', eyebrow: 'Pipeline', icon: 'briefcase', group: 'Pipeline', keywords: ['customers', 'retainer'] },
  { path: '/projects', label: 'Projects', eyebrow: 'Pipeline', icon: 'folder', group: 'Pipeline', keywords: ['delivery', 'deadline'] },
  { path: '/memory', label: 'Memory Vault', eyebrow: 'Intelligence', icon: 'brain', group: 'Intelligence', keywords: ['notes', 'vault', 'constitution', 'markdown', 'second brain'], key: 'm' },
  { path: '/reel-intel', label: 'Reel Intel', eyebrow: 'Intelligence', icon: 'target', group: 'Intelligence', keywords: ['instagram', 'analyze', 'video'] },
  { path: '/reels', label: 'Reel Scripts', eyebrow: 'Intelligence', icon: 'camera', group: 'Intelligence', keywords: ['script', 'generator', 'video'] },
  { path: '/content', label: 'Content', eyebrow: 'Intelligence', icon: 'megaphone', group: 'Intelligence', keywords: ['posts', 'social', 'ideas'] },
  { path: '/reports', label: 'Reports', eyebrow: 'Intelligence', icon: 'chartbar', group: 'Intelligence', keywords: ['daily brief', 'summary'] },
  { path: '/tasks', label: 'Tasks', eyebrow: 'System', icon: 'usercheck', group: 'System', keywords: ['kanban', 'agents', 'todo'], key: 't' },
  { path: '/health', label: 'System Status', eyebrow: 'System', icon: 'activity', group: 'System', keywords: ['health', 'diagnostics', 'env', 'keys'], key: 'h' },
  { path: '/settings', label: 'Settings', eyebrow: 'System', icon: 'gear', group: 'System', keywords: ['email', 'profile', 'api keys', 'preferences'], key: 's' },
  { path: '/privacy', label: 'Privacy', eyebrow: 'System', icon: 'shield', group: 'System', keywords: ['policy', 'data'] },
];

export const NAV_GROUPS: NavGroup[] = ['Overview', 'Pipeline', 'Intelligence', 'System'];

export function routeFor(pathname: string | null | undefined): NavRoute | undefined {
  if (!pathname) return undefined;
  return NAV_ROUTES.find(r => r.path === pathname) ?? NAV_ROUTES.find(r => r.path !== '/' && pathname.startsWith(r.path + '/'));
}

export function documentTitle(pathname: string | null | undefined): string {
  const r = routeFor(pathname);
  return r ? `${r.label} \u00b7 PostelOS` : 'PostelOS';
}
