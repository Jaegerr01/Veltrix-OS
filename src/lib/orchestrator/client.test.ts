import { describe, it, expect, vi } from 'vitest';
vi.mock('@/lib/authFetch', () => ({ authFetch: vi.fn() }));
import { splitNdjson } from './client';

describe('splitNdjson', () => {
  it('returns complete lines and keeps the partial tail', () => {
    const r = splitNdjson('{"type":"plan"}\n{"type":"task","x":1}\n{"type":"do');
    expect(r.events).toEqual([{ type: 'plan' }, { type: 'task', x: 1 }]);
    expect(r.rest).toBe('{"type":"do');
  });
  it('skips malformed lines without throwing', () => {
    expect(splitNdjson('nope\n{"a":1}\n').events).toEqual([{ a: 1 }]);
  });
});
