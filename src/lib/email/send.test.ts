import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../db', () => ({
  db: { getOutreachMessages: vi.fn() },
}));
vi.mock('./gmail', () => ({
  getGmailTransport: vi.fn(),
  GMAIL_FROM: () => 'Test <test@example.com>',
}));
vi.mock('./resend', () => ({
  getResendClient: vi.fn(),
  FROM_EMAIL: 'PostelOS <test@example.com>',
}));

import { db } from '../db';
import { getGmailTransport } from './gmail';
import { getResendClient } from './resend';
import { sendOutreachEmail } from './send';

const mockedDb = vi.mocked(db);
const mockedGmail = vi.mocked(getGmailTransport);
const mockedResend = vi.mocked(getResendClient);

describe('sendOutreachEmail', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedDb.getOutreachMessages.mockResolvedValue([]);
    mockedGmail.mockReturnValue(null);
    mockedResend.mockReturnValue(null);
    process.env = { ...originalEnv };
    delete process.env.OUTREACH_SEND_ENABLED;
    delete process.env.OUTREACH_DAILY_CAP;
    delete process.env.OUTREACH_BLACKLIST;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects an invalid recipient regardless of autonomy', async () => {
    const result = await sendOutreachEmail({ to: 'not-an-email', subject: 's', text: 't', autonomous: false });
    expect(result.delivered).toBe(false);
    expect(result.reason).toMatch(/invalid recipient/i);
  });

  it('blocks autonomous sends when the kill switch is off', async () => {
    process.env.OUTREACH_SEND_ENABLED = 'false';
    mockedGmail.mockReturnValue({ sendMail: vi.fn() } as any);
    const result = await sendOutreachEmail({ to: 'lead@x.com', subject: 's', text: 't', autonomous: true });
    expect(result.delivered).toBe(false);
    expect(result.reason).toMatch(/kill switch/i);
  });

  it('blocks autonomous sends to a blacklisted domain', async () => {
    process.env.OUTREACH_BLACKLIST = 'rival.com';
    mockedGmail.mockReturnValue({ sendMail: vi.fn() } as any);
    const result = await sendOutreachEmail({ to: 'owner@rival.com', subject: 's', text: 't', autonomous: true });
    expect(result.delivered).toBe(false);
    expect(result.reason).toMatch(/blacklist/i);
  });

  it('blocks autonomous sends once the daily cap is reached', async () => {
    process.env.OUTREACH_DAILY_CAP = '2';
    const today = new Date().toISOString();
    mockedDb.getOutreachMessages.mockResolvedValue([
      { status: 'Sent', sent_at: today },
      { status: 'Sent', sent_at: today },
    ] as any);
    mockedGmail.mockReturnValue({ sendMail: vi.fn() } as any);
    const result = await sendOutreachEmail({ to: 'lead@x.com', subject: 's', text: 't', autonomous: true });
    expect(result.delivered).toBe(false);
    expect(result.reason).toMatch(/daily send cap/i);
  });

  it('lets a human-approved (non-autonomous) send bypass the kill switch', async () => {
    process.env.OUTREACH_SEND_ENABLED = 'false';
    const sendMail = vi.fn().mockResolvedValue({});
    mockedGmail.mockReturnValue({ sendMail } as any);
    const result = await sendOutreachEmail({ to: 'lead@x.com', subject: 's', text: 't', autonomous: false });
    expect(result.delivered).toBe(true);
    expect(sendMail).toHaveBeenCalledOnce();
  });

  it('sends via Gmail when configured, without touching Resend', async () => {
    const sendMail = vi.fn().mockResolvedValue({});
    mockedGmail.mockReturnValue({ sendMail } as any);
    const result = await sendOutreachEmail({ to: 'lead@x.com', subject: 's', text: 't', autonomous: true });
    expect(result.delivered).toBe(true);
    expect(result.provider).toBe('gmail');
    expect(mockedResend).not.toHaveBeenCalled();
  });

  it('falls back to Resend when Gmail send fails', async () => {
    const sendMail = vi.fn().mockRejectedValue(new Error('smtp down'));
    mockedGmail.mockReturnValue({ sendMail } as any);
    const send = vi.fn().mockResolvedValue({});
    mockedResend.mockReturnValue({ emails: { send } } as any);
    const result = await sendOutreachEmail({ to: 'lead@x.com', subject: 's', text: 't', autonomous: true });
    expect(result.delivered).toBe(true);
    expect(result.provider).toBe('resend');
    expect(send).toHaveBeenCalledOnce();
  });

  it('refuses to send when no provider is configured', async () => {
    const result = await sendOutreachEmail({ to: 'lead@x.com', subject: 's', text: 't', autonomous: true });
    expect(result.delivered).toBe(false);
    expect(result.reason).toMatch(/no email provider configured/i);
  });
});
