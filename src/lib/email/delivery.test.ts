import { describe, it, expect, vi, beforeEach } from 'vitest';

const s = vi.hoisted(() => {
  const state: any = { messages: [], followups: [], proposals: [], leads: [], tasks: [], logs: [] };
  const db = {
    getOutreachMessages: async () => state.messages,
    getFollowups: async () => state.followups,
    getProposals: async () => state.proposals,
    getLeads: async () => state.leads,
    getTasks: async () => state.tasks,
    updateTask: async (id: string, u: any) => { Object.assign(state.tasks.find((t: any) => t.id === id), u); },
    updateLead: async (id: string, u: any) => { Object.assign(state.leads.find((l: any) => l.id === id), u); },
    updateOutreachMessage: async (id: string, u: any) => { Object.assign(state.messages.find((m: any) => m.id === id), u); },
    updateFollowup: async (id: string, u: any) => { Object.assign(state.followups.find((m: any) => m.id === id), u); },
    updateProposal: async (id: string, u: any) => { Object.assign(state.proposals.find((m: any) => m.id === id), u); },
    claimForSending: async (table: string, id: string, from: string[]) => {
      const list = table === 'outreach_messages' ? state.messages : table === 'followups' ? state.followups : state.proposals;
      const r = list.find((x: any) => x.id === id);
      if (!r || !from.includes(r.status)) return false;
      r.status = 'Sending';
      return true;
    },
    logAgentAction: async (...a: any[]) => { state.logs.push(a); },
  };
  return { state, db };
});
vi.mock('../db', () => ({ db: s.db }));

import { deliverRecord, approveAndDeliver, markManuallySent } from './delivery';
import type { SendResult } from './send';

const ok = (id = '<msg-1@gmail>'): SendResult => ({ delivered: true, blocked: false, provider: 'gmail-smtp', messageId: id, attempts: 1 });

beforeEach(() => {
  s.state.leads = [{ id: 'L1', business_name: 'Acme', email: 'lead@acme.com', status: 'Qualified' }];
  s.state.messages = [{ id: 'M1', lead_id: 'L1', channel: 'Email', message: 'Subject: Hi Acme\n\nHello there', status: 'Approved', approval_status: 'Approved' }];
  s.state.followups = [{ id: 'F1', lead_id: 'L1', message: 'Checking in', status: 'Approved' }];
  s.state.proposals = [{ id: 'P1', lead_id: 'L1', title: 'Website', price: 1500, deliverables: ['a'], status: 'Approved' }];
  s.state.tasks = [{ id: 'T1', related_lead_id: 'L1', title: 'Outreach to Acme', status: 'Pending' }];
  s.state.logs = [];
});

describe('deliverRecord - truthful state machine', () => {
  it('success -> Sent with provider, provider_message_id, sent_at; lead Contacted; task Completed', async () => {
    const send = vi.fn(async (_i: any) => ok());
    const r = await deliverRecord('outreach', 'M1', { send });
    expect(r.outcome).toBe('sent');
    const m = s.state.messages[0];
    expect(m).toMatchObject({ status: 'Sent', provider: 'gmail-smtp', provider_message_id: '<msg-1@gmail>', error: null });
    expect(m.sent_at).toBeTruthy();
    expect(s.state.leads[0].status).toBe('Contacted');
    expect(s.state.tasks[0].status).toBe('Completed');
    expect(send.mock.calls[0][0]).toMatchObject({ to: 'lead@acme.com', subject: 'Hi Acme', kind: 'outreach' });
  });

  it('provider error -> Failed with error text and NEVER Sent; lead untouched', async () => {
    const send = vi.fn(async (): Promise<SendResult> => ({ delivered: false, blocked: false, reason: 'Resend: domain not verified', attempts: 1, provider: 'resend' }));
    const r = await deliverRecord('outreach', 'M1', { send });
    expect(r.outcome).toBe('failed');
    const m = s.state.messages[0];
    expect(m.status).toBe('Failed');
    expect(m.error).toMatch(/domain not verified/);
    expect(m.provider_message_id).toBeUndefined();
    expect(m.sent_at).toBeUndefined();
    expect(s.state.leads[0].status).toBe('Qualified');
    expect(s.state.tasks[0].status).toBe('Pending');
  });

  it('a throwing sender is also Failed, not Sent', async () => {
    const r = await deliverRecord('outreach', 'M1', { send: async () => { throw new Error('boom'); } });
    expect(r.outcome).toBe('failed');
    expect(s.state.messages[0].status).toBe('Failed');
  });

  it('kill switch / cap / blacklist (blocked) -> record stays Approved, nothing marked sent', async () => {
    const send = vi.fn(async (): Promise<SendResult> => ({ delivered: false, blocked: true, reason: 'Sending is switched off (OUTREACH_SEND_ENABLED=false)', attempts: 0 }));
    const r = await deliverRecord('outreach', 'M1', { send });
    expect(r.outcome).toBe('blocked');
    expect(s.state.messages[0].status).toBe('Approved');
    expect(s.state.messages[0].error).toMatch(/OUTREACH_SEND_ENABLED/);
    expect(s.state.leads[0].status).toBe('Qualified');
  });

  it('a Draft (unapproved) message is never sent', async () => {
    s.state.messages[0].status = 'Draft';
    const send = vi.fn(async () => ok());
    const r = await deliverRecord('outreach', 'M1', { send });
    expect(r.outcome).toBe('not_approved');
    expect(send).not.toHaveBeenCalled();
  });

  it('Failed can be retried explicitly, and only then', async () => {
    s.state.messages[0].status = 'Failed';
    const send = vi.fn(async () => ok('<retry-ok>'));
    expect((await deliverRecord('outreach', 'M1', { send })).outcome).toBe('not_approved');
    expect((await deliverRecord('outreach', 'M1', { send, retry: true })).outcome).toBe('sent');
    expect(s.state.messages[0].provider_message_id).toBe('<retry-ok>');
  });

  it('already-Sent records are never re-sent (idempotent)', async () => {
    s.state.messages[0].status = 'Sent';
    const send = vi.fn(async () => ok());
    expect((await deliverRecord('outreach', 'M1', { send })).outcome).toBe('already_sent');
    expect(send).not.toHaveBeenCalled();
  });

  it('a second concurrent request cannot double-send (claim fails)', async () => {
    s.state.messages[0].status = 'Sending';
    const send = vi.fn(async () => ok());
    expect((await deliverRecord('outreach', 'M1', { send })).outcome).toBe('in_flight');
    expect(send).not.toHaveBeenCalled();
  });

  it('lead without email -> no_recipient, nothing sent', async () => {
    s.state.leads[0].email = undefined;
    const send = vi.fn(async () => ok());
    expect((await deliverRecord('outreach', 'M1', { send })).outcome).toBe('no_recipient');
    expect(send).not.toHaveBeenCalled();
  });

  it('proposals: lead becomes Proposal Sent only after confirmed delivery', async () => {
    const fail = vi.fn(async (): Promise<SendResult> => ({ delivered: false, blocked: false, reason: 'x', attempts: 1 }));
    await deliverRecord('proposal', 'P1', { send: fail });
    expect(s.state.proposals[0].status).toBe('Failed');
    expect(s.state.leads[0].status).toBe('Qualified');
    const r = await deliverRecord('proposal', 'P1', { send: async () => ok('<p-1>'), retry: true });
    expect(r.outcome).toBe('sent');
    expect(s.state.proposals[0]).toMatchObject({ status: 'Sent', provider_message_id: '<p-1>' });
    expect(s.state.leads[0].status).toBe('Proposal Sent');
  });

  it('follow-ups: Sent only with a message id', async () => {
    const r = await deliverRecord('followup', 'F1', { send: async () => ok('<f-1>') });
    expect(r.outcome).toBe('sent');
    expect(s.state.followups[0]).toMatchObject({ status: 'Sent', provider_message_id: '<f-1>' });
  });

  it('approveAndDeliver approves a Draft first, then delivers', async () => {
    s.state.messages[0].status = 'Draft';
    s.state.messages[0].approval_status = 'Pending Approval';
    const r = await approveAndDeliver('outreach', 'M1', { send: async () => ok() });
    expect(r.outcome).toBe('sent');
    expect(s.state.messages[0].approval_status).toBe('Approved');
  });
});

describe('markManuallySent - owner attestation', () => {
  it('records provider=manual proof for a social DM and is excluded from the email cap', async () => {
    s.state.messages[0].channel = 'LinkedIn';
    s.state.messages[0].status = 'Approved';
    const r = await markManuallySent('outreach', 'M1');
    expect(r.outcome).toBe('sent');
    expect(s.state.messages[0]).toMatchObject({ status: 'Sent', provider: 'manual', provider_message_id: 'manual:M1' });
    const { isConfirmedSendToday } = await import('./usage');
    expect(isConfirmedSendToday(s.state.messages[0])).toBe(false);
  });

  it('refuses to attest an Email-channel message (email needs provider confirmation)', async () => {
    const r = await markManuallySent('outreach', 'M1');
    expect(r.outcome).toBe('not_approved');
    expect(s.state.messages[0].status).toBe('Approved');
  });
});

