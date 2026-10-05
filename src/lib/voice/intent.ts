/**
 * Voice intent routing for ARIA. Deliberately conservative: navigation only happens when the user clearly
 * asks to open something ("open leads"), so ordinary instructions like "email the dentist leads" go to the CEO
 * orchestrator instead of being swallowed by a keyword match.
 */
export type VoiceIntent =
  | { kind: 'navigate'; path: string; label: string }
  | { kind: 'status' }
  | { kind: 'stop' }
  | { kind: 'ask'; text: string };

const ROUTES: Array<{ keys: string[]; path: string; label: string }> = [
  { keys: ['ceo console', 'ceo', 'mission board', 'console'], path: '/ceo', label: 'the CEO console' },
  { keys: ['command center', 'approvals', 'approval queue'], path: '/command-center', label: 'the command center' },
  { keys: ['leads', 'lead list', 'lead'], path: '/leads', label: 'leads' },
  { keys: ['revenue', 'finance', 'earnings'], path: '/revenue', label: 'revenue' },
  { keys: ['outreach', 'outbox'], path: '/outreach', label: 'outreach' },
  { keys: ['follow ups', 'follow up', 'followups', 'followup'], path: '/follow-ups', label: 'follow-ups' },
  { keys: ['proposals', 'proposal', 'quotes'], path: '/proposals', label: 'proposals' },
  { keys: ['clients', 'client list'], path: '/clients', label: 'clients' },
  { keys: ['projects', 'project'], path: '/projects', label: 'projects' },
  { keys: ['tasks', 'task list', 'to do'], path: '/tasks', label: 'tasks' },
  { keys: ['memory', 'notes', 'vault'], path: '/memory', label: 'memory' },
  { keys: ['content', 'writer'], path: '/content', label: 'the content writer' },
  { keys: ['reports', 'report'], path: '/reports', label: 'reports' },
  { keys: ['settings', 'email settings'], path: '/settings', label: 'settings' },
  { keys: ['system status', 'health'], path: '/health', label: 'system health' },
  { keys: ['dashboard', 'home', 'main page'], path: '/', label: 'the dashboard' },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ').trim();

export function parseVoiceIntent(raw: string): VoiceIntent {
  const t = norm(raw);
  if (!t) return { kind: 'ask', text: raw.trim() };

  if (/^(stop|cancel|quiet|be quiet|shut up|never ?mind|that'?s enough|enough)( aria)?$/.test(t)) return { kind: 'stop' };

  const nav = t.match(/^(?:aria )?(?:please )?(?:open|go to|show me|show|take me to|navigate to|switch to|bring up)\s+(?:the |my )?(.+)$/);
  if (nav) {
    const target = nav[1];
    // longest key wins so "command center" beats "center"-like partials
    let best: { path: string; label: string; len: number } | null = null;
    for (const r of ROUTES) for (const k of r.keys) {
      if (target === k || target.startsWith(k + ' ') || target.endsWith(' ' + k)) {
        if (!best || k.length > best.len) best = { path: r.path, label: r.label, len: k.length };
      }
    }
    if (best) return { kind: 'navigate', path: best.path, label: best.label };
  }

  if (/\b(system|agent|business|pipeline|overall)? ?status( report)?\b/.test(t) && t.split(' ').length <= 6) return { kind: 'status' };
  if (/^how (are|is) (we|things|everything|the business) (doing|going)\b/.test(t)) return { kind: 'status' };

  return { kind: 'ask', text: raw.trim() };
}
