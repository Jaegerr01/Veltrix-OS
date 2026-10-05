import { asErr } from '../errors';
/**
 * Typed AI failures. Every AI-dependent path surfaces one of these to the UI instead of
 * pretending ("simulator mode"). `hint` is the plain-language fix shown to the operator.
 */
export type AiErrorCode =
  | 'NOT_CONFIGURED'
  | 'INVALID_KEY'
  | 'QUOTA'
  | 'TIMEOUT'
  | 'UNAVAILABLE'
  | 'MODEL_NOT_FOUND'
  | 'BLOCKED'
  | 'BAD_OUTPUT'
  | 'UNKNOWN';

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly hint: string;
  /** Provider-suggested wait, ms (QUOTA / UNAVAILABLE). */
  readonly retryAfterMs?: number;

  constructor(code: AiErrorCode, message: string, hint: string, retryAfterMs?: number) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.hint = hint;
    this.retryAfterMs = retryAfterMs;
  }

  /** One sentence for the UI / for ARIA to speak. */
  get userMessage(): string {
    return `${this.message} ${this.hint}`.trim();
  }
}

export function isAiError(e: unknown): e is AiError {
  return e instanceof AiError || (typeof e === 'object' && e !== null && (e as { name?: string }).name === 'AiError');
}

const KEY_HINT =
  'Create a key at https://aistudio.google.com/apikey, put it in GEMINI_API_KEY (.env.local locally, Netlify > Site settings > Environment variables in production) and redeploy/restart.';

export const notConfigured = () =>
  new AiError('NOT_CONFIGURED', 'The AI is not connected: GEMINI_API_KEY is not set.', KEY_HINT);

function retryDelayMs(msg: string): number | undefined {
  const m = msg.match(/"?retryDelay"?\s*:?\s*"?(\d+(?:\.\d+)?)s"?/i);
  if (!m) return undefined;
  const s = Number(m[1]);
  return Number.isFinite(s) && s > 0 ? Math.ceil(s * 1000) + 750 : undefined;
}

/** Map any thrown value from the Gemini SDK / network to a typed AiError. */
export function classifyAiError(e: unknown): AiError {
  if (isAiError(e)) return e as AiError;
  const er = asErr(e);
  const msg = String(er.message ?? e ?? 'Unknown error');
  const low = msg.toLowerCase();
  const status = Number(er.status ?? er.statusCode ?? 0);

  if (low.includes('api key not valid') || low.includes('api_key_invalid') || low.includes('api key expired') || status === 401) {
    return new AiError('INVALID_KEY', 'Google rejected the Gemini API key (invalid or revoked).', KEY_HINT);
  }
  if (status === 403 || low.includes('permission_denied') || low.includes('has not been used') || low.includes('is disabled') || low.includes('403')) {
    return new AiError(
      'INVALID_KEY',
      'Google denied access for this Gemini API key (403).',
      'Enable the "Generative Language API" for the key\'s project, or create a fresh key at https://aistudio.google.com/apikey and update GEMINI_API_KEY.'
    );
  }
  if (status === 429 || low.includes('429') || low.includes('resource_exhausted') || low.includes('resource has exhausted') || low.includes('quota')) {
    const ms = retryDelayMs(msg);
    return new AiError(
      'QUOTA',
      'Gemini rate limit / quota reached.',
      `Wait ${ms ? Math.ceil(ms / 1000) : 60} seconds and try again, or upgrade the Gemini plan if this keeps happening.`,
      ms
    );
  }
  if (status === 404 || low.includes('is not found for api version') || low.includes('models/') && low.includes('not found')) {
    return new AiError(
      'MODEL_NOT_FOUND',
      'The configured Gemini model does not exist for this key.',
      'Set GEMINI_MODEL to a current model such as gemini-2.5-flash (or gemini-flash-latest).'
    );
  }
  if (low.includes('safety') || low.includes('blocked') || low.includes('prohibited')) {
    return new AiError('BLOCKED', 'Gemini declined to answer this request (safety filter).', 'Rephrase the request.');
  }
  if (low.includes('abort') || low.includes('deadline') || low.includes('timeout') || low.includes('timed out') || low.includes('etimedout')) {
    return new AiError('TIMEOUT', 'The AI took too long to answer.', 'Try again; if it persists, check that the server can reach generativelanguage.googleapis.com.');
  }
  if (status >= 500 || low.includes('503') || low.includes('overloaded') || low.includes('service unavailable') || low.includes('fetch failed') || low.includes('econn') || low.includes('enotfound')) {
    return new AiError('UNAVAILABLE', 'The AI service is unreachable or overloaded right now.', 'Try again in a few seconds. If it persists, check the server\'s internet access and Google AI status.', retryDelayMs(msg));
  }
  return new AiError('UNKNOWN', `The AI request failed: ${msg.slice(0, 200)}`, 'Check the server log for details.');
}
