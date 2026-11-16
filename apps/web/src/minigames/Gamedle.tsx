import { GamePicker } from '../components/GamePicker';
import { Result } from '../components/Result';
import { gameById, type Game } from '../data/games';
import { sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { dailyGames } from './content';
import { useDaily } from './useDaily';

const MAX = 10;

type Cell = 'ok' | 'partial' | 'no';

interface Column {
  label: string;
  value: string;
  result: Cell;
  arrow?: '↑' | '↓';
}

function overlap<T>(a: readonly T[], b: readonly T[]): Cell {
  if (a.length === b.length && a.every((x) => b.includes(x))) return 'ok';
  return a.some((x) => b.includes(x)) ? 'partial' : 'no';
}

const SHORT: Record<string, string> = { PC: 'PC', PlayStation: 'PS', Xbox: 'XB', Switch: 'NS', Móvil: 'Móv' };

function compare(guess: Game, target: Game): Column[] {
  const eq = (a: unknown, b: unknown): Cell => (a === b ? 'ok' : 'no');
  return [
    { label: 'Género', value: guess.genre, result: eq(guess.genre, target.genre) },
    { label: 'Modo', value: guess.modes.join(', '), result: overlap(guess.modes, target.modes) },
    { label: 'Vista', value: guess.view, result: eq(guess.view, target.view) },
    { label: 'Plataformas', value: guess.platforms.map((p) => SHORT[p] ?? p).join(' '), result: overlap(guess.platforms, target.platforms) },
    { label: 'Gratis', value: guess.f2p ? 'Sí' : 'No', result: eq(guess.f2p, target.f2p) },
    {
      label: 'Año',
      value: String(guess.year),
      result: eq(guess.year, target.year),
      arrow: guess.year === target.year ? undefined : guess.year < target.year ? '↑' : '↓',
    },
    { label: 'Estudio', value: guess.studio, result: eq(guess.studio, target.studio) },
  ];
}

const CELL: Record<Cell, string> = {
  ok: 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-200/40 shadow-[0_0_18px_rgb(52_211_153/0.35)]',
  partial: 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-200/40',
  no: 'bg-gradient-to-br from-rose-500/80 to-rose-700/80 border-rose-200/20',
};
const SQ: Record<Cell, string> = { ok: '🟩', partial: '🟨', no: '🟥' };
const HEADERS = ['Juego', 'Género', 'Modo', 'Vista', 'Plataformas', 'Gratis', 'Año', 'Estudio'];

export function Gamedle() {
  const { today } = useStore();
  const target = dailyGames(today).gamedle;
  const { data, playing, play } = useDaily<{ guesses: string[] }>(
    'gamedle',
    () => ({ guesses: [] }),
    (d) => {
      const n = d.guesses.length;
      const won = d.guesses[n - 1] === target.id;
      if (!won && n < MAX) return null;
      return {
        won,
        score: n,
        summary: won ? `Adivinado en ${n} ${n === 1 ? 'intento' : 'intentos'}.` : `Se acabaron los ${MAX} intentos.`,
        share: d.guesses.map((id) => compare(gameById(id), target).map((c) => SQ[c.result]).join('')).join('\n'),
        flags: won && n === 1 ? ['gamedle-1'] : [],
      };
    },
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-white/65">
          Escribe un juego: cada columna te dice si se parece al del día. 🟩 igual · 🟨 parcial · 🟥 distinto · ↑↓ año
        </p>
        {playing && <span className="chip bg-white/10 text-white/75">{MAX - data.guesses.length} intentos</span>}
      </div>

      {playing && (
        <GamePicker
          exclude={data.guesses}
          onPick={(g) => {
            compare(g, target).forEach((c, i) =>
              sfx(c.result === 'ok' ? 'ok' : c.result === 'partial' ? 'present' : 'absent', { delay: i * 140 + 80, pitch: 1 + i * 0.05 }),
            );
            play((d) => ({ guesses: [...d.guesses, g.id] }));
          }}
        />
      )}

      <div className="scroll-thin mt-4 overflow-x-auto pb-2">
        <div className="grid min-w-[760px] grid-cols-[1.4fr_repeat(7,1fr)] gap-1.5">
          {HEADERS.map((h) => (
            <div key={h} className="border-b-2 border-white/15 pb-1.5 text-center text-[11px] font-black uppercase tracking-wider text-white/55">
              {h}
            </div>
          ))}
          {[...data.guesses].reverse().map((id, row) => {
            const g = gameById(id);
            const fresh = row === 0;
            return (
              <div key={id} className="contents">
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 p-2 text-sm font-extrabold">
                  <span className="text-2xl">{g.icon}</span>
                  <span className="leading-tight">{g.name}</span>
                </div>
                {compare(g, target).map((c, i) => (
                  <div
                    key={c.label}
                    className={`flex min-h-16 flex-col items-center justify-center rounded-xl border p-1.5 text-center text-xs font-extrabold leading-tight text-white ${CELL[c.result]} ${fresh ? 'animate-flip' : ''}`}
                    style={fresh ? { animationDelay: `${i * 140}ms` } : undefined}
                  >
                    <span>{c.value}</span>
                    {c.arrow && <span className="mt-0.5 text-lg leading-none">{c.arrow}</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {data.guesses.length === 0 && (
          <div className="mt-6 text-center text-white/40">
            <div className="text-5xl">🎮</div>
            <p className="mt-2 font-bold">Prueba con cualquier juego para empezar…</p>
          </div>
        )}
      </div>

      <Result
        id="gamedle"
        answer={
          <b className="text-white">
            {target.icon} {target.name}
          </b>
        }
      />
    </div>
  );
}
