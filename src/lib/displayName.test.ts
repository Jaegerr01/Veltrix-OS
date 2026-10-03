import { describe, it, expect } from 'vitest';
import { approvalQueueTitle, cleanDisplayName } from './displayName';

describe('approvalQueueTitle (derived from the saved profile name, never hardcoded)', () => {
  it('falls back to a generic title with no name or only a placeholder', () => {
    expect(approvalQueueTitle(null)).toBe('Approval Queue');
    expect(approvalQueueTitle(undefined)).toBe('Approval Queue');
    expect(approvalQueueTitle('')).toBe('Approval Queue');
    expect(approvalQueueTitle('   ')).toBe('Approval Queue');
    expect(approvalQueueTitle('Operator')).toBe('Approval Queue');
    expect(approvalQueueTitle('PostelOS Operator')).toBe('Approval Queue');
  });
  it('spells the stored name exactly', () => {
    expect(approvalQueueTitle('Barry')).toBe("Barry's Approval Queue");
    expect(approvalQueueTitle('  Berry  ')).toBe("Berry's Approval Queue");
    expect(approvalQueueTitle('Shl adl')).toBe("Shl adl's Approval Queue");
    expect(approvalQueueTitle('James')).toBe("James' Approval Queue");
  });
  it('cleanDisplayName trims and rejects placeholders', () => {
    expect(cleanDisplayName(' Barry ')).toBe('Barry');
    expect(cleanDisplayName('operator')).toBeNull();
  });
});
