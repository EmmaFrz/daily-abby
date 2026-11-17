import { useCallback, useMemo, useState } from 'react';
import { Keyboard, usePhysicalKeys } from '../components/Keyboard';
import { Result } from '../components/Result';
import { MECHANISMS, type CrypticClue } from '../data/cryptic';
import { normalizeWord } from '../lib/format';
import { haptic, sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { crypticOfDay } from './content';
import { useDaily } from './useDaily';

const MAX = 5;
const HINT_COST = 10;

type HintKey = 'tipo' | 'def' | 'ind' | 'mat' | 'letra';
type Part = 'def' | 'ind' | 'mat';

const HINTS: { key: HintKey; icon: string; label: string }[] = [
  { key: 'tipo', icon: '🧩', label: 'Mecanismo' },
  { key: 'def', icon: '📕', label: 'Definición' },
  { key: 'ind', icon: '🔦', label: 'Indicador' },
  { key: 'mat', icon: '🧱', label: 'Material' },
  { key: 'letra', icon: '🔤', label: 'Primera letra' },
];

const PART_STYLE: Record<Part, string> = {
  def: 'bg-rose-500/30 text-rose-50 decoration-rose-300',
  ind: 'bg-amber-400/30 text-amber-50 decoration-amber-300',
  mat: 'bg-emerald-500/30 text-emerald-50 decoration-emerald-300',
};

interface Data {
  attempts: string[];
  hints: HintKey[];
  gaveUp: boolean;
}

/** Puntos: 100 a la primera; cada intento extra y cada pista restan 10 (mínimo 10). */
const points = (attempts: number, hints: number) => Math.max(10, 100 - 10 * (attempts - 1) - HINT_COST * hints);

/** La frase troceada según qué partes (definición, indicador, material) están a la vista. */
function ClueText({ clue, show }: { clue: CrypticClue; show: Part[] }) {
  const marks: (Part | null)[] = Array(clue.clue.length).fill(null);
  for (const part of show) {
    for (const span of clue[part]) {
      const at = clue.clue.indexOf(span);
      if (at >= 0) for (let i = at; i < at + span.length; i++) marks[i] = part;
    }
  }
  const segments: { text: string; part: Part | null }[] = [];
  [...clue.clue].forEach((ch, i) => {
    const last = segments[segments.length - 1];
    if (last && last.part === marks[i]) last.text += ch;
    else segments.push({ text: ch, part: marks[i]! });
  });
  return (
    <>
      {segments.map((s, i) =>
        s.part ? (
          <mark key={i} className={`animate-pop rounded-md px-0.5 underline decoration-2 underline-offset-4 ${PART_STYLE[s.part]}`}>
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

export function Cripto() {
  const { today, toast } = useStore();
  const clue = useMemo(() => crypticOfDay(today), [today]);
  const answer = normalizeWord(clue.answer);
  const [typed, setTyped] = useState('');
  const [shake, setShake] = useState(0);

  const { data, playing, play } = useDaily<Data>(
    'cripto',
    () => ({ attempts: [], hints: [], gaveUp: false }),
    (d) => {
      const n = d.attempts.length;
      const won = d.attempts[n - 1] === answer;
      if (!won && n < MAX && !d.gaveUp) return null;
      const squares = d.attempts.map((a) => (a === answer ? '🟩' : '🟥')).join('') + (d.gaveUp ? '🏳️' : '');
      const hintsTxt = d.hints.length ? ` · 💡×${d.hints.length}` : '';
      if (!won)
        return { won: false, summary: d.gaveUp ? 'Te rendiste… mira el desglose.' : 'Se acabaron los intentos.', share: `${squares || '🏳️'}${hintsTxt}` };
      const pts = points(n, d.hints.length);
      return {
        won: true,
        score: pts,
        summary: `${pts} puntos: ${n} ${n === 1 ? 'intento' : 'intentos'} y ${d.hints.length} ${d.hints.length === 1 ? 'pista' : 'pistas'}.`,
        share: `${squares}${hintsTxt} · ${pts} pts`,
        flags: n === 1 && d.hints.length === 0 ? ['cripto-clean'] : [],
      };
    },
  );

  const submit = useCallback(() => {
    if (typed.length !== answer.length) {
      sfx('wrong');
      setShake((s) => s + 1);
      return;
    }
    if (typed !== answer) {
      sfx('wrong');
      haptic(80);
      const left = MAX - data.attempts.length - 1;
      if (left > 0) toast({ icon: '❌', title: 'No es esa', text: `Te ${left === 1 ? 'queda 1 intento' : `quedan ${left} intentos`}`, tone: 'bad' });
    }
    play((d) => ({ ...d, attempts: [...d.attempts, typed] }));
    setTyped('');
  }, [typed, answer, play, toast, data.attempts.length]);

  const press = useCallback(
    (k: string) => {
      if (k === 'ENTER') return submit();
      if (k === 'BORRAR') return setTyped((t) => t.slice(0, -1));
      setTyped((t) => (t.length < answer.length ? t + k : t));
    },
    [submit, answer.length],
  );
  usePhysicalKeys(press, playing);

  const available = (k: HintKey) => (k === 'ind' ? clue.ind.length > 0 : k === 'mat' ? clue.mat.length > 0 : true);
  const used = (k: HintKey) => data.hints.includes(k);
  const takeHint = (k: HintKey) => {
    sfx('pop');
    play((d) => (d.hints.includes(k) ? d : { ...d, hints: [...d.hints, k] }));
  };
  const giveUp = () => {
    if (!confirm('¿Rendirte? Se mostrará la respuesta y el desglose de la pista.')) return;
    play((d) => ({ ...d, gaveUp: true }));
  };

  const shown: Part[] = playing ? (['def', 'ind', 'mat'] as Part[]).filter(used) : ['def', 'ind', 'mat'];
  const mech = MECHANISMS[clue.type];
  const pts = points(data.attempts.length + 1, data.hints.length);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center">
      <div className="w-full rounded-3xl border border-white/12 bg-gradient-to-br from-emerald-500/10 via-white/4 to-teal-500/10 p-5 sm:p-7">
        <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-white/50">
          <span>🕵️ Pista críptica</span>
          {playing && <span className="text-emerald-200/80">{pts} pts</span>}
        </div>
        <p className="text-center font-display text-2xl font-semibold leading-relaxed sm:text-3xl">
          <ClueText clue={clue} show={shown} /> <span className="whitespace-nowrap text-white/50">({clue.answer.length})</span>
        </p>
        {shown.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold">
            {shown.includes('def') && <span className="chip bg-rose-500/25 text-rose-100">📕 Definición</span>}
            {shown.includes('ind') && clue.ind.length > 0 && <span className="chip bg-amber-400/25 text-amber-100">🔦 Indicador</span>}
            {shown.includes('mat') && clue.mat.length > 0 && <span className="chip bg-emerald-500/25 text-emerald-100">🧱 Material</span>}
          </div>
        )}
        {playing && (used('tipo') || used('letra')) && (
          <div className="mt-4 grid gap-1.5 text-sm">
            {used('tipo') && (
              <div className="animate-rise rounded-xl bg-white/8 px-3 py-2 text-white/85">
                {mech.icon} <b>{clue.type}</b>: {mech.what}
              </div>
            )}
            {used('letra') && (
              <div className="animate-rise rounded-xl bg-white/8 px-3 py-2 text-white/85">
                🔤 Empieza por <b className="font-display">{answer[0]}</b>
              </div>
            )}
          </div>
        )}
      </div>

      {playing && (
        <>
          <div key={shake} className={`my-5 flex flex-wrap justify-center gap-1.5 ${shake ? 'animate-shake' : ''}`}>
            {[...answer].map((_, i) => (
              <div
                key={i}
                className={`grid h-12 w-10 place-items-center rounded-xl border-2 font-display text-2xl font-bold sm:h-14 sm:w-12 ${
                  typed[i] ? 'animate-pop border-emerald-300/60 bg-emerald-500/25' : 'border-dashed border-white/20 bg-white/3'
                }`}
              >
                {typed[i] ?? ''}
              </div>
            ))}
          </div>

          <div className="mb-2 flex flex-wrap justify-center gap-2">
            {HINTS.map((h) => (
              <button
                key={h.key}
                className="btn btn-ghost px-3 py-2 text-sm"
                disabled={used(h.key) || !available(h.key)}
                title={available(h.key) ? `Pista: −${HINT_COST} puntos` : 'Esta pista no tiene'}
                onClick={() => takeHint(h.key)}
              >
                {h.icon} {available(h.key) ? h.label : `Sin ${h.label.toLowerCase()}`}
              </button>
            ))}
          </div>
          <p className="mb-4 text-center text-xs text-white/45">
            Cada pista y cada intento fallado restan {HINT_COST} puntos · {MAX - data.attempts.length} intentos
          </p>

          {data.attempts.length > 0 && (
            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {data.attempts.map((a, i) => (
                <span key={i} className="chip bg-rose-500/25 font-display text-sm tracking-widest text-rose-100 line-through">
                  {a}
                </span>
              ))}
            </div>
          )}

          <Keyboard states={{}} onKey={press} />
          <div className="mt-3 flex justify-center gap-2">
            <button className="btn btn-primary px-8" onClick={submit}>
              Comprobar
            </button>
            <button className="btn btn-ghost text-rose-200" onClick={giveUp}>
              🏳️ Rendirse
            </button>
          </div>

          <details className="mt-6 w-full rounded-2xl border border-white/10 bg-white/4 p-4 text-sm text-white/75">
            <summary className="cursor-pointer font-bold text-white">❓ ¿Cómo se resuelve un críptico?</summary>
            <p className="mt-3">
              Cada pista es una frase con <b>dos caminos</b> a la misma palabra. Una parte, al principio o al final, es la{' '}
              <b className="text-rose-200">definición</b> (un sinónimo). El resto es un <b>juego de palabras</b>: un{' '}
              <b className="text-amber-200">indicador</b> te dice qué hacer con el <b className="text-emerald-200">material</b>. El número
              entre paréntesis es la cantidad de letras.
            </p>
            <p className="mt-2 text-white/60">
              Ejemplo: «Al notar algo raro, mueve el cursor (5)». Lo que mueve el cursor es un RATÓN, y NOTAR revuelto (algo raro) también da RATÓN.
            </p>
            <ul className="mt-3 grid gap-1.5">
              {Object.entries(MECHANISMS).map(([name, m]) => (
                <li key={name}>
                  {m.icon} <b>{name}</b>: {m.what} <span className="text-white/45">Indicadores: {m.indicators}</span>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}

      {!playing && (
        <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <h3 className="mb-2 font-display text-lg font-bold">🔎 Desglose</h3>
          <p>
            <span className="text-rose-200">📕 Definición:</span> «{clue.def.join('» + «')}»
          </p>
          <p className="mt-1">
            <span className="text-amber-200">
              {mech.icon} {clue.type}:
            </span>{' '}
            {clue.how}
          </p>
        </div>
      )}

      <div className="w-full">
        <Result id="cripto" answer={<b className="font-display tracking-[0.2em] text-white">{clue.answer}</b>} />
      </div>
    </div>
  );
}
