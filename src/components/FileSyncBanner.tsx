import { motion } from 'framer-motion';
import {
  AlertTriangle,
  FilePlus2,
  FolderOpen,
  HardDrive,
  ShieldCheck,
  Unlink,
} from 'lucide-react';
import type { FileSync } from '../hooks/useFileSync';

const outlineBtn =
  'flex items-center justify-center gap-2 border border-line bg-paper px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-cream-dim transition-colors hover:border-gold/60 hover:text-gold';
const solidBtn =
  'flex items-center justify-center gap-2 border border-gold bg-gold px-4 py-2.5 font-mono text-[10px] font-bold tracking-[0.18em] text-ink transition-colors hover:bg-gold-soft';

export function FileSyncBanner(props: FileSync) {
  const { state, supported, fileName, lastSaved, note } = props;

  const skin =
    state === 'connected'
      ? 'border-sage/40'
      : state === 'needs-permission'
        ? 'border-ember/50'
        : state === 'disconnected'
          ? 'border-gold/40'
          : 'border-line';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      className={`border bg-card ${skin}`}
    >
      <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        {/* left — status copy */}
        <div className="flex items-start gap-3.5">
          <span
            className={`grid size-10 shrink-0 place-items-center border ${
              state === 'connected'
                ? 'border-sage/50 bg-sage/10 text-sage'
                : state === 'needs-permission'
                  ? 'border-ember/50 bg-ember/10 text-ember'
                  : 'border-gold/40 bg-gold/10 text-gold'
            }`}
          >
            {state === 'connected' ? (
              <ShieldCheck className="size-4.5" strokeWidth={1.75} />
            ) : state === 'needs-permission' || !supported ? (
              <AlertTriangle className="size-4.5" strokeWidth={1.75} />
            ) : (
              <HardDrive className="size-4.5" strokeWidth={1.75} />
            )}
          </span>

          <div className="leading-tight">
            <p className="flex items-center gap-2.5 font-display text-sm font-bold tracking-[0.14em]">
              {state === 'connected' && (
                <>
                  DISK-SYNCING — {fileName.toUpperCase()}
                  <span className="size-1.5 animate-pulse rounded-full bg-sage" />
                </>
              )}
              {state === 'needs-permission' && `RE-ENABLE FILE ACCESS — ${fileName.toUpperCase()}`}
              {state === 'disconnected' && 'PROTECT YOUR LEDGER — SAVE IT TO A REAL JSON FILE'}
              {state === 'checking' && 'CHECKING LINKED FILE…'}
              {state === 'unsupported' && 'EXTERNAL FILE SYNC NOT AVAILABLE HERE'}
            </p>
            <p className="mt-1 font-mono text-[10px] leading-relaxed tracking-wide text-cream-dim">
              {state === 'connected' && (
                <>
                  every meal &amp; settlement is written straight to the file on your device
                  {lastSaved && <span className="text-sage"> · last write {lastSaved}</span>}
                  {note && <span className="text-gold"> · {note}</span>}
                </>
              )}
              {state === 'needs-permission' &&
                'your json file is still linked, but the browser paused write access after restart — one click restores it.'}
              {state === 'disconnected' &&
                'data currently lives only in this browser. link duet-ledger.json once and it auto-saves + auto-restores forever — safe from cache clears and UI updates.'}
              {state === 'checking' &&
                'restoring your ledger from the connected json file…'}
              {state === 'unsupported' &&
                'live file sync needs chrome or edge on desktop. your data still auto-saves in this browser — use the export/import buttons below for manual backups.'}
            </p>
          </div>
        </div>

        {/* right — actions */}
        <div className="flex shrink-0 flex-wrap gap-2">
          {state === 'disconnected' && (
            <>
              <button onClick={props.onCreate} className={solidBtn}>
                <FilePlus2 className="size-3.5" strokeWidth={2} /> CREATE JSON FILE
              </button>
              <button onClick={props.onLink} className={outlineBtn}>
                <FolderOpen className="size-3.5" strokeWidth={2} /> LINK EXISTING FILE
              </button>
            </>
          )}
          {state === 'needs-permission' && (
            <>
              <button onClick={props.onEnable} className={solidBtn}>
                <ShieldCheck className="size-3.5" strokeWidth={2} /> ENABLE AUTO-SAVE
              </button>
              <button onClick={props.onDisconnect} className={outlineBtn}>
                <Unlink className="size-3.5" strokeWidth={2} /> UNLINK
              </button>
            </>
          )}
          {state === 'connected' && (
            <button onClick={props.onDisconnect} className={outlineBtn}>
              <Unlink className="size-3.5" strokeWidth={2} /> UNLINK FILE
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}
