import { useEffect, useRef, useState } from 'react';

/** smoothly eases towards a changing numeric target */
export function useAnimatedNumber(target: number, duration = 750): number {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = from + (target - from) * eased;
      setVal(v);
      fromRef.current = v;
      if (k < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return val;
}
