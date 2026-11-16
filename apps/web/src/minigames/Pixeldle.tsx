import { sfx } from '../lib/sound';
import { useEffect, useRef } from 'react';
import { GamePicker } from '../components/GamePicker';
import { Result } from '../components/Result';
import { useStore } from '../state/store';
import { dailyGames } from './content';
import { GuessList, guessShare } from './GuessList';
import { useDaily } from './useDaily';

const MAX = 6;
/** Resolución (en píxeles) del icono en cada intento. */
const LEVELS = [5, 7, 10, 14, 20, 30];
const SIZE = 220;

function PixelEmoji({ emoji, level }: { emoji: string; level: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const src = document.createElement('canvas');
    src.width = src.height = 128;
    const s = src.getContext('2d')!;
    s.textAlign = 'center';
    s.textBaseline = 'middle';
    s.font = '104px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    s.fillText(emoji, 64, 70);
    const small = document.createElement('canvas');
    small.width = small.height = level;
    small.getContext('2d')!.drawImage(src, 0, 0, level, level);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, SIZE, SIZE);
  }, [emoji, level]);
  return <canvas ref={ref} width={SIZE} height={SIZE} className="h-44 w-44 sm:h-56 sm:w-56" />;
}

export function Pixeldle() {
  const { today } = useStore();
  const target = dailyGames(today).pixeldle;
  const { data, playing, play } = useDaily<{ guesses: string[] }>(
    'pixeldle',
    () => ({ guesses: [] }),
    (d) => {
      const n = d.guesses.length;
      const won = d.guesses[n - 1] === target.id;
      if (!won && n < MAX) return null;
      return {
        won,
        score: n,
        summary: won ? `Reconocido con ${LEVELS[n - 1]}×${LEVELS[n - 1]} píxeles.` : 'Demasiados píxeles hoy.',
        share: guessShare(d.guesses, target.id),
        flags: won && n === 1 ? ['pixeldle-1'] : [],
      };
    },
  );
  const level = LEVELS[Math.min(data.guesses.length, LEVELS.length - 1)]!;
  const fails = data.guesses.length;

  return (
    <div>
      <p className="mb-5 text-center text-sm text-white/65">
        Este es el icono de un juego, muy pixelado. Cada fallo lo hace más nítido.
        {playing && <span className="chip ml-1 bg-white/10 text-white/75">{MAX - fails} intentos</span>}
      </p>
      <div className="mx-auto mb-4 grid w-fit place-items-center rounded-3xl border-2 border-cyan-300/40 bg-gradient-to-br from-cyan-500/20 to-blue-700/20 p-4 shadow-[0_0_40px_-8px_rgb(34_211_238/0.6)]">
        {playing ? (
          <PixelEmoji emoji={target.icon} level={level} />
        ) : (
          <span className="animate-bounce-in grid h-44 w-44 place-items-center text-[8rem] sm:h-56 sm:w-56">{target.icon}</span>
        )}
      </div>
      {playing && (
        <div className="mb-4 flex flex-wrap justify-center gap-2 text-sm">
          <span className="chip bg-white/10 text-white/70">🔍 {level}×{level} px</span>
          {fails >= 2 && <span className="chip animate-pop bg-cyan-400/20 text-cyan-100">Pista: {target.genre}</span>}
          {fails >= 4 && <span className="chip animate-pop bg-cyan-400/20 text-cyan-100">Pista: {target.year}</span>}
        </div>
      )}
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
        id="pixeldle"
        answer={
          <b className="text-white">
            {target.icon} {target.name}
          </b>
        }
      />
    </div>
  );
}
