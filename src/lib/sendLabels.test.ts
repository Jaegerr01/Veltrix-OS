import { describe, it, expect } from 'vitest';
import { describeSendState } from './sendLabels';

describe('describeSendState - UI never claims a send without proof', () => {
  it('Sent with provider id -> Sent', () => {
    expect(describeSendState({ status: 'Sent', provider: 'resend', provider_message_id: 'abc' })).toEqual({ label: 'Sent', tone: 'ok' });
  });
  it('Sent WITHOUT proof (legacy lie) -> flagged Unverified, not green', () => {
    const r = describeSendState({ status: 'Sent' });
    expect(r.tone).toBe('warn');
    expect(r.label).toMatch(/Unverified/);
  });
  it('manual attestation is labelled as such', () => {
    expect(describeSendState({ status: 'Sent', provider: 'manual', provider_message_id: 'manual:1' }).label).toMatch(/manually/);
  });
  it('Approved is "not sent yet"; Failed is red; Sending is busy; drafts awaiting approval are labelled', () => {
    expect(describeSendState({ status: 'Approved' }).label).toMatch(/not sent yet/);
    expect(describeSendState({ status: 'Failed' }).tone).toBe('bad');
    expect(describeSendState({ status: 'Sending' }).tone).toBe('busy');
    expect(describeSendState({ status: 'Draft', approval_status: 'Pending Approval' }).label).toBe('Awaiting approval');
    expect(describeSendState({ status: 'Drafted' }).label).toBe('Draft');
  });
  it('rejected messages say Rejected', () => {
    expect(describeSendState({ status: 'Draft', approval_status: 'Rejected' }).label).toBe('Rejected');
  });
});
