import { useEffect, useState } from 'react';

/** Milisegundos que faltan para `deadline` (0 si no hay deadline o ya pasó). */
export function useCountdown(deadline: number | null, now: () => number): number {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (deadline === null) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0, deadline - now()));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [deadline, now]);

  return remaining;
}
