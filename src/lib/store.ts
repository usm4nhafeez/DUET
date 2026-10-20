import type { Entry, MealEntry, SettleEntry } from './types';
import { round2 } from './types';

const KEY = 'duet-ledger-v1';
const UPDATED_KEY = 'duet-ledger-v1-updated';

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** demo meals so the ledger tells a story on first launch */
function seedEntries(): Entry[] {
  const now = new Date();
  const at = (daysAgo: number, h: number, m: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const seed: Array<Omit<MealEntry, 'id'>> = [
    { kind: 'meal', at: at(2, 21, 40), slot: 'night', note: 'Chicken biryani + cold drinks', split: 'even', usman: 850, fasi: 0 },
    { kind: 'meal', at: at(1, 11, 15), slot: 'break', note: 'Samosay + chai at canteen', split: 'even', usman: 0, fasi: 240 },
    { kind: 'meal', at: at(0, 22, 5), slot: 'night', note: 'Shawarma night run', split: 'even', usman: 380, fasi: 320 },
  ];
  return seed.map((s) => ({ ...s, id: uid() }));
}

export function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const fresh = seedEntries();
      saveEntries(fresh);
      return fresh;
    }
    const data = JSON.parse(raw);
    if (Array.isArray(data?.entries)) return data.entries as Entry[];
    return seedEntries();
  } catch {
    return seedEntries();
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
