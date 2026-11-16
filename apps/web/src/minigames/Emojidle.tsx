import { sfx } from '../lib/sound';
import { GamePicker } from '../components/GamePicker';
import { Result } from '../components/Result';
import { useStore } from '../state/store';
import { dailyGames } from './content';
import { GuessList, guessShare } from './GuessList';
import { useDaily } from './useDaily';

const MAX = 6;

export function Emojidle() {
  const { today } = useStore();
  const target = dailyGames(today).emojidle;
  const { data, playing, play } = useDaily<{ guesses: string[] }>(
    'emojidle',
    () => ({ guesses: [] }),
    (d) => {
      const n = d.guesses.length;
      const won = d.guesses[n - 1] === target.id;
      if (!won && n < MAX) return null;
      return {
        won,
        score: n,
        summary: won ? `Lo sacaste con ${Math.min(5, n)} ${n === 1 ? 'emoji' : 'emojis'}.` : 'Ni con todos los emojis…',
        share: guessShare(d.guesses, target.id),
        flags: won && n === 1 ? ['emojidle-1'] : [],
      };
    },
  );
  const revealed = playing ? Math.min(5, data.guesses.length + 1) : 5;

  return (
    <div>
      <p className="mb-5 text-center text-sm text-white/65">
        ¿Qué juego es? Cada fallo revela un emoji más.
        {playing && <span className="chip ml-1 bg-white/10 text-white/75">{MAX - data.guesses.length} intentos</span>}
      </p>
      <div className="mb-6 flex justify-center gap-2 sm:gap-3">
        {target.clues.map((e, i) => {
          const shown = i < revealed;
          return (
            <div
              key={`${i}-${shown}`}
              className={`grid h-14 w-14 place-items-center rounded-2xl border-2 text-3xl sm:h-20 sm:w-20 sm:text-5xl ${
                shown
                  ? 'animate-bounce-in border-abby/50 bg-gradient-to-br from-white/15 to-white/5 shadow-[0_0_24px_rgb(177_75_255/0.35)]'
                  : 'border-dashed border-white/15 bg-white/3'
              }`}
            >
              {shown ? e : <span className="font-display text-2xl text-white/25">?</span>}
            </div>
          );
        })}
      </div>
      {playing && (
        <div className="mx-auto max-w-lg">
          <GamePicker hideIcons exclude={data.guesses} onPick={(g) => {
            if (g.id !== target.id) sfx('wrong');
            play((d) => ({ guesses: [...d.guesses, g.id] }));
          }} />
        </div>
      )}
      <GuessList guesses={data.guesses} answerId={target.id} showIcons={false} />
      <Result
        id="emojidle"
        answer={
          <b className="text-white">
            {target.icon} {target.name}
          </b>
        }
      />
    </div>
  );
}
