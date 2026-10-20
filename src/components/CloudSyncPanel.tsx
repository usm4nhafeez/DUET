import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Cloud, CloudOff, Copy, KeyRound, Satellite, TriangleAlert } from 'lucide-react';
import type { CloudSync } from '../hooks/useCloudSync';

const solidBtn =
  'flex items-center justify-center gap-2 border border-gold bg-gold px-4 py-2.5 font-mono text-[10px] font-bold tracking-[0.18em] text-ink transition-colors hover:bg-gold-soft disabled:opacity-40';
const outlineBtn =
  'flex items-center justify-center gap-2 border border-line bg-paper px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-cream-dim transition-colors hover:border-gold/60 hover:text-gold';

const STEPS = [
  'console.firebase.google.com → add project (free, no card needed)',
  'build → firestore database → create database → start in test mode → enable',
  'project settings ⛭ → your apps → web (</>) → register → copy the firebaseConfig object',
];

export function CloudSyncPanel(sync: CloudSync) {
  const { state, code, error, lastPush, connectCode } = sync;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [codeInput, setCodeInput] = useState('usman-fasi');
  const [copied, setCopied] = useState(false);

  const skin =
    state === 'online'
      ? 'border-sage/40'
      : state === 'error'
        ? 'border-ember/50'
        : 'border-line';

  const doConnect = async () => {
    const ok = await sync.connect(text, codeInput);
    if (ok) {
      setOpen(false);
      setText('');
    }
  };

  const copyConnectCode = async () => {
    try {
      await navigator.clipboard.writeText(connectCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      className={`border bg-card ${skin}`}
    >
      <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        {/* status copy */}
        <div className="flex items-start gap-3.5">
          <span
            className={`grid size-10 shrink-0 place-items-center border ${
              state === 'online'
                ? 'border-sage/50 bg-sage/10 text-sage'
                : state === 'error'
                  ? 'border-ember/50 bg-ember/10 text-ember'
                  : 'border-line bg-paper text-cream-dim'
            }`}
          >
            {state === 'error' ? (
              <TriangleAlert className="size-4.5" strokeWidth={1.75} />
            ) : state === 'online' ? (
              <Satellite className="size-4.5" strokeWidth={1.75} />
            ) : (
              <Cloud className="size-4.5" strokeWidth={1.75} />
            )}
          </span>

          <div className="leading-tight">
            <p className="flex items-center gap-2.5 font-display text-sm font-bold tracking-[0.14em]">
              {state === 'online' && (
                <>
                  LIVE ON ALL DEVICES — ROOM “{code.toUpperCase()}”
                  <span className="size-1.5 animate-pulse rounded-full bg-sage" />
                </>
              )}
              {state === 'off' && 'ONE LEDGER, EVERY SCREEN — DEPLOY-SAFE SYNC'}
              {state === 'connecting' && 'CONNECTING TO THE CLOUD…'}
              {state === 'error' && 'CLOUD SYNC HIT A SNAG'}
            </p>
            <p className="mt-1 font-mono text-[10px] leading-relaxed tracking-wide text-cream-dim">
              {state === 'online' && (
                <>
                  open duet anywhere with the same room code — log or delete on one device, it
                  appears everywhere in ~1s
                  {lastPush && <span className="text-sage"> · last push {lastPush}</span>}
                </>
              )}
              {state === 'off' &&
                'after deploying, each device keeps its own copy by default. connect a free firebase room once and usman & fasi always see the same numbers.'}
              {state === 'connecting' && 'handshaking with firestore…'}
              {state === 'error' && (error || 'unknown error')}
            </p>
          </div>
        </div>

        {/* actions */}
        <div className="flex shrink-0 flex-wrap gap-2">
          {state === 'off' && (
            <button onClick={() => setOpen((o) => !o)} className={solidBtn}>
              <KeyRound className="size-3.5" strokeWidth={2} /> {open ? 'CLOSE SETUP' : 'SET UP LIVE SYNC'}
            </button>
          )}
          {state === 'connecting' && (
            <span className="px-2 font-mono text-[10px] tracking-[0.2em] text-gold">…</span>
          )}
          {state === 'error' && (
            <>
              <button onClick={() => setOpen(true)} className={solidBtn}>
                TRY AGAIN
              </button>
              <button onClick={sync.disconnect} className={outlineBtn}>
                <CloudOff className="size-3.5" strokeWidth={2} /> FORGET SETUP
              </button>
            </>
          )}
          {state === 'online' && (
            <>
              <button onClick={copyConnectCode} className={outlineBtn} title="send this to your other device — paste it in setup there">
                {copied ? <Check className="size-3.5 text-sage" /> : <Copy className="size-3.5" />}
                {copied ? 'COPIED' : 'COPY CONNECT CODE'}
              </button>
              <button onClick={sync.disconnect} className={outlineBtn}>
                <CloudOff className="size-3.5" strokeWidth={2} /> DISCONNECT
              </button>
            </>
          )}
        </div>
      </div>

      {/* setup wizard */}
      <AnimatePresence>
        {(open || state === 'connecting') && state !== 'online' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-line bg-ink/40 px-5 py-4">
              <ol className="space-y-1.5">
                {STEPS.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 font-mono text-[10px] leading-relaxed tracking-wide text-cream-dim">
                    <span className="grid size-4 shrink-0 place-items-center border border-gold/40 bg-gold/10 text-[9px] font-bold text-gold">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                rows={5}
                placeholder={'paste the firebaseConfig object here — or a connect code from your other device (starts with duet-sync:…)'}
                className="w-full resize-y border border-line bg-card p-3 font-mono text-[11px] leading-relaxed text-cream outline-none placeholder:text-cream-dim/40 focus:border-gold/60"
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex flex-1 items-center gap-3 border border-line bg-card px-3 py-2.5">
                  <span className="shrink-0 font-mono text-[9px] tracking-[0.2em] text-cream-dim">ROOM CODE</span>
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    className="w-full bg-transparent font-mono text-xs text-cream outline-none"
                    placeholder="usman-fasi"
                  />
                </label>
                <button onClick={doConnect} disabled={!text.trim() || state === 'connecting'} className={solidBtn}>
                  <Satellite className="size-3.5" strokeWidth={2} />
                  {state === 'connecting' ? 'CONNECTING…' : 'CONNECT'}
                </button>
              </div>

              <p className="font-mono text-[9px] leading-relaxed tracking-[0.12em] text-cream-dim/60">
                BOTH OF YOU USE THE SAME ROOM CODE. EASIEST WAY: SET UP ON ONE DEVICE, HIT “COPY
                CONNECT CODE”, SEND IT OVER WHATSAPP, AND PASTE IT HERE ON THE OTHER — DONE.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
