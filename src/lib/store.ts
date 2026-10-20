import type { Entry, MealEntry, SettleEntry } from './types';
import { round2 } from './types';

const KEY = 'duet-ledger-v1';
const UPDATED_KEY = 'duet-ledger-v1-updated';

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data?.entries) ? (data.entries as Entry[]) : [];
  } catch {
    return [];
  }
}

/** true when this browser already holds a saved ledger (even an empty one) */
export function hasStoredLedger(): boolean {
  try {
    return localStorage.getItem(KEY) != null;
  } catch {
    return false;
  }
}

export function saveEntries(entries: Entry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, entries }));
    localStorage.setItem(UPDATED_KEY, new Date().toISOString());
  } catch {
    /* storage full / private mode — session still works in-memory */
  }
}

/** timestamp of the last write into browser storage */
export function localUpdatedAt(): number {
  try {
    return Date.parse(localStorage.getItem(UPDATED_KEY) ?? '') || 0;
  } catch {
    return 0;
  }
}

export function toJson(entries: Entry[]): string {
  return JSON.stringify(
    {
      v: 1,
      app: 'duet-ledger',
      updatedAt: new Date().toISOString(),
      entries,
    },
    null,
    2,
  );
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? round2(n) : 0;
}

/** tolerant JSON import — accepts {entries:[...]} or a raw array */
export function parseImported(text: string): Entry[] {
  const data = JSON.parse(text);
  const list: unknown[] = Array.isArray(data) ? data : Array.isArray(data?.entries) ? data.entries : [];
  const clean: Entry[] = [];
  for (const item of list) {
    if (typeof item !== 'object' || item === null) continue;
    const e = item as Record<string, unknown>;
    const atDate = new Date(String(e.at ?? Date.now()));
    const at = Number.isNaN(atDate.getTime()) ? new Date().toISOString() : atDate.toISOString();
    if (e.kind === 'meal') {
      const m: MealEntry = {
        id: typeof e.id === 'string' ? e.id : uid(),
        kind: 'meal',
        at,
        slot: e.slot === 'night' ? 'night' : 'break',
        note: String(e.note ?? ''),
        split: e.split === 'usman' || e.split === 'fasi' ? e.split : 'even',
        usman: Math.max(0, num(e.usman)),
        fasi: Math.max(0, num(e.fasi)),
      };
      if (m.usman + m.fasi > 0) clean.push(m);
    } else if (e.kind === 'settle') {
      const s: SettleEntry = {
        id: typeof e.id === 'string' ? e.id : uid(),
        kind: 'settle',
        at,
        from: e.from === 'usman' ? 'usman' : 'fasi',
        amount: Math.max(0, num(e.amount)),
        note: String(e.note ?? ''),
      };
      if (s.amount > 0) clean.push(s);
    }
  }
  return clean;
}

/* ------------------------------------------------------------------ */
/* bundled ledger — duet-ledger.json shipped with the deployed site   */
/* ------------------------------------------------------------------ */
export interface BundledLedger {
  entries: Entry[];
  updatedAt: number;
}

/**
 * Fetches duet-ledger.json from the deployed site (the one in public/).
 * Lets you keep the shared data in a plain .json file: update it in the
 * repo, redeploy, and every screen adopts it on reload (newest wins).
 */
export async function fetchBundledLedger(): Promise<BundledLedger | null> {
  try {
    const res = await fetch('duet-ledger.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const raw = await res.text();
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as { updatedAt?: string };
    const entries = parseImported(raw);
    if (entries.length === 0) return null;
    return { entries, updatedAt: Date.parse(parsed?.updatedAt ?? '') || 0 };
  } catch {
    /* file not deployed — local data stands on its own */
    return null;
  }
}
