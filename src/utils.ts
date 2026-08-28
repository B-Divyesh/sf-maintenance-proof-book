import type { ProofBookBackup, RepairRecord } from './types';

export const PRODUCT_SLUG = 'maintenance-proof-book';
export const FREE_RECORD_LIMIT = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_RECORD_BYTES = 50 * 1024 * 1024;

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatDate(value: string): string {
  if (!value) return 'Not set';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function dueState(nextDue: string, now = new Date()): 'overdue' | 'soon' | 'later' | 'none' {
  if (!nextDue) return 'none';
  const due = new Date(`${nextDue}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return 'overdue';
  if (days <= 30) return 'soon';
  return 'later';
}

export function makeCheckoutUrl(email = ''): string {
  const base = `https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/checkout`;
  return email ? `${base}?email=${encodeURIComponent(email)}` : base;
}

export function validateBackup(value: unknown): value is ProofBookBackup {
  if (!value || typeof value !== 'object') return false;
  const backup = value as Partial<ProofBookBackup>;
  return backup.format === 'maintenance-proof-book' && backup.version === 1 &&
    !!backup.property && typeof backup.property.name === 'string' &&
    typeof backup.property.address === 'string' && Array.isArray(backup.records) &&
    backup.records.every((record) => typeof record?.id === 'string' && typeof record?.title === 'string' &&
      [record.area, record.completedDate, record.contractor, record.vendor, record.part, record.notes, record.nextDue, record.nextAction, record.createdAt, record.updatedAt].every((field) => typeof field === 'string') &&
      (record.cost === null || typeof record.cost === 'number') &&
      Array.isArray(record.attachments) && record.attachments.every((attachment) =>
        typeof attachment?.id === 'string' && typeof attachment.name === 'string' && typeof attachment.type === 'string' &&
        typeof attachment.size === 'number' && typeof attachment.addedAt === 'string' && typeof attachment.data === 'string'));
}

export function sortRecords(records: RepairRecord[]): RepairRecord[] {
  return [...records].sort((a, b) => b.completedDate.localeCompare(a.completedDate) || b.updatedAt.localeCompare(a.updatedAt));
}
