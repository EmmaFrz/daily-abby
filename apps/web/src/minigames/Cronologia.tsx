import { Result } from '../components/Result';
import { gameById } from '../data/games';
import { sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { chronologyOfDay } from './content';
import { useDaily } from './useDaily';

const MAX = 3;

interface Data {
  order: string[];
  attempts: boolean[][];
}

export function Cronologia() {
  const { today } = useStore();
  const { answer, start } = chronologyOfDay(today);
  const { data, playing, play } = useDaily<Data>(
    'cronologia',
    () => ({ order: start, attempts: [] }),
    (d) => {
      const n = d.attempts.length;
      const won = n > 0 && d.attempts[n - 1]!.every(Boolean);
      if (!won && n < MAX) return null;
      return {
        won,
        score: n,
        summary: won ? `Ordenado en ${n} ${n === 1 ? 'intento' : 'intentos'}.` : 'La historia es complicada.',
        share: d.attempts.map((row) => row.map((ok) => (ok ? '🟩' : '🟥')).join('')).join('\n'),
        flags: won && n === 1 ? ['cronologia-1'] : [],
      };
    },
  );

  const last = data.attempts[data.attempts.length - 1];
  const order = playing ? data.order : answer;
  const move = (i: number, dir: -1 | 1) => {
    sfx('tap', { pitch: dir < 0 ? 1.15 : 0.9 });
    play((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.order.length) return d;
      const o = [...d.order];
      [o[i], o[j]] = [o[j]!, o[i]!];
      return { ...d, order: o };
    });
  };
  const check = () => {
    data.order.forEach((id, i) => sfx(id === answer[i] ? 'ok' : 'absent', { delay: i * 120, pitch: 1 + i * 0.06 }));
    play((d) => ({ ...d, attempts: [...d.attempts, d.order.map((id, i) => id === answer[i])] }));
  };

  return (
    <div className="mx-auto max-w-lg">
      <p className="mb-4 text-center text-sm text-white/65">
        Ordena del <b>más antiguo</b> (arriba) al <b>más nuevo</b> (abajo).
        {playing && <span className="chip ml-1 bg-white/10 text-white/75">{MAX - data.attempts.length} intentos</span>}
      </p>
      <ol className="grid gap-2">
        {order.map((id, i) => {
          const g = gameById(id);
          const mark = playing && last && data.order[i] === id ? (last[i] ? 'ok' : 'no') : null;
          return (
            <li
              key={id}
              className={`flex items-center gap-3 rounded-2xl border p-2.5 transition-all ${
                !playing || mark === 'ok'
                  ? 'border-emerald-300/40 bg-emerald-500/15'
                  : mark === 'no'
                    ? 'border-rose-300/30 bg-rose-500/10'
                    : 'border-white/12 bg-white/6'
              }`}
            >
              <span className="w-5 text-center font-display text-lg text-white/40">{i + 1}</span>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-2xl">{g.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold">{g.name}</span>
                {!playing && <span className="block font-display text-sm text-emerald-200">{g.year}</span>}
              </span>
              {mark && <span>{mark === 'ok' ? '✅' : '❌'}</span>}
              {playing && (
                <span className="flex flex-col gap-1">
                  <button className="btn btn-ghost h-7 px-2.5 py-0 text-xs" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">
                    ▲
                  </button>
                  <button
                    className="btn btn-ghost h-7 px-2.5 py-0 text-xs"
                    disabled={i === order.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="Bajar"
                  >
                    ▼
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {playing && (
        <button className="btn btn-primary mt-4 w-full" onClick={check}>
          Comprobar orden
        </button>
      )}
      <Result id="cronologia" />
    </div>
  );
}
