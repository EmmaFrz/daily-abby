import { AUTH_ERROR, type ChatSourceKind, type GamePhase, type HostCommand, type PublicGameState } from '@abby/shared';
import { useState } from 'react';
import { Centered } from '../components/Centered';
import { KeyGate } from '../components/KeyGate';
import { useCountdown } from '../hooks/useCountdown';
import { useGame } from '../hooks/useGame';
import { useStoredKey } from '../hooks/useStoredKey';

const PHASE_LABEL: Record<GamePhase, string> = {
  lobby: 'Lobby',
  question: 'Pregunta abierta',
  locked: 'Respuestas cerradas',
  reveal: 'Respuesta revelada',
  scoreboard: 'Marcador',
  finished: 'Juego terminado',
};

const SOURCES: { kind: ChatSourceKind; label: string }[] = [
  { kind: 'twitch', label: 'Twitch' },
  { kind: 'simulator', label: 'Simulador' },
  { kind: 'off', label: 'Apagado' },
];

/** Consola del director: controla el ritmo del programa. No ve la respuesta correcta. */
export default function HostPage() {
  const [key, setKey] = useStoredKey();
  const { state, error, socket, now } = useGame('host', key);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!key || error === AUTH_ERROR) {
    return <KeyGate title="Consola del host" error={key ? error : null} onSubmit={setKey} />;
  }
  if (!state) return <Centered>{error ?? 'Conectando…'}</Centered>;

  const send = (cmd: HostCommand) => {
    setFeedback(null);
    socket?.emit('host:command', cmd, (res) => {
      if (!res.ok) setFeedback(res.error);
    });
  };
  const main = mainAction(state);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Consola del host</h1>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{PHASE_LABEL[state.phase]}</span>
      </header>

      <section className="space-y-3 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        {state.question ? (
          <>
            <p className="text-sm text-white/60">
              Pregunta {state.question.number} de {state.question.total} · {state.question.category}
            </p>
            <p className="text-lg font-semibold">{state.question.text}</p>
          </>
        ) : (
          <p className="text-white/60">Sin pregunta en pantalla</p>
        )}
        <div className="flex flex-wrap gap-3 text-sm">
          {state.phase === 'question' && <HostTimer deadline={state.deadline} now={now} />}
          <Stat label="Abby" value={state.abbyAnswered ? 'Respondió' : '—'} />
          <Stat label="Votos del chat" value={state.votes} />
          <Stat label="Marcador" value={`${state.score.abby} – ${state.score.chat}`} />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        {main && (
          <button
            onClick={() => send(main.cmd)}
            className="flex-1 rounded-xl bg-chat px-5 py-4 text-lg font-bold hover:brightness-110"
          >
            {main.label}
          </button>
        )}
        <button
          onClick={() => {
            if (confirm('¿Reiniciar el juego? Se borra el marcador.')) send({ type: 'reset' });
          }}
          className="rounded-xl bg-white/10 px-5 py-4 font-semibold hover:bg-white/15"
        >
          ↺ Reiniciar
        </button>
      </div>

      {feedback && <p className="rounded-lg bg-rose-500/15 px-4 py-2 text-rose-300">{feedback}</p>}

      <section className="space-y-3 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="font-semibold">Fuente del chat</h2>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.kind}
              onClick={() => send({ type: 'setChatSource', source: s.kind })}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                state.chat.source === s.kind ? 'bg-chat' : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-white/60">{chatStatusText(state)}</p>
        <p className="text-xs text-white/40">
          Retraso del stream configurado: {state.streamDelaySec} s (el chat tiene ese tiempo extra para votar).
        </p>
      </section>

      <nav className="flex flex-wrap gap-4 text-sm text-white/60">
        <a href="/" target="_blank" className="underline hover:text-white">
          Abrir pantalla del juego
        </a>
        <a href="/abby" target="_blank" className="underline hover:text-white">
          Abrir pad de Abby
        </a>
        <button onClick={() => setKey(undefined)} className="underline hover:text-white">
          Cerrar sesión
        </button>
      </nav>
    </div>
  );
}

function mainAction(s: PublicGameState): { label: string; cmd: HostCommand } | null {
  switch (s.phase) {
    case 'lobby':
      return { label: '▶ Empezar juego', cmd: { type: 'next' } };
    case 'question':
      return { label: '⏹ Cerrar respuestas ya', cmd: { type: 'lockNow' } };
    case 'locked':
      return { label: '👀 Revelar respuesta', cmd: { type: 'next' } };
    case 'reveal':
      return { label: '📊 Ver marcador', cmd: { type: 'next' } };
    case 'scoreboard':
      return { label: s.hasNextQuestion ? '▶ Siguiente pregunta' : '🏁 Terminar juego', cmd: { type: 'next' } };
    case 'finished':
      return null;
  }
}

function chatStatusText({ chat }: PublicGameState): string {
  const parts = [chat.connected ? '🟢 Conectado' : '⚪ Sin conexión'];
  if (chat.channel) parts.push(`#${chat.channel}`);
  if (chat.detail) parts.push(chat.detail);
  return parts.join(' · ');
}

function HostTimer({ deadline, now }: { deadline: number | null; now: () => number }) {
  const ms = useCountdown(deadline, now);
  return <Stat label="Tiempo (Abby)" value={ms > 0 ? `${Math.ceil(ms / 1000)} s` : 'esperando al chat…'} />;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="rounded-lg bg-black/30 px-3 py-1.5">
      <span className="text-white/50">{label}: </span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
