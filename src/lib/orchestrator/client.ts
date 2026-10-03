import { authFetch } from '@/lib/authFetch';
import type { OrchestratorEvent, RunResult, OrchestratorError } from './run';

/** Browser-side helpers for talking to the CEO orchestrator (/api/ceo). Shared by the CEO console and ARIA. */

export class CeoRequestError extends Error {
  code: string; hint?: string; status: number;
  constructor(e: { code?: string; message: string; hint?: string }, status = 0) {
    super(e.message); this.code = e.code || 'ERROR'; this.hint = e.hint; this.status = status;
  }
}

/** Splits an NDJSON buffer into parsed events + the unfinished tail. Malformed lines are skipped. */
export function splitNdjson(buf: string): { events: unknown[]; rest: string } {
  const parts = buf.split('\n');
  const rest = parts.pop() ?? '';
  const events: unknown[] = [];
  for (const p of parts) {
    const line = p.trim();
    if (!line) continue;
    try { events.push(JSON.parse(line)); } catch { /* skip garbage line */ }
  }
  return { events, rest };
}

async function failFrom(res: Response): Promise<CeoRequestError> {
  const data = await res.json().catch(() => ({} as any));
  return new CeoRequestError({ code: data.code, message: data.error || `The server answered ${res.status}.`, hint: data.hint }, res.status);
}

async function readStream(res: Response, onEvent: (e: OrchestratorEvent | { type: 'chat'; message: unknown }) => void, signal?: AbortSignal) {
  if (!res.body) throw new CeoRequestError({ message: 'The server sent no stream.' }, res.status);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    if (signal?.aborted) { try { await reader.cancel(); } catch { /* ignore */ } return; }
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const { events, rest } = splitNdjson(buf);
    buf = rest;
    for (const e of events) onEvent(e as OrchestratorEvent);
  }
  const tail = splitNdjson(buf + '\n').events;
  for (const e of tail) onEvent(e as OrchestratorEvent);
}

/** Streams a run. Resolves when the stream ends; throws CeoRequestError for HTTP-level failures (auth, rate limit, bad input). */
export async function streamCeo(message: string, source: 'ceo' | 'aria' | 'user', onEvent: (e: OrchestratorEvent | { type: 'chat'; message: unknown }) => void, signal?: AbortSignal) {
  let res: Response;
  try {
    res = await authFetch('/api/ceo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, source, stream: true }), signal });
  } catch (e: any) {
    if (e?.name === 'AbortError') return;
    throw new CeoRequestError({ code: 'NETWORK', message: 'Could not reach the server.', hint: 'Check that the app is running and your connection is up.' });
  }
  if (!res.ok) throw await failFrom(res);
  await readStream(res, onEvent, signal);
}

export async function continueCeoRun(runId: string, onEvent: (e: OrchestratorEvent | { type: 'chat'; message: unknown }) => void, signal?: AbortSignal) {
  let res: Response;
  try {
    res = await authFetch('/api/ceo/continue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId }), signal });
  } catch (e: any) {
    if (e?.name === 'AbortError') return;
    throw new CeoRequestError({ code: 'NETWORK', message: 'Could not reach the server.' });
  }
  if (!res.ok) throw await failFrom(res);
  await readStream(res, onEvent, signal);
}

/** Non-streaming call (ARIA). Resolves with the RunResult, or throws CeoRequestError with the real reason. */
export async function askCeoOnce(message: string, source: 'ceo' | 'aria' | 'user', signal?: AbortSignal): Promise<RunResult> {
  let res: Response;
  try {
    res = await authFetch('/api/ceo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, source, voice: source === 'aria', stream: false }), signal });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    throw new CeoRequestError({ code: 'NETWORK', message: 'Could not reach the server.', hint: 'Check that the app is running and your connection is up.' });
  }
  if (!res.ok) throw await failFrom(res);
  const data = await res.json().catch(() => null);
  if (!data) throw new CeoRequestError({ message: 'The server sent an unreadable answer.' }, res.status);
  return data as RunResult;
}

export type { OrchestratorError };
