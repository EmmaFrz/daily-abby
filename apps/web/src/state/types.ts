export type Status = 'playing' | 'won' | 'lost';

/** Partida de hoy de un minijuego. `data` es el estado propio de cada juego. */
export interface Run<T = unknown> {
  day: string;
  status: Status;
  data: T;
  share?: string;
  summary?: string;
  score?: number;
}

export interface GameRecord {
  played: number;
  won: number;
  streak: number;
  maxStreak: number;
  lastWinDay: string | null;
  best: number | null;
}

/** Lo que devuelve un minijuego cuando la partida termina. */
export interface Outcome {
  won: boolean;
  summary: string;
  /** Cuadritos/emoji para compartir (sin cabecera). */
  share: string;
  score?: number;
  /** Hazañas especiales que desbloquean logros. */
  flags?: string[];
}

export interface SaveState {
  version: 2;
  startedOn: string;
  runs: Record<string, Run>;
  records: Record<string, GameRecord>;
  achievements: string[];
  flags: string[];
  /** Días seguidos completando al menos un reto. */
  streak: number;
  bestStreak: number;
  lastPlayDay: string | null;
  perfectDays: number;
  lastPerfectDay: string | null;
  totalWins: number;
}
