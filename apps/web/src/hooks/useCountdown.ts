import { useEffect, useState } from 'react';
import { msUntilNextDay } from '../lib/daily';
import { fmtCountdown } from '../lib/format';

/** Cuenta atrás hasta medianoche, en formato HH:MM:SS. */
export function useCountdown(): string {
  const [ms, setMs] = useState(msUntilNextDay);
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextDay()), 1000);
    return () => clearInterval(id);
  }, []);
  return fmtCountdown(ms);
}
