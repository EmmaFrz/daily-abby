import { currentRun, finishRun } from '../state/progress';
import { useStore } from '../state/store';
import type { Outcome } from '../state/types';

/**
 * Estado de hoy de un minijuego.
 * - `init`: estado inicial (debe ser determinista para el día).
 * - `judge`: devuelve el resultado cuando la partida termina, o null si sigue.
 * `play(fn)` aplica un movimiento y, si la partida acaba, registra rachas, récords y logros.
 */
export function useDaily<T>(id: string, init: () => T, judge: (d: T) => Outcome | null) {
  const { state, today, act } = useStore();
  const run = currentRun(state, id, today, init);

  const play = (fn: (d: T) => T) =>
    act((s) => {
      const r = currentRun(s, id, today, init);
      if (r.status !== 'playing') return s;
      const data = fn(r.data);
      const outcome = judge(data);
      if (!outcome) return { ...s, runs: { ...s.runs, [id]: { ...r, data } } };
      return finishRun(s, id, today, data, outcome);
    });

  return { run, data: run.data, playing: run.status === 'playing', play, today };
}
