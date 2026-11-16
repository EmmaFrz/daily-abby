import { useState } from 'react';
import { Result } from '../components/Result';
import type { Game } from '../data/games';
import { haptic, sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { chainOfDay, CHAIN_ROUNDS } from './content';
import { useDaily } from './useDaily';

const PASS = 5;

function GameCard({ g, year, tone }: { g: Game; year: string; tone: string }) {
  return (
    <div className={`animate-pop flex flex-1 flex-col items-center rounded-3xl border p-4 text-center ${tone}`}>
      <span className="text-5xl sm:text-6xl">{g.icon}</span>
      <span className="mt-2 font-display text-lg font-semibold leading-tight">{g.name}</span>
      <span className="mt-1 font-display text-3xl font-bold">{year}</span>
    </div>
  );
}

export function MasOMenos() {
  const { today } = useStore();
  const chain = chainOfDay(today);
  const { data, playing, play } = useDaily<{ answers: boolean[] }>(
    'masomenos',
    () => ({ answers: [] }),
    (d) => {
      const right = d.answers.filter(Boolean).length;
      const failed = d.answers.includes(false);
      if (!failed && d.answers.length < CHAIN_ROUNDS) return null;
      return {
        won: right >= PASS,
        score: right,
        summary: failed ? `Racha de ${right}. ${right >= PASS ? '¡Suficiente para ganar!' : `Necesitabas ${PASS}.`}` : '¡10 de 10, perfecta!',
        share: d.answers.map((a) => (a ? '🟩' : '🟥')).join(''),
        flags: right === CHAIN_ROUNDS ? ['masomenos-10'] : [],
      };
    },
  );
  // Ronda que se está mostrando (puede ir por detrás para enseñar el último resultado).
  const [shown, setShown] = useState(() => (playing ? data.answers.length : Math.max(0, data.answers.length - 1)));
  const round = Math.min(shown, CHAIN_ROUNDS - 1);
  const a = chain[round]!;
  const b = chain[round + 1]!;
  const result = data.answers[round];
  const revealed = result != null;

  const answer = (later: boolean) => {
    const right = later === b.year > a.year;
    // Cada acierto seguido suena un poco más agudo.
    sfx(right ? 'ok' : 'wrong', { pitch: 1 + data.answers.length * 0.05 });
    if (!right) haptic(100);
    play((d) => (d.answers.length === round ? { answers: [...d.answers, right] } : d));
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between text-sm font-bold text-white/60">
        <span>
          Ronda {round + 1}/{CHAIN_ROUNDS}
        </span>
        <span>🔥 Racha: {data.answers.filter(Boolean).length}</span>
      </div>
      <div key={round} className="flex items-stretch gap-3">
        <GameCard g={a} year={String(a.year)} tone="border-white/12 bg-white/6" />
        <div className="grid place-items-center font-display text-xl font-bold text-white/40">VS</div>
        <GameCard
          g={b}
          year={revealed ? String(b.year) : '????'}
          tone={revealed ? (result ? 'border-emerald-300/50 bg-emerald-500/20' : 'border-rose-300/50 bg-rose-500/20') : 'border-lime-300/30 bg-lime-400/10'}
        />
      </div>

      {!revealed && playing && (
        <>
          <p className="my-4 text-center font-bold text-white/75">
            ¿{b.name} salió antes o después que {a.name}?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn btn-ghost py-4 text-lg" onClick={() => answer(false)}>
              ⬅️ Antes
            </button>
            <button className="btn btn-primary py-4 text-lg" onClick={() => answer(true)}>
              Después ➡️
            </button>
          </div>
        </>
      )}
      {revealed && playing && (
        <button
          className="btn btn-primary mt-4 w-full"
          onClick={() => {
            sfx('pop');
            setShown(round + 1);
          }}
        >
          {result ? '¡Correcto! Siguiente →' : 'Siguiente →'}
        </button>
      )}
      {revealed && !playing && (
        <p className={`mt-4 text-center font-bold ${result ? 'text-emerald-200' : 'text-rose-200'}`}>
          {result ? '¡Correcto!' : `Fallo: ${b.name} salió en ${b.year}.`}
        </p>
      )}
      <Result id="masomenos" />
    </div>
  );
}
