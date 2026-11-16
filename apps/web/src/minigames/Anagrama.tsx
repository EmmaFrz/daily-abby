import { useCallback, useState } from 'react';
import { usePhysicalKeys } from '../components/Keyboard';
import { Result } from '../components/Result';
import { sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { anagramOfDay } from './content';
import { useDaily } from './useDaily';

const MAX = 3;

export function Anagrama() {
  const { today, toast } = useStore();
  const { word, letters } = anagramOfDay(today);
  const [picked, setPicked] = useState<number[]>([]);
  const [shake, setShake] = useState(0);
  const { data, playing, play } = useDaily<{ attempts: string[]; hints: number }>(
    'anagrama',
    () => ({ attempts: [], hints: 0 }),
    (d) => {
      const n = d.attempts.length;
      const won = d.attempts[n - 1] === word;
      if (!won && n < MAX) return null;
      return {
        won,
        score: n,
        summary: won ? `Resuelto en ${n} ${n === 1 ? 'intento' : 'intentos'} con ${d.hints} ${d.hints === 1 ? 'pista' : 'pistas'}.` : 'Las letras ganaron hoy.',
        share: d.attempts.map((a) => (a === word ? '🟩' : '🟥')).join('') + (d.hints ? ` 💡×${d.hints}` : ''),
        flags: won && n === 1 && d.hints === 0 ? ['anagrama-clean'] : [],
      };
    },
  );

  // Las pistas fijan las primeras letras y gastan sus fichas.
  const hintTiles: number[] = [];
  for (const ch of word.slice(0, data.hints)) {
    const idx = letters.findIndex((l, i) => l === ch && !hintTiles.includes(i));
    hintTiles.push(idx);
  }
  const used = new Set([...hintTiles, ...picked]);
  const current = word.slice(0, data.hints) + picked.map((i) => letters[i]).join('');

  const submit = useCallback(() => {
    if (current.length !== word.length) {
      sfx('wrong');
      setShake((s) => s + 1);
      return;
    }
    if (current !== word) sfx('wrong');
    if (current !== word) toast({ icon: '❌', title: 'No es esa', text: `Te quedan ${MAX - data.attempts.length - 1} intentos`, tone: 'bad' });
    play((d) => ({ ...d, attempts: [...d.attempts, current] }));
    setPicked([]);
  }, [current, word, play, toast, data.attempts.length]);

  const press = useCallback(
    (k: string) => {
      if (k === 'ENTER') return submit();
      if (k === 'BORRAR') return setPicked((p) => p.slice(0, -1));
      const idx = letters.findIndex((l, i) => l === k && !used.has(i));
      if (idx >= 0) setPicked((p) => [...p, idx]);
    },
    [letters, used, submit],
  );
  usePhysicalKeys(press, playing);

  const hint = () => {
    sfx('pop');
    setPicked([]);
    play((d) => ({ ...d, hints: Math.min(word.length - 2, d.hints + 1) }));
  };

  return (
    <div className="flex flex-col items-center">
      <p className="mb-5 text-center text-sm text-white/65">
        Ordena las letras para formar una palabra del mundo stream y gaming ({word.length} letras).
        {playing && <span className="chip ml-1 bg-white/10 text-white/75">{MAX - data.attempts.length} intentos</span>}
      </p>

      <div key={shake} className={`mb-5 flex flex-wrap justify-center gap-1.5 ${shake ? 'animate-shake' : ''}`}>
        {[...word].map((_, i) => {
          const ch = playing ? current[i] : word[i];
          const isHint = i < data.hints;
          return (
            <button
              key={i}
              disabled={!playing || isHint || !ch}
              onClick={() => {
                sfx('tap', { pitch: 0.8 });
                setPicked((p) => p.slice(0, i - data.hints));
              }}
              className={`grid h-12 w-10 place-items-center rounded-xl border-2 font-display text-2xl font-bold sm:h-14 sm:w-12 ${
                isHint
                  ? 'border-amber-300/60 bg-amber-400/25'
                  : ch
                    ? 'animate-pop border-indigo-300/60 bg-gradient-to-br from-indigo-500/60 to-purple-600/60'
                    : 'border-dashed border-white/20 bg-white/3'
              }`}
            >
              {ch ?? ''}
            </button>
          );
        })}
      </div>

      {playing && (
        <>
          <div className="mb-5 flex flex-wrap justify-center gap-2">
            {letters.map((l, i) => (
              <button
                key={i}
                disabled={used.has(i)}
                onClick={() => {
                  sfx('tap', { pitch: 1 + picked.length * 0.05 });
                  setPicked((p) => [...p, i]);
                }}
                className="grid h-13 w-13 place-items-center rounded-2xl border border-white/20 bg-white/12 font-display text-2xl font-bold shadow-lg transition hover:-translate-y-0.5 hover:bg-white/20 disabled:scale-90 disabled:opacity-15"
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button className="btn btn-ghost" onClick={() => setPicked([])}>
              ↺ Limpiar
            </button>
            <button className="btn btn-ghost" disabled={data.hints >= word.length - 2} onClick={hint}>
              💡 Pista
            </button>
            <button className="btn btn-primary px-8" onClick={submit}>
              Enviar
            </button>
          </div>
          {data.attempts.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {data.attempts.map((a, i) => (
                <span key={i} className="chip bg-rose-500/25 font-display text-sm tracking-widest text-rose-100 line-through">
                  {a}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <div className="w-full">
        <Result id="anagrama" answer={<b className="font-display tracking-[0.2em] text-white">{word}</b>} />
      </div>
    </div>
  );
}
