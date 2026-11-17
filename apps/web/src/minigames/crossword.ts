/**
 * Generador del crucigrama diario. Coloca palabras de POP_CLUES cruzándolas en una cuadrícula
 * pequeña (máx. 9×9), sin palabras accidentales: dos letras solo se tocan si se cruzan.
 * Con la misma fecha sale siempre el mismo crucigrama.
 */
import { POP_CLUES, type PopClue } from '../data/popclues';
import { puzzleNumber, seeded, shuffled } from '../lib/daily';

export type Dir = 'H' | 'V';

export interface CrossEntry {
  num: number;
  dir: Dir;
  row: number;
  col: number;
  answer: string;
  clue: string;
  /** Índices de las casillas (fila * cols + columna). */
  cells: number[];
}

export interface Crossword {
  rows: number;
  cols: number;
  /** Letra solución de cada casilla, o null si es una casilla negra. */
  solution: (string | null)[];
  /** Número que se dibuja en la esquina de la casilla. */
  numbers: (number | null)[];
  entries: CrossEntry[];
}

const MAX_SIDE = 9;
const TARGET_WORDS = 7;
const MIN_WORDS = 5;
const WINDOW = 45;

interface Placed {
  word: PopClue;
  row: number;
  col: number;
  dir: Dir;
}

const key = (r: number, c: number) => `${r},${c}`;

function build(pool: readonly PopClue[], rng: () => number): Placed[] {
  const cells = new Map<string, { ch: string; dirs: Set<Dir> }>();
  const placed: Placed[] = [];
  let minR = 0, maxR = 0, minC = 0, maxC = 0;

  const put = (p: Placed) => {
    const [dr, dc] = p.dir === 'H' ? [0, 1] : [1, 0];
    [...p.word.answer].forEach((ch, k) => {
      const r = p.row + dr * k;
      const c = p.col + dc * k;
      const cell = cells.get(key(r, c)) ?? { ch, dirs: new Set<Dir>() };
      cell.dirs.add(p.dir);
      cells.set(key(r, c), cell);
      minR = Math.min(minR, r); maxR = Math.max(maxR, r);
      minC = Math.min(minC, c); maxC = Math.max(maxC, c);
    });
    placed.push(p);
  };

  /** Devuelve el número de cruces si la palabra cabe ahí, o -1. */
  const fits = (word: string, row: number, col: number, dir: Dir): number => {
    const [dr, dc] = dir === 'H' ? [0, 1] : [1, 0];
    const end = word.length - 1;
    if (cells.has(key(row - dr, col - dc)) || cells.has(key(row + dr * (end + 1), col + dc * (end + 1)))) return -1;
    if (
      Math.max(maxR, row + dr * end) - Math.min(minR, row) + 1 > MAX_SIDE ||
      Math.max(maxC, col + dc * end) - Math.min(minC, col) + 1 > MAX_SIDE
    )
      return -1;
    let crossings = 0;
    for (let k = 0; k <= end; k++) {
      const r = row + dr * k;
      const c = col + dc * k;
      const cell = cells.get(key(r, c));
      if (cell) {
        if (cell.ch !== word[k] || cell.dirs.has(dir)) return -1;
        crossings++;
      } else if (cells.has(key(r + dc, c + dr)) || cells.has(key(r - dc, c - dr))) {
        // Una letra nueva no puede quedar pegada de lado a otra palabra.
        return -1;
      }
    }
    return crossings;
  };

  const first = pool.find((w) => w.answer.length >= 5 && w.answer.length <= 8);
  if (!first) return placed;
  put({ word: first, row: 0, col: 0, dir: rng() < 0.5 ? 'H' : 'V' });

  while (placed.length < TARGET_WORDS) {
    type Candidate = Placed & { score: number };
    let best = null as Candidate | null;
    for (const word of pool) {
      if (placed.some((p) => p.word.answer === word.answer)) continue;
      for (const [k, cell] of cells) {
        if (cell.dirs.size > 1) continue;
        const [r, c] = k.split(',').map(Number) as [number, number];
        const dir: Dir = cell.dirs.has('H') ? 'V' : 'H';
        for (let i = 0; i < word.answer.length; i++) {
          if (word.answer[i] !== cell.ch) continue;
          const row = dir === 'V' ? r - i : r;
          const col = dir === 'H' ? c - i : c;
          const crossings = fits(word.answer, row, col, dir);
          if (crossings < 1) continue;
          // Más cruces es mejor; un poco de azar para variar la forma.
          const score = crossings * 10 + rng() * 6;
          if (!best || score > best.score) best = { word, row, col, dir, score };
        }
      }
      // Cuando ya hay un buen candidato, no hace falta mirar todo el lote.
      if (best && best.score >= 20) break;
    }
    if (!best) break;
    put(best);
  }
  return placed;
}

export function crosswordOfDay(day: string): Crossword {
  // Ventana del catálogo que avanza cada día: las palabras rotan sin repetirse tanto.
  const order = shuffled(
    POP_CLUES.filter((c) => c.answer.length <= MAX_SIDE),
    seeded('orden', 'crucigrama'),
  );
  const start = ((puzzleNumber(day) - 1) * TARGET_WORDS) % order.length;
  const base = Array.from({ length: WINDOW }, (_, i) => order[(((start + i) % order.length) + order.length) % order.length]!);

  let placed: Placed[] = [];
  for (let attempt = 0; attempt < 20 && placed.length < MIN_WORDS; attempt++) {
    const rng = seeded('crucigrama', day, attempt);
    placed = build(shuffled(base, rng), rng);
  }
  return toGrid(placed);
}

function toGrid(placed: Placed[]): Crossword {
  const len = (p: Placed) => p.word.answer.length - 1;
  const minR = Math.min(...placed.map((p) => p.row));
  const minC = Math.min(...placed.map((p) => p.col));
  const rows = Math.max(...placed.map((p) => p.row + (p.dir === 'V' ? len(p) : 0))) - minR + 1;
  const cols = Math.max(...placed.map((p) => p.col + (p.dir === 'H' ? len(p) : 0))) - minC + 1;

  const solution: (string | null)[] = Array(rows * cols).fill(null);
  const numbers: (number | null)[] = Array(rows * cols).fill(null);
  const norm = placed.map((p) => ({ ...p, row: p.row - minR, col: p.col - minC }));
  for (const p of norm) {
    [...p.word.answer].forEach((ch, k) => {
      const r = p.row + (p.dir === 'V' ? k : 0);
      const c = p.col + (p.dir === 'H' ? k : 0);
      solution[r * cols + c] = ch;
    });
  }

  // Numeración clásica: por orden de lectura de la casilla inicial.
  const starts = [...new Set(norm.map((p) => p.row * cols + p.col))].sort((a, b) => a - b);
  starts.forEach((idx, i) => (numbers[idx] = i + 1));

  const entries: CrossEntry[] = norm
    .map((p) => ({
      num: numbers[p.row * cols + p.col]!,
      dir: p.dir,
      row: p.row,
      col: p.col,
      answer: p.word.answer,
      clue: p.word.clue,
      cells: [...p.word.answer].map((_, k) => (p.row + (p.dir === 'V' ? k : 0)) * cols + p.col + (p.dir === 'H' ? k : 0)),
    }))
    .sort((a, b) => (a.dir === b.dir ? a.num - b.num : a.dir === 'H' ? -1 : 1));

  return { rows, cols, solution, numbers, entries };
}
