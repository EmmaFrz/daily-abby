import type { GameRecord, Run, SaveState, Status } from './types';

/**
 * La partida sale del localStorage, que se puede editar a mano (o romperse).
 * Aquí se comprueba su forma para que unos datos rotos no tumben la web al cargar:
 * lo que no encaja se descarta y lo demás se conserva tal cual.
 */

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

/** Días con el formato de todayKey(): AAAA-MM-DD. */
const day = (v: unknown): string | null => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : [];

const STATUSES: readonly Status[] = ['playing', 'won', 'lost'];
/** Claves que no se copian nunca, para no tocar prototipos. */
const RESERVED = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeRun(v: unknown): Run | null {
  if (!isObject(v)) return null;
  const d = day(v.day);
  const status = STATUSES.find((s) => s === v.status);
  if (!d || !status) return null;
  const run: Run = { day: d, status, data: v.data };
  if (typeof v.share === 'string') run.share = v.share;
  if (typeof v.summary === 'string') run.summary = v.summary;
  if (typeof v.score === 'number' && Number.isFinite(v.score)) run.score = v.score;
  return run;
}

function sanitizeRecord(v: unknown): GameRecord | null {
  if (!isObject(v)) return null;
  return {
    played: count(v.played),
    won: count(v.won),
    streak: count(v.streak),
    maxStreak: count(v.maxStreak),
    lastWinDay: day(v.lastWinDay),
    best: typeof v.best === 'number' && Number.isFinite(v.best) ? v.best : null,
  };
}

function entries<T>(v: unknown, sanitizeItem: (item: unknown) => T | null): Record<string, T> {
  const out: Record<string, T> = {};
  if (!isObject(v)) return out;
  for (const [key, value] of Object.entries(v)) {
    if (RESERVED.has(key)) continue;
    const item = sanitizeItem(value);
    if (item) out[key] = item;
  }
  return out;
}

/** Devuelve la partida validada, o null si no es una partida v2. */
export function sanitizeSave(raw: unknown, today: string): SaveState | null {
  if (!isObject(raw) || raw.version !== 2) return null;
  return {
    version: 2,
    startedOn: day(raw.startedOn) ?? today,
    runs: entries(raw.runs, sanitizeRun),
    records: entries(raw.records, sanitizeRecord),
    achievements: strings(raw.achievements),
    flags: strings(raw.flags),
    streak: count(raw.streak),
    bestStreak: count(raw.bestStreak),
    lastPlayDay: day(raw.lastPlayDay),
    perfectDays: count(raw.perfectDays),
    lastPerfectDay: day(raw.lastPerfectDay),
    totalWins: count(raw.totalWins),
  };
}
