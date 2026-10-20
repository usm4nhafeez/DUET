import { useEffect, useMemo, useState } from 'react';
import type { Entry, Slot, Split } from './lib/types';
import { computeStats } from './lib/types';
import { loadEntries, saveEntries, uid } from './lib/store';
import { useFileSync } from './hooks/useFileSync';
import { useCloudSync } from './hooks/useCloudSync';
import { Header } from './components/Header';
import { Marquee } from './components/Marquee';
import { BalanceHero } from './components/BalanceHero';
import { StatsGrid } from './components/StatsGrid';
import { MealForm } from './components/MealForm';
import { History } from './components/History';
import { JsonPanel } from './components/JsonPanel';
import { FileSyncBanner } from './components/FileSyncBanner';
import { CloudSyncPanel } from './components/CloudSyncPanel';
import { Footer } from './components/Footer';

export default function App() {
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  /* real JSON file on disk — auto-save + auto-restore */
  const fileSync = useFileSync(entries, setEntries);

  /* shared ledger across devices — realtime cloud sync */
  const cloudSync = useCloudSync(entries, setEntries);

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

        {/* sync status — cloud (all devices) + disk file (this device) */}
        <div className="mx-auto max-w-7xl space-y-3 px-4 pt-6 sm:px-6">
          <CloudSyncPanel {...cloudSync} />
          <FileSyncBanner {...fileSync} />
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
