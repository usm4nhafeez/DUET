import type { Entry } from './types';
import { parseImported, toJson } from './store';

/* ------------------------------------------------------------------ */
/* minimal structural typings for the File System Access API          */
/* ------------------------------------------------------------------ */
export interface FSHandleLite {
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(d: string | Blob): Promise<void>; close(): Promise<void> }>;
  queryPermission?(desc: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission?(desc: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
}

interface PickerType {
  description?: string;
  accept: Record<string, string[]>;
}
interface PickerOptions {
  suggestedName?: string;
  types?: PickerType[];
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
}

declare global {
  interface Window {
    showSaveFilePicker?: (opts?: PickerOptions) => Promise<FSHandleLite>;
    showOpenFilePicker?: (opts?: PickerOptions) => Promise<FSHandleLite[]>;
  }
}

export const isFileSyncSupported = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.showSaveFilePicker === 'function' &&
  typeof window.showOpenFilePicker === 'function' &&
  typeof indexedDB !== 'undefined';

/* ------------------------------------------------------------------ */
/* file-handle persistence in IndexedDB (survives reloads & restarts) */
/* ------------------------------------------------------------------ */
const DB_NAME = 'duet-file-sync';
const STORE = 'kv';
const HANDLE_KEY = 'ledger-file-handle';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveHandle(handle: FSHandleLite): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(handle, HANDLE_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadHandle(): Promise<FSHandleLite | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(HANDLE_KEY);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as FSHandleLite | undefined) ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearHandle(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(HANDLE_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* db blocked — nothing to forget */
  }
}

/* ------------------------------------------------------------------ */
/* permissions + IO                                                   */
/* ------------------------------------------------------------------ */
export async function queryPermission(handle: FSHandleLite): Promise<PermissionState> {
  try {
    return (await handle.queryPermission?.({ mode: 'readwrite' })) ?? 'denied';
  } catch {
    return 'denied';
  }
}

/** must be called from a user gesture when a prompt may appear */
export async function ensurePermission(handle: FSHandleLite): Promise<boolean> {
  try {
    if ((await handle.queryPermission?.({ mode: 'readwrite' })) === 'granted') return true;
    if ((await handle.requestPermission?.({ mode: 'readwrite' })) === 'granted') return true;
  } catch {
    /* fall through */
  }
  return false;
}

export async function writeToFile(handle: FSHandleLite, entries: Entry[]): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(toJson(entries));
  await writable.close();
}

export interface FileReadResult {
  entries: Entry[];
  updatedAt: number;
}

export async function readFromFile(handle: FSHandleLite): Promise<FileReadResult | null> {
  const file = await handle.getFile();
  const raw = await file.text();
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as { updatedAt?: string; exportedAt?: string };
    return {
      entries: parseImported(raw),
      updatedAt: Date.parse(parsed?.updatedAt ?? parsed?.exportedAt ?? '') || file.lastModified || 0,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* picker helpers                                                     */
/* ------------------------------------------------------------------ */
const JSON_TYPES: PickerType[] = [
  { description: 'DUET ledger (JSON)', accept: { 'application/json': ['.json'] } },
];

/** create a brand-new ledger file on disk */
export const pickSaveFile = (): Promise<FSHandleLite> =>
  window.showSaveFilePicker!({ suggestedName: 'duet-ledger.json', types: JSON_TYPES });

/** link an existing JSON file from disk */
export const pickOpenFile = async (): Promise<FSHandleLite | null> => {
  const handles = await window.showOpenFilePicker!({ types: JSON_TYPES, multiple: false });
  return handles[0] ?? null;
};
