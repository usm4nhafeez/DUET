import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, Coffee, History as HistoryIcon, Moon, Trash2, UtensilsCrossed } from 'lucide-react';
import type { Entry } from '../lib/types';
import { PEOPLE, mealTotal, shareOf } from '../lib/types';
import { dayKey, fmtDayHeader, fmtMoney, fmtRelativeDay, fmtTimeShort } from '../lib/format';

interface Props {
  entries: Entry[];
  onDelete: (id: string) => void;
}

interface DayGroup {
  key: string;
  label: string;
  total: number;
  items: Entry[];
}

export function History({ entries, onDelete }: Props) {
  const groups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>();
    const sorted = [...entries].sort((a, b) => +new Date(b.at) - +new Date(a.at));
    for (const e of sorted) {
      const k = dayKey(e.at);
      let g = map.get(k);
      if (!g) {
        g = { key: k, label: fmtDayHeader(e.at), total: 0, items: [] };
        map.set(k, g);
      }
      g.items.push(e);
      if (e.kind === 'meal') g.total += mealTotal(e);
    }
    return [...map.values()];
  }, [entries]);

  return (
    <section className="border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <p className="flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.28em]">
          <HistoryIcon className="size-4 text-gold" strokeWidth={1.75} />
          THE LEDGER
        </p>
        <span className="font-mono text-[9px] tracking-[0.2em] text-cream-dim/70">
          {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <span className="grid size-14 place-items-center border border-line bg-paper text-cream-dim">
            <UtensilsCrossed className="size-6" strokeWidth={1.25} />
          </span>
          <div>
            <p className="font-serif text-2xl italic text-cream">the table is clean</p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-cream-dim">
              LOG YOUR FIRST MEAL TO START THE LEDGER
            </p>
          </div>
        </div>
      ) : (
        <div>
          {groups.map((g) => (
            <div key={g.key}>
              {/* day header */}
              <div className="flex items-center justify-between border-b border-line bg-paper/60 px-5 py-2.5">
                <span className="font-mono text-[10px] font-semibold tracking-[0.24em] text-gold">
                  {g.label.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-cream-dim">
                  day total {fmtMoney(g.total)}
                </span>
              </div>
              <ul>
                <AnimatePresence initial={false}>
                  {g.items.map((e) => (
                    <motion.li
                      key={e.id}
                      layout
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 22, height: 0, paddingTop: 0, paddingBottom: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="group relative overflow-hidden border-b border-line/60 last:border-0"
                    >
                      <div className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-paper/70">
                        {/* time */}
                        <div className="w-14 shrink-0 leading-tight">
                          <p className="font-mono text-xs font-semibold tabular-nums text-cream">
                            {fmtTimeShort(e.at)}
                          </p>
                          <p className="font-mono text-[8px] tracking-[0.18em] text-cream-dim/70">
                            {fmtRelativeDay(e.at).toUpperCase()}
                          </p>
                        </div>

                        {/* icon */}
                        <span
                          className={`grid size-8 shrink-0 place-items-center border ${
                            e.kind === 'settle'
                              ? 'border-sage/50 bg-sage/10 text-sage'
                              : e.slot === 'night'
                                ? 'border-gold/40 bg-gold/10 text-gold'
                                : 'border-ember/50 bg-ember/10 text-ember'
                          }`}
                        >
                          {e.kind === 'settle' ? (
                            <ArrowLeftRight className="size-3.5" strokeWidth={1.75} />
                          ) : e.slot === 'night' ? (
                            <Moon className="size-3.5" strokeWidth={1.75} />
                          ) : (
                            <Coffee className="size-3.5" strokeWidth={1.75} />
                          )}
                        </span>

                        {/* detail */}
                        <div className="min-w-0 flex-1 leading-tight">
                          {e.kind === 'settle' ? (
                            <>
                              <p className="truncate font-display text-sm font-medium">
                                {PEOPLE[e.from].name}
                                <span className="mx-1.5 text-sage">→</span>
                                {PEOPLE[e.from === 'usman' ? 'fasi' : 'usman'].name}
                                <span className="ml-2 font-mono text-[8px] tracking-[0.2em] text-sage">
                                  SETTLEMENT
                                </span>
                              </p>
                              <p className="mt-0.5 truncate font-mono text-[10px] text-cream-dim">
                                {e.note || 'balance squared by hand'}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="truncate font-display text-sm font-medium">
                                {e.note || (e.slot === 'night' ? 'Night meal' : 'Break meal')}
                                {e.split !== 'even' && (
                                  <span className="ml-2 font-mono text-[8px] tracking-[0.2em] text-gold">
                                    {e.split === 'usman' ? 'USMAN ATE' : 'FASI ATE'}
                                  </span>
                                )}
                              </p>
                              <p className="mt-0.5 font-mono text-[10px] tabular-nums text-cream-dim">
                                U {fmtMoney(e.usman).replace('Rs ', '')}
                                <span className="mx-1.5 text-line">|</span>
                                F {fmtMoney(e.fasi).replace('Rs ', '')}
                                <span className="mx-1.5 text-line">|</span>
                                share u{Math.round(shareOf(e.split, 'usman') * 100)}%
                              </p>
                            </>
                          )}
                        </div>

                        {/* amount */}
                        <p
                          className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${
                            e.kind === 'settle' ? 'text-sage' : 'text-cream'
                          }`}
                        >
                          {e.kind === 'settle' ? fmtMoney(e.amount) : fmtMoney(mealTotal(e))}
                        </p>

                        {/* delete */}
                        <button
                          onClick={() => onDelete(e.id)}
                          aria-label="delete entry"
                          className="grid size-8 shrink-0 place-items-center border border-transparent text-cream-dim/40 opacity-0 transition-all hover:border-ember/50 hover:bg-ember/10 hover:text-ember focus:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.75} />
                        </button>
                      </div>

                      {/* mini paid split bar for meals */}
                      {e.kind === 'meal' && (
                        <div className="absolute inset-x-0 bottom-0 flex h-0.5">
                          <div
                            className="bg-gold/60"
                            style={{
                              width: `${mealTotal(e) > 0 ? (e.usman / mealTotal(e)) * 100 : 0}%`,
                            }}
                          />
                          <div
                            className="bg-ember/60"
                            style={{
                              width: `${mealTotal(e) > 0 ? (e.fasi / mealTotal(e)) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
