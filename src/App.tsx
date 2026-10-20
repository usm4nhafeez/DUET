import { useEffect, useMemo, useRef, useState } from 'react';
import { Database } from 'lucide-react';
import type { Entry, Slot, Split } from './lib/types';
import { computeStats } from './lib/types';
import {
  fetchBundledLedger,
  hasStoredLedger,
  localUpdatedAt,
  loadEntries,
  saveEntries,
  uid,
} from './lib/store';
import { fetchDbLedger, pushDbLedger } from './lib/filedb';
import { useFileSync } from './hooks/useFileSync';
import { Header } from './components/Header';
import { Marquee } from './components/Marquee';
import { BalanceHero } from './components/BalanceHero';
import { StatsGrid } from './components/StatsGrid';
import { MealForm } from './components/MealForm';
import { History } from './components/History';
import { JsonPanel } from './components/JsonPanel';
import { FileSyncBanner } from './components/FileSyncBanner';
import { Footer } from './components/Footer';

export default function App() {
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [booted, setBooted] = useState(false);
  const [dbLive, setDbLive] = useState(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* boot — the .json file IS the database:
     1. dev server file endpoint → read public/duet-ledger.json from disk
     2. static deploy → bundled duet-ledger.json if newer than this screen
     3. otherwise → whatever this browser already holds */
  useEffect(() => {
    let alive = true;
    void (async () => {
      const fromFile = await fetchDbLedger();
      if (!alive) return;
      if (fromFile !== null) {
        setEntries(fromFile);
        setDbLive(true);
        setBooted(true);
        return;
      }
      const bundled = await fetchBundledLedger();
      if (!alive) return;
      if (bundled && (!hasStoredLedger() || bundled.updatedAt > localUpdatedAt())) {
        setEntries(bundled.entries);
      }
      setBooted(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* persist every change — file DB when live (browser storage stays as mirror) */
  useEffect(() => {
    if (!booted) return;
    saveEntries(entries);
    if (dbLive) {
      clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => void pushDbLedger(entries), 300);
    }
  }, [entries, booted, dbLive]);

  /* real JSON file on disk — auto-save + auto-restore */
  const fileSync = useFileSync(entries, setEntries);

  const stats = useMemo(() => computeStats(entries), [entries]);

  const addMeal = (meal: {
    at: string;
    slot: Slot;
    note: string;
    split: Split;
    usman: number;
    fasi: number;
  }) => {
    setEntries((prev) => [...prev, { id: uid(), kind: 'meal', ...meal }]);
    window.setTimeout(() => {
      document.getElementById('ledger')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const addSettle = (from: 'usman' | 'fasi', amount: number, note: string) => {
    setEntries((prev) => [
      ...prev,
      { id: uid(), kind: 'settle', at: new Date().toISOString(), from, amount, note },
    ]);
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const clearAll = () => setEntries([]);
  const importAll = (list: Entry[]) => setEntries(list);

  return (
    <div id="top" className="grain min-h-screen bg-ink text-cream">
      <Header />
      <main>
        <BalanceHero stats={stats} onSettle={addSettle} />
        <Marquee />

        {/* sync status — the ledger .json file */}
        <div className="mx-auto max-w-7xl space-y-3 px-4 pt-6 sm:px-6">
          {dbLive ? (
            <section className="flex items-center gap-3.5 border border-sage/40 bg-card px-5 py-4">
              <span className="grid size-10 shrink-0 place-items-center border border-sage/50 bg-sage/10 text-sage">
                <Database className="size-4.5" strokeWidth={1.75} />
              </span>
              <div className="leading-tight">
                <p className="flex items-center gap-2.5 font-display text-sm font-bold tracking-[0.14em]">
                  FILE DATABASE LIVE
                  <span className="size-1.5 animate-pulse rounded-full bg-sage" />
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-wide text-cream-dim">
                  reading and writing the shared duet-ledger.json — every change lands in the
                  file instantly
                </p>
              </div>
            </section>
          ) : (
            <FileSyncBanner {...fileSync} />
          )}
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid items-start gap-6 lg:grid-cols-12">
            {/* left column — form + stats */}
            <div className="space-y-6 lg:col-span-5">
              <MealForm onAdd={addMeal} />
              <JsonPanel entries={entries} onImport={importAll} onClear={clearAll} />
            </div>

            {/* right column — stats + ledger */}
            <div className="space-y-6 lg:col-span-7">
              <StatsGrid stats={stats} />
              <div id="ledger" className="scroll-mt-24">
                <History entries={entries} onDelete={removeEntry} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
