/**
 * The single account that owns this PostelOS instance.
 * Read strictly from env (never from the brand placeholder) so that a missing
 * OWNER_EMAIL is a visible, fixable misconfiguration rather than a silent default.
 */
export function getOwnerEmail(env: NodeJS.ProcessEnv = process.env): string | null {
  const v = (env.OWNER_EMAIL || env.NOTIFY_EMAIL || '').trim().toLowerCase();
  return v || null;
}

export function isOwnerEmail(email: string | null | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  const owner = getOwnerEmail(env);
  return !!owner && !!email && email.trim().toLowerCase() === owner;
}
