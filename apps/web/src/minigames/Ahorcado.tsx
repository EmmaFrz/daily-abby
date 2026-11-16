import { useCallback } from 'react';
import { Keyboard, usePhysicalKeys, type KeyState } from '../components/Keyboard';
import { Result } from '../components/Result';
import { normalizeWord } from '../lib/format';
import { haptic, sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { dailyGames } from './content';
import { useDaily } from './useDaily';

const LIVES = 6;
const isLetter = (ch: string) => /^[A-ZÑ]$/.test(ch);

export function Ahorcado() {
  const { today } = useStore();
  const target = dailyGames(today).ahorcado;
  const name = normalizeWord(target.name);
  const needed = new Set([...name].filter(isLetter));

  const { data, playing, play } = useDaily<{ letters: string[] }>(
    'ahorcado',
    () => ({ letters: [] }),
    (d) => {
      const misses = d.letters.filter((l) => !needed.has(l)).length;
      const won = [...needed].every((l) => d.letters.includes(l));
      if (!won && misses < LIVES) return null;
      return {
        won,
        score: misses,
        summary: won ? `Descubierto con ${misses} ${misses === 1 ? 'fallo' : 'fallos'}.` : 'Te quedaste sin vidas.',
        share: '❤️'.repeat(LIVES - misses) + '🖤'.repeat(misses),
        flags: won && misses === 0 ? ['ahorcado-clean'] : [],
      };
    },
  );

  const misses = data.letters.filter((l) => !needed.has(l)).length;
  const states: Record<string, KeyState> = {};
  for (const l of data.letters) states[l] = needed.has(l) ? 'ok' : 'absent';

  const press = useCallback(
    (k: string) => {
      if (!isLetter(k) || data.letters.includes(k)) return;
      sfx(needed.has(k) ? 'ok' : 'wrong');
      if (!needed.has(k)) haptic(60);
      play((d) => (d.letters.includes(k) ? d : { letters: [...d.letters, k] }));
    },
    [play, data.letters, needed],
  );
  usePhysicalKeys(press, playing, false);

  const words = name.split(' ');

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-2xl tracking-wider">
          {'❤️'.repeat(LIVES - misses)}
          <span className="opacity-40">{'🖤'.repeat(misses)}</span>
        </span>
        <span className="chip bg-white/10 text-white/70">Pista: {target.genre}</span>
        {misses >= 3 && <span className="chip animate-pop bg-rose-400/20 text-rose-100">Pista: {target.year}</span>}
      </div>

      <div className="mb-6 flex max-w-2xl flex-wrap justify-center gap-x-5 gap-y-3">
        {words.map((w, wi) => (
          <div key={wi} className="flex gap-1">
            {[...w].map((ch, i) => {
              const letter = isLetter(ch);
              const shown = !letter || data.letters.includes(ch) || !playing;
              const missed = letter && !data.letters.includes(ch) && !playing;
              return (
                <span
                  key={i}
                  className={`grid h-11 w-8 place-items-center border-b-4 font-display text-2xl font-bold sm:h-13 sm:w-10 sm:text-3xl ${
                    letter ? 'border-rose-400/70' : 'border-transparent'
                  } ${missed ? 'text-rose-300' : ''} ${shown && letter && playing ? 'animate-pop' : ''}`}
                >
                  {shown ? ch : ''}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {playing && <Keyboard states={states} onKey={press} withEnter={false} />}
      <div className="w-full">
        <Result
          id="ahorcado"
          answer={
            <b className="text-white">
              {target.icon} {target.name}
            </b>
          }
        />
      </div>
    </div>
  );
}
