import { useState } from 'react';
import { Result } from '../components/Result';
import { GROUP_COLORS } from '../data/connections';
import { haptic, sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { connectionsOfDay } from './content';
import { useDaily } from './useDaily';

const MAX_MISTAKES = 4;

interface Data {
  found: number[];
  mistakes: number;
  /** Grupos reales de cada envío (para compartir). */
  history: number[][];
}

export function Conexiones() {
  const { today, toast } = useStore();
  const { groups, board } = connectionsOfDay(today);
  const [selected, setSelected] = useState<string[]>([]);
  const [shake, setShake] = useState(0);
  const { data, playing, play } = useDaily<Data>(
    'conexiones',
    () => ({ found: [], mistakes: 0, history: [] }),
    (d) => {
      const won = d.found.length === 4;
      if (!won && d.mistakes < MAX_MISTAKES) return null;
      return {
        won,
        score: d.mistakes,
        summary: won ? `Los 4 grupos con ${d.mistakes} ${d.mistakes === 1 ? 'fallo' : 'fallos'}.` : 'Te quedaste sin vidas.',
        share: d.history.map((row) => row.map((g) => GROUP_COLORS[g]!.emoji).join('')).join('\n'),
        flags: won && d.mistakes === 0 ? ['conexiones-perfect'] : [],
      };
    },
  );

  const groupOf = (item: string) => board.find((b) => b.item === item)!.group;
  const remaining = board.filter((b) => !data.found.includes(b.group));
  const solvedOrder = playing ? data.found : [...data.found, ...[0, 1, 2, 3].filter((g) => !data.found.includes(g))];

  const toggle = (item: string) => {
    const on = selected.includes(item);
    if (on || selected.length < 4) sfx('tap', { pitch: on ? 0.8 : 1 + selected.length * 0.08 });
    setSelected((s) => (s.includes(item) ? s.filter((x) => x !== item) : s.length < 4 ? [...s, item] : s));
  };

  const submit = () => {
    const gs = selected.map(groupOf);
    const counts = gs.reduce<Record<number, number>>((acc, g) => ({ ...acc, [g]: (acc[g] ?? 0) + 1 }), {});
    const top = Math.max(...Object.values(counts));
    if (top === 4) {
      sfx('match');
      toast({ icon: '✨', title: groups[gs[0]!]!.title, tone: 'good' });
    } else {
      sfx(top === 3 ? 'present' : 'wrong');
      haptic(80);
      setShake((n) => n + 1);
      toast({ icon: top === 3 ? '🤏' : '❌', title: top === 3 ? '¡A una de acertar!' : 'No es un grupo', tone: 'bad' });
    }
    play((d) => ({
      found: top === 4 ? [...d.found, gs[0]!] : d.found,
      mistakes: top === 4 ? d.mistakes : d.mistakes + 1,
      history: [...d.history, gs],
    }));
    if (top === 4) setSelected([]);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-4 text-center text-sm text-white/65">Forma 4 grupos de 4 elementos que tengan algo en común.</p>

      <div className="mb-2 grid gap-2">
        {solvedOrder.map((gi) => {
          const c = GROUP_COLORS[gi]!;
          return (
            <div key={gi} className={`animate-bounce-in rounded-2xl bg-gradient-to-r p-3 text-center ${c.bg} ${c.text}`}>
              <div className="font-display text-lg font-bold uppercase tracking-wide">{groups[gi]!.title}</div>
              <div className="text-sm font-bold">{groups[gi]!.items.join(' · ')}</div>
            </div>
          );
        })}
      </div>

      {playing && (
        <>
          <div key={shake} className={`grid grid-cols-4 gap-2 ${shake ? 'animate-shake' : ''}`}>
            {remaining.map(({ item }) => {
              const on = selected.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggle(item)}
                  className={`flex min-h-16 items-center justify-center rounded-2xl px-1 text-center text-[13px] font-extrabold leading-tight transition active:scale-95 sm:min-h-20 sm:text-base ${
                    on
                      ? 'scale-[0.97] bg-gradient-to-br from-abby to-twitch text-white shadow-[0_0_20px_rgb(255_79_163/0.5)]'
                      : 'bg-white/12 hover:bg-white/20'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-white/60">
              Vidas: {'💜'.repeat(MAX_MISTAKES - data.mistakes)}
              <span className="opacity-30">{'🖤'.repeat(data.mistakes)}</span>
            </span>
            <div className="flex gap-2">
              <button className="btn btn-ghost" disabled={!selected.length} onClick={() => setSelected([])}>
                Quitar
              </button>
              <button className="btn btn-primary" disabled={selected.length !== 4} onClick={submit}>
                Enviar
              </button>
            </div>
          </div>
        </>
      )}

      <Result id="conexiones" />
    </div>
  );
}
