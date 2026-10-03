/**
 * Single source of truth for brand strings.
 *
 * NOTE: the e-mail addresses below are PLACEHOLDERS (hello@postel.studio is
 * not a verified mailbox/domain). Override them in the environment:
 *   NEXT_PUBLIC_SUPPORT_EMAIL  – shown in the UI (privacy page, settings)
 *   OWNER_EMAIL                – server-side owner/admin contact
 */
export const BRAND = {
  name: 'PostelOS',
  studio: 'Postel Studio',
  tagline: 'PostelOS — the AI command center by Postel Studio',
  short: 'The AI command center by Postel Studio',
} as const;

/** Client-safe (NEXT_PUBLIC_*) support contact. Placeholder default, unverified. */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@postel.studio';

/** Server-side owner contact. Placeholder default, unverified. */
export const OWNER_EMAIL = process.env.OWNER_EMAIL || process.env.NOTIFY_EMAIL || SUPPORT_EMAIL;