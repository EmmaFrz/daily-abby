import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { haptic, sfx } from '../lib/sound';
import { ABBY } from '../config/abby';
import { useCountdown } from '../hooks/useCountdown';
import { puzzleNumber } from '../lib/daily';
import { META, MINIGAMES, albumColor, albumNumber } from '../minigames/meta';
import { liveStreak } from '../state/progress';
import { useStore } from '../state/store';
import { StickerArt, StickerNumber, tilt } from './Album';
import { Confetti } from './Confetti';

/** Panel final común: el cromo pegado (o en gris), respuesta, récord, racha y compartir. */
export function Result({ id, answer }: { id: string; answer?: ReactNode }) {
  const { state, today, toast } = useStore();
  const countdown = useCountdown();
  const run = state.runs[id];
  const finished = !!run && run.day === today && run.status !== 'playing';
  // Solo hay confeti (y el cromo cae) si la partida termina mientras miras, no al volver a abrirla.
  const [startedPlaying] = useState(!finished);
  const status = finished ? run.status : null;

  // Fanfarria o derrota cuando la partida acaba delante de ti (no al reabrirla).
  useEffect(() => {
    if (!startedPlaying || !status) return;
    const won = status === 'won';
    sfx(won ? 'win' : 'lose', { delay: 350 });
    haptic(won ? [40, 60, 40] : 120);
  }, [startedPlaying, status]);

  if (!finished || !run) return null;

  const meta = META[id]!;
  const rec = state.records[id];
  const won = run.status === 'won';
  const text = `${meta.icon} ${meta.name} de ${ABBY.name} #${puzzleNumber(today)}\n${run.share ?? ''}\n#AbbyDiarios`;
  const n = albumNumber(id);
  const piece = meta.parent ? MINIGAMES.filter((m) => m.parent === meta.parent).findIndex((m) => m.id === id) + 1 : 0;
  const label = piece ? `${n}·${piece}` : String(n);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ icon: '📋', title: 'Resultado copiado', text: 'Pégalo en el chat o en Discord', tone: 'good' });
    } catch {
      toast({ icon: '⚠️', title: 'No se pudo copiar', tone: 'bad' });
    }
  };

  return (
    <div className="mt-6 rounded-[20px] border border-slot/70 bg-paper/70 p-5">
      <Confetti burst={startedPlaying && won ? 1 : 0} />
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
        <div
          className={`sticker w-32 shrink-0 ${startedPlaying ? 'animate-stick' : ''}`}
          style={{ '--r': `${tilt(n)}deg` } as CSSProperties}
        >
          <StickerNumber n={label} className="absolute left-2.5 top-2.5 z-10" />
          {!won && <span className="stamp absolute right-2 top-14 z-10">FALLADO</span>}
          <StickerArt icon={meta.icon} color={albumColor(id)} grey={!won} className="h-24 text-5xl" />
          <span className="mx-1 mt-1.5 block truncate font-display text-sm font-bold">{meta.name}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-dim">
            {won ? 'Cromo conseguido' : 'Cromo en gris'} · #{puzzleNumber(today)}
          </p>
          <h3 className="font-display text-2xl font-extrabold leading-tight [font-variation-settings:'wdth'_85]">
            {won ? `¡Cromo nº ${label} pegado!` : 'Hoy no pudo ser'}
          </h3>
          {run.summary && <p className="mt-1 text-white/75">{run.summary}</p>}
          {answer && <div className="mt-1 text-white/75">La respuesta era: {answer}</div>}
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm sm:justify-start">
            <span className="chip bg-orange-400/15 text-orange-200">Racha {rec ? liveStreak(rec.streak, rec.lastWinDay, today) : 0}</span>
            {rec?.best != null && <span className="chip bg-amber-300/20 text-amber-200">Récord: {meta.formatScore(rec.best)}</span>}
            {rec && (
              <span className="chip bg-white/8 text-white/70">
                {rec.won}/{rec.played} ganados
              </span>
            )}
          </div>
        </div>
      </div>
      {run.share && (
        <pre className="mx-auto mt-4 w-fit rounded-xl bg-ink px-4 py-2 font-sans text-lg leading-snug">{run.share}</pre>
      )}
      <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <button className="btn btn-primary" onClick={share}>
          Copiar resultado
        </button>
        <span className="text-sm font-bold text-dim">Sobre nuevo en {countdown}</span>
      </div>
    </div>
  );
}
