import { Result } from '../../components/Result';
import { SearchPicker, type PickerItem } from '../../components/SearchPicker';
import { ARTISTS, ARTISTS_BY_ID, type Artist } from '../../data/music';
import { sfx } from '../../lib/sound';
import { useStore } from '../../state/store';
import { musicOfDay } from '../content';
import { useDaily } from '../useDaily';

const MAX = 8;
const ITEMS: PickerItem[] = ARTISTS.map((a) => ({ id: a.id, label: a.name, icon: '🎤' }));

type Cell = 'ok' | 'partial' | 'no';
interface Column {
  label: string;
  value: string;
  result: Cell;
  arrow?: '↑' | '↓';
}

function compare(g: Artist, t: Artist): Column[] {
  const eq = (a: unknown, b: unknown): Cell => (a === b ? 'ok' : 'no');
  const langs: Cell =
    g.languages.length === t.languages.length && g.languages.every((l) => t.languages.includes(l))
      ? 'ok'
      : g.languages.some((l) => t.languages.includes(l))
        ? 'partial'
        : 'no';
  return [
    { label: 'País', value: g.country, result: g.country === t.country ? 'ok' : g.region === t.region ? 'partial' : 'no' },
    { label: 'Género', value: g.genre, result: eq(g.genre, t.genre) },
    {
      label: 'Debut',
      value: `Años ${String(g.decade).slice(2)}`,
      result: eq(g.decade, t.decade),
      arrow: g.decade === t.decade ? undefined : g.decade < t.decade ? '↑' : '↓',
    },
    { label: 'Formato', value: g.format, result: eq(g.format, t.format) },
    {
      label: 'Voz',
      value: g.voice,
      result: g.voice === t.voice ? 'ok' : g.voice === 'Mixta' || t.voice === 'Mixta' ? 'partial' : 'no',
    },
    { label: 'Idioma', value: g.languages.join(', '), result: langs },
  ];
}

/** Todos los rasgos coinciden pero no es el artista del día (dos artistas con la misma ficha). */
const isLookalike = (cols: Column[], guessId: string, targetId: string) =>
  guessId !== targetId && cols.every((c) => c.result === 'ok');

const CELL: Record<Cell, string> = {
  ok: 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-200/40',
  partial: 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-200/40',
  no: 'bg-gradient-to-br from-rose-500/80 to-rose-700/80 border-rose-200/20',
};
const SQ: Record<Cell, string> = { ok: '🟩', partial: '🟨', no: '🟥' };
const HEADERS = ['Artista', 'País', 'Género', 'Debut', 'Formato', 'Voz', 'Idioma'];

export function Artistdle() {
  const { today } = useStore();
  const target = musicOfDay(today).artist;
  const { data, playing, play } = useDaily<{ guesses: string[] }>(
    'artistdle',
    () => ({ guesses: [] }),
    (d) => {
      const n = d.guesses.length;
      const won = d.guesses[n - 1] === target.id;
      if (!won && n < MAX) return null;
      return {
        won,
        score: n,
        summary: won ? `Adivinado en ${n} ${n === 1 ? 'intento' : 'intentos'}.` : `Se acabaron los ${MAX} intentos.`,
        share: d.guesses.map((id) => compare(ARTISTS_BY_ID[id]!, target).map((c) => SQ[c.result]).join('')).join('\n'),
      };
    },
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-white/65">
          Adivina el artista del día. 🟩 igual · 🟨 parecido (misma región, voz mixta o algún idioma en común) · ↑↓ década de debut
        </p>
        {playing && <span className="chip bg-white/10 text-white/75">{MAX - data.guesses.length} intentos</span>}
      </div>
      {playing && (
        <SearchPicker
          items={ITEMS}
          exclude={data.guesses}
          placeholder="Escribe un artista…"
          onPick={(id) => {
            compare(ARTISTS_BY_ID[id]!, target).forEach((c, i) =>
              sfx(c.result === 'ok' ? 'ok' : c.result === 'partial' ? 'present' : 'absent', { delay: i * 140 + 80, pitch: 1 + i * 0.05 }),
            );
            play((d) => ({ guesses: [...d.guesses, id] }));
          }}
        />
      )}
      <div className="scroll-thin mt-4 overflow-x-auto pb-2">
        <div className="grid min-w-[700px] grid-cols-[1.3fr_repeat(6,1fr)] gap-1.5">
          {HEADERS.map((h) => (
            <div key={h} className="border-b-2 border-white/15 pb-1.5 text-center text-[11px] font-black uppercase tracking-wider text-white/55">
              {h}
            </div>
          ))}
          {[...data.guesses].reverse().map((id, row) => {
            const a = ARTISTS_BY_ID[id]!;
            const fresh = row === 0;
            const cols = compare(a, target);
            return (
              <div key={id} className="contents">
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 p-2 text-sm font-extrabold">
                  <span className="text-xl">🎤</span>
                  <span className="leading-tight">{a.name}</span>
                </div>
                {cols.map((c, i) => (
                  <div
                    key={c.label}
                    className={`flex min-h-16 flex-col items-center justify-center rounded-xl border p-1.5 text-center text-xs font-extrabold leading-tight text-white ${CELL[c.result]} ${fresh ? 'animate-flip' : ''}`}
                    style={fresh ? { animationDelay: `${i * 140}ms` } : undefined}
                  >
                    <span>{c.value}</span>
                    {c.arrow && <span className="mt-0.5 text-lg leading-none">{c.arrow}</span>}
                  </div>
                ))}
                {isLookalike(cols, id, target.id) && (
                  <div
                    className={`col-span-full rounded-xl border border-amber-200/40 bg-amber-400/15 px-3 py-2 text-center text-sm font-bold text-amber-100 ${fresh ? 'animate-flip' : ''}`}
                    style={fresh ? { animationDelay: `${cols.length * 140}ms` } : undefined}
                  >
                    🤔 ¡Todo coincide! Pero aunque {a.name} comparte todos los rasgos, no es el artista que tengo en mente. Sigue probando…
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {data.guesses.length === 0 && (
          <div className="mt-6 text-center text-white/40">
            <div className="text-5xl">🎤</div>
            <p className="mt-2 font-bold">Prueba con cualquier artista para empezar…</p>
          </div>
        )}
      </div>
      <Result id="artistdle" answer={<b className="text-white">🎤 {target.name}</b>} />
    </div>
  );
}
