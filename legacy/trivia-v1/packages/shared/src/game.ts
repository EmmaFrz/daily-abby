/** Opciones de respuesta. En el chat se aceptan A-D o 1-4. */
export const CHOICES = ['A', 'B', 'C', 'D'] as const;
export type Choice = (typeof CHOICES)[number];
export type Tally = Record<Choice, number>;

export const emptyTally = (): Tally => ({ A: 0, B: 0, C: 0, D: 0 });

export const isChoice = (value: unknown): value is Choice =>
  typeof value === 'string' && (CHOICES as readonly string[]).includes(value);

/**
 * Máquina de estados del programa:
 * lobby → question → locked → reveal → scoreboard → (siguiente question | finished)
 */
export type GamePhase =
  | 'lobby' //      esperando a que empiece
  | 'question' //   pregunta en pantalla: Abby y el chat responden
  | 'locked' //     se acabó el tiempo, respuestas cerradas
  | 'reveal' //     se muestra la correcta, qué eligió cada uno y quién suma
  | 'scoreboard' // marcador entre preguntas
  | 'finished'; //  fin del juego

/** Pregunta completa. Solo vive en el servidor (y más adelante en el panel admin). */
export interface Question {
  id: string;
  category: string;
  text: string;
  options: Record<Choice, string>;
  correct: Choice;
  timeLimitSec: number;
  /** Dato curioso que se muestra al revelar. */
  explanation?: string;
}

/** Lo que reciben las pantallas: nunca incluye la respuesta correcta antes del reveal. */
export interface PublicQuestion extends Omit<Question, 'correct' | 'explanation'> {
  number: number; // 1-based
  total: number;
}

export interface RoundResult {
  correct: Choice;
  abbyChoice: Choice | null;
  /** Opción más votada por el chat. null si nadie votó o hubo empate. */
  chatChoice: Choice | null;
  tally: Tally;
  voters: number;
  abbyScored: boolean;
  chatScored: boolean;
  explanation?: string;
}

export interface Score {
  abby: number;
  chat: number;
}

/** Ranking individual de chatters (aciertos personales, aparte del versus). */
export interface ChatterRank {
  name: string;
  correct: number;
}

export type ChatSourceKind = 'off' | 'simulator' | 'twitch';

export interface ChatStatus {
  source: ChatSourceKind;
  connected: boolean;
  channel?: string;
  detail?: string;
}

export interface PublicGameState {
  phase: GamePhase;
  question: PublicQuestion | null;
  /**
   * Momento (epoch ms, reloj del servidor) en que el contador en pantalla llega a 0.
   * Es el cierre para Abby. El chat ve ese mismo contador con el retraso del stream,
   * así que su cierre real es deadline + streamDelaySec.
   */
  deadline: number | null;
  /** Hora del servidor al emitir el estado; los clientes la usan para sincronizar su reloj. */
  serverNow: number;
  abbyAnswered: boolean;
  /** Cuántos votos van (sin repartir por opción, para que nadie copie a nadie). */
  votes: number;
  result: RoundResult | null;
  score: Score;
  topChatters: ChatterRank[];
  chat: ChatStatus;
  streamDelaySec: number;
  hasNextQuestion: boolean;
}
