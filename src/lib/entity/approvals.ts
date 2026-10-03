import { db } from '../db';
import type { ApprovalRequest, EntityDepartment, ApprovalRequestType, OutreachSendPayload, RecordSendPayload } from '../types';

/**
 * Entity Phase 1 — the propose-then-approve backbone.
 *
 * Doctrine (PostelOS Constitution (Memory Vault note "Constitution"), Article 3):
 * every action that crosses the entity's boundary into the world becomes an
 * approval request. Barry approves, edits, or rejects. Nothing external
 * executes without a decision.
 *
 * Two invariants this module enforces:
 *  1. A rejected card NEVER executes.
 *  2. Approval does NOT bypass the hard guardrails — approved sends still
 *     go through the kill switch, daily cap, and blacklist (lib/email/send.ts).
 *     (Barry approved the message; the guardrails protect the domain.)
 *  3. An approval whose execution did not really happen is recorded as 'failed'
 *     (with the reason), never as a success. It can be retried.
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
  /** false when the approved action did NOT actually happen (see executionNote). */
  executed?: boolean;
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
  if (request.status !== 'pending' && request.status !== 'failed') {
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
  let ok = true;

  try {
    switch (request.type) {
      case 'outreach_send': {
        ({ ok, note: executionNote } = await executeOutreachSend(effectivePayload as unknown as OutreachSendPayload));
        break;
      }
      case 'followup_send': {
        ({ ok, note: executionNote } = await executeRecordSend('followup', effectivePayload as unknown as RecordSendPayload));
        break;
      }
      case 'proposal_send': {
        ({ ok, note: executionNote } = await executeRecordSend('proposal', effectivePayload as unknown as RecordSendPayload));
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
    ok = false;
    executionNote = `Execution failed: ${err?.message || err}`;
  }

  const updated = await db.updateApprovalRequest(id, {
    status: !ok ? 'failed' : editedPayload ? 'approved_edited' : 'approved',
    decision_payload: effectivePayload,
    execution_result: executionNote,
    decided_at: now,
  });

  await db.logAgentAction(
    'Governance',
    'Approval Granted',
    `requestId=${id}, type=${request.type}, edited=${!!editedPayload}`,
    executionNote,
    ok ? 'Success' : 'Failure'
  );

  return { success: true, request: updated, executionNote, executed: ok };
}

interface ExecOutcome { ok: boolean; note: string }

/**
 * Execute an approved outreach send.
 * Email -> guarded send through lib/email/delivery.ts; the message becomes Sent ONLY with a
 *          provider message id, otherwise Failed (provider error) or Approved (blocked) - never phantom-Sent.
 * Social channels (LinkedIn/Instagram/Discord/...) -> assisted send: Barry's approval IS his attestation
 *          that he copied + sent the DM himself (provider='manual'). No bot automation on social.
 */
async function executeOutreachSend(payload: OutreachSendPayload): Promise<ExecOutcome> {
  const { leadId, outreachMessageId, channel, text, profileUrl } = payload;
  if (!text) throw new Error('Payload missing message text.');

  if (channel && channel !== 'Email') {
    if (outreachMessageId) {
      const ts = new Date().toISOString();
      await db.updateOutreachMessage(outreachMessageId, {
        approval_status: 'Approved',
        status: 'Sent',
        sent_at: ts,
        provider: 'manual',
        provider_message_id: `manual:${outreachMessageId}`,
        message: text,
      });
    }
    if (leadId) await db.updateLead(leadId, { status: 'Contacted' });
    return { ok: true, note: `${channel} DM marked sent by Barry (manual, owner-attested)${profileUrl ? ` -> ${profileUrl}` : ''}. Lead moved to Contacted.` };
  }

  if (!outreachMessageId) throw new Error('Payload missing outreachMessageId.');
  // Persist any edits Barry made, then approve + deliver via the single send pipeline.
  await db.updateOutreachMessage(outreachMessageId, { message: text, approval_status: 'Approved', status: 'Approved', error: null });
  const { deliverRecord } = await import('../email/delivery');
  const r = await deliverRecord('outreach', outreachMessageId, { retry: true });
  return { ok: r.outcome === 'sent' || r.outcome === 'already_sent', note: r.message };
}

async function executeRecordSend(kind: 'followup' | 'proposal', payload: RecordSendPayload): Promise<ExecOutcome> {
  const id = kind === 'followup' ? payload.followupId : payload.proposalId;
  if (!id) throw new Error(`Payload missing ${kind}Id.`);
  if (kind === 'followup') {
    await db.updateFollowup(id, { ...(payload.text ? { message: payload.text } : {}), status: 'Approved', error: null });
  } else {
    await db.updateProposal(id, { status: 'Approved', error: null });
  }
  const { deliverRecord } = await import('../email/delivery');
  const r = await deliverRecord(kind, id, { retry: true });
  return { ok: r.outcome === 'sent' || r.outcome === 'already_sent', note: r.message };
}
