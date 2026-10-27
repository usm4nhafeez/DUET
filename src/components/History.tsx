import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Coffee,
  History as HistoryIcon,
  Moon,
  Pencil,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import type { Entry, Person, Slot, Split } from '../lib/types';
import { PEOPLE, mealTotal, shareOf } from '../lib/types';
import { dayKey, fmtDayHeader, fmtMoney, fmtRelativeDay, fmtTimeShort } from '../lib/format';

interface Props {
  entries: Entry[];
  onDelete: (id: string) => void;
  onUpdate: (entry: Entry) => void;
}

const inp =
  'w-full min-w-0 bg-transparent font-mono text-sm text-cream outline-none placeholder:text-cream-dim/60';
const seg = (active: boolean) =>
  `py-2 font-mono text-[9px] font-semibold tracking-[0.18em] transition-colors ${
    active ? 'bg-gold text-ink' : 'bg-card text-cream-dim hover:text-cream'
  }`;

/** inline row editor — builds a full replacement Entry, App persists via the existing JSON pipeline */
function EntryEditor({
  entry,
  onSave,
  onCancel,
}: {
  entry: Entry;
  onSave: (e: Entry) => void;
  onCancel: () => void;
}) {
  const [slot, setSlot] = useState<Slot>(entry.kind === 'meal' ? entry.slot : 'break');
  const [split, setSplit] = useState<Split>(entry.kind === 'meal' ? entry.split : 'even');
  const [from, setFrom] = useState<Person>(entry.kind === 'settle' ? entry.from : 'usman');
  const [usman, setUsman] = useState(entry.kind === 'meal' ? String(entry.usman) : '');
  const [fasi, setFasi] = useState(entry.kind === 'meal' ? String(entry.fasi) : '');
  const [amount, setAmount] = useState(entry.kind === 'settle' ? String(entry.amount) : '');
  const [note, setNote] = useState(entry.note);

  const num = (s: string) => Math.max(0, Number(s) || 0);

  const save = () => {
    if (entry.kind === 'meal') {
      const u = num(usman);
      const f = num(fasi);
      if (u + f <= 0) return;
      onSave({ ...entry, slot, split, usman: u, fasi: f, note: note.trim() });
    } else {
      const a = num(amount);
      if (a <= 0) return;
      onSave({ ...entry, from, amount: a, note: note.trim() });
    }
  };

  return (
    <div className="space-y-2.5 border-t border-line bg-paper/70 px-4 py-4 sm:px-5">
      <p className="font-mono text-[9px] tracking-[0.28em] text-gold">EDIT ENTRY</p>

      {entry.kind === 'meal' ? (
        <>
          <div className="grid grid-cols-2 gap-px border border-line bg-line">
            {(['usman', 'fasi'] as const).map((p) => (
              <label key={p} className="flex items-center gap-2 bg-card px-3 py-2.5">
                <span className="font-mono text-[9px] tracking-[0.2em] text-cream-dim">
                  {PEOPLE[p].short} PAID Rs
                </span>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={p === 'usman' ? usman : fasi}
                  onChange={(e) => (p === 'usman' ? setUsman(e.target.value) : setFasi(e.target.value))}
                  className={inp}
                  placeholder="0"
                />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-px border border-line bg-line">
            <button onClick={() => setSlot('break')} className={seg(slot === 'break')}>
              BREAK
            </button>
            <button onClick={() => setSlot('night')} className={seg(slot === 'night')}>
              NIGHT
            </button>
          </div>
          <div className="grid grid-cols-3 gap-px border border-line bg-line">
            <button onClick={() => setSplit('even')} className={seg(split === 'even')}>
              EVEN 50/50
            </button>
            <button onClick={() => setSplit('usman')} className={seg(split === 'usman')}>
              USMAN ATE
            </button>
            <button onClick={() => setSplit('fasi')} className={seg(split === 'fasi')}>
              FASI ATE
            </button>
          </div>
        </>
      ) : (
        <div className="flex gap-2.5">
          <button
            onClick={() => setFrom(from === 'usman' ? 'fasi' : 'usman')}
            className="flex items-center gap-2 border border-line bg-card px-3 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-cream transition-colors hover:border-gold/50"
            title="swap direction"
          >
            {PEOPLE[from].tag} <ArrowLeftRight className="size-3 text-gold" />{' '}
            {PEOPLE[from === 'usman' ? 'fasi' : 'usman'].tag}
          </button>
          <label className="flex flex-1 items-center gap-2 border border-line bg-card px-3 py-2">
            <span className="font-mono text-[9px] tracking-[0.2em] text-cream-dim">Rs</span>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inp}
              placeholder="0"
            />
          </label>
        </div>
      )}

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        maxLength={60}
        placeholder="note…"
        className={`border border-line bg-card px-3 py-2.5 ${inp}`}
      />

      <div className="flex gap-2">
        <button
          onClick={save}
          className="border border-gold bg-gold px-4 py-2 font-mono text-[10px] font-bold tracking-[0.2em] text-ink transition-colors hover:bg-gold-soft"
        >
          SAVE
        </button>
        <button
          onClick={onCancel}
          className="border border-line bg-card px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-cream-dim transition-colors hover:text-cream"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

interface DayGroup {
  key: string;
  label: string;
  total: number;
  items: Entry[];
}

export function History({ entries, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
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
    <section data-reveal className="border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <p className="flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.28em]">
          <HistoryIcon className="size-4 text-gold" strokeWidth={1.75} />
          THE LEDGER
        </p>
        <span className="font-mono text-[9px] tracking-[0.2em] text-cream-dim/90">
          {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <span className="grid size-14 place-items-center border border-line bg-paper text-cream-dim">
            <UtensilsCrossed className="size-6" strokeWidth={1.25} />
          </span>
          <div>
            <p className="font-serif text-3xl italic text-cream">the table is clean</p>
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
                      <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-paper/70 sm:gap-4 sm:px-5">
                        {/* time */}
                        <div className="w-14 shrink-0 leading-tight">
                          <p className="font-mono text-xs font-semibold tabular-nums text-cream">
                            {fmtTimeShort(e.at)}
                          </p>
                          <p className="font-mono text-[9px] tracking-[0.18em] text-cream-dim/90">
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
                              <p className="font-display text-sm font-medium sm:truncate">
                                {PEOPLE[e.from].name}
                                <span className="mx-1.5 text-sage">→</span>
                                {PEOPLE[e.from === 'usman' ? 'fasi' : 'usman'].name}
                                <span className="ml-2 font-mono text-[9px] tracking-[0.2em] text-sage">
                                  SETTLEMENT
                                </span>
                              </p>
                              <p className="mt-0.5 font-mono text-[10px] text-cream-dim sm:truncate">
                                {e.note || 'balance squared by hand'}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-display text-sm font-medium sm:truncate">
                                {e.note || (e.slot === 'night' ? 'Night meal' : 'Break meal')}
                                {e.split !== 'even' && (
                                  <span className="ml-2 font-mono text-[9px] tracking-[0.2em] text-gold">
                                    {e.split === 'usman' ? 'USMAN ATE' : 'FASI ATE'}
                                  </span>
                                )}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] tabular-nums text-cream-dim">
                                U {fmtMoney(e.usman).replace('Rs ', '')}
                                <span className="mx-1.5 text-cream-dim/45">|</span>
                                F {fmtMoney(e.fasi).replace('Rs ', '')}
                                <span className="mx-1.5 text-cream-dim/45">|</span>
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

                        {/* edit */}
                        <button
                          onClick={() => setEditing(editing === e.id ? null : e.id)}
                          aria-label="edit entry"
                          className={`grid size-8 shrink-0 place-items-center border transition-all ${
                            editing === e.id
                              ? 'border-gold/50 bg-gold/10 text-gold opacity-100'
                              : 'border-transparent text-cream-dim/60 opacity-0 hover:border-gold/50 hover:bg-gold/10 hover:text-gold focus:opacity-100 group-hover:opacity-100 max-sm:opacity-100'
                          }`}
                        >
                          <Pencil className="size-3.5" strokeWidth={1.75} />
                        </button>

                        {/* delete */}
                        <button
                          onClick={() => onDelete(e.id)}
                          aria-label="delete entry"
                          className="grid size-8 shrink-0 place-items-center border border-transparent text-cream-dim/60 opacity-0 transition-all hover:border-ember/50 hover:bg-ember/10 hover:text-ember focus:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.75} />
                        </button>
                      </div>

                      {/* inline editor */}
                      {editing === e.id && (
                        <EntryEditor
                          entry={e}
                          onSave={(next) => {
                            onUpdate(next);
                            setEditing(null);
                          }}
                          onCancel={() => setEditing(null)}
                        />
                      )}

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
