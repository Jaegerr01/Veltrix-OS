import { Resend } from 'resend';

// Lazy singleton — null when RESEND_API_KEY is not configured
let _resend: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'VELTRIX OS <onboarding@resend.dev>';
