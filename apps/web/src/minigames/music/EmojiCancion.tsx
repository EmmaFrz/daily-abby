import { Result } from '../../components/Result';
import { songById } from '../../data/music';
import { sfx } from '../../lib/sound';
import { useStore } from '../../state/store';
import { musicOfDay } from '../content';
import { useDaily } from '../useDaily';
import { SongPicker, SongReveal } from './shared';

const MAX = 6;

export function EmojiCancion() {
  const { today } = useStore();
  const song = musicOfDay(today).emoji;
  const { data, playing, play } = useDaily<{ guesses: string[] }>(
    'emojicancion',
    () => ({ guesses: [] }),
    (d) => {
      const n = d.guesses.length;
      const won = d.guesses[n - 1] === song.id;
      if (!won && n < MAX) return null;
      return {
        won,
        score: n,
        summary: won ? `La sacaste con ${Math.min(5, n)} ${n === 1 ? 'emoji' : 'emojis'}.` : 'Ni con todos los emojis…',
        share: '🎶' + d.guesses.map((g) => (g === song.id ? '🟩' : '🟥')).join(''),
      };
    },
  );
  const revealed = playing ? Math.min(5, data.guesses.length + 1) : 5;

  return (
    <div>
      <p className="mb-5 text-center text-sm text-white/65">
        ¿Qué canción es? Cada fallo revela un emoji más.
        {playing && <span className="chip ml-1 bg-white/10 text-white/75">{MAX - data.guesses.length} intentos</span>}
      </p>
      <div className="mb-6 flex justify-center gap-2 sm:gap-3">
        {song.clues.map((e, i) => {
          const shown = i < revealed;
          return (
            <div
              key={`${i}-${shown}`}
              className={`grid h-14 w-14 place-items-center rounded-2xl border-2 text-3xl sm:h-20 sm:w-20 sm:text-5xl ${
                shown
                  ? 'animate-bounce-in border-sky-300/50 bg-gradient-to-br from-white/15 to-white/5 shadow-[0_0_24px_rgb(56_189_248/0.35)]'
                  : 'border-dashed border-white/15 bg-white/3'
              }`}
            >
              {shown ? e : <span className="font-display text-2xl text-white/25">♪</span>}
            </div>
          );
        })}
      </div>
      {playing && (
        <div className="mx-auto max-w-lg">
          <SongPicker
            exclude={data.guesses}
            onPick={(id) => {
              if (id !== song.id) sfx('wrong');
              play((d) => ({ guesses: [...d.guesses, id] }));
            }}
          />
        </div>
      )}
      {data.guesses.length > 0 && (
        <div className="mx-auto mt-4 flex max-w-lg flex-wrap justify-center gap-2">
          {data.guesses.map((id) => {
            const s = songById(id);
            const ok = id === song.id;
            return (
              <span
                key={id}
                className={`animate-pop chip px-3 py-1.5 text-sm ${ok ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/25 text-rose-100 line-through decoration-2'}`}
              >
                {s.title}
              </span>
            );
          })}
        </div>
      )}
      <Result id="emojicancion" answer={<SongReveal song={song} />} />
    </div>
  );
}
