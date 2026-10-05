import { db } from '../db';
import { geminiConfigured } from '../ai/gemini';
import { getEmailStatus } from '../email/status';

export interface CeoStatus {
  ai: { configured: boolean; envVar: 'GEMINI_API_KEY'; model: string };
  tasks: { queued: number; running: number; done: number; failed: number; blocked: number; needsApproval: number; total: number };
  approvalsPending: number;
  email: { ready: boolean; sentToday: number; cap: number; provider: string | null; problems: string[] };
  /** Plain-language readout built ONLY from the counts above - safe for ARIA to speak. */
  spoken: string;
}

export async function getCeoStatus(): Promise<CeoStatus> {
  const [tasks, approvals, email] = await Promise.all([
    db.getTasks(),
    db.getApprovalRequests('pending'),
    getEmailStatus().catch(() => null),
  ]);
  const n = (s: string) => tasks.filter(t => t.status === s).length;
  const t = {
    queued: n('Pending'), running: n('In Progress'), done: n('Completed'), failed: n('Failed'),
    blocked: n('Blocked'), needsApproval: n('Needs Approval'), total: tasks.length,
  };
  const ai = { configured: geminiConfigured(), envVar: 'GEMINI_API_KEY' as const, model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' };
  const em = {
    ready: !!email?.ready, sentToday: email?.cap.sentToday ?? 0, cap: email?.cap.limit ?? 0,
    provider: email?.selected ?? null, problems: email?.problems ?? ['Email status unavailable.'],
  };

  const bits: string[] = [];
  bits.push(ai.configured ? 'The AI is connected.' : 'The AI is not connected: the Gemini API key is missing.');
  bits.push(`You have ${t.queued} queued, ${t.running} running, ${t.needsApproval} awaiting approval, ${t.failed} failed and ${t.done} completed tasks.`);
  bits.push(`${approvals.length} approval${approvals.length === 1 ? ' is' : 's are'} pending.`);
  bits.push(em.provider ? `Email is set up through ${em.provider}; ${em.sentToday} of ${em.cap} sent today.` : 'Email is not configured, so nothing can be sent yet.');
  return { ai, tasks: t, approvalsPending: approvals.length, email: em, spoken: bits.join(' ') };
}
