import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => ({
  db: {
    getApprovalRequests: vi.fn(),
    updateApprovalRequest: vi.fn((id: string, patch: any) => Promise.resolve({ id, ...patch })),
    logAgentAction: vi.fn(),
    updateOutreachMessage: vi.fn(),
    updateFollowup: vi.fn(),
    updateProposal: vi.fn(),
    updateLead: vi.fn(),
  },
}));

vi.mock('../email/delivery', () => ({
  deliverRecord: vi.fn(),
}));

import { db } from '../db';
import { deliverRecord } from '../email/delivery';
import { decideApprovalRequest } from './approvals';

const mockedDb = vi.mocked(db);
const mockedDeliver = vi.mocked(deliverRecord);

function request(over: Record<string, unknown> = {}, payloadOverride: Record<string, unknown> = {}) {
  return {
    id: 'req1',
    type: 'outreach_send',
    department: 'revenue',
    created_by_agent: 'Emma',
    title: 'Send outreach',
    payload: { leadId: 'lead1', outreachMessageId: 'msg1', channel: 'Email', to: 'lead@x.com', subject: 'Hi', text: 'Body', ...payloadOverride },
    status: 'pending',
    created_at: new Date().toISOString(),
    ...over,
  };
}

describe('decideApprovalRequest', () => {
  beforeEach(() => vi.clearAllMocks());

  it('never executes a rejected request', async () => {
    mockedDb.getApprovalRequests.mockResolvedValue([request()] as any);
    const result = await decideApprovalRequest({ id: 'req1', decision: 'reject', rejectionReason: 'no' });
    expect(result.success).toBe(true);
    expect(mockedDeliver).not.toHaveBeenCalled();
    expect(mockedDb.updateOutreachMessage).not.toHaveBeenCalled();
    expect(mockedDb.updateApprovalRequest).toHaveBeenCalledWith('req1', expect.objectContaining({ status: 'rejected' }));
  });

  it('approved email: goes through the delivery pipeline; approval is "approved" only when delivered', async () => {
    mockedDb.getApprovalRequests.mockResolvedValue([request()] as any);
    mockedDeliver.mockResolvedValue({ outcome: 'sent', message: 'Delivered via gmail-smtp to lead@x.com', providerMessageId: '<id>' } as any);
    const result = await decideApprovalRequest({ id: 'req1', decision: 'approve' });
    expect(mockedDeliver).toHaveBeenCalledWith('outreach', 'msg1', expect.anything());
    expect(mockedDb.updateOutreachMessage).toHaveBeenCalledWith('msg1', expect.objectContaining({ status: 'Approved', approval_status: 'Approved' }));
    expect(mockedDb.updateApprovalRequest).toHaveBeenCalledWith('req1', expect.objectContaining({ status: 'approved' }));
    expect(result.executed).toBe(true);
  });

  it('approved but provider failed -> approval is marked failed (retryable), never "approved"', async () => {
    mockedDb.getApprovalRequests.mockResolvedValue([request()] as any);
    mockedDeliver.mockResolvedValue({ outcome: 'failed', message: 'Send failed - Resend: domain not verified' } as any);
    const result = await decideApprovalRequest({ id: 'req1', decision: 'approve' });
    expect(mockedDb.updateApprovalRequest).toHaveBeenCalledWith('req1', expect.objectContaining({ status: 'failed', execution_result: expect.stringMatching(/domain not verified/) }));
    expect(result.executed).toBe(false);
  });

  it('approved but blocked by guardrail (cap/kill switch) -> failed status, nothing marked Sent', async () => {
    mockedDb.getApprovalRequests.mockResolvedValue([request()] as any);
    mockedDeliver.mockResolvedValue({ outcome: 'blocked', message: 'Not sent - Daily send cap reached (15/15).' } as any);
    const result = await decideApprovalRequest({ id: 'req1', decision: 'approve' });
    expect(result.executed).toBe(false);
    expect(mockedDb.updateApprovalRequest).toHaveBeenCalledWith('req1', expect.objectContaining({ status: 'failed' }));
    expect(mockedDb.updateLead).not.toHaveBeenCalled();
  });

  it('a failed request can be retried (approve again), an approved one cannot', async () => {
    mockedDeliver.mockResolvedValue({ outcome: 'sent', message: 'ok', providerMessageId: 'x' } as any);
    mockedDb.getApprovalRequests.mockResolvedValue([request({ status: 'failed' })] as any);
    expect((await decideApprovalRequest({ id: 'req1', decision: 'approve' })).success).toBe(true);
    mockedDb.getApprovalRequests.mockResolvedValue([request({ status: 'approved' })] as any);
    expect((await decideApprovalRequest({ id: 'req1', decision: 'approve' })).success).toBe(false);
  });

  it('follow-up approvals use the same pipeline', async () => {
    mockedDb.getApprovalRequests.mockResolvedValue([request({ type: 'followup_send', payload: { followupId: 'f1', leadId: 'lead1', text: 'edited' } })] as any);
    mockedDeliver.mockResolvedValue({ outcome: 'sent', message: 'ok', providerMessageId: 'x' } as any);
    await decideApprovalRequest({ id: 'req1', decision: 'approve' });
    expect(mockedDb.updateFollowup).toHaveBeenCalledWith('f1', expect.objectContaining({ status: 'Approved' }));
    expect(mockedDeliver).toHaveBeenCalledWith('followup', 'f1', expect.anything());
  });

  it('proposal approvals use the same pipeline', async () => {
    mockedDb.getApprovalRequests.mockResolvedValue([request({ type: 'proposal_send', payload: { proposalId: 'p1', leadId: 'lead1' } })] as any);
    mockedDeliver.mockResolvedValue({ outcome: 'failed', message: 'nope' } as any);
    const r = await decideApprovalRequest({ id: 'req1', decision: 'approve' });
    expect(mockedDeliver).toHaveBeenCalledWith('proposal', 'p1', expect.anything());
    expect(r.executed).toBe(false);
  });

  it('social DM approval is an owner attestation: provider=manual with a manual id (not an email send)', async () => {
    mockedDb.getApprovalRequests.mockResolvedValue([
      request({}, { channel: 'LinkedIn', to: undefined, subject: undefined, profileUrl: 'https://linkedin.com/in/someone' }),
    ] as any);
    const result = await decideApprovalRequest({ id: 'req1', decision: 'approve' });
    expect(mockedDeliver).not.toHaveBeenCalled();
    expect(mockedDb.updateOutreachMessage).toHaveBeenCalledWith('msg1', expect.objectContaining({ status: 'Sent', provider: 'manual', provider_message_id: 'manual:msg1' }));
    expect(mockedDb.updateLead).toHaveBeenCalledWith('lead1', { status: 'Contacted' });
    expect(result.executionNote).toMatch(/manual, owner-attested/);
  });
});
