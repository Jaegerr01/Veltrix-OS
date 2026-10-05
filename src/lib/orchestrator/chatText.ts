import type { RunResult, RunTaskStatus } from './run';

const LABEL: Record<RunTaskStatus, string> = {
  queued: 'QUEUED', running: 'RUNNING', done: 'DONE', failed: 'FAILED', blocked: 'BLOCKED', needs_approval: 'NEEDS YOUR APPROVAL',
};

/** The chat-history text for a finished run: only what really happened. */
export function runToChatText(r: RunResult): string {
  if (r.error) return `I could not do that: ${r.error.message}${r.error.hint ? ` ${r.error.hint}` : ''}`;
  const lines: string[] = [];
  if (r.reply) lines.push(r.reply);
  if (r.tasks.length) {
    lines.push('', 'Mission board:');
    for (const t of r.tasks) {
      lines.push(`- [${LABEL[t.status]}] ${t.agentName}: ${t.title}${t.error ? ` - ${t.error}` : ''}`);
    }
    if (r.summary) lines.push('', r.summary);
  }
  return lines.join('\n').trim();
}

/** What ARIA says after a run (short, truthful, no markdown). */
export function runToSpoken(r: RunResult): string {
  if (r.error) return `${r.error.message} ${r.error.hint ?? ''}`.trim();
  if (!r.tasks.length) return r.reply;
  const head = r.reply ? `${r.reply} ` : '';
  return `${head}${r.summary}`.replace(/\s+/g, ' ').trim();
}
