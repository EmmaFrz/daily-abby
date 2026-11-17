/**
 * Todo lo "diario" sale de aquí: la fecha local del jugador decide el puzzle,
 * el evento y las tendencias. Con la misma fecha, todos ven lo mismo.
 */

const OFFSET_KEY = 'abby-day-offset';
const DAY_MS = 86_400_000;

/** Día 1 de los puzzles numerados (#1, #2…). */
export const EPOCH = '2026-11-01';

/** Desfase de días solo para pruebas (modo dev). */
export function dayOffset(): number {
  try {
    return Number(localStorage.getItem(OFFSET_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function setDayOffset(days: number): void {
  try {
    localStorage.setItem(OFFSET_KEY, String(days));
  } catch {
    /* sin almacenamiento: el desfase simplemente no persiste */
  }
}

export function now(): Date {
  return new Date(Date.now() + dayOffset() * DAY_MS);
}

const pad = (n: number) => String(n).padStart(2, '0');

export function todayKey(d: Date = now()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseKey(key: string): number {
  const [y = 1970, m = 1, d = 1] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  return new Date(parseKey(key) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseKey(to) - parseKey(from)) / DAY_MS);
}

export function puzzleNumber(key: string): number {
  return daysBetween(EPOCH, key) + 1;
}

/** Día del año (1 de enero = 1, 31 de diciembre = 365 o 366): es el número del sobre del día. */
export function dayOfYear(key: string): number {
  return daysBetween(`${key.slice(0, 4)}-01-01`, key) + 1;
}

export function msUntilNextDay(): number {
  const n = now();
  const next = new Date(n);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - n.getTime();
}

/** Hash FNV-1a de 32 bits. */
export function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Generador pseudoaleatorio con semilla (mulberry32). */
export function seeded(...parts: (string | number)[]): () => number {
  let a = hash(parts.join(':'));
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Elige el elemento del día recorriendo una permutación fija de la lista,
 * así no se repite nada hasta haber pasado por todos.
 */
export function dailyPick<T>(list: readonly T[], key: string, salt: string): T {
  const order = shuffled(list, seeded('orden', salt));
  const n = puzzleNumber(key) - 1;
  const len = order.length;
  return order[((n % len) + len) % len]!;
}
