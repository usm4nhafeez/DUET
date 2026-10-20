import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Coffee, Moon, Plus, TimerReset, UtensilsCrossed, Zap } from 'lucide-react';
import type { Slot, Split } from '../lib/types';
import { PEOPLE } from '../lib/types';
import { fmtDateChip, fmtMoney, pad2, toLocalInputValue } from '../lib/format';
import { useNow } from '../hooks/useNow';

interface Props {
  onAdd: (meal: {
    at: string;
    slot: Slot;
    note: string;
    split: Split;
    usman: number;
    fasi: number;
  }) => void;
}

const SPLITS: { key: Split; label: string }[] = [
  { key: 'even', label: 'EVEN 50/50' },
  { key: 'usman', label: 'USMAN ONLY' },
  { key: 'fasi', label: 'FASI ONLY' },
];

export function MealForm({ onAdd }: Props) {
  const now = useNow(1000);
  const h = now.getHours();
  const suggestedSlot: Slot = h >= 5 && h < 17 ? 'break' : 'night';

  const [slot, setSlot] = useState<Slot>(suggestedSlot);
  const [slotTouched, setSlotTouched] = useState(false);
  const [timeMode, setTimeMode] = useState<'auto' | 'manual'>('auto');
  const [manualDT, setManualDT] = useState(toLocalInputValue(new Date()));
  const [usmanAmt, setUsmanAmt] = useState('');
  const [fasiAmt, setFasiAmt] = useState('');
  const [split, setSplit] = useState<Split>('even');
  const [note, setNote] = useState('');
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (!slotTouched) setSlot(suggestedSlot);
  }, [suggestedSlot, slotTouched]);

  const u = Number(usmanAmt) || 0;
  const f = Number(fasiAmt) || 0;
  const total = u + f;

  const submit = () => {
    if (total <= 0) {
      setShake((s) => s + 1);
      return;
    }
    const at =
      timeMode === 'auto'
        ? new Date().toISOString()
        : new Date(manualDT || toLocalInputValue(new Date())).toISOString();
    onAdd({ at, slot, note: note.trim(), split, usman: u, fasi: f });
    setUsmanAmt('');
    setFasiAmt('');
    setNote('');
    setSplit('even');
    setTimeMode('auto');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      className="border border-line bg-card"
    >
      {/* form header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <p className="flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.28em] text-cream">
          <UtensilsCrossed className="size-4 text-gold" strokeWidth={1.75} />
          LOG A MEAL
        </p>
        <span className="font-mono text-[9px] tracking-[0.2em] text-cream-dim/70">SAVED AS JSON</span>
      </div>

      <div className="space-y-5 p-5">
        {/* slot segmented */}
        <div>
          <p className="mb-2 font-mono text-[9px] tracking-[0.28em] text-cream-dim">
            MEAL SESSION {!slotTouched && <span className="text-gold">· AUTO-SUGGESTED</span>}
          </p>
          <div className="grid grid-cols-2 gap-px border border-line bg-line">
            <button
              onClick={() => {
                setSlot('break');
                setSlotTouched(true);
              }}
              className={`flex items-center justify-center gap-2 py-3 font-mono text-[11px] font-semibold tracking-[0.2em] transition-colors ${
                slot === 'break'
                  ? 'bg-gold text-ink'
                  : 'bg-paper text-cream-dim hover:text-cream'
              }`}
            >
              <Coffee className="size-4" strokeWidth={1.75} /> BREAK TIME
            </button>
            <button
              onClick={() => {
                setSlot('night');
                setSlotTouched(true);
              }}
              className={`flex items-center justify-center gap-2 py-3 font-mono text-[11px] font-semibold tracking-[0.2em] transition-colors ${
                slot === 'night'
                  ? 'bg-gold text-ink'
                  : 'bg-paper text-cream-dim hover:text-cream'
              }`}
            >
              <Moon className="size-4" strokeWidth={1.75} /> NIGHT
            </button>
          </div>
        </div>

        {/* time mode */}
        <div>
          <p className="mb-2 font-mono text-[9px] tracking-[0.28em] text-cream-dim">
            DATE · TIME · WEEKDAY
          </p>
          <motion.div key="timebox" className="border border-line bg-paper">
            <div className="grid grid-cols-2 gap-px bg-line">
              <button
                onClick={() => setTimeMode('auto')}
                className={`flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] font-semibold tracking-[0.2em] transition-colors ${
                  timeMode === 'auto' ? 'bg-cream text-ink' : 'bg-paper text-cream-dim hover:text-cream'
                }`}
              >
                <Zap className="size-3.5" /> AUTO · LIVE
              </button>
              <button
                onClick={() => {
                  setManualDT(toLocalInputValue(new Date()));
                  setTimeMode('manual');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] font-semibold tracking-[0.2em] transition-colors ${
                  timeMode === 'manual' ? 'bg-cream text-ink' : 'bg-paper text-cream-dim hover:text-cream'
                }`}
              >
                <TimerReset className="size-3.5" /> MANUAL
              </button>
            </div>
            <div className="px-4 py-3">
              {timeMode === 'auto' ? (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] leading-relaxed text-cream-dim">
                  <CalendarClock className="size-3.5 text-gold" />
                  <span className="text-cream">{fmtDateChip(now)}</span>
                  <span className="text-gold tabular-nums">
                    {pad2(now.getHours())}
                    <span className="blink">:</span>
                    {pad2(now.getMinutes())}
                    <span className="blink">:</span>
                    {pad2(now.getSeconds())}
                  </span>
                  <span className="tracking-[0.14em]">— CAPTURED ON SAVE</span>
                </p>
              ) : (
                <input
                  type="datetime-local"
                  value={manualDT}
                  onChange={(e) => setManualDT(e.target.value)}
                  className="w-full bg-transparent font-mono text-xs text-cream outline-none"
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* amounts */}
        <motion.div
          key={shake}
          animate={shake ? { x: [0, -7, 7, -4, 4, 0] } : {}}
          transition={{ duration: 0.35 }}
        >
          <p className="mb-2 font-mono text-[9px] tracking-[0.28em] text-cream-dim">WHO PAID WHAT</p>
          <div className="grid grid-cols-2 gap-px border border-line bg-line">
            {(['usman', 'fasi'] as const).map((p) => (
              <label key={p} className="block bg-paper px-4 pb-3 pt-3 focus-within:bg-card">
                <span className="mb-1.5 flex items-center gap-2 font-mono text-[9px] tracking-[0.24em] text-cream-dim">
                  <span className="grid size-4 place-items-center border border-gold/40 bg-gold/10 text-[8px] font-bold text-gold">
                    {PEOPLE[p].short}
                  </span>
                  {PEOPLE[p].tag} PAID
                </span>
                <span className="flex items-baseline gap-1.5">
                  <span className="font-mono text-xs text-cream-dim">Rs</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="0"
                    value={p === 'usman' ? usmanAmt : fasiAmt}
                    onChange={(e) => (p === 'usman' ? setUsmanAmt(e.target.value) : setFasiAmt(e.target.value))}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    className="w-full bg-transparent font-mono text-xl font-semibold tabular-nums text-cream outline-none placeholder:text-cream-dim/40"
                  />
                </span>
              </label>
            ))}
          </div>

          {/* live total strip */}
          <div className="flex items-center justify-between border border-t-0 border-line bg-gold/10 px-4 py-3">
            <span className="font-mono text-[10px] tracking-[0.28em] text-gold">TOTAL MEAL</span>
            <motion.span
              key={total}
              initial={{ scale: 1.06 }}
              animate={{ scale: 1 }}
              className="font-mono text-lg font-bold tabular-nums text-gold-soft"
            >
              {fmtMoney(total)}
            </motion.span>
          </div>
        </motion.div>

        {/* split */}
        <div>
          <p className="mb-2 font-mono text-[9px] tracking-[0.28em] text-cream-dim">WHO ATE — THE SHARE</p>
          <div className="grid grid-cols-3 gap-px border border-line bg-line">
            {SPLITS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSplit(s.key)}
                className={`py-2.5 font-mono text-[9px] font-semibold tracking-[0.16em] transition-colors ${
                  split === s.key ? 'bg-cream text-ink' : 'bg-paper text-cream-dim hover:text-cream'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* note */}
        <div>
          <p className="mb-2 font-mono text-[9px] tracking-[0.28em] text-cream-dim">
            MEAL DETAIL <span className="text-cream-dim/60">— OPTIONAL</span>
          </p>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="anda paratha @ canteen…"
            maxLength={60}
            className="w-full border border-line bg-paper px-4 py-3 font-mono text-sm text-cream outline-none placeholder:text-cream-dim/40 focus:border-gold/60"
          />
        </div>

        {/* submit */}
        <button
          onClick={submit}
          disabled={total <= 0}
          className="flex w-full items-center justify-center gap-2.5 border border-gold bg-gold py-4 font-mono text-[12px] font-bold tracking-[0.28em] text-ink transition-all hover:bg-gold-soft active:scale-[0.99] disabled:cursor-not-allowed disabled:border-line disabled:bg-paper disabled:text-cream-dim"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          LOG MEAL — {fmtMoney(total)}
        </button>
      </div>
    </motion.div>
  );
}
