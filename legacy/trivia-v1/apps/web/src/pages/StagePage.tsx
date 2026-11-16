import { CHOICES, type Choice, type PublicGameState, type PublicQuestion, type RoundResult } from '@abby/shared';
import type { ReactNode } from 'react';
import { Centered } from '../components/Centered';
import { CHOICE_BG } from '../components/choiceStyles';
import { useCountdown } from '../hooks/useCountdown';
import { useGame } from '../hooks/useGame';

/**
 * Pantalla principal del programa (la que Abby muestra en el stream).
 * Versión 2D para validar el motor; la escena 3D se monta encima en la fase 4.
 */
export default function StagePage() {
  const { state, status, now } = useGame('stage');

  if (!state) {
    return <Centered>{status === 'error' ? 'No se puede conectar con el servidor del juego' : 'Conectando…'}</Centered>;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,#2a1450,transparent_65%)]">
      <ScoreBar state={state} />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-6 md:px-10">
        <PhaseView state={state} now={now} />
      </main>
      <footer className="pb-6 text-center text-lg text-white/60">
        Responde en el chat de Twitch escribiendo <b className="text-white">A</b>, <b className="text-white">B</b>,{' '}
        <b className="text-white">C</b> o <b className="text-white">D</b>
      </footer>
    </div>
  );
}

function PhaseView({ state, now }: { state: PublicGameState; now: () => number }) {
  switch (state.phase) {
    case 'lobby':
      return <Lobby />;
    case 'question':
    case 'locked':
    case 'reveal':
      return state.question ? <QuestionView state={state} question={state.question} now={now} /> : null;
    case 'scoreboard':
      return <Scoreboard state={state} title="Marcador" />;
    case 'finished':
      return <Scoreboard state={state} title={winnerTitle(state)} />;
  }
}

function ScoreBar({ state }: { state: PublicGameState }) {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 md:px-10">
      <div className="flex items-baseline gap-3 text-abby">
        <span className="text-lg font-bold tracking-widest">ABBY</span>
        <span className="text-4xl font-black tabular-nums">{state.score.abby}</span>
      </div>
      <span className="font-bold text-white/40">VS</span>
      <div className="flex items-baseline gap-3 text-chat">
        <span className="text-4xl font-black tabular-nums">{state.score.chat}</span>
        <span className="text-lg font-bold tracking-widest">CHAT</span>
      </div>
    </header>
  );
}

function Lobby() {
  return (
    <div className="space-y-6 text-center">
      <p className="text-xl tracking-[0.3em] text-white/60 uppercase">Trivia en vivo</p>
      <h1 className="text-6xl font-black md:text-8xl">
        <span className="text-abby">Abby</span> <span className="text-white/40">vs</span>{' '}
        <span className="text-chat">Chat</span>
      </h1>
      <p className="text-2xl text-white/70">El juego empieza en breve…</p>
    </div>
  );
}

function QuestionView({
  state,
  question: q,
  now,
}: {
  state: PublicGameState;
  question: PublicQuestion;
  now: () => number;
}) {
  const remainingMs = useCountdown(state.deadline, now);

  return (
    <>
      <p className="text-base tracking-widest text-white/60 uppercase md:text-lg">
        {q.category} · Pregunta {q.number} de {q.total}
      </p>
      <h1 className="max-w-5xl text-center text-3xl leading-tight font-bold text-balance md:text-5xl">{q.text}</h1>
      <div className="grid w-full max-w-5xl gap-4 md:grid-cols-2">
        {CHOICES.map((c) => (
          <OptionTile key={c} choice={c} text={q.options[c]} result={state.result} />
        ))}
      </div>
      <StatusLine state={state} remainingMs={remainingMs} />
    </>
  );
}

function OptionTile({ choice, text, result }: { choice: Choice; text: string; result: RoundResult | null }) {
  const isCorrect = result?.correct === choice;
  const dimmed = result !== null && !isCorrect;
  const pct = result && result.voters > 0 ? Math.round((result.tally[choice] / result.voters) * 100) : 0;
  const abbyPicked = result?.abbyChoice === choice;
  const chatPicked = result?.chatChoice === choice;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 transition duration-500 md:p-5 ${CHOICE_BG[choice]} ${
        dimmed ? 'opacity-35' : ''
      } ${isCorrect ? 'scale-[1.02] ring-4 ring-white' : ''}`}
    >
      {result && (
        <div className="absolute inset-y-0 left-0 bg-black/25 transition-all duration-700" style={{ width: `${pct}%` }} />
      )}
      <div className="relative flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-black/25 text-2xl font-black">
          {choice}
        </span>
        <span className="flex-1 text-xl font-semibold md:text-2xl">{text}</span>
        {result && <span className="text-lg font-bold tabular-nums">{pct}%</span>}
      </div>
      {(abbyPicked || chatPicked) && (
        <div className="relative mt-3 flex gap-2">
          {abbyPicked && <Tag className="bg-abby">Abby</Tag>}
          {chatPicked && <Tag className="bg-chat">Chat</Tag>}
        </div>
      )}
    </div>
  );
}

function Tag({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`rounded-full px-3 py-0.5 text-sm font-bold tracking-wide uppercase ${className}`}>{children}</span>;
}

function StatusLine({ state, remainingMs }: { state: PublicGameState; remainingMs: number }) {
  if (state.phase === 'question') {
    const secs = Math.ceil(remainingMs / 1000);
    return (
      <div className="flex flex-wrap items-center justify-center gap-6 text-xl md:gap-10">
        <span className="text-abby">{state.abbyAnswered ? '🔒 Abby ya respondió' : '🤔 Abby está pensando…'}</span>
        <div
          className={`grid size-24 place-items-center rounded-full text-5xl font-black tabular-nums ring-4 ${
            secs <= 5 ? 'text-rose-400 ring-rose-500' : 'ring-white/30'
          }`}
        >
          {secs > 0 ? secs : '⏳'}
        </div>
        <span className="text-chat">💬 {state.votes} votos del chat</span>
      </div>
    );
  }

  if (state.phase === 'locked') {
    return (
      <p className="text-3xl font-bold">
        🔒 ¡Tiempo! Respuestas cerradas · <span className="text-chat">{state.votes} votos</span>
      </p>
    );
  }

  const r = state.result;
  if (!r) return null;
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex flex-wrap justify-center gap-6 text-2xl font-bold">
        <span className={r.abbyScored ? 'text-emerald-400' : 'text-rose-400'}>
          Abby {r.abbyScored ? 'acierta ✅' : r.abbyChoice ? 'falla ❌' : 'no respondió ⌛'}
        </span>
        <span className={r.chatScored ? 'text-emerald-400' : 'text-rose-400'}>Chat {chatOutcome(r)}</span>
      </div>
      {r.explanation && <p className="max-w-3xl text-lg text-white/70">{r.explanation}</p>}
    </div>
  );
}

function chatOutcome(r: RoundResult): string {
  if (r.chatScored) return 'acierta ✅';
  if (r.voters === 0) return 'no votó ⌛';
  if (r.chatChoice === null) return 'empata, sin mayoría 🤝';
  return 'falla ❌';
}

function Scoreboard({ state, title }: { state: PublicGameState; title: string }) {
  return (
    <div className="w-full max-w-3xl space-y-10 text-center">
      <h1 className="text-5xl font-black md:text-7xl">{title}</h1>
      <div className="flex items-center justify-center gap-10 font-black tabular-nums">
        <div className="text-abby">
          <p className="text-7xl md:text-9xl">{state.score.abby}</p>
          <p className="text-xl tracking-widest">ABBY</p>
        </div>
        <span className="text-4xl text-white/30">vs</span>
        <div className="text-chat">
          <p className="text-7xl md:text-9xl">{state.score.chat}</p>
          <p className="text-xl tracking-widest">CHAT</p>
        </div>
      </div>
      {state.topChatters.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl tracking-widest text-white/60 uppercase">Top del chat</h2>
          <ol className="mx-auto max-w-md space-y-1 text-left text-lg">
            {state.topChatters.map((c, i) => (
              <li key={`${i}-${c.name}`} className="flex justify-between rounded-lg bg-white/5 px-4 py-2">
                <span>
                  <span className="mr-3 text-white/50">{i + 1}.</span>
                  {c.name}
                </span>
                <span className="tabular-nums">{c.correct} ✓</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function winnerTitle(state: PublicGameState): string {
  if (state.score.abby > state.score.chat) return '¡Gana Abby! 🩷';
  if (state.score.chat > state.score.abby) return '¡Gana el chat! 💜';
  return '¡Empate!';
}
