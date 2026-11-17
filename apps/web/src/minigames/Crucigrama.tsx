import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, usePhysicalKeys } from '../components/Keyboard';
import { Result } from '../components/Result';
import { haptic, sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { crosswordOfDay } from './content';
import type { CrossEntry, Dir } from './crossword';
import { useDaily } from './useDaily';

interface Data {
  letters: string[];
  checks: number;
  revealed: number[];
  gaveUp: boolean;
}

const ayudas = (n: number) => `${n} ${n === 1 ? 'ayuda' : 'ayudas'}`;

export function Crucigrama() {
  const { today, toast } = useStore();
  const cw = useMemo(() => crosswordOfDay(today), [today]);
  const { rows, cols, solution, numbers, entries } = cw;
  const total = solution.filter(Boolean).length;

  const { data, playing, play } = useDaily<Data>(
    'crucigrama',
    () => ({ letters: Array(rows * cols).fill(''), checks: 0, revealed: [], gaveUp: false }),
    (d) => {
      if (d.gaveUp)
        return { won: false, summary: 'Te rendiste… ¡mañana hay otro!', share: `🏳️ ${entries.length} palabras` };
      const solved = solution.every((s, i) => !s || d.letters[i] === s);
      if (!solved) return null;
      const helps = d.checks + d.revealed.length;
      return {
        won: true,
        score: helps,
        summary: helps ? `Resuelto con ${ayudas(helps)}.` : '¡Resuelto sin ninguna ayuda!',
        share: `✍️ ${entries.length} palabras · ${helps ? `${d.checks ? `🔎×${d.checks} ` : ''}${d.revealed.length ? `💡×${d.revealed.length}` : ''}`.trim() : 'sin ayudas ✨'}`,
        flags: helps === 0 ? ['crucigrama-clean'] : [],
      };
    },
  );

  const firstCell = entries[0]?.cells[0] ?? 0;
  const [sel, setSel] = useState(firstCell);
  const [dir, setDir] = useState<Dir>(entries[0]?.dir ?? 'H');
  const [wrong, setWrong] = useState<Set<number>>(new Set());

  const entryAt = (cell: number, d: Dir): CrossEntry | undefined => entries.find((e) => e.dir === d && e.cells.includes(cell));
  const current = entryAt(sel, dir) ?? entryAt(sel, dir === 'H' ? 'V' : 'H');
  const activeDir = current?.dir ?? dir;
  const locked = new Set(data.revealed);

  const select = (cell: number) => {
    if (!solution[cell]) return;
    sfx('tap', { pitch: 0.9 });
    if (cell === sel) {
      const other: Dir = activeDir === 'H' ? 'V' : 'H';
      if (entryAt(cell, other)) setDir(other);
      return;
    }
    setSel(cell);
    if (!entryAt(cell, activeDir)) setDir(activeDir === 'H' ? 'V' : 'H');
  };

  const selectEntry = (e: CrossEntry) => {
    sfx('tap', { pitch: 0.9 });
    setDir(e.dir);
    setSel(e.cells[0]!);
  };

  /** Pasa a la siguiente casilla de la palabra (o a la siguiente palabra si se acabó). */
  const advance = (letters: string[]) => {
    if (!current) return;
    const i = current.cells.indexOf(sel);
    // Siempre a la casilla siguiente (aunque ya tenga letra): así se puede escribir la palabra entera.
    const next = current.cells[i + 1];
    if (next != null) return setSel(next);
    // Palabra terminada: salta a la siguiente con huecos.
    const idx = entries.indexOf(current);
    for (let k = 1; k <= entries.length; k++) {
      const e = entries[(idx + k) % entries.length]!;
      const empty = e.cells.find((c) => !letters[c]);
      if (empty != null) {
        setDir(e.dir);
        return setSel(empty);
      }
    }
  };

  /** ENTER: salta a la siguiente palabra con huecos. */
  const nextEntry = () => {
    const idx = current ? entries.indexOf(current) : -1;
    for (let k = 1; k <= entries.length; k++) {
      const e = entries[(idx + k) % entries.length]!;
      if (e.cells.some((c) => !data.letters[c])) return selectEntry(e);
    }
  };

  const check = useCallback(() => {
    const bad = new Set(solution.flatMap((s, i) => (s && data.letters[i] && data.letters[i] !== s ? [i] : [])));
    const empty = solution.filter((s, i) => s && !data.letters[i]).length;
    setWrong(bad);
    if (bad.size) {
      sfx('wrong');
      haptic(80);
      toast({ icon: '🔎', title: `${bad.size} ${bad.size === 1 ? 'letra mal' : 'letras mal'}`, text: 'Están marcadas en rojo', tone: 'bad' });
    } else {
      sfx('ok');
      toast({ icon: '👌', title: 'Todo bien hasta ahora', text: `Faltan ${empty} ${empty === 1 ? 'letra' : 'letras'}`, tone: 'good' });
    }
    play((d) => ({ ...d, checks: d.checks + 1 }));
  }, [solution, data.letters, play, toast]);

  const press = useCallback(
    (k: string) => {
      if (k === 'ENTER') return nextEntry();
      if (k === 'BORRAR') {
        if (!current) return;
        const i = current.cells.indexOf(sel);
        const target = data.letters[sel] && !locked.has(sel) ? sel : current.cells[Math.max(0, i - 1)]!;
        if (target !== sel) setSel(target);
        if (locked.has(target)) return;
        setWrong((w) => (w.has(target) ? new Set([...w].filter((x) => x !== target)) : w));
        return play((d) => ({ ...d, letters: d.letters.map((l, j) => (j === target ? '' : l)) }));
      }
      if (locked.has(sel)) return advance(data.letters);
      const letters = data.letters.map((l, j) => (j === sel ? k : l));
      setWrong((w) => (w.has(sel) ? new Set([...w].filter((x) => x !== sel)) : w));
      play((d) => ({ ...d, letters: d.letters.map((l, j) => (j === sel ? k : l)) }));
      advance(letters);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, sel, data.letters, data.revealed, play],
  );
  usePhysicalKeys(press, playing);

  // Flechas del teclado para moverse por la cuadrícula.
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      const delta: Record<string, [number, number, Dir]> = {
        ArrowUp: [-1, 0, 'V'],
        ArrowDown: [1, 0, 'V'],
        ArrowLeft: [0, -1, 'H'],
        ArrowRight: [0, 1, 'H'],
      };
      const d = delta[e.key];
      if (!d) return;
      e.preventDefault();
      if (d[2] !== activeDir && entryAt(sel, d[2])) return setDir(d[2]);
      let r = Math.floor(sel / cols) + d[0];
      let c = (sel % cols) + d[1];
      while (r >= 0 && r < rows && c >= 0 && c < cols) {
        if (solution[r * cols + c]) {
          setSel(r * cols + c);
          if (!entryAt(r * cols + c, activeDir)) setDir(d[2]);
          return;
        }
        r += d[0];
        c += d[1];
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const reveal = () => {
    if (!solution[sel] || locked.has(sel)) return;
    sfx('pop');
    const cell = sel;
    setWrong((w) => new Set([...w].filter((x) => x !== cell)));
    const letters = data.letters.map((l, j) => (j === cell ? solution[cell]! : l));
    play((d) => ({ ...d, letters, revealed: [...d.revealed, cell] }));
    advance(letters);
  };

  const giveUp = () => {
    if (!confirm('¿Seguro que quieres rendirte? Se mostrará la solución.')) return;
    play((d) => ({ ...d, gaveUp: true }));
  };

  const filled = solution.filter((s, i) => s && data.letters[i]).length;
  const highlight = new Set(current?.cells ?? []);
  const size = cols >= 9 ? 'w-8 h-8 text-base sm:w-11 sm:h-11 sm:text-xl' : 'w-9 h-9 text-lg sm:w-12 sm:h-12 sm:text-2xl';

  const clueList = (d: Dir, title: string) => (
    <div>
      <h3 className="mb-1 font-display text-sm font-bold uppercase tracking-wider text-white/50">{title}</h3>
      <ul className="grid gap-1">
        {entries
          .filter((e) => e.dir === d)
          .map((e) => {
            const done = e.cells.every((c) => data.letters[c]);
            const active = current === e;
            return (
              <li key={`${e.dir}${e.num}`}>
                <button
                  disabled={!playing}
                  onClick={() => selectEntry(e)}
                  className={`w-full rounded-xl px-3 py-1.5 text-left text-sm transition ${
                    active ? 'bg-emerald-400/20 text-white' : 'text-white/75 hover:bg-white/6'
                  } ${done && !active ? 'opacity-50' : ''}`}
                >
                  <b className="mr-1.5 font-display">{e.num}.</b>
                  {e.clue} <span className="text-white/40">({e.answer.length})</span>
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-3 text-center text-sm text-white/65">
        Mini crucigrama de cultura pop: música, series, pelis, juegos e internet. Toca una casilla (dos veces para cambiar de dirección).
      </p>

      {playing && current && (
        <div className="mb-3 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-center text-sm font-bold">
          <span className="mr-2 font-display text-emerald-200">
            {current.num} {current.dir === 'H' ? '→' : '↓'}
          </span>
          {current.clue}
        </div>
      )}

      <div className="flex flex-col items-center gap-5 md:flex-row md:items-start md:justify-center">
        <div className="grid gap-[3px] rounded-2xl bg-black/30 p-2" style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
          {solution.map((s, i) => {
            if (!s) return <div key={i} className={size} />;
            const letter = playing ? data.letters[i] : s;
            const isSel = playing && i === sel;
            const isWrong = playing && wrong.has(i);
            const userWrong = !playing && data.letters[i] !== s;
            return (
              <button
                key={i}
                onClick={() => select(i)}
                disabled={!playing}
                className={`relative grid place-items-center rounded-md font-display font-bold transition ${size} ${
                  isSel
                    ? 'bg-amber-300 text-ink'
                    : isWrong
                      ? 'bg-rose-500/70 text-white'
                      : highlight.has(i) && playing
                        ? 'bg-emerald-300/40 text-white'
                        : locked.has(i)
                          ? 'bg-sky-400/30 text-sky-100'
                          : userWrong
                            ? 'bg-rose-500/30 text-rose-100'
                            : 'bg-white/90 text-ink'
                }`}
              >
                {numbers[i] && <span className="absolute left-0.5 top-0 text-[9px] leading-none opacity-70 sm:text-[10px]">{numbers[i]}</span>}
                {letter}
              </button>
            );
          })}
        </div>

        <div className="grid w-full gap-4 md:max-w-xs">
          {clueList('H', 'Horizontales →')}
          {clueList('V', 'Verticales ↓')}
        </div>
      </div>

      {playing && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="chip bg-white/10 text-white/70">
              {filled}/{total} letras
            </span>
            <button className="btn btn-ghost" onClick={check}>
              🔎 Comprobar
            </button>
            <button className="btn btn-ghost" onClick={reveal} disabled={locked.has(sel)}>
              💡 Revelar letra
            </button>
            <button className="btn btn-ghost text-rose-200" onClick={giveUp}>
              🏳️ Rendirse
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-white/45">Comprobar y revelar cuentan como ayudas. Con 0 ayudas, logro especial.</p>
          <div className="mt-4">
            <Keyboard states={{}} onKey={press} enterLabel="SIGUIENTE" />
          </div>
        </>
      )}

      <Result id="crucigrama" />
    </div>
  );
}
