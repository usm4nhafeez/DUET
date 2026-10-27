import { useEffect, useRef } from 'react';
import { ExodeUICanvas, type ExodeUIEngine } from 'exodeui';

interface Props {
  /** 0-100 — happy when the ledger is square */
  mood: number;
  /** bump this number to make Ember react to a ledger change */
  waveKey: number;
  /** signed balance — >0 Fasi owes (Ember leans right), <0 Usman owes (leans left) */
  balance: number;
}

/** click-cycle through Ember's trick repertoire — Cool is the signature sunglasses move */
const TRICKS = ['cool', 'wink', 'think', 'laugh', 'party', 'wiggle', 'blep', 'starstruck'] as const;

/** Ember the Fox — ledger companion living in the footer (exode mascot, public/mascots/ip-2007.bexode) */
export function Mascot({ mood, waveKey, balance }: Props) {
  const engine = useRef<ExodeUIEngine | null>(null);
  const ready = useRef(false);
  const trick = useRef(0);
  const wrap = useRef<HTMLDivElement | null>(null);
  const square = mood >= 100;

  /* page-wide gaze: exodeui's `interactive` only tracks the pointer inside the canvas box,
     but the rig inputs mouseX/mouseY/eyeX/eyeY are plain artboard coords (240 = centre).
     Feed them from a window listener with an expanded mapping so Ember's head + eyes
     follow the cursor anywhere on the site. Pointer over Ember himself falls through to
     the canvas' own precise tracking. */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const eng = engine.current;
      const t = e.target;
      if (!eng || (t instanceof Node && wrap.current?.contains(t))) return;
      const mx = 240 + (e.clientX / window.innerWidth - 0.5) * 1440;
      const my = 240 + (e.clientY / window.innerHeight - 0.5) * 1440;
      eng.updateInput('mouseX', mx);
      eng.updateInput('mouseY', my);
      eng.updateInput('eyeX', mx);
      eng.updateInput('eyeY', my);
    };
    window.addEventListener('pointermove', onMove);
    // touchscreens never fire bare pointermove — a tap anywhere should move his face too
    window.addEventListener('pointerdown', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
    };
  }, []);

  useEffect(() => {
    if (waveKey > 0 && ready.current) engine.current?.fireTrigger(square ? 'love' : 'wave');
  }, [waveKey, square]);

  const doTrick = () => {
    engine.current?.fireTrigger(TRICKS[trick.current % TRICKS.length]);
    trick.current += 1;
  };

  return (
    <div
      ref={wrap}
      role="button"
      tabIndex={0}
      aria-label="Ember the fox — click for a trick"
      title="Click Ember for a trick (try the sunglasses)"
      onClick={doTrick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && doTrick()}
      className="grid size-[140px] shrink-0 cursor-pointer select-none place-items-center border border-line bg-card p-1 transition-colors hover:border-gold/50"
    >
      <ExodeUICanvas
        src="/mascots/ip-2007.bexode"
        inputs={{
          mood,
          ears: mood,
          focus: square ? 10 : 0,
          tilt: Math.max(-80, Math.min(80, balance / 6)),
        }}
        interactive
        preventScroll
        onReady={(eng) => {
          engine.current = eng;
          ready.current = true;
          if (waveKey > 0) eng.fireTrigger(mood >= 100 ? 'love' : 'wave');
        }}
      />
    </div>
  );
}
