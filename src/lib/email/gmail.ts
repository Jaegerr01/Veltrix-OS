import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Gmail SMTP transport (App Password auth).
 *
 * Setup: Google Account → Security → 2-Step Verification → App passwords.
 * .env.local:
 *   GMAIL_USER=you@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *
 * Null when not configured, mirroring the Resend client pattern so callers
 * can fall through to the next provider.
 */
let _transport: Transporter | null = null;

export function getGmailTransport(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  if (!user || !pass) return null;
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }
  return _transport;
}

export const GMAIL_FROM = () =>
  process.env.GMAIL_FROM_NAME
    ? `${process.env.GMAIL_FROM_NAME} <${process.env.GMAIL_USER}>`
    : process.env.GMAIL_USER || '';
