import { describe, expect, it } from 'vitest';
import { dueState, formatBytes, makeCheckoutUrl, sortRecords, validateBackup } from '../../src/utils';
import type { RepairRecord } from '../../src/types';

describe('proof book utility rules', () => {
  it('classifies due dates relative to the local day', () => {
    const now = new Date('2026-08-28T09:00:00');
    expect(dueState('2026-08-27', now)).toBe('overdue');
    expect(dueState('2026-08-28', now)).toBe('soon');
    expect(dueState('2026-09-27', now)).toBe('soon');
    expect(dueState('2026-10-01', now)).toBe('later');
    expect(dueState('', now)).toBe('none');
  });

  it('uses the slug-only Sociobot checkout contract', () => {
    expect(makeCheckoutUrl()).toBe('https://api.sociobot.in/api/v1/products/maintenance-proof-book/checkout');
    expect(makeCheckoutUrl('home+owner@example.com')).toContain('email=home%2Bowner%40example.com');
  });

  it('accepts only the versioned product backup envelope', () => {
    expect(validateBackup({ format: 'maintenance-proof-book', version: 1, property: { name: 'Home', address: '' }, records: [] })).toBe(true);
    expect(validateBackup({ format: 'other', version: 1, property: {}, records: [] })).toBe(false);
  });

  it('sorts completed work newest first and formats limits', () => {
    const base = { id: '', title: '', area: '', contractor: '', vendor: '', part: '', cost: null, notes: '', nextDue: '', nextAction: '', attachments: [], createdAt: '', updatedAt: '' };
    const records = [{ ...base, id: 'old', completedDate: '2024-01-01' }, { ...base, id: 'new', completedDate: '2026-01-01' }] as RepairRecord[];
    expect(sortRecords(records).map((record) => record.id)).toEqual(['new', 'old']);
    expect(formatBytes(10 * 1024 * 1024)).toBe('10.0 MB');
  });
});
