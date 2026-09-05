import type { Attachment, ProofBookBackup, PropertyProfile, RepairRecord } from './types';
import { validateBackup } from './utils';

const REAL_DB_NAME = 'maintenance-proof-book';
const DEMO_DB_NAME = 'demo:maintenance-proof-book';
const DB_VERSION = 1;
let activeDbName = REAL_DB_NAME;

export function configureDatabase(demo: boolean): void {
  activeDbName = demo ? DEMO_DB_NAME : REAL_DB_NAME;
}

export function databaseName(): string {
  return activeDbName;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('The local database could not be read.'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('The local database change could not be saved.'));
    tx.onabort = () => reject(tx.error ?? new Error('The local database change was cancelled.'));
  });
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(activeDbName, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('records')) db.createObjectStore('records', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Private storage is unavailable in this browser.'));
  });
}

export async function clearBook(): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(['records', 'settings'], 'readwrite');
    tx.objectStore('records').clear();
    tx.objectStore('settings').clear();
    await txDone(tx);
  } finally { db.close(); }
}

export async function getAllRecords(): Promise<RepairRecord[]> {
  const db = await openDatabase();
  try {
    return await requestResult(db.transaction('records').objectStore('records').getAll());
  } finally { db.close(); }
}

export async function saveRecord(record: RepairRecord): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction('records', 'readwrite');
    tx.objectStore('records').put(record);
    await txDone(tx);
  } finally { db.close(); }
}

export async function removeRecord(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction('records', 'readwrite');
    tx.objectStore('records').delete(id);
    await txDone(tx);
  } finally { db.close(); }
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await openDatabase();
  try {
    const row = await requestResult<{ key: string; value: T } | undefined>(db.transaction('settings').objectStore('settings').get(key));
    return row?.value ?? fallback;
  } finally { db.close(); }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key, value });
    await txDone(tx);
  } finally { db.close(); }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('An attachment could not be read.'));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(data: string): Blob {
  const [meta, encoded] = data.split(',');
  if (!meta || !encoded || !meta.startsWith('data:')) throw new Error('An attachment in this backup is invalid.');
  const type = meta.match(/^data:([^;]+)/)?.[1] ?? 'application/octet-stream';
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type });
}

export async function createBackup(property: PropertyProfile, records: RepairRecord[]): Promise<ProofBookBackup> {
  return {
    format: 'maintenance-proof-book',
    version: 1,
    exportedAt: new Date().toISOString(),
    property,
    records: await Promise.all(records.map(async (record) => ({
      ...record,
      attachments: await Promise.all(record.attachments.map(async ({ blob, ...attachment }) => ({
        ...attachment,
        data: await blobToDataUrl(blob)
      })))
    })))
  };
}

export async function restoreBackup(value: unknown): Promise<{ property: PropertyProfile; records: RepairRecord[] }> {
  if (!validateBackup(value)) throw new Error('This is not a Maintenance Proof Book v1 backup.');
  const records = value.records.map((record) => ({
    ...record,
    attachments: record.attachments.map(({ data, ...attachment }): Attachment => ({ ...attachment, blob: dataUrlToBlob(data) }))
  }));
  const db = await openDatabase();
  try {
    const tx = db.transaction(['records', 'settings'], 'readwrite');
    const recordsStore = tx.objectStore('records');
    recordsStore.clear();
    records.forEach((record) => recordsStore.put(record));
    tx.objectStore('settings').put({ key: 'property', value: value.property });
    await txDone(tx);
  } finally { db.close(); }
  return { property: value.property, records };
}
