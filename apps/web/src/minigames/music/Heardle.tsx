import { useMemo, useState } from 'react';
import { Result } from '../../components/Result';
import { SearchPicker, type PickerItem } from '../../components/SearchPicker';
import { genreCatalog, GENRES_BY_ID, type GenreId } from '../../data/heardleGenres';
import { useClip, useTrack } from '../../lib/itunes';
import { sfx } from '../../lib/sound';
import { useStore } from '../../state/store';
import { HEARDLE_PHASES, heardleGenreOfDay } from '../content';
import { useDaily } from '../useDaily';
import { credit, SongReveal, TrackGate } from './shared';

/** Segundos que se desbloquean en cada intento de una canción. */
const STEPS = [1, 2, 4, 7, 11, 16];
const TOTAL = STEPS[STEPS.length - 1]!;
const PASS = 3;
const SKIP = 'skip';

interface Data {
  /** Intentos de cada fase (una canción por fase). */
  phases: string[][];
}

const phaseWon = (g: string[], answer: string) => g[g.length - 1] === answer;
const phaseDone = (g: string[], answer: string) => phaseWon(g, answer) || g.length >= STEPS.length;

/** Heardle de un género: 5 fases, una canción en cada una. */
export function HeardleGenre({ genre }: { genre: GenreId }) {
  const { today } = useStore();
  const meta = GENRES_BY_ID[genre];
  const songs = useMemo(() => heardleGenreOfDay(genre, today), [genre, today]);
  const items = useMemo<PickerItem[]>(() => genreCatalog(genre).map((s) => ({ id: s.id, label: s.title, sub: s.artist })), [genre]);
  const titleOf = (id: string) => items.find((i) => i.id === id);

  const { data, playing, play } = useDaily<Data>(
    `heardle-${genre}`,
    () => ({ phases: songs.map(() => []) }),
    (d) => {
      if (!d.phases.every((g, i) => phaseDone(g, songs[i]!.id))) return null;
      const right = d.phases.filter((g, i) => phaseWon(g, songs[i]!.id)).length;
      const instant = d.phases.some((g, i) => g.length === 1 && g[0] === songs[i]!.id);
      return {
        won: right >= PASS,
        score: right,
        summary: `${right} de ${HEARDLE_PHASES} canciones de ${meta.name}.`,
        share: d.phases
          .map((g, i) => `${i + 1}️⃣${g.map((x) => (x === songs[i]!.id ? '🟩' : x === SKIP ? '⬛' : '🟥')).join('')}${'⬜'.repeat(STEPS.length - g.length)}`)
          .join('\n'),
        flags: [...(instant ? ['heardle-1'] : []), ...(right === HEARDLE_PHASES ? ['heardle-perfect'] : [])],
      };
    },
  );

  const current = data.phases.findIndex((g, i) => !phaseDone(g, songs[i]!.id));
  const [view, setView] = useState(() => (current === -1 ? HEARDLE_PHASES - 1 : current));
  const song = songs[view]!;
  const guesses = data.phases[view] ?? [];
  const done = phaseDone(guesses, song.id);
  const won = phaseWon(guesses, song.id);
  const unlocked = STEPS[Math.min(guesses.length, STEPS.length - 1)]!;

  const track = useTrack(song.trackId, song.store);
  const clip = useClip(track.status === 'ready' ? track.info.previewUrl : null);

  const guess = (id: string) => {
    if (done) return;
    sfx(id === song.id ? 'match' : id === SKIP ? 'tap' : 'wrong');
    clip.stop();
    play((d) => {
      const phases = d.phases.map((p) => [...p]);
      if (!phaseDone(phases[view]!, song.id)) phases[view]!.push(id);
      return { phases };
    });
  };

  const goTo = (i: number) => {
    sfx('pop');
    clip.stop();
    setView(i);
  };

  return (
    <div className="mx-auto max-w-xl">
      {/* Fases */}
      <div className="mb-5 flex items-center justify-center gap-2">
        {songs.map((s, i) => {
          const g = data.phases[i] ?? [];
          const isDone = phaseDone(g, s.id);
          const reachable = isDone || i === current;
          return (
            <button
              key={s.id}
              disabled={!reachable}
              onClick={() => goTo(i)}
              className={`grid h-11 w-11 place-items-center rounded-2xl border-2 font-display text-lg font-bold transition ${
                i === view ? 'scale-110 ring-2 ring-white/70' : ''
              } ${
                isDone
                  ? phaseWon(g, s.id)
                    ? 'border-emerald-300/50 bg-emerald-500/30'
                    : 'border-rose-300/40 bg-rose-500/25'
                  : i === current
                    ? 'animate-pulse border-abby/60 bg-abby/20'
                    : 'border-white/10 bg-white/4 text-white/30'
              }`}
              aria-label={`Fase ${i + 1}`}
            >
              {isDone ? (phaseWon(g, s.id) ? '✓' : '✗') : i + 1}
            </button>
          );
        })}
      </div>

      <div key={view} className="animate-rise">
        <div className="mb-3 text-center text-xs font-black uppercase tracking-wider text-white/45">
          {meta.icon} {meta.name} · Canción {view + 1} de {HEARDLE_PHASES}
        </div>

        {!done ? (
          <TrackGate track={track}>
            <div className="mb-4 rounded-3xl border border-rose-300/25 bg-gradient-to-br from-rose-500/15 to-fuchsia-600/10 p-4">
              <div className="relative h-4 overflow-hidden rounded-full bg-white/8">
                <div className="absolute inset-y-0 left-0 bg-white/15" style={{ width: `${(unlocked / TOTAL) * 100}%` }} />
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-abby to-twitch"
                  style={{ width: `${(Math.min(clip.progress, unlocked) / TOTAL) * 100}%` }}
                />
                {STEPS.slice(0, -1).map((s) => (
                  <span key={s} className="absolute inset-y-0 w-px bg-white/30" style={{ left: `${(s / TOTAL) * 100}%` }} />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[11px] font-bold text-white/40">
                <span>0:00</span>
                <span>0:{String(TOTAL).padStart(2, '0')}</span>
              </div>
              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  onClick={() => (clip.playing ? clip.stop() : clip.play(unlocked))}
                  className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-abby to-twitch text-2xl shadow-[0_0_30px_rgb(255_79_163/0.6)] transition active:scale-95"
                  aria-label={clip.playing ? 'Parar' : 'Escuchar'}
                >
                  {clip.playing ? '■' : '▶'}
                </button>
                <div className="font-display text-lg font-semibold">
                  {unlocked} {unlocked === 1 ? 'segundo' : 'segundos'}
                  <span className="block text-xs font-bold text-white/50">desbloqueados</span>
                </div>
              </div>
            </div>
          </TrackGate>
        ) : (
          <div className={`mb-4 rounded-3xl border p-4 text-center ${won ? 'border-emerald-300/30 bg-emerald-500/10' : 'border-rose-300/30 bg-rose-500/10'}`}>
            <div className="font-display text-xl font-bold">{won ? `¡Acertada con ${STEPS[guesses.length - 1]} s!` : 'Esta se resistió'}</div>
            <SongReveal song={song} />
            {view < HEARDLE_PHASES - 1 && playing && (
              <button className="btn btn-primary mt-4 w-full" onClick={() => goTo(current === -1 ? view + 1 : current)}>
                Siguiente canción →
              </button>
            )}
          </div>
        )}

        <ol className="mb-4 grid gap-1.5">
          {STEPS.map((s, i) => {
            const g = guesses[i];
            const t = g && g !== SKIP ? titleOf(g) : null;
            return (
              <li
                key={s}
                className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${
                  g == null
                    ? 'border-white/8 bg-white/3 text-white/25'
                    : g === song.id
                      ? 'animate-pop border-emerald-300/40 bg-emerald-500/20'
                      : g === SKIP
                        ? 'animate-pop border-white/10 bg-white/6 text-white/50'
                        : 'animate-pop border-rose-300/30 bg-rose-500/15'
                }`}
              >
                <span className="w-8 shrink-0 text-xs text-white/40">{s}s</span>
                <span className="min-w-0 truncate">
                  {g == null ? '' : g === SKIP ? '⏭ Saltado' : `${g === song.id ? '✅' : '❌'} ${t?.label ?? ''} — ${t?.sub ?? ''}`}
                </span>
              </li>
            );
          })}
        </ol>

        {!done && track.status === 'ready' && (
          <div className="grid gap-2">
            <SearchPicker items={items} exclude={guesses} onPick={guess} placeholder={`Busca entre ${items.length} canciones de ${meta.name}…`} />
            <button className="btn btn-ghost text-sm" onClick={() => guess(SKIP)}>
              {guesses.length < STEPS.length - 1 ? `⏭ Saltar (+${STEPS[guesses.length + 1]! - unlocked} s)` : '⏭ Rendirse'}
            </button>
          </div>
        )}
      </div>

      <Result id={`heardle-${genre}`} />
      {credit}
    </div>
  );
}
