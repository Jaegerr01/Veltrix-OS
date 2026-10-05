import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Gmail transport via nodemailer. Two auth modes (OAuth2 wins if both are configured):
 *
 *  - OAuth2 (recommended for Workspace / no app passwords):
 *      GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
 *      (create an OAuth client in Google Cloud, scope https://mail.google.com/, get a refresh token
 *       via the OAuth Playground; nodemailer refreshes the access token itself.)
 *  - SMTP app password (simplest): GMAIL_USER + GMAIL_APP_PASSWORD
 *      (Google Account -> Security -> 2-Step Verification -> App passwords.)
 *
 * Optional: GMAIL_FROM_NAME. Returns null when neither mode is configured.
 */
export type GmailMode = 'oauth' | 'smtp';

export function gmailMode(env: NodeJS.ProcessEnv = process.env): GmailMode | null {
  if (!env.GMAIL_USER) return null;
  if (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN) return 'oauth';
  if (env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '')) return 'smtp';
  return null;
}

let _transport: Transporter | null = null;
let _key = '';

export function getGmailTransport(): Transporter | null {
  const mode = gmailMode();
  if (!mode) return null;
  const user = process.env.GMAIL_USER as string;
  // Rebuild the transport if credentials changed (hot env reload / settings fix) - never serve a stale one.
  const key = `${mode}:${user}:${process.env.GMAIL_APP_PASSWORD?.length ?? 0}:${process.env.GMAIL_REFRESH_TOKEN?.length ?? 0}`;
  if (_transport && _key === key) return _transport;

  const timeouts = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };
  _transport = nodemailer.createTransport(
    mode === 'oauth'
      ? {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          ...timeouts,
          auth: {
            type: 'OAuth2',
            user,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          },
        }
      : {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          ...timeouts,
          auth: { user, pass: (process.env.GMAIL_APP_PASSWORD as string).replace(/\s+/g, '') },
        }
  );
  _key = key;
  return _transport;
}

export const GMAIL_FROM = () =>
  process.env.GMAIL_FROM_NAME
    ? `${process.env.GMAIL_FROM_NAME} <${process.env.GMAIL_USER}>`
    : process.env.GMAIL_USER || '';
