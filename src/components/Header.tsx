import { Coffee, Moon, UtensilsCrossed } from 'lucide-react';
import { useNow } from '../hooks/useNow';
import { fmtDateChip, pad2 } from '../lib/format';

/** sticky top bar — brand + live weekday / date / time chip */
export function Header() {
  const now = useNow(1000);
  const hour = now.getHours();
  const isNight = hour >= 17 || hour < 5;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* brand */}
        <a href="#top" className="group flex items-center gap-3">
          <span className="grid size-9 place-items-center border border-line bg-paper text-gold transition-colors group-hover:border-gold/60">
            <UtensilsCrossed className="size-4" strokeWidth={1.75} />
          </span>
          <span className="leading-none">
            <span className="block font-display text-lg font-bold tracking-[0.18em]">DUET</span>
            <span className="block font-mono text-[9px] tracking-[0.28em] text-cream-dim">
              USMAN × FASI LEDGER
            </span>
          </span>
        </a>

        {/* live clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 border border-line bg-paper px-3 py-1.5 font-mono text-[10px] tracking-[0.22em] text-cream-dim md:flex">
            {isNight ? (
              <Moon className="size-3.5 text-gold" strokeWidth={1.75} />
            ) : (
              <Coffee className="size-3.5 text-ember" strokeWidth={1.75} />
            )}
            {isNight ? 'NIGHT HOURS' : 'BREAK HOURS'}
          </span>

          <span className="hidden border border-line bg-paper px-3 py-1.5 font-mono text-[10px] tracking-[0.22em] text-cream-dim sm:block">
            {fmtDateChip(now)}
          </span>

          <span className="flex items-center gap-1 border border-gold/40 bg-gold/10 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-gold tabular-nums">
            {pad2(now.getHours())}
            <span className="blink">:</span>
            {pad2(now.getMinutes())}
            <span className="blink">:</span>
            {pad2(now.getSeconds())}
          </span>
        </div>
      </div>
    </header>
  );
}
