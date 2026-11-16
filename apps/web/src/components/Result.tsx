import { useEffect, useState, type ReactNode } from 'react';
import { haptic, sfx } from '../lib/sound';
import { ABBY } from '../config/abby';
import { useCountdown } from '../hooks/useCountdown';
import { puzzleNumber } from '../lib/daily';
import { META } from '../minigames/meta';
import { liveStreak } from '../state/progress';
import { useStore } from '../state/store';
import { Confetti } from './Confetti';

/** Panel final común: respuesta, récord, racha y compartir. */
export function Result({ id, answer }: { id: string; answer?: ReactNode }) {
  const { state, today, toast } = useStore();
  const countdown = useCountdown();
  const run = state.runs[id];
  const finished = !!run && run.day === today && run.status !== 'playing';
  // Solo hay confeti si la partida termina mientras miras, no al volver a abrirla.
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

  const share = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ icon: '📋', title: 'Resultado copiado', text: 'Pégalo en el chat o en Discord', tone: 'good' });
    } catch {
      toast({ icon: '⚠️', title: 'No se pudo copiar', tone: 'bad' });
    }
  };

  return (
    <div
      className={`animate-bounce-in mt-6 rounded-3xl border p-5 text-center ${
        won ? 'border-emerald-300/30 bg-gradient-to-br from-emerald-400/15 to-fuchsia-500/10' : 'border-rose-300/30 bg-rose-500/10'
      }`}
    >
      <Confetti burst={startedPlaying && won ? 1 : 0} />
      <div className="text-4xl">{won ? '🎉' : '😵'}</div>
      <h3 className="font-display text-2xl font-bold">{won ? '¡Reto superado!' : 'Hoy no pudo ser'}</h3>
      {run.summary && <p className="mt-1 text-white/75">{run.summary}</p>}
      {answer && <div className="mt-2 text-white/75">La respuesta era: {answer}</div>}
      <pre className="mx-auto mt-3 w-fit rounded-xl bg-black/25 px-4 py-2 font-sans text-lg leading-snug">{run.share}</pre>
      <div className="mt-3 inline-flex flex-wrap justify-center gap-2 text-sm">
        <span className="chip bg-orange-400/15 text-orange-200">🔥 Racha {rec ? liveStreak(rec.streak, rec.lastWinDay, today) : 0}</span>
        {rec?.best != null && <span className="chip bg-amber-300/15 text-amber-200">🏆 Récord: {meta.formatScore(rec.best)}</span>}
        {rec && (
          <span className="chip bg-white/10 text-white/70">
            {rec.won}/{rec.played} ganados
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <button className="btn btn-primary" onClick={share}>
          📤 Compartir resultado
        </button>
        <span className="text-sm font-bold text-white/50">Nuevo reto en {countdown}</span>
      </div>
    </div>
  );
}
