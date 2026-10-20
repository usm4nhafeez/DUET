const ITEMS = [
  'USMAN × FASI',
  'BREAK TIME & NIGHT RUNS',
  'SPLIT IT EVEN',
  'NO DEBT FORGOTTEN',
  'LOG EVERY BITE',
  'STORED AS JSON',
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-y border-line bg-ink-2 py-3">
      <div className="marquee-track flex w-max items-center">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center" aria-hidden={half === 1}>
            {row.map((t, i) => (
              <span
                key={`${half}-${i}`}
                className="flex items-center font-mono text-[10px] tracking-[0.34em] text-cream-dim/70"
              >
                <span className="px-6">{t}</span>
                <span className="size-1 rotate-45 bg-gold/50" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
