export type Person = 'usman' | 'fasi';
export type Slot = 'break' | 'night';
export type Split = 'even' | 'usman' | 'fasi';

export interface MealEntry {
  id: string;
  kind: 'meal';
  at: string; // ISO timestamp
  slot: Slot;
  note: string;
  split: Split;
  usman: number; // amount paid by usman
  fasi: number; // amount paid by fasi
}

export interface SettleEntry {
  id: string;
  kind: 'settle';
  at: string;
  from: Person; // who paid the other
  amount: number;
  note: string;
}

export type Entry = MealEntry | SettleEntry;

export const PEOPLE: Record<Person, { name: string; short: string; tag: string }> = {
  usman: { name: 'Usman', short: 'U', tag: 'USMAN' },
  fasi: { name: 'Fasi', short: 'F', tag: 'FASI' },
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** fraction of a meal that person p is responsible for */
export const shareOf = (split: Split, p: Person): number =>
  split === 'even' ? 0.5 : split === p ? 1 : 0;

export const mealTotal = (m: MealEntry) => round2(m.usman + m.fasi);

export interface LedgerStats {
  grandTotal: number;
  usmanPaid: number;
  fasiPaid: number;
  usmanShare: number;
  fasiShare: number;
  meals: number;
  nights: number;
  breaks: number;
  settledAmount: number;
  /** > 0  →  Fasi owes Usman  ·  < 0  →  Usman owes Fasi */
  balance: number;
}

export function computeStats(entries: Entry[]): LedgerStats {
  let grandTotal = 0;
  let usmanPaid = 0;
  let fasiPaid = 0;
  let usmanShare = 0;
  let fasiShare = 0;
  let meals = 0;
  let nights = 0;
  let breaks = 0;
  let settledAmount = 0;
  let balance = 0;

  for (const e of entries) {
    if (e.kind === 'meal') {
      const t = e.usman + e.fasi;
      grandTotal += t;
      usmanPaid += e.usman;
      fasiPaid += e.fasi;
      const us = t * shareOf(e.split, 'usman');
      usmanShare += us;
      fasiShare += t - us;
      meals += 1;
      if (e.slot === 'night') nights += 1;
      else breaks += 1;
      balance += e.usman - us;
    } else {
      settledAmount += e.amount;
      balance += e.from === 'usman' ? e.amount : -e.amount;
    }
  }

  return {
    grandTotal: round2(grandTotal),
    usmanPaid: round2(usmanPaid),
    fasiPaid: round2(fasiPaid),
    usmanShare: round2(usmanShare),
    fasiShare: round2(fasiShare),
    meals,
    nights,
    breaks,
    settledAmount: round2(settledAmount),
    balance: round2(balance),
  };
}
