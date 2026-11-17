import { useMemo, useState } from 'react';
import { Result } from '../../components/Result';
import { SearchPicker, type PickerItem } from '../../components/SearchPicker';
import { genreCatalog, GENRES_BY_ID, type GenreId, type HeardleSong } from '../../data/heardleGenres';
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
  // En los géneros con guessBy 'game' (Videojuegos) se adivina el juego: el buscador lista juegos y la
  // respuesta correcta es el juego de la canción. En el resto, la canción.
  const byGame = meta.guessBy === 'game';
  const answerOf = (s: HeardleSong) => (byGame ? `juego:${s.game}` : s.id);
  const items = useMemo<PickerItem[]>(() => {
    const catalog = genreCatalog(genre);
    if (!byGame) return catalog.map((s) => ({ id: s.id, label: s.title, sub: s.artist }));
    const games = [...new Set(catalog.map((s) => s.game!))].sort((a, b) => a.localeCompare(b, 'es'));
    return games.map((g) => ({ id: `juego:${g}`, label: g }));
  }, [genre, byGame]);
  const titleOf = (id: string) => items.find((i) => i.id === id);

  const { data, playing, play } = useDaily<Data>(
    `heardle-${genre}`,
    () => ({ phases: songs.map(() => []) }),
    (d) => {
      if (!d.phases.every((g, i) => phaseDone(g, answerOf(songs[i]!)))) return null;
      const right = d.phases.filter((g, i) => phaseWon(g, answerOf(songs[i]!))).length;
      const instant = d.phases.some((g, i) => g.length === 1 && g[0] === answerOf(songs[i]!));
      return {
        won: right >= PASS,
        score: right,
        summary: `${right} de ${HEARDLE_PHASES} canciones de ${meta.name}.`,
        share: d.phases
          .map((g, i) => `${i + 1}️⃣${g.map((x) => (x === answerOf(songs[i]!) ? '🟩' : x === SKIP ? '⬛' : '🟥')).join('')}${'⬜'.repeat(STEPS.length - g.length)}`)
          .join('\n'),
        flags: [...(instant ? ['heardle-1'] : []), ...(right === HEARDLE_PHASES ? ['heardle-perfect'] : [])],
      };
    },
  );

  const current = data.phases.findIndex((g, i) => !phaseDone(g, answerOf(songs[i]!)));
  const [view, setView] = useState(() => (current === -1 ? HEARDLE_PHASES - 1 : current));
  const song = songs[view]!;
  const guesses = data.phases[view] ?? [];
  const answer = answerOf(song);
  const done = phaseDone(guesses, answer);
  const won = phaseWon(guesses, answer);
  const unlocked = STEPS[Math.min(guesses.length, STEPS.length - 1)]!;

  const track = useTrack(song.trackId, song.store);
  const clip = useClip(track.status === 'ready' ? track.info.previewUrl : null);

  const guess = (id: string) => {
    if (done) return;
    sfx(id === answer ? 'match' : id === SKIP ? 'tap' : 'wrong');
    clip.stop();
    play((d) => {
      const phases = d.phases.map((p) => [...p]);
      if (!phaseDone(phases[view]!, answer)) phases[view]!.push(id);
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
          const isDone = phaseDone(g, answerOf(s));
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
                  ? phaseWon(g, answerOf(s))
                    ? 'border-emerald-300/50 bg-emerald-500/30'
                    : 'border-rose-300/40 bg-rose-500/25'
                  : i === current
                    ? 'animate-pulse border-abby/60 bg-abby/20'
                    : 'border-white/10 bg-white/4 text-white/30'
              }`}
              aria-label={`Fase ${i + 1}`}
            >
              {isDone ? (phaseWon(g, answerOf(s)) ? '✓' : '✗') : i + 1}
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
            {byGame && (
              <div className="mt-1 text-sm font-bold text-white/70">
                🎮 Es de <b className="text-white">{song.game}</b>
              </div>
            )}
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
                    : g === answer
                      ? 'animate-pop border-emerald-300/40 bg-emerald-500/20'
                      : g === SKIP
                        ? 'animate-pop border-white/10 bg-white/6 text-white/50'
                        : 'animate-pop border-rose-300/30 bg-rose-500/15'
                }`}
              >
                <span className="w-8 shrink-0 text-xs text-white/40">{s}s</span>
                <span className="min-w-0 truncate">
                  {g == null ? '' : g === SKIP ? '⏭ Saltado' : `${g === answer ? '✅' : '❌'} ${t?.label ?? ''}${t?.sub ? ` — ${t.sub}` : ''}`}
                </span>
              </li>
            );
          })}
        </ol>

        {!done && track.status === 'ready' && (
          <div className="grid gap-2">
            <SearchPicker items={items} exclude={guesses} onPick={guess} placeholder={byGame ? `¿De qué juego es? Busca entre ${items.length} juegos…` : `Busca entre ${items.length} canciones de ${meta.name}…`} />
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
