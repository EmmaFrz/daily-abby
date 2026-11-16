import { AUTH_ERROR, CHOICES, type Choice, type PublicGameState } from '@abby/shared';
import { useState } from 'react';
import { Centered } from '../components/Centered';
import { CHOICE_BG } from '../components/choiceStyles';
import { KeyGate } from '../components/KeyGate';
import { useCountdown } from '../hooks/useCountdown';
import { useGame } from '../hooks/useGame';
import { useStoredKey } from '../hooks/useStoredKey';

/**
 * Pad privado de Abby (celular o tablet, fuera de cámara).
 * Su elección no aparece en la pantalla del stream hasta el reveal.
 */
export default function AbbyPage() {
  const [key, setKey] = useStoredKey();
  const { state, abbyChoice, error, socket, now } = useGame('abby', key);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!key || error === AUTH_ERROR) {
    return <KeyGate title="Pad de Abby" error={key ? error : null} onSubmit={setKey} />;
  }
  if (!state) return <Centered>{error ?? 'Conectando…'}</Centered>;

  const answer = (choice: Choice) => {
    setFeedback(null);
    socket?.emit('abby:answer', choice, (res) => {
      if (!res.ok) setFeedback(res.error);
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-5 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-abby">Pad de Abby</h1>
        <span className="text-sm text-white/60">
          Abby {state.score.abby} – {state.score.chat} Chat
        </span>
      </header>
      <AbbyBody state={state} abbyChoice={abbyChoice} now={now} onAnswer={answer} />
      {feedback && <p className="rounded-lg bg-rose-500/15 px-4 py-2 text-rose-300">{feedback}</p>}
    </div>
  );
}

function AbbyBody({
  state,
  abbyChoice,
  now,
  onAnswer,
}: {
  state: PublicGameState;
  abbyChoice: Choice | null;
  now: () => number;
  onAnswer: (choice: Choice) => void;
}) {
  const remainingMs = useCountdown(state.deadline, now);
  const q = state.question;

  if (!q) {
    return (
      <p className="flex flex-1 items-center justify-center text-center text-xl text-white/70">
        {state.phase === 'finished' ? 'Juego terminado 🎉' : 'Esperando a que empiece la pregunta…'}
      </p>
    );
  }

  const open = state.phase === 'question' && remainingMs > 0;

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm text-white/60">
          Pregunta {q.number} de {q.total} · {open ? `${Math.ceil(remainingMs / 1000)} s` : 'cerrada'}
        </p>
        <p className="text-xl font-semibold">{q.text}</p>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3">
        {CHOICES.map((c) => {
          const selected = abbyChoice === c;
          return (
            <button
              key={c}
              disabled={!open}
              onClick={() => onAnswer(c)}
              className={`flex min-h-28 flex-col items-start justify-between rounded-2xl p-4 text-left transition ${CHOICE_BG[c]} ${
                selected ? 'ring-4 ring-white' : abbyChoice ? 'opacity-50' : ''
              } disabled:cursor-not-allowed`}
            >
              <span className="text-3xl font-black">{c}</span>
              <span className="font-semibold">{q.options[c]}</span>
            </button>
          );
        })}
      </div>
      <p className="text-center text-white/70">{statusText(state, abbyChoice, open)}</p>
    </>
  );
}

function statusText(state: PublicGameState, abbyChoice: Choice | null, open: boolean): string {
  const r = state.result;
  if (r) return r.abbyScored ? '¡Acertaste! ✅' : `❌ Era la ${r.correct}`;
  if (open) return abbyChoice ? `Elegiste ${abbyChoice}. Puedes cambiar hasta que acabe el tiempo.` : 'Toca tu respuesta';
  return abbyChoice ? `Respuesta final: ${abbyChoice} 🔒` : 'Tiempo agotado';
}
