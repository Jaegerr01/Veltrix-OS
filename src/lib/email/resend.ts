import { Resend } from 'resend';

// Lazy singleton - null when RESEND_API_KEY is not configured
let _resend: Resend | null = null;
let _key = '';

export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend || _key !== key) {
    _resend = new Resend(key);
    _key = key;
  }
  return _resend;
}

export const DEFAULT_RESEND_FROM = 'PostelOS <onboarding@resend.dev>';

/** Sender for Resend. Must be on a domain verified in Resend, or Resend rejects the send. */
export const resendFrom = () => process.env.RESEND_FROM_EMAIL || DEFAULT_RESEND_FROM;

/** @deprecated evaluated at import time; prefer resendFrom(). Kept for existing callers. */
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || DEFAULT_RESEND_FROM;
