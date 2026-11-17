import { useEffect, useMemo, useRef, useState } from 'react';
import { Result } from '../components/Result';
import { flagUrl, type Country } from '../data/countries';
import { haptic, sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { countryDuelsOfDay } from './content';
import { useDaily } from './useDaily';

const TIME_MS = 60_000;
const PENALTY_MS = 5_000;
const PASS = 15;
const GREAT = 25;
const FEEDBACK_MS = 650;

const km2 = (n: number) => `${n < 10 ? n.toLocaleString('es', { maximumFractionDigits: 2 }) : Math.round(n).toLocaleString('es')} km²`;

interface Data {
  /** null mientras no se haya terminado el minuto. */
  answers: boolean[] | null;
}

function CountryCard({
  c,
  onPick,
  state,
  showArea,
  disabled,
}: {
  c: Country;
  onPick: () => void;
  state: 'idle' | 'right' | 'wrong' | 'bigger';
  showArea: boolean;
  disabled: boolean;
}) {
  const [flagOk, setFlagOk] = useState(true);
  const tone = {
    idle: 'border-white/12 bg-white/6 hover:-translate-y-1 hover:border-sky-300/50 hover:bg-white/10',
    right: 'border-emerald-300/60 bg-emerald-500/25',
    wrong: 'border-rose-300/60 bg-rose-500/25',
    bigger: 'border-emerald-300/40 bg-emerald-500/10',
  }[state];
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={`flex min-h-48 flex-1 flex-col items-center justify-center rounded-3xl border p-3 text-center transition sm:min-h-56 ${tone}`}
    >
      {flagOk ? (
        <img
          src={flagUrl(c.code)}
          alt=""
          className="h-14 w-auto max-w-[80%] rounded-md object-contain shadow-lg sm:h-20"
          onError={() => setFlagOk(false)}
          draggable={false}
        />
      ) : (
        <span className="text-5xl">🏳️</span>
      )}
      <span className="mt-3 font-display text-lg font-semibold leading-tight sm:text-xl">{c.name}</span>
      <span className={`mt-1 h-5 text-sm font-bold tabular-nums ${showArea ? 'text-white/80' : 'text-transparent'}`}>{km2(c.area)}</span>
    </button>
  );
}

export function Paises() {
  const { today } = useStore();
  const duels = useMemo(() => countryDuelsOfDay(today), [today]);
  const [phase, setPhase] = useState<'idle' | 'count' | 'run'>('idle');
  const [count, setCount] = useState(3);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<{ pick: 0 | 1; right: boolean } | null>(null);
  const [left, setLeft] = useState(TIME_MS);
  const deadline = useRef(0);
  const answersRef = useRef<boolean[]>([]);

  const { data, playing, play } = useDaily<Data>(
    'paises',
    () => ({ answers: null }),
    (d) => {
      if (!d.answers) return null;
      const right = d.answers.filter(Boolean).length;
      const wrong = d.answers.length - right;
      return {
        won: right >= PASS,
        score: right,
        summary: `${right} ${right === 1 ? 'acierto' : 'aciertos'} y ${wrong} ${wrong === 1 ? 'fallo' : 'fallos'} en un minuto.${right >= PASS ? '' : ` Necesitabas ${PASS}.`}`,
        share: `🌍 ${right} aciertos · ❌×${wrong}\n${d.answers
          .slice(0, 30)
          .map((a) => (a ? '🟩' : '🟥'))
          .join('')}`,
        flags: right >= GREAT ? ['paises-25'] : [],
      };
    },
  );

  // El reloj usa siempre la última versión de `play` sin reiniciarse en cada render.
  const playRef = useRef(play);
  playRef.current = play;

  // Cuenta atrás 3, 2, 1…
  useEffect(() => {
    if (phase !== 'count') return;
    sfx(count === 0 ? 'go' : 'tick');
    if (count === 0) {
      deadline.current = performance.now() + TIME_MS;
      setPhase('run');
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 650);
    return () => clearTimeout(t);
  }, [phase, count]);

  // Reloj del minuto.
  useEffect(() => {
    if (phase !== 'run') return;
    let raf = 0;
    let lastSec = Math.ceil(TIME_MS / 1000);
    const tick = () => {
      const ms = deadline.current - performance.now();
      setLeft(Math.max(0, ms));
      const sec = Math.ceil(ms / 1000);
      if (sec !== lastSec && sec <= 5 && sec > 0) sfx('tick');
      lastSec = sec;
      if (ms <= 0) {
        setPhase('idle');
        const final = answersRef.current;
        playRef.current(() => ({ answers: final }));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const begin = () => {
    answersRef.current = [];
    setAnswers([]);
    setFeedback(null);
    setLeft(TIME_MS);
    setCount(3);
    setPhase('count');
  };

  const round = Math.min(answers.length, duels.length - 1);
  const [a, b] = duels[round]!;

  const pick = (side: 0 | 1) => {
    if (phase !== 'run' || feedback) return;
    const chosen = side === 0 ? a : b;
    const other = side === 0 ? b : a;
    const right = chosen.area > other.area;
    sfx(right ? 'ok' : 'wrong', { pitch: 1 + Math.min(answersRef.current.filter(Boolean).length, 20) * 0.03 });
    if (!right) {
      haptic(80);
      deadline.current -= PENALTY_MS;
    }
    setFeedback({ pick: side, right });
    setTimeout(() => {
      answersRef.current = [...answersRef.current, right];
      setAnswers(answersRef.current);
      setFeedback(null);
    }, FEEDBACK_MS);
  };

  const cardState = (side: 0 | 1): 'idle' | 'right' | 'wrong' | 'bigger' => {
    if (!feedback) return 'idle';
    const c = side === 0 ? a : b;
    const o = side === 0 ? b : a;
    if (feedback.pick === side) return feedback.right ? 'right' : 'wrong';
    return c.area > o.area ? 'bigger' : 'idle';
  };

  const live = phase === 'run';
  const shownAnswers = live ? answers : (data.answers ?? []);
  const right = shownAnswers.filter(Boolean).length;
  const secs = Math.ceil(left / 1000);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between text-sm font-bold text-white/65">
        <span>✅ {right}</span>
        <span className={`font-display text-2xl tabular-nums ${live && secs <= 10 ? 'text-rose-300' : 'text-white'}`}>⏱️ {live ? secs : playing ? 60 : 0} s</span>
        <span>❌ {shownAnswers.length - right} (−5 s)</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
          style={{ width: `${(live ? left / TIME_MS : playing ? 1 : 0) * 100}%` }}
        />
      </div>

      {live && (
        <>
          <p className="mb-3 text-center font-bold text-white/75">¿Qué país es más grande?</p>
          <div key={round} className="animate-pop flex items-stretch gap-3">
            <CountryCard c={a} onPick={() => pick(0)} state={cardState(0)} showArea={!!feedback} disabled={!!feedback} />
            <div className="grid place-items-center font-display text-xl font-bold text-white/40">VS</div>
            <CountryCard c={b} onPick={() => pick(1)} state={cardState(1)} showArea={!!feedback} disabled={!!feedback} />
          </div>
        </>
      )}

      {phase === 'count' && (
        <div className="grid min-h-56 place-items-center rounded-3xl border border-white/10 bg-white/5">
          <div key={count} className="animate-bounce-in font-display text-8xl font-bold">
            {count || '¡YA!'}
          </div>
        </div>
      )}

      {phase === 'idle' && playing && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <div className="text-6xl">🌍📏</div>
          <p className="mt-3 font-bold text-white/80">
            Tienes 60 segundos: en cada ronda, toca el país con <b>más superficie</b>.
            <br />
            Cada fallo te quita 5 s, ¡no vale ir a lo loco! Necesitas {PASS} aciertos para superar el reto.
          </p>
          <p className="mt-2 text-sm text-white/50">Solo cuenta tu primer minuto completo.</p>
          <button className="btn btn-primary mt-4 px-10 py-3 text-lg" onClick={begin}>
            Empezar
          </button>
        </div>
      )}

      {!playing && !live && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <div className="font-display text-6xl font-bold text-gradient">{right}</div>
          <div className="mt-1 font-bold text-white/60">aciertos hoy</div>
        </div>
      )}

      <Result id="paises" />
    </div>
  );
}
