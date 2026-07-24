import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => ({
  db: {
    getApprovalRequests: vi.fn(),
    updateApprovalRequest: vi.fn((id: string, patch: any) => Promise.resolve({ id, ...patch })),
    logAgentAction: vi.fn(),
    updateOutreachMessage: vi.fn(),
    updateLead: vi.fn(),
  },
}));

vi.mock('../email/send', () => ({
  sendOutreachEmail: vi.fn(),
}));

import { db } from '../db';
import { sendOutreachEmail } from '../email/send';
import { decideApprovalRequest } from './approvals';

const mockedDb = vi.mocked(db);
const mockedSend = vi.mocked(sendOutreachEmail);

function pendingRequest(payloadOverride: Record<string, unknown> = {}) {
  return {
    id: 'req1',
    type: 'outreach_send',
    department: 'revenue',
    created_by_agent: 'Emma',
    title: 'Send outreach',
    payload: {
      leadId: 'lead1',
      outreachMessageId: 'msg1',
      channel: 'Email',
      to: 'lead@x.com',
      subject: 'Hi',
      text: 'Body',
      ...payloadOverride,
    },
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

describe('decideApprovalRequest — outreach_send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('never executes a rejected request', async () => {
    mockedDb.getApprovalRequests.mockResolvedValue([pendingRequest()] as any);
    const result = await decideApprovalRequest({ id: 'req1', decision: 'reject', rejectionReason: 'no' });
    expect(result.success).toBe(true);
    expect(mockedSend).not.toHaveBeenCalled();
    expect(mockedDb.updateOutreachMessage).not.toHaveBeenCalled();
    expect(mockedDb.updateApprovalRequest).toHaveBeenCalledWith('req1', expect.objectContaining({ status: 'rejected' }));
  });

  it('sends a delivered Email approval through the guarded sender and marks it Sent', async () => {
    mockedDb.getApprovalRequests.mockResolvedValue([pendingRequest()] as any);
    mockedSend.mockResolvedValue({ delivered: true, provider: 'gmail' });
    const result = await decideApprovalRequest({ id: 'req1', decision: 'approve' });
    expect(mockedSend).toHaveBeenCalledWith(expect.objectContaining({ to: 'lead@x.com', autonomous: true }));
    expect(mockedDb.updateOutreachMessage).toHaveBeenCalledWith('msg1', expect.objectContaining({ status: 'Sent' }));
    expect(mockedDb.updateLead).toHaveBeenCalledWith('lead1', { status: 'Proposal Sent' });
    expect(result.executionNote).toMatch(/Delivered via gmail/);
  });

  it('leaves the message as Draft when the guarded sender refuses delivery', async () => {
    mockedDb.getApprovalRequests.mockResolvedValue([pendingRequest()] as any);
    mockedSend.mockResolvedValue({ delivered: false, reason: 'Daily send cap reached (15/15).' });
    const result = await decideApprovalRequest({ id: 'req1', decision: 'approve' });
    expect(mockedDb.updateOutreachMessage).not.toHaveBeenCalled();
    expect(mockedDb.updateLead).not.toHaveBeenCalled();
    expect(result.executionNote).toMatch(/NOT delivered/);
  });

  it('marks a social DM approval Sent without calling the email sender (assisted send)', async () => {
    mockedDb.getApprovalRequests.mockResolvedValue([
      pendingRequest({ channel: 'LinkedIn', to: undefined, subject: undefined, profileUrl: 'https://linkedin.com/in/someone' }),
    ] as any);
    const result = await decideApprovalRequest({ id: 'req1', decision: 'approve' });
    expect(mockedSend).not.toHaveBeenCalled();
    expect(mockedDb.updateOutreachMessage).toHaveBeenCalledWith('msg1', expect.objectContaining({ status: 'Sent' }));
    expect(mockedDb.updateLead).toHaveBeenCalledWith('lead1', { status: 'Contacted' });
    expect(result.executionNote).toMatch(/LinkedIn DM confirmed sent/);
  });
});
