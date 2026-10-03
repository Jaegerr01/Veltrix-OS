/**
 * Single source of truth for brand strings.
 *
 * Official contact address: hello@postelstudio.com. For PostelOS to SEND from it, the domain
 * postelstudio.com must be verified in Resend (SPF + DKIM DNS records). Override in the environment:
 *   NEXT_PUBLIC_SUPPORT_EMAIL  – shown in the UI (privacy page, settings)
 *   OWNER_EMAIL                – server-side owner/admin contact
 */
export const BRAND = {
  name: 'PostelOS',
  studio: 'Postel Studio',
  tagline: 'PostelOS — the AI command center by Postel Studio',
  short: 'The AI command center by Postel Studio',
} as const;

/** Client-safe (NEXT_PUBLIC_*) support contact (official address). */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@postelstudio.com';

/** Server-side owner contact (falls back to the official address). */
export const OWNER_EMAIL = process.env.OWNER_EMAIL || process.env.NOTIFY_EMAIL || SUPPORT_EMAIL;