import { useEffect, useMemo, useState } from 'react';
import { Result } from '../../components/Result';
import { fetchTrack, useClip, useTrack } from '../../lib/itunes';
import { haptic, sfx } from '../../lib/sound';
import { useStore } from '../../state/store';
import { musicOfDay, QUIEN_CANTA_ROUNDS } from '../content';
import { useDaily } from '../useDaily';
import { credit, SongReveal, TrackGate } from './shared';

const CLIP_SECONDS = 5;
const PASS = 3;

export function QuienCanta() {
  const { today } = useStore();
  const { rounds } = useMemo(() => musicOfDay(today), [today]);
  const { data, playing, play } = useDaily<{ answers: number[] }>(
    'quiencanta',
    () => ({ answers: [] }),
    (d) => {
      if (d.answers.length < QUIEN_CANTA_ROUNDS) return null;
      const right = d.answers.filter((a, i) => a === rounds[i]!.correct).length;
      return {
        won: right >= PASS,
        score: right,
        summary: `${right} de ${QUIEN_CANTA_ROUNDS} artistas acertados.`,
        share: '📻' + d.answers.map((a, i) => (a === rounds[i]!.correct ? '🟩' : '🟥')).join(''),
        flags: right === QUIEN_CANTA_ROUNDS ? ['quiencanta-5'] : [],
      };
    },
  );
  const [idx, setIdx] = useState(() => Math.min(data.answers.length, QUIEN_CANTA_ROUNDS - 1));
  const round = rounds[idx]!;
  const track = useTrack(round.song.trackId);
  const clip = useClip(track.status === 'ready' ? track.info.previewUrl : null);
  const chosen = data.answers[idx];
  const answered = chosen != null;

  // Precarga el resto de canciones para que no haya esperas entre rondas.
  useEffect(() => {
    rounds.forEach((r) => void fetchTrack(r.song.trackId).catch(() => {}));
  }, [rounds]);

  const answer = (i: number) => {
    const right = i === round.correct;
    sfx(right ? 'ok' : 'wrong');
    if (!right) haptic(80);
    play((d) => (d.answers.length === idx ? { answers: [...d.answers, i] } : d));
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex gap-1.5">
        {rounds.map((r, i) => {
          const a = data.answers[i];
          return (
            <span
              key={r.song.id}
              className={`h-2.5 flex-1 rounded-full ${a == null ? (i === idx ? 'bg-white/40' : 'bg-white/10') : a === r.correct ? 'bg-emerald-400' : 'bg-rose-500'}`}
            />
          );
        })}
      </div>

      <div key={idx} className="animate-rise">
        <div className="mb-3 text-center text-xs font-black uppercase tracking-wider text-white/45">
          Ronda {idx + 1} de {QUIEN_CANTA_ROUNDS} · ¿Quién canta esto?
        </div>
        <TrackGate track={track}>
          <div className="mb-4 flex flex-col items-center gap-2">
            <button
              onClick={() => (clip.playing ? clip.stop() : clip.play(answered ? 30 : CLIP_SECONDS))}
              className={`relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-4xl shadow-[0_0_40px_rgb(251_146_60/0.5)] transition active:scale-95 ${clip.playing ? 'animate-pulse' : ''}`}
              aria-label={clip.playing ? 'Parar' : 'Escuchar'}
            >
              {clip.playing ? '■' : '▶'}
            </button>
            <span className="text-sm font-bold text-white/55">
              {clip.playing ? `${clip.progress.toFixed(1).replace('.', ',')} s` : answered ? 'Escuchar la previa' : `Escuchar ${CLIP_SECONDS} s (puedes repetir)`}
            </span>
          </div>
        </TrackGate>

        <div className="grid gap-2 sm:grid-cols-2">
          {round.options.map((o, i) => {
            const isRight = i === round.correct;
            const cls = !answered
              ? 'border-white/12 bg-white/7 hover:-translate-y-0.5 hover:bg-white/14'
              : isRight
                ? 'border-emerald-300/60 bg-emerald-500/30'
                : i === chosen
                  ? 'border-rose-300/50 bg-rose-500/25'
                  : 'border-white/8 bg-white/3 opacity-50';
            return (
              <button
                key={o}
                disabled={answered || !playing || track.status !== 'ready'}
                onClick={() => answer(i)}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left font-extrabold transition disabled:cursor-default ${cls}`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-sm">🎤</span>
                <span className="flex-1">{o}</span>
                {answered && isRight && '✅'}
                {answered && i === chosen && !isRight && '❌'}
              </button>
            );
          })}
        </div>

        {answered && <SongReveal song={round.song} />}

        <div className="mt-4 flex justify-between gap-2">
          <button
            className="btn btn-ghost"
            disabled={idx === 0}
            onClick={() => {
              clip.stop();
              setIdx(idx - 1);
            }}
          >
            ← Anterior
          </button>
          {answered && idx < QUIEN_CANTA_ROUNDS - 1 && (
            <button
              className="btn btn-primary"
              onClick={() => {
                sfx('pop');
                clip.stop();
                setIdx(idx + 1);
              }}
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>

      <Result id="quiencanta" />
      {credit}
    </div>
  );
}
