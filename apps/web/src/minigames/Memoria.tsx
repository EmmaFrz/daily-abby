import { useEffect, useState } from 'react';
import { Result } from '../components/Result';
import { sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { memoryDeckOfDay } from './content';
import { useDaily } from './useDaily';

const PERFECT = 12;

export function Memoria() {
  const { today } = useStore();
  const deck = memoryDeckOfDay(today);
  const [open, setOpen] = useState<number[]>([]);
  const { data, playing, play } = useDaily<{ matched: number[]; moves: number }>(
    'memoria',
    () => ({ matched: [], moves: 0 }),
    (d) =>
      d.matched.length === deck.length
        ? {
            won: true,
            score: d.moves,
            summary: `Todas las parejas en ${d.moves} movimientos.`,
            share: `🃏 ${d.moves} movimientos ${d.moves <= PERFECT ? '🧠✨' : ''}`.trim(),
            flags: d.moves <= PERFECT ? ['memoria-perfect'] : [],
          }
        : null,
  );

  // Dos cartas abiertas que no son pareja: se cierran solas.
  useEffect(() => {
    if (open.length !== 2) return;
    const t = setTimeout(() => setOpen([]), 750);
    return () => clearTimeout(t);
  }, [open]);

  const flip = (i: number) => {
    if (!playing || open.length === 2 || open.includes(i) || data.matched.includes(i)) return;
    sfx('flip');
    if (open.length === 0) return setOpen([i]);
    const first = open[0]!;
    const match = deck[first] === deck[i];
    sfx(match ? 'match' : 'absent', { delay: 250, pitch: match ? 1 + data.matched.length * 0.03 : 1 });
    play((d) => ({ moves: d.moves + 1, matched: match ? [...d.matched, first, i] : d.matched }));
    setOpen(match ? [] : [first, i]);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex justify-between text-sm font-bold text-white/65">
        <span>🃏 Movimientos: {data.moves}</span>
        <span>
          Parejas: {data.matched.length / 2}/{deck.length / 2}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 [perspective:900px] sm:gap-3">
        {deck.map((emoji, i) => {
          const faceUp = open.includes(i) || data.matched.includes(i) || !playing;
          const done = data.matched.includes(i);
          return (
            <button
              key={i}
              onClick={() => flip(i)}
              className="relative aspect-square transition-transform duration-500 [transform-style:preserve-3d]"
              style={{ transform: faceUp ? 'rotateY(180deg)' : undefined }}
              aria-label={faceUp ? emoji : 'Carta boca abajo'}
            >
              <span className="absolute inset-0 grid place-items-center rounded-2xl border border-white/15 bg-gradient-to-br from-abby/50 to-twitch/50 text-2xl text-white/70 shadow-lg [backface-visibility:hidden]">
                💜
              </span>
              <span
                className={`absolute inset-0 grid place-items-center rounded-2xl border text-4xl [backface-visibility:hidden] [transform:rotateY(180deg)] sm:text-5xl ${
                  done ? 'border-emerald-300/50 bg-emerald-500/20 shadow-[0_0_18px_rgb(52_211_153/0.35)]' : 'border-white/20 bg-white/12'
                }`}
              >
                {emoji}
              </span>
            </button>
          );
        })}
      </div>
      <Result id="memoria" />
    </div>
  );
}
