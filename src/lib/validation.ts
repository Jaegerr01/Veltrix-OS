import { NextResponse } from 'next/server';

/**
 * Small hand-rolled validators for API request bodies.
 *
 * Deliberately not a schema library: the routes here validate a handful of
 * fields each, and adding a dependency for that would be more surface than it
 * saves. The job is narrow — reject the wrong type, and put an upper bound on
 * anything that reaches a model prompt or a filesystem walk, so request cost
 * isn't caller-controlled.
 */

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

/** Sensible ceilings by role. Generous enough that no real input hits them. */
export const LIMITS = {
  /** Short identifiers, commands, enum-ish values. */
  token: 200,
  /** A prompt-sized field: a chat message, a topic, a note. */
  prompt: 4_000,
  /** A long-form body: a proposal, pasted research, an email draft. */
  body: 20_000,
} as const;

export function validateText(
  value: unknown,
  field: string,
  { max = LIMITS.prompt, required = true }: { max?: number; required?: boolean } = {}
): Validated<string> {
  if (value === undefined || value === null || value === '') {
    if (required) return { ok: false, error: `${field} is required.` };
    return { ok: true, value: '' };
  }
  if (typeof value !== 'string') {
    return { ok: false, error: `${field} must be text.` };
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    return { ok: false, error: `${field} is required.` };
  }
  if (trimmed.length > max) {
    return { ok: false, error: `${field} is too long (max ${max.toLocaleString()} characters).` };
  }
  return { ok: true, value: trimmed };
}

/** Turns a failed validation into the 400 every route already returns. */
export function badRequest(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 });
}
