import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowLeftRight, ArrowRight, HandCoins, Scale, X } from 'lucide-react';
import type { LedgerStats, Person } from '../lib/types';
import { PEOPLE } from '../lib/types';
import { fmtMoney, fmtNum } from '../lib/format';
import { useAnimatedNumber } from '../lib/useAnimatedNumber';

interface Props {
  stats: LedgerStats;
  onSettle: (from: Person, amount: number, note: string) => void;
}

function PersonChip({
  person,
  paid,
  status,
}: {
  person: Person;
  paid: number;
  status: { kind: 'owed' | 'owes' | 'even'; amount: number };
}) {
  const p = PEOPLE[person];
  return (
    <div className="flex flex-1 items-center justify-between gap-3 border border-line bg-paper px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center border border-gold/40 bg-gold/10 font-display text-sm font-bold text-gold">
          {p.short}
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold tracking-wide">{p.tag}</p>
          <p className="font-mono text-[10px] text-cream-dim">paid {fmtMoney(paid)} total</p>
        </div>
      </div>
      <div className="text-right leading-tight">
        {status.kind === 'even' ? (
          <p className="font-mono text-[10px] tracking-[0.2em] text-sage">ALL SQUARE</p>
        ) : status.kind === 'owed' ? (
          <>
            <p className="font-mono text-[10px] tracking-[0.2em] text-sage">GETS BACK</p>
            <p className="font-mono text-sm font-semibold text-gold tabular-nums">
              +{fmtMoney(status.amount)}
            </p>
          </>
        ) : (
          <>
            <p className="font-mono text-[10px] tracking-[0.2em] text-ember">OWES</p>
            <p className="font-mono text-sm font-semibold text-ember tabular-nums">
              −{fmtMoney(status.amount)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function BalanceHero({ stats, onSettle }: Props) {
  const { balance } = stats;
  const square = Math.abs(balance) < 0.01;
  const debtor: Person = balance > 0 ? 'fasi' : 'usman';
  const creditor: Person = balance > 0 ? 'usman' : 'fasi';
  const absBal = useAnimatedNumber(Math.abs(balance));

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [from, setFrom] = useState<Person>('usman');

  const openSettle = () => {
    setFrom(debtor);
    setAmount(String(Math.abs(balance)));
    setNote('');
    setOpen(true);
  };

  const parsed = Number(amount);
  const valid = Number.isFinite(parsed) && parsed > 0;

  const submitSettle = () => {
    if (!valid) return;
    onSettle(from, parsed, note.trim());
    setOpen(false);
    setAmount('');
    setNote('');
  };

  // seesaw marker position: tanh keeps it smooth, -1..1 → 8%..92%
  const mag = Math.tanh(balance / 400);
  const markerPct = 50 + mag * 42;

  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* ambient glow + backdrop word */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-130 w-200 -translate-x-1/2 rounded-full opacity-25"
        style={{ background: 'radial-gradient(closest-side, rgba(240,184,74,0.35), transparent)' }}
      />
      <span className="outline-word pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 font-serif text-[22vw] italic leading-none">
        dinner
      </span>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.34em] text-cream-dim"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-gold" />
          LIVE SETTLEMENT — WHO PAYS NEXT
        </motion.p>

        {/* headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display"
        >
          {square ? (
            <h1 className="text-[13vw] font-bold leading-[0.9] tracking-tight sm:text-8xl">
              ALL <span className="font-serif font-normal italic text-gold">square.</span>
            </h1>
          ) : (
            <h1 className="text-[13vw] font-bold leading-[0.9] tracking-tight sm:text-8xl">
              {PEOPLE[debtor].tag}{' '}
              <span className="font-serif font-normal italic text-gold">owes</span>{' '}
              {PEOPLE[creditor].tag}
            </h1>
          )}
        </motion.div>

        {/* amount */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3"
        >
          <p className="font-mono text-6xl font-semibold leading-none text-gold-soft tabular-nums sm:text-8xl">
            {square ? '0' : fmtNum(absBal)}
            <span className="ml-3 align-top font-mono text-lg tracking-[0.2em] text-cream-dim">PKR</span>
          </p>
          {!square && (
            <p className="mb-1 font-mono text-[11px] leading-relaxed tracking-wide text-cream-dim">
              {PEOPLE[debtor].name} covers the next bill,
              <br />
              or hands back {fmtMoney(Math.abs(balance))} to settle.
            </p>
          )}
          {square && (
            <p className="mb-1 font-mono text-[11px] leading-relaxed tracking-wide text-cream-dim">
              nobody owes anybody.
              <br />
              the table is clean — go eat.
            </p>
          )}
        </motion.div>

        {/* seesaw */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <div className="relative h-14">
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-line" />
            <div className="absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-cream-dim/50" />
            <div
              className="absolute top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-line"
              style={{ left: '25%' }}
            />
            <div
              className="absolute top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-line"
              style={{ left: '75%' }}
            />
            {/* gradient flow from debtor → creditor */}
            {!square && (
              <div
                className="absolute top-1/2 h-px -translate-y-1/2"
                style={{
                  left: `${Math.min(50, markerPct)}%`,
                  width: `${Math.abs(markerPct - 50)}%`,
                  background: `linear-gradient(${balance > 0 ? '270deg' : '90deg'}, rgba(226,105,60,0.9), rgba(240,184,74,0.9))`,
                }}
              />
            )}
            <motion.div
              className="marker-pulse absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-ink"
              style={{ background: square ? 'var(--color-sage)' : 'var(--color-gold)' }}
              animate={{ left: `${markerPct}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 14 }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.28em] text-cream-dim">
            <span className="flex items-center gap-2">
              USMAN
              {!square && balance < 0 && <ArrowLeft className="size-3 text-gold" />}
            </span>
            <span className="flex items-center gap-1.5 text-cream-dim/60">
              <Scale className="size-3" /> EVEN
            </span>
            <span className="flex items-center gap-2">
              {!square && balance > 0 && <ArrowRight className="size-3 text-gold" />}
              FASI
            </span>
          </div>
        </motion.div>

        {/* person chips + settle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mt-8 flex flex-col gap-3 lg:flex-row"
        >
          <PersonChip
            person="usman"
            paid={stats.usmanPaid}
            status={
              Math.abs(balance) < 0.01
                ? { kind: 'even', amount: 0 }
                : balance > 0
                  ? { kind: 'owed', amount: balance }
                  : { kind: 'owes', amount: Math.abs(balance) }
            }
          />
          <PersonChip
            person="fasi"
            paid={stats.fasiPaid}
            status={
              Math.abs(balance) < 0.01
                ? { kind: 'even', amount: 0 }
                : balance > 0
                  ? { kind: 'owes', amount: balance }
                  : { kind: 'owed', amount: Math.abs(balance) }
            }
          />
          <button
            onClick={() => (open ? setOpen(false) : openSettle())}
            disabled={square && !open}
            className="group flex items-center justify-center gap-2.5 border border-gold bg-gold px-6 py-3 font-mono text-[11px] font-bold tracking-[0.24em] text-ink transition-all hover:bg-gold-soft disabled:cursor-not-allowed disabled:border-line disabled:bg-paper disabled:text-cream-dim"
          >
            {open ? <X className="size-4" /> : <HandCoins className="size-4" strokeWidth={2} />}
            {open ? 'CANCEL' : 'RECORD SETTLEMENT'}
          </button>
        </motion.div>

        {/* settle panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 border border-gold/30 bg-paper p-5">
                <p className="mb-4 font-mono text-[10px] tracking-[0.28em] text-cream-dim">
                  MONEY CHANGED HANDS — LOG IT SO THE LEDGER STAYS HONEST
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    onClick={() => setFrom(from === 'usman' ? 'fasi' : 'usman')}
                    className="flex items-center justify-between gap-3 border border-line bg-card px-4 py-3 transition-colors hover:border-gold/50 sm:min-w-56"
                    title="swap direction"
                  >
                    <span className="font-mono text-xs font-semibold tracking-wider">
                      {PEOPLE[from].tag} <span className="text-gold">→</span>{' '}
                      {PEOPLE[from === 'usman' ? 'fasi' : 'usman'].tag}
                    </span>
                    <ArrowLeftRight className="size-3.5 text-cream-dim" />
                  </button>
                  <div className="flex items-center border border-line bg-card px-4 py-3 focus-within:border-gold/60 sm:w-44">
                    <span className="mr-2 font-mono text-xs text-cream-dim">Rs</span>
                    <input
                      type="number"
                      min={0}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent font-mono text-sm font-semibold tabular-nums outline-none placeholder:text-cream-dim/50"
                      placeholder="0"
                    />
                  </div>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="note — optional"
                    className="flex-1 border border-line bg-card px-4 py-3 font-mono text-xs outline-none placeholder:text-cream-dim/50 focus:border-gold/60"
                  />
                  <button
                    onClick={submitSettle}
                    disabled={!valid}
                    className="border border-gold bg-gold px-6 py-3 font-mono text-[11px] font-bold tracking-[0.24em] text-ink transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
