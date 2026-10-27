import { UtensilsCrossed } from 'lucide-react';
import { Mascot } from './Mascot';

export function Footer({ mood, waveKey, balance }: { mood: number; waveKey: number; balance: number }) {
  return (
    <footer data-reveal className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
        <p className="flex items-center gap-3">
          <span className="grid size-8 place-items-center border border-line bg-paper text-gold">
            <UtensilsCrossed className="size-3.5" strokeWidth={1.75} />
          </span>
          <span className="font-display text-sm font-bold tracking-[0.22em]">DUET</span>
        </p>
        <Mascot mood={mood} waveKey={waveKey} balance={balance} />
        <p className="text-center font-serif text-xl italic text-cream-dim">
          built for two hungry friends — usman &amp; fasi
        </p>
        <p className="font-mono text-[9px] tracking-[0.24em] text-cream-dim/80">
          BREAK TIME · NIGHT RUNS · SETTLED FAIR
        </p>
      </div>
    </footer>
  );
}
