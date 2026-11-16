import { useCallback, useState } from 'react';
import { Keyboard, usePhysicalKeys, type KeyState } from '../components/Keyboard';
import { Result } from '../components/Result';
import { normalizeWord } from '../lib/format';
import { sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { useDaily } from './useDaily';

const LEN = 5;
const MAX = 6;

export function scoreWord(guessRaw: string, answerRaw: string): KeyState[] {
  const guess = [...normalizeWord(guessRaw)];
  const answer = [...normalizeWord(answerRaw)];
  const res: KeyState[] = guess.map(() => 'absent');
  const left: Record<string, number> = {};
  answer.forEach((ch, i) => {
    if (guess[i] === ch) res[i] = 'ok';
    else left[ch] = (left[ch] ?? 0) + 1;
  });
  guess.forEach((ch, i) => {
    if (res[i] !== 'ok' && (left[ch] ?? 0) > 0) {
      res[i] = 'present';
      left[ch]!--;
    }
  });
  return res;
}

const TILE: Record<KeyState, string> = {
  ok: 'border-emerald-300/50 bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_16px_rgb(52_211_153/0.4)]',
  present: 'border-amber-200/50 bg-gradient-to-br from-amber-400 to-orange-500',
  absent: 'border-white/5 bg-white/10 text-white/70',
};
const SQ: Record<KeyState, string> = { ok: '🟩', present: '🟨', absent: '⬛' };

/**
 * Tablero tipo Wordle reutilizable (Wordle clásico y Palabrdle gamer).
 * `flag`: hazaña que se marca al resolverlo en 2 intentos o menos.
 */
export function WordleBoard({ id, answer, intro, flag }: { id: string; answer: string; intro: string; flag: string }) {
  const { toast } = useStore();
  const [draft, setDraft] = useState('');
  const [shake, setShake] = useState(0);
  const { data, playing, play } = useDaily<{ guesses: string[] }>(
    id,
    () => ({ guesses: [] }),
    (d) => {
      const n = d.guesses.length;
      const won = d.guesses[n - 1] === answer;
      if (!won && n < MAX) return null;
      return {
        won,
        score: n,
        summary: won ? `Resuelto en ${n}/${MAX}.` : 'Se acabaron los intentos.',
        share: d.guesses.map((g) => scoreWord(g, answer).map((s) => SQ[s]).join('')).join('\n'),
        flags: won && n <= 2 ? [flag] : [],
      };
    },
  );

  const keyStates: Record<string, KeyState> = {};
  const rank = { absent: 0, present: 1, ok: 2 } as const;
  for (const g of data.guesses) {
    scoreWord(g, answer).forEach((r, i) => {
      const ch = g[i]!;
      const prev = keyStates[ch];
      if (!prev || rank[r] > rank[prev]) keyStates[ch] = r;
    });
  }

  const press = useCallback(
    (k: string) => {
      if (!playing) return;
      if (k === 'BORRAR') return setDraft((d) => d.slice(0, -1));
      if (k !== 'ENTER') return setDraft((d) => (d.length < LEN ? d + k : d));
      if (draft.length !== LEN || data.guesses.includes(draft)) {
        sfx('wrong');
        setShake((n) => n + 1);
        toast({ icon: '✋', title: draft.length !== LEN ? 'Faltan letras' : 'Esa ya la probaste', tone: 'bad' });
        return;
      }
      // Cada casilla suena al girar, un poco más aguda que la anterior.
      scoreWord(draft, answer).forEach((s, i) => sfx(s, { delay: i * 160 + 120, pitch: 1 + i * 0.06 }));
      play((d) => ({ guesses: [...d.guesses, draft] }));
      setDraft('');
    },
    [playing, draft, data.guesses, play, toast, answer],
  );
  usePhysicalKeys(press, playing);

  const rows = Array.from({ length: MAX }, (_, r) => {
    if (r < data.guesses.length) return { word: data.guesses[r]!, scores: scoreWord(data.guesses[r]!, answer), current: false };
    return { word: r === data.guesses.length && playing ? draft : '', scores: null, current: r === data.guesses.length };
  });

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-center text-sm text-white/65">{intro} 🟩 en su sitio · 🟨 está pero en otro sitio · ⬛ no está</p>
      <div className="grid gap-1.5">
        {rows.map((row, r) => (
          <div key={`${r}-${row.current ? shake : 0}`} className={`grid grid-cols-5 gap-1.5 ${row.current && shake ? 'animate-shake' : ''}`}>
            {Array.from({ length: LEN }, (_, i) => {
              const ch = row.word[i] ?? '';
              const sc = row.scores?.[i];
              const justPlayed = !!row.scores && r === data.guesses.length - 1;
              return (
                <div
                  key={i}
                  className={`grid h-13 w-13 place-items-center rounded-xl border-2 font-display text-2xl font-bold sm:h-15 sm:w-15 sm:text-3xl ${
                    sc ? TILE[sc] : ch ? 'animate-pop border-abby/60 bg-white/8' : 'border-white/12 bg-white/3'
                  } ${justPlayed ? 'animate-flip' : ''}`}
                  style={justPlayed ? { animationDelay: `${i * 160}ms` } : undefined}
                >
                  {ch}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {playing && (
        <div className="mt-5 w-full">
          <Keyboard states={keyStates} onKey={press} />
        </div>
      )}
      <div className="w-full">
        <Result id={id} answer={<b className="font-display tracking-[0.25em] text-white">{answer}</b>} />
      </div>
    </div>
  );
}
