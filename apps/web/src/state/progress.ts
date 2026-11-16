import { withAchievements } from '../data/achievements';
import { addDays } from '../lib/daily';
import { META, MINIGAMES } from '../minigames/meta';
import type { GameRecord, Outcome, Run, SaveState } from './types';

export const emptyRecord = (): GameRecord => ({ played: 0, won: 0, streak: 0, maxStreak: 0, lastWinDay: null, best: null });

export function createSave(today: string): SaveState {
  return {
    version: 2,
    startedOn: today,
    runs: {},
    records: {},
    achievements: [],
    flags: [],
    streak: 0,
    bestStreak: 0,
    lastPlayDay: null,
    perfectDays: 0,
    lastPerfectDay: null,
    totalWins: 0,
  };
}

/** Partida de hoy (o una nueva si la guardada es de otro día). */
export function currentRun<T>(s: SaveState, id: string, today: string, init: () => T): Run<T> {
  const saved = s.runs[id];
  if (saved && saved.day === today) return saved as Run<T>;
  return { day: today, status: 'playing', data: init() };
}

/** Una racha solo sigue viva si se jugó hoy o ayer. */
export function liveStreak(streak: number, lastDay: string | null, today: string): number {
  return lastDay === today || lastDay === addDays(today, -1) ? streak : 0;
}

export function isDone(s: SaveState, id: string, today: string): boolean {
  const r = s.runs[id];
  return !!r && r.day === today && r.status !== 'playing';
}

export function doneToday(s: SaveState, today: string): number {
  return MINIGAMES.filter((m) => isDone(s, m.id, today)).length;
}

export function finishRun<T>(s: SaveState, id: string, today: string, data: T, o: Outcome): SaveState {
  const yesterday = addDays(today, -1);
  const rec = s.records[id] ?? emptyRecord();
  const streak = o.won ? (rec.lastWinDay === yesterday ? rec.streak + 1 : 1) : 0;
  const meta = META[id];
  let best = rec.best;
  if (o.won && o.score != null) {
    best = best == null ? o.score : meta?.lowerIsBetter ? Math.min(best, o.score) : Math.max(best, o.score);
  }

  let next: SaveState = {
    ...s,
    runs: {
      ...s.runs,
      [id]: { day: today, status: o.won ? 'won' : 'lost', data, share: o.share, summary: o.summary, score: o.score },
    },
    records: {
      ...s.records,
      [id]: {
        played: rec.played + 1,
        won: rec.won + (o.won ? 1 : 0),
        streak,
        maxStreak: Math.max(rec.maxStreak, streak),
        lastWinDay: o.won ? today : rec.lastWinDay,
        best,
      },
    },
    flags: [...new Set([...s.flags, ...(o.flags ?? [])])],
    totalWins: s.totalWins + (o.won ? 1 : 0),
  };

  if (next.lastPlayDay !== today) {
    const dayStreak = next.lastPlayDay === yesterday ? next.streak + 1 : 1;
    next = { ...next, lastPlayDay: today, streak: dayStreak, bestStreak: Math.max(next.bestStreak, dayStreak) };
  }

  const perfect = MINIGAMES.every((m) => next.runs[m.id]?.day === today && next.runs[m.id]?.status === 'won');
  if (perfect && next.lastPerfectDay !== today) next = { ...next, perfectDays: next.perfectDays + 1, lastPerfectDay: today };

  return withAchievements(next);
}
