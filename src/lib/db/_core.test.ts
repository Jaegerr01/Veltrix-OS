import { describe, it, expect, vi, beforeEach } from 'vitest';

async function loadCore() {
  vi.resetModules();
  vi.doMock('../supabase/client', () => ({ supabase: {} }));
  vi.doMock('../supabase/admin', () => ({ supabaseAdmin: {} }));
  return import('./_core');
}

describe('safeRead', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns the value when the read succeeds', async () => {
    const { safeRead } = await loadCore();
    await expect(safeRead(async () => [1, 2], [], 'getThings')).resolves.toEqual([1, 2]);
  });

  // An empty list is an honest answer to "what do you have?" — unlike a write,
  // a failed read has a safe neutral result.
  it('falls back rather than throwing when the read fails', async () => {
    const { safeRead } = await loadCore();
    const boom = async () => {
      throw new Error('connection reset');
    };
    await expect(safeRead(boom, [], 'getThings')).resolves.toEqual([]);
  });
});

describe('safeWrite', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns the persisted row when the write succeeds', async () => {
    const { safeWrite } = await loadCore();
    await expect(safeWrite(async () => ({ id: 'real-1' }), 'addThing')).resolves.toEqual({
      id: 'real-1',
    });
  });

  // Regression test for silent data loss: this used to swallow the error and
  // return a caller-supplied object with a synthetic `mock-…` id, so a failed
  // insert was indistinguishable from a real one and the route replied 200.
  it('throws instead of fabricating a successful-looking row', async () => {
    const { safeWrite, DbWriteError } = await loadCore();
    const boom = async () => {
      throw new Error('duplicate key value violates unique constraint');
    };
    await expect(safeWrite(boom, 'addThing')).rejects.toBeInstanceOf(DbWriteError);
  });

  it('keeps the driver error off the user-facing message but retains it as cause', async () => {
    const { safeWrite } = await loadCore();
    const driverError = new Error('relation "public.leads" does not exist');
    const boom = async () => {
      throw driverError;
    };

    await expect(safeWrite(boom, 'addLead')).rejects.toMatchObject({
      message: "We couldn't save that. Please try again.",
      context: 'addLead',
      cause: driverError,
    });
  });

  it('flags an invalid schema so the UI can surface a setup problem', async () => {
    const { safeWrite, schemaState } = await loadCore();
    expect(schemaState.isSchemaInvalid).toBe(false);

    const missingTable = Object.assign(new Error('relation does not exist'), { code: '42P01' });
    await expect(safeWrite(async () => { throw missingTable; }, 'addLead')).rejects.toThrow();

    expect(schemaState.isSchemaInvalid).toBe(true);
  });
});
