import { motion } from 'framer-motion';
import { MoonStar, Wallet } from 'lucide-react';
import type { LedgerStats } from '../lib/types';
import { fmtMoney, fmtNum } from '../lib/format';
import { PEOPLE } from '../lib/types';
import { useAnimatedNumber } from '../lib/useAnimatedNumber';

function Tile({
  label,
  icon,
  value,
  sub,
  accent = false,
  delay = 0,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  sub: string;
  accent?: boolean;
  delay?: number;
}) {
  const v = useAnimatedNumber(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay }}
      className={`group border border-line p-5 transition-colors ${
        accent ? 'bg-gold/10 hover:bg-gold/15' : 'bg-card hover:bg-paper'
      }`}
    >
      <div className="mb-6 flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.28em] text-cream-dim">{label}</span>
        <span className={accent ? 'text-gold' : 'text-cream-dim group-hover:text-gold'}>{icon}</span>
      </div>
      <p
        className={`font-mono text-3xl font-semibold tabular-nums leading-none sm:text-[2rem] ${
          accent ? 'text-gold-soft' : 'text-cream'
        }`}
      >
        {fmtNum(v)}
      </p>
      <p className="mt-2 font-mono text-[10px] text-cream-dim">{sub}</p>
    </motion.div>
  );
}

export function StatsGrid({ stats }: { stats: LedgerStats }) {
  const pct = (n: number) =>
    stats.grandTotal > 0 ? `${Math.round((n / stats.grandTotal) * 100)}% of spend` : 'nothing yet';

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        label="GRAND TOTAL"
        icon={<Wallet className="size-4" strokeWidth={1.75} />}
        value={stats.grandTotal}
        sub={`${stats.meals} meals · avg ${fmtMoney(stats.meals ? stats.grandTotal / stats.meals : 0)}`}
        accent
        delay={0}
      />
      <Tile
        label="USMAN PAID"
        icon={
          <span className="grid size-4 place-items-center border border-current text-[9px] font-bold">
            {PEOPLE.usman.short}
          </span>
        }
        value={stats.usmanPaid}
        sub={pct(stats.usmanPaid)}
        delay={0.05}
      />
      <Tile
        label="FASI PAID"
        icon={
          <span className="grid size-4 place-items-center border border-current text-[9px] font-bold">
            {PEOPLE.fasi.short}
          </span>
        }
        value={stats.fasiPaid}
        sub={pct(stats.fasiPaid)}
        delay={0.1}
      />
      <Tile
        label="NIGHT / BREAK"
        icon={<MoonStar className="size-4" strokeWidth={1.75} />}
        value={stats.nights}
        sub={`${stats.nights} night runs · ${stats.breaks} breaks · ${fmtMoney(stats.settledAmount)} settled`}
        delay={0.15}
      />
    </div>
  );
}
