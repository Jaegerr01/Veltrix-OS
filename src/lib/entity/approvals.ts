import { db } from '../db';
import type { ApprovalRequest, EntityDepartment, ApprovalRequestType, OutreachSendPayload } from '../types';

/**
 * Entity Phase 1 — the propose-then-approve backbone.
 *
 * Doctrine (Obsidian → Entity/VELTRIX Constitution.md, Article 3):
 * every action that crosses the entity's boundary into the world becomes an
 * approval request. Barry approves, edits, or rejects. Nothing external
 * executes without a decision.
 *
 * Two invariants this module enforces:
 *  1. A rejected card NEVER executes.
 *  2. Approval does NOT bypass the hard guardrails — approved outreach still
 *     goes through sendOutreachEmail's kill switch, daily cap, and blacklist.
 *     (Barry approved the message; the guardrails protect the domain.)
 */

export async function requestApproval(opts: {
  type: ApprovalRequestType;
  department: EntityDepartment;
  createdByAgent: string;
  title: string;
  context?: string;
  payload: Record<string, unknown>;
  recommendation?: string;
  confidence?: number;
}): Promise<ApprovalRequest> {
  const request = await db.addApprovalRequest({
    type: opts.type,
    department: opts.department,
    created_by_agent: opts.createdByAgent,
    title: opts.title,
    context: opts.context,
    payload: opts.payload,
    recommendation: opts.recommendation,
    confidence: opts.confidence,
  });

  await db.logAgentAction(
    opts.createdByAgent,
    'Approval Requested',
    `type=${opts.type}, department=${opts.department}, requestId=${request.id}`,
    opts.title,
    'Success'
  );

  return request;
}

export interface DecisionResult {
  success: boolean;
  request?: ApprovalRequest | null;
  executionNote?: string;
  error?: string;
}

/**
 * Decide a pending request. On approve, the action executes immediately.
 * `editedPayload` lets Barry modify the action (e.g. rewrite the email text)
 * — the original stays in `payload`, what actually ran goes to
 * `decision_payload`. The diff between them is Phase 4 learning data.
 */
export async function decideApprovalRequest(opts: {
  id: string;
  decision: 'approve' | 'reject';
  editedPayload?: Record<string, unknown>;
  rejectionReason?: string;
}): Promise<DecisionResult> {
  const { id, decision, editedPayload, rejectionReason } = opts;

  const all = await db.getApprovalRequests();
  const request = all.find(r => r.id === id);
  if (!request) return { success: false, error: 'Approval request not found.' };
  if (request.status !== 'pending') {
    return { success: false, error: `Request already ${request.status}.` };
  }

  const now = new Date().toISOString();

  if (decision === 'reject') {
    const updated = await db.updateApprovalRequest(id, {
      status: 'rejected',
      rejection_reason: rejectionReason || 'Rejected by operator.',
      decided_at: now,
    });
    await db.logAgentAction(
      'Governance',
      'Approval Rejected',
      `requestId=${id}, type=${request.type}`,
      rejectionReason || 'Rejected by operator.',
      'Success'
    );
    return { success: true, request: updated };
  }

  // ── Approve: execute the action ──────────────────────────────────────────
  const effectivePayload = editedPayload ?? request.payload;
  let executionNote = '';

  try {
    switch (request.type) {
      case 'outreach_send': {
        executionNote = await executeOutreachSend(effectivePayload as unknown as OutreachSendPayload);
        break;
      }
      case 'goal_ratification': {
        // Dynamic import — cascade.ts imports requestApproval from this module.
        const { instantiateCascade } = await import('./cascade');
        executionNote = await instantiateCascade(effectivePayload as any);
        break;
      }
      default:
        // Non-executable types (playbook_edit, structural, goal_ratification…)
        // are decisions-of-record in Phase 1; later phases wire up execution.
        executionNote = 'Approved as decision of record (no automated execution for this type yet).';
    }
  } catch (err: any) {
    executionNote = `Execution failed: ${err?.message || err}`;
  }

  const updated = await db.updateApprovalRequest(id, {
    status: editedPayload ? 'approved_edited' : 'approved',
    decision_payload: effectivePayload,
    execution_result: executionNote,
    decided_at: now,
  });

  await db.logAgentAction(
    'Governance',
    'Approval Granted',
    `requestId=${id}, type=${request.type}, edited=${!!editedPayload}`,
    executionNote,
    executionNote.startsWith('Execution failed') ? 'Failure' : 'Success'
  );

  return { success: true, request: updated, executionNote };
}

/**
 * Execute an approved outreach send. Constitutional rule: the message state
 * only becomes "Sent" if the email verifiably left the building.
 */
async function executeOutreachSend(payload: OutreachSendPayload): Promise<string> {
  const { leadId, outreachMessageId, to, subject, text } = payload;
  if (!to || !text) throw new Error('Payload missing recipient or message text.');

  const { sendOutreachEmail } = await import('../email/send');

  // autonomous:true keeps the kill switch / daily cap / blacklist active.
  // Barry approved the CONTENT; the guardrails protect the sending domain.
  const result = await sendOutreachEmail({ to, subject: subject || 'Outreach from VELTRIX', text, autonomous: true });

  if (result.delivered) {
    if (outreachMessageId) {
      await db.updateOutreachMessage(outreachMessageId, {
        approval_status: 'Approved',
        status: 'Sent',
        sent_at: new Date().toISOString(),
        message: text, // persist Barry's edits if any
      });
    }
    if (leadId) {
      await db.updateLead(leadId, { status: 'Proposal Sent' });
    }
    return `Delivered via ${result.provider} to ${to}.`;
  }

  // Not delivered — message stays Draft, lead status untouched. Never phantom-Sent.
  return `NOT delivered — ${result.reason}. Message remains Draft.`;
}
