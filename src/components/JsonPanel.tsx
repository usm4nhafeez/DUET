import { useRef, useState } from 'react';
import { Braces, Check, Copy, Download, Eraser, Upload } from 'lucide-react';
import type { Entry } from '../lib/types';
import { parseImported, toJson } from '../lib/store';

interface Props {
  entries: Entry[];
  onImport: (entries: Entry[]) => void;
  onClear: () => void;
}

export function JsonPanel({ entries, onImport, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const json = toJson(entries);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('clipboard blocked by browser');
    }
  };

  const download = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duet-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = parseImported(await file.text());
      if (parsed.length === 0) {
        setError('no valid entries found in that file');
        return;
      }
      if (window.confirm(`Import ${parsed.length} entries? This replaces your current ledger.`)) {
        onImport(parsed);
      }
    } catch {
      setError('that file is not valid JSON');
    }
  };

  const clearAll = () => {
    if (window.confirm('Wipe the whole ledger? Every meal and settlement will be deleted.')) {
      onClear();
    }
  };

  const btn =
    'flex items-center justify-center gap-2 border border-line bg-paper px-3 py-2.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-cream-dim transition-colors hover:border-gold/50 hover:text-gold';

  return (
    <section className="border border-line bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <p className="flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.28em]">
          <Braces className="size-4 text-gold" strokeWidth={1.75} />
          YOUR DATA — RAW JSON
        </p>
        <div className="flex gap-2">
          <button onClick={copy} className={btn}>
            {copied ? <Check className="size-3.5 text-sage" /> : <Copy className="size-3.5" />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
          <button onClick={download} className={btn}>
            <Download className="size-3.5" /> .JSON
          </button>
          <button onClick={() => fileRef.current?.click()} className={btn}>
            <Upload className="size-3.5" /> IMPORT
          </button>
          <button
            onClick={clearAll}
            className="flex items-center justify-center gap-2 border border-line bg-paper px-3 py-2.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-cream-dim transition-colors hover:border-ember/60 hover:text-ember"
          >
            <Eraser className="size-3.5" /> WIPE
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={onFile} className="hidden" />
        </div>
      </div>

      {error && (
        <p className="border-b border-line bg-ember/10 px-5 py-2.5 font-mono text-[10px] tracking-[0.14em] text-ember">
          {error.toUpperCase()}
        </p>
      )}

      <div className="px-5 py-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between font-mono text-[10px] tracking-[0.22em] text-cream-dim transition-colors hover:text-gold"
        >
          <span>{open ? 'HIDE LEDGER FILE' : 'PEEK INSIDE THE LEDGER FILE'}</span>
          <span className={`transition-transform duration-300 ${open ? 'rotate-90' : ''}`}>→</span>
        </button>
        {open && (
          <pre className="mt-3 max-h-72 overflow-auto border border-line bg-ink p-4 font-mono text-[11px] leading-relaxed text-cream-dim">
            {json}
          </pre>
        )}
        <p className="mt-3 pb-1 font-mono text-[9px] leading-relaxed tracking-[0.12em] text-cream-dim/60">
          MIRROR OF YOUR LEDGER — ALSO AUTO-WRITTEN TO YOUR LINKED JSON FILE ON DISK. IMPORTING OR
          WIPING HERE SYNCES TO THE FILE TOO.
        </p>
      </div>
    </section>
  );
}
