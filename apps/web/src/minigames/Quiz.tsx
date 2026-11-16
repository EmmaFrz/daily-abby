import { useState } from 'react';
import { Result } from '../components/Result';
import { haptic, sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { quizOfDay } from './content';
import { useDaily } from './useDaily';

const PASS = 3;

export function Quiz() {
  const { today } = useStore();
  const questions = quizOfDay(today);
  const { data, playing, play } = useDaily<{ answers: number[] }>(
    'quiz',
    () => ({ answers: [] }),
    (d) => {
      if (d.answers.length < questions.length) return null;
      const right = d.answers.filter((a, i) => a === questions[i]!.correct).length;
      return {
        won: right >= PASS,
        score: right,
        summary: `${right} de ${questions.length} respuestas correctas.`,
        share: d.answers.map((a, i) => (a === questions[i]!.correct ? '🟩' : '🟥')).join(''),
        flags: right === questions.length ? ['quiz-5'] : [],
      };
    },
  );
  const [idx, setIdx] = useState(() => Math.min(data.answers.length, questions.length - 1));
  const q = questions[idx]!;
  const chosen = data.answers[idx];
  const answered = chosen != null;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex justify-center gap-1.5">
        {questions.map((qq, i) => {
          const a = data.answers[i];
          return (
            <span
              key={i}
              className={`h-2.5 flex-1 rounded-full ${a == null ? (i === idx ? 'bg-white/40' : 'bg-white/10') : a === qq.correct ? 'bg-emerald-400' : 'bg-rose-500'}`}
            />
          );
        })}
      </div>

      {playing || answered ? (
        <div key={idx} className="animate-rise">
          <div className="mb-1 text-xs font-black uppercase tracking-wider text-white/45">
            Pregunta {idx + 1} de {questions.length}
          </div>
          <h3 className="mb-4 flex items-start gap-3 font-display text-xl font-semibold sm:text-2xl">
            <span className="text-3xl">{q.icon}</span>
            {q.text}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, i) => {
              const isRight = i === q.correct;
              const cls = !answered
                ? 'border-white/12 bg-white/7 hover:bg-white/14 hover:-translate-y-0.5'
                : isRight
                  ? 'border-emerald-300/60 bg-emerald-500/30'
                  : i === chosen
                    ? 'border-rose-300/50 bg-rose-500/25'
                    : 'border-white/8 bg-white/3 opacity-50';
              return (
                <button
                  key={o}
                  disabled={answered}
                  onClick={() => {
                    sfx(isRight ? 'ok' : 'wrong');
                    if (!isRight) haptic(80);
                    play((d) => (d.answers.length === idx ? { answers: [...d.answers, i] } : d));
                  }}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left font-extrabold transition ${cls}`}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-sm">{'ABCD'[i]}</span>
                  <span className="flex-1">{o}</span>
                  {answered && isRight && '✅'}
                  {answered && i === chosen && !isRight && '❌'}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between gap-2">
            <button className="btn btn-ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
              ← Anterior
            </button>
            {answered && idx < questions.length - 1 && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  sfx('pop');
                  setIdx(idx + 1);
                }}
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      ) : null}

      <Result id="quiz" />
    </div>
  );
}
