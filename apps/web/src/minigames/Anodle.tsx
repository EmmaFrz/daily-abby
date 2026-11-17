import { useState } from 'react';
import { Result } from '../components/Result';
import { sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { dailyGames } from './content';
import { useDaily } from './useDaily';

const MAX = 6;
const MIN_YEAR = 1980;
const MAX_YEAR = 2026;

function heat(diff: number) {
  const d = Math.abs(diff);
  if (d === 0) return { label: '¡Exacto!', cls: 'from-emerald-400 to-emerald-600', sq: '🟩' };
  if (d <= 2) return { label: '🔥 Muy cerca', cls: 'from-amber-400 to-orange-500', sq: '🟨' };
  if (d <= 5) return { label: '🌡️ Cerca', cls: 'from-orange-500 to-rose-500', sq: '🟧' };
  return { label: '❄️ Lejos', cls: 'from-sky-600 to-indigo-700', sq: '🟦' };
}

export function Anodle() {
  const { today } = useStore();
  const target = dailyGames(today).anodle;
  const [year, setYear] = useState(2015);
  const { data, playing, play } = useDaily<{ guesses: number[] }>(
    'anodle',
    () => ({ guesses: [] }),
    (d) => {
      const n = d.guesses.length;
      const won = d.guesses[n - 1] === target.year;
      if (!won && n < MAX) return null;
      return {
        won,
        score: n,
        summary: won ? `Año exacto en ${n} ${n === 1 ? 'intento' : 'intentos'}.` : `Era ${target.year}.`,
        share: d.guesses.map((g) => heat(g - target.year).sq + (g === target.year ? '' : g < target.year ? '⬆️' : '⬇️')).join(' '),
        flags: won && n === 1 ? ['anodle-1'] : [],
      };
    },
  );

  const submit = () => {
    if (data.guesses.includes(year)) return;
    const diff = Math.abs(year - target.year);
    if (diff > 0) sfx(diff <= 2 ? 'present' : 'wrong');
    play((d) => ({ guesses: [...d.guesses, year] }));
  };
  const nudge = (n: number) => {
    sfx('tap', { pitch: n > 0 ? 1.15 : 0.85 });
    setYear((y) => Math.min(MAX_YEAR, Math.max(MIN_YEAR, y + n)));
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-5 flex w-full max-w-md items-center gap-4 rounded-3xl border border-amber-300/30 bg-gradient-to-br from-amber-400/15 to-orange-600/10 p-4">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/10 text-5xl">{target.icon}</span>
        <div>
          <div className="font-display text-2xl font-bold leading-tight">{target.name}</div>
          <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
            <span className="chip bg-white/10 text-white/70">{target.genre}</span>
            <span className="chip bg-white/10 text-white/70">{target.studio}</span>
          </div>
        </div>
      </div>

      {playing && (
        <>
          <p className="mb-3 text-sm text-white/65">¿En qué año salió? Te diremos si es antes o después.</p>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost px-3" onClick={() => nudge(-5)}>
              −5
            </button>
            <button className="btn btn-ghost px-3" onClick={() => nudge(-1)}>
              −1
            </button>
            <input
              type="number"
              value={year}
              min={MIN_YEAR}
              max={MAX_YEAR}
              onChange={(e) => setYear(Number(e.target.value) || MIN_YEAR)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-28 rounded-2xl border-2 border-slot bg-paper py-2 text-center font-display text-3xl font-bold outline-none focus:border-amber-300/70"
            />
            <button className="btn btn-ghost px-3" onClick={() => nudge(1)}>
              +1
            </button>
            <button className="btn btn-ghost px-3" onClick={() => nudge(5)}>
              +5
            </button>
          </div>
          <button className="btn btn-primary mt-3 px-10" disabled={data.guesses.includes(year)} onClick={submit}>
            Probar {year} · {MAX - data.guesses.length} intentos
          </button>
        </>
      )}

      <div className="mt-5 grid w-full max-w-md gap-2">
        {[...data.guesses].reverse().map((g, i) => {
          const h = heat(g - target.year);
          return (
            <div
              key={g}
              className={`flex items-center justify-between rounded-2xl bg-gradient-to-r px-4 py-2.5 font-bold ${h.cls} ${i === 0 ? 'animate-pop' : ''}`}
            >
              <span className="font-display text-2xl">{g}</span>
              <span>{h.label}</span>
              <span className="text-2xl">{g === target.year ? '✅' : g < target.year ? '⬆️' : '⬇️'}</span>
            </div>
          );
        })}
      </div>

      <div className="w-full">
        <Result id="anodle" answer={<b className="text-white">{target.year}</b>} />
      </div>
    </div>
  );
}
