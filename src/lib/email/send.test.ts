import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
  sendMail: vi.fn(),
  resendSend: vi.fn(),
  sentToday: vi.fn(async () => 0),
}));

vi.mock('./gmail', () => ({
  getGmailTransport: () => ({ sendMail: h.sendMail }),
  GMAIL_FROM: () => 'Barry <b@example.com>',
}));
vi.mock('./resend', () => ({
  getResendClient: () => ({ emails: { send: h.resendSend } }),
  resendFrom: () => 'PostelOS <hi@postel.test>',
}));
vi.mock('./usage', () => ({ countConfirmedSendsToday: h.sentToday }));

import { sendEmail } from './send';

const base = { to: 'lead@acme.com', subject: 'Hello', text: 'Body', sleep: async () => {} };

function env(vars: Record<string, string>) {
  for (const k of ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'EMAIL_PROVIDER', 'OUTREACH_SEND_ENABLED', 'OUTREACH_DAILY_CAP', 'OUTREACH_BLACKLIST', 'OWNER_EMAIL', 'NOTIFY_EMAIL']) {
    vi.stubEnv(k, '');
  }
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
}

beforeEach(() => {
  h.sendMail.mockReset();
  h.resendSend.mockReset();
  h.sentToday.mockReset();
  h.sentToday.mockResolvedValue(0);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllEnvs());

describe('sendEmail - success', () => {
  it('Gmail SMTP: delivered with the provider message id, plain+html, reply-to and unsubscribe', async () => {
    env({ GMAIL_USER: 'b@example.com', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop', OWNER_EMAIL: 'owner@example.com' });
    h.sendMail.mockResolvedValue({ messageId: '<abc@mail.gmail.com>', rejected: [] });
    const r = await sendEmail(base);
    expect(r).toMatchObject({ delivered: true, blocked: false, provider: 'gmail-smtp', messageId: '<abc@mail.gmail.com>', attempts: 1 });
    const arg = h.sendMail.mock.calls[0][0];
    expect(arg.text).toContain('unsubscribe');
    expect(arg.html).toContain('<p');
    expect(arg.replyTo).toBe('owner@example.com');
    expect(arg.headers['List-Unsubscribe']).toContain('owner@example.com');
  });

  it('Resend: delivered only when the API returns an id', async () => {
    env({ RESEND_API_KEY: 're_x', RESEND_FROM_EMAIL: 'PostelOS <hi@postel.test>' });
    h.resendSend.mockResolvedValue({ data: { id: 'rs_123' }, error: null });
    const r = await sendEmail(base);
    expect(r).toMatchObject({ delivered: true, provider: 'resend', messageId: 'rs_123' });
  });
});

describe('sendEmail - failures are never reported as delivered', () => {
  it('Resend {error} (the SDK does not throw) -> NOT delivered, reason carries the provider message', async () => {
    env({ RESEND_API_KEY: 're_x', RESEND_FROM_EMAIL: 'x@y.com' });
    h.resendSend.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'The domain is not verified', statusCode: 403 } });
    const r = await sendEmail(base);
    expect(r.delivered).toBe(false);
    expect(r.blocked).toBe(false);
    expect(r.messageId).toBeUndefined();
    expect(r.reason).toMatch(/not verified/i);
    expect(h.resendSend).toHaveBeenCalledTimes(1); // 403 is not retried
  });

  it('Resend response without an id is not confirmation', async () => {
    env({ RESEND_API_KEY: 're_x', RESEND_FROM_EMAIL: 'x@y.com' });
    h.resendSend.mockResolvedValue({ data: {}, error: null });
    expect((await sendEmail(base)).delivered).toBe(false);
  });

  it('SMTP auth failure -> not delivered, not retried', async () => {
    env({ GMAIL_USER: 'b@example.com', GMAIL_APP_PASSWORD: 'x' });
    h.sendMail.mockRejectedValue(Object.assign(new Error('Invalid login'), { code: 'EAUTH', responseCode: 535 }));
    const r = await sendEmail(base);
    expect(r.delivered).toBe(false);
    expect(r.reason).toMatch(/App Password/);
    expect(h.sendMail).toHaveBeenCalledTimes(1);
  });

  it('transient error is retried with backoff and then succeeds', async () => {
    env({ GMAIL_USER: 'b@example.com', GMAIL_APP_PASSWORD: 'x' });
    const sleep = vi.fn(async () => {});
    h.sendMail
      .mockRejectedValueOnce(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }))
      .mockResolvedValueOnce({ messageId: '<ok@x>', rejected: [] });
    const r = await sendEmail({ ...base, sleep });
    expect(r).toMatchObject({ delivered: true, attempts: 2, messageId: '<ok@x>' });
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('gives up after maxAttempts on persistent transient errors', async () => {
    env({ GMAIL_USER: 'b@example.com', GMAIL_APP_PASSWORD: 'x' });
    h.sendMail.mockRejectedValue(Object.assign(new Error('reset'), { code: 'ECONNRESET' }));
    const r = await sendEmail({ ...base, maxAttempts: 3 });
    expect(r.delivered).toBe(false);
    expect(r.attempts).toBe(3);
  });

  it('rejects an invalid recipient without calling the provider', async () => {
    env({ GMAIL_USER: 'b@example.com', GMAIL_APP_PASSWORD: 'x' });
    const r = await sendEmail({ ...base, to: 'a@b.com\nBcc: evil@x.com' });
    expect(r.delivered).toBe(false);
    expect(h.sendMail).not.toHaveBeenCalled();
  });
});

describe('sendEmail - guardrails block BEFORE any provider call', () => {
  const gmail = { GMAIL_USER: 'b@example.com', GMAIL_APP_PASSWORD: 'x' };

  it('kill switch', async () => {
    env({ ...gmail, OUTREACH_SEND_ENABLED: 'false' });
    const r = await sendEmail(base);
    expect(r).toMatchObject({ delivered: false, blocked: true });
    expect(r.reason).toMatch(/OUTREACH_SEND_ENABLED/);
    expect(h.sendMail).not.toHaveBeenCalled();
  });

  it('daily cap counts confirmed sends', async () => {
    env({ ...gmail, OUTREACH_DAILY_CAP: '5' });
    h.sentToday.mockResolvedValue(5);
    const r = await sendEmail(base);
    expect(r).toMatchObject({ delivered: false, blocked: true });
    expect(r.reason).toMatch(/5\/5/);
    expect(h.sendMail).not.toHaveBeenCalled();
  });

  it('blacklist: exact address, domain and TLD-style entries', async () => {
    env({ ...gmail, OUTREACH_BLACKLIST: 'gov, competitor.com, bad@x.com' });
    for (const to of ['a@city.gov', 'sales@competitor.com', 'bad@x.com']) {
      expect(await sendEmail({ ...base, to })).toMatchObject({ delivered: false, blocked: true });
    }
    expect(h.sendMail).not.toHaveBeenCalled();
    h.sendMail.mockResolvedValue({ messageId: '<m>', rejected: [] });
    expect((await sendEmail({ ...base, to: 'ok@fine.com' })).delivered).toBe(true);
  });

  it('no provider configured -> blocked with the env var names, nothing sent', async () => {
    env({});
    const r = await sendEmail(base);
    expect(r).toMatchObject({ delivered: false, blocked: true });
    expect(r.reason).toMatch(/GMAIL_USER/);
    expect(r.reason).toMatch(/RESEND_API_KEY/);
  });

  it('test emails to the owner are not subject to the outreach kill switch', async () => {
    env({ ...gmail, OUTREACH_SEND_ENABLED: 'false' });
    h.sendMail.mockResolvedValue({ messageId: '<t>', rejected: [] });
    const r = await sendEmail({ ...base, kind: 'test', unsubscribe: false });
    expect(r.delivered).toBe(true);
    expect(h.sendMail.mock.calls[0][0].text).not.toMatch(/unsubscribe/);
  });
});
