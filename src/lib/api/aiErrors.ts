import { NextResponse } from 'next/server';
import { isAiError } from '../ai/errors';

/** Uniform JSON error for AI/route failures: explicit code + plain-language fix hint, never a fake success. */
export function aiErrorResponse(e: unknown, fallbackStatus = 500) {
  if (isAiError(e)) {
    const err = e as any;
    const status = err.code === 'NOT_CONFIGURED' ? 503 : err.code === 'QUOTA' ? 429 : err.code === 'INVALID_KEY' ? 502 : err.code === 'TIMEOUT' ? 504 : 502;
    return NextResponse.json({ success: false, code: err.code, error: err.message, hint: err.hint }, { status });
  }
  console.error('[api] unexpected error:', e);
  return NextResponse.json({ success: false, code: 'ERROR', error: 'Something went wrong on the server. Check the server log.' }, { status: fallbackStatus });
}
