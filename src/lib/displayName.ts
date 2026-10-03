// Display-name helpers. The operator's name comes from the profile they saved in
// Settings (localStorage 'vx_display_name'). We never hardcode a person's name in UI
// strings: with no saved name (or only the placeholder) we fall back to generic text.

export const DISPLAY_NAME_KEY = 'vx_display_name';
const PLACEHOLDERS = new Set(['operator', 'postelos operator']);

/** The saved display name exactly as stored (trimmed), or null when absent / placeholder. */
export function cleanDisplayName(raw: string | null | undefined): string | null {
  const name = (raw ?? '').trim();
  if (!name || PLACEHOLDERS.has(name.toLowerCase())) return null;
  return name;
}

/** "Barry's Approval Queue" when a real name is stored (spelled as stored), else "Approval Queue". */
export function approvalQueueTitle(raw: string | null | undefined): string {
  const name = cleanDisplayName(raw);
  if (!name) return 'Approval Queue';
  const possessive = /s$/i.test(name) ? name + "'" : name + "'s";
  return possessive + ' Approval Queue';
}
