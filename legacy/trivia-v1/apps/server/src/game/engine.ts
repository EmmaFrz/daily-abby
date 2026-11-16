import {
  CHOICES,
  emptyTally,
  type ChatStatus,
  type ChatterRank,
  type Choice,
  type GamePhase,
  type PublicGameState,
  type PublicQuestion,
  type Question,
  type RoundResult,
  type Score,
  type Tally,
} from '@abby/shared';

/** Error de regla de juego: el mensaje se muestra tal cual en la consola del host. */
export class GameError extends Error {}

export interface QuestionStartInfo {
  correct: Choice;
  /** Cuánto tiempo puede votar el chat (incluye el retraso del stream). */
  windowMs: number;
}

/** Margen para que los mensajes del chat lleguen por la red cuando su contador ya marcó 0. */
const CHAT_NETWORK_GRACE_MS = 1000;
/** Margen para un toque de Abby justo en el último instante. */
const ABBY_GRACE_MS = 300;
/** Mientras llegan votos, el estado se reenvía como máximo cada X ms (con 1k viewers importa). */
const VOTE_BROADCAST_MS = 250;

type Listener<T> = (payload: T) => void;

class Emitter<T> {
  private listeners = new Set<Listener<T>>();
  on(fn: Listener<T>): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit(payload: T): void {
    for (const fn of this.listeners) fn(payload);
  }
}

interface Vote {
  choice: Choice;
  name: string;
}

/**
 * Motor del versus Abby vs Chat. Es la única fuente de verdad: las pantallas solo reflejan
 * lo que emite `stateChanged`, y la respuesta correcta nunca sale de aquí antes del reveal.
 */
export class GameEngine {
  readonly stateChanged = new Emitter<PublicGameState>();
  readonly questionStarted = new Emitter<QuestionStartInfo>();
  readonly questionEnded = new Emitter<void>();

  private phase: GamePhase = 'lobby';
  private index = -1;
  private deadline: number | null = null;
  private chatDeadline: number | null = null;
  private abbyChoice: Choice | null = null;
  private votes = new Map<string, Vote>();
  private result: RoundResult | null = null;
  private score: Score = { abby: 0, chat: 0 };
  private chatters = new Map<string, ChatterRank>();
  private chat: ChatStatus = { source: 'off', connected: false };
  private lockTimer: ReturnType<typeof setTimeout> | null = null;
  private broadcastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly questions: Question[],
    private readonly streamDelaySec: number,
  ) {
    if (questions.length === 0) throw new Error('El juego necesita al menos una pregunta');
  }

  // ── Acciones del host ────────────────────────────────────────────────

  /** Avanza a la siguiente fase del programa. */
  next(): void {
    switch (this.phase) {
      case 'lobby':
        return this.startQuestion(0);
      case 'question':
        throw new GameError('La pregunta sigue abierta. Espera al contador o usa "Cerrar respuestas ya".');
      case 'locked':
        return this.reveal();
      case 'reveal':
        this.phase = 'scoreboard';
        return this.broadcast();
      case 'scoreboard':
        return this.hasNext() ? this.startQuestion(this.index + 1) : this.finish();
      case 'finished':
        throw new GameError('El juego terminó. Usa "Reiniciar" para jugar otra vez.');
    }
  }

  /** Cierra la pregunta antes de que acabe el contador. */
  lockNow(): void {
    if (this.phase !== 'question') throw new GameError('No hay ninguna pregunta abierta.');
    this.lock();
  }

  reset(): void {
    const wasOpen = this.phase === 'question';
    this.clearLockTimer();
    this.phase = 'lobby';
    this.index = -1;
    this.deadline = null;
    this.chatDeadline = null;
    this.abbyChoice = null;
    this.votes.clear();
    this.result = null;
    this.score = { abby: 0, chat: 0 };
    this.chatters.clear();
    if (wasOpen) this.questionEnded.emit();
    this.broadcast();
  }

  // ── Respuestas ───────────────────────────────────────────────────────

  /** Abby puede cambiar de opinión hasta que el contador llega a 0. */
  answerAbby(choice: Choice): void {
    if (this.phase !== 'question' || this.deadline === null) {
      throw new GameError('No hay ninguna pregunta abierta.');
    }
    if (Date.now() > this.deadline + ABBY_GRACE_MS) throw new GameError('Se acabó el tiempo.');
    this.abbyChoice = choice;
    this.broadcast();
  }

  /** Un voto por usuario y pregunta; si alguien vuelve a votar, cuenta el último. */
  registerVote(userId: string, name: string, choice: Choice): boolean {
    if (this.phase !== 'question' || this.chatDeadline === null) return false;
    if (Date.now() > this.chatDeadline) return false;
    this.votes.set(userId, { choice, name });
    this.scheduleBroadcast();
    return true;
  }

  setChatStatus(status: ChatStatus): void {
    this.chat = status;
    this.broadcast();
  }

  getAbbyChoice(): Choice | null {
    return this.abbyChoice;
  }

  getState(): PublicGameState {
    const q = this.questions[this.index];
    const showQuestion = q !== undefined && this.phase !== 'lobby' && this.phase !== 'finished';
    const showResult = this.phase === 'reveal' || this.phase === 'scoreboard';
    return {
      phase: this.phase,
      question: showQuestion ? toPublic(q, this.index, this.questions.length) : null,
      deadline: this.phase === 'question' ? this.deadline : null,
      serverNow: Date.now(),
      abbyAnswered: this.abbyChoice !== null,
      votes: this.votes.size,
      result: showResult ? this.result : null,
      score: { ...this.score },
      topChatters: this.topChatters(10),
      chat: this.chat,
      streamDelaySec: this.streamDelaySec,
      hasNextQuestion: this.hasNext(),
    };
  }

  // ── Interno ──────────────────────────────────────────────────────────

  private startQuestion(i: number): void {
    const q = this.questions[i];
    if (!q) throw new GameError('No hay más preguntas.');
    this.clearLockTimer();
    const now = Date.now();
    this.index = i;
    this.phase = 'question';
    this.abbyChoice = null;
    this.votes.clear();
    this.result = null;
    this.deadline = now + q.timeLimitSec * 1000;
    // El chat ve el mismo contador pero desplazado por el retraso del stream:
    // cuando a ellos les llega a 0, en tiempo real ya pasaron `streamDelaySec` segundos más.
    this.chatDeadline = this.deadline + this.streamDelaySec * 1000 + CHAT_NETWORK_GRACE_MS;
    this.lockTimer = setTimeout(() => this.lock(), this.chatDeadline - now);
    this.questionStarted.emit({ correct: q.correct, windowMs: this.chatDeadline - now });
    this.broadcast();
  }

  private lock(): void {
    this.clearLockTimer();
    this.phase = 'locked';
    this.questionEnded.emit();
    this.broadcast();
  }

  private reveal(): void {
    const q = this.questions[this.index];
    if (!q) throw new GameError('No hay pregunta para revelar.');

    const tally = emptyTally();
    for (const vote of this.votes.values()) tally[vote.choice]++;
    const chatChoice = majority(tally);
    const abbyScored = this.abbyChoice === q.correct;
    const chatScored = chatChoice === q.correct;
    if (abbyScored) this.score.abby++;
    if (chatScored) this.score.chat++;

    for (const [userId, vote] of this.votes) {
      if (vote.choice !== q.correct) continue;
      const entry = this.chatters.get(userId) ?? { name: vote.name, correct: 0 };
      entry.name = vote.name;
      entry.correct++;
      this.chatters.set(userId, entry);
    }

    this.result = {
      correct: q.correct,
      abbyChoice: this.abbyChoice,
      chatChoice,
      tally,
      voters: this.votes.size,
      abbyScored,
      chatScored,
      explanation: q.explanation,
    };
    this.phase = 'reveal';
    this.broadcast();
  }

  private finish(): void {
    this.phase = 'finished';
    this.broadcast();
  }

  private hasNext(): boolean {
    return this.index + 1 < this.questions.length;
  }

  private topChatters(limit: number): ChatterRank[] {
    return [...this.chatters.values()]
      .sort((a, b) => b.correct - a.correct || a.name.localeCompare(b.name))
      .slice(0, limit);
  }

  private clearLockTimer(): void {
    if (this.lockTimer) clearTimeout(this.lockTimer);
    this.lockTimer = null;
  }

  private scheduleBroadcast(): void {
    if (this.broadcastTimer) return;
    this.broadcastTimer = setTimeout(() => this.broadcast(), VOTE_BROADCAST_MS);
  }

  private broadcast(): void {
    if (this.broadcastTimer) clearTimeout(this.broadcastTimer);
    this.broadcastTimer = null;
    this.stateChanged.emit(this.getState());
  }
}

/** Opción más votada. Si hay empate en el primer puesto (o nadie votó), el chat no tiene respuesta. */
function majority(tally: Tally): Choice | null {
  let best: Choice | null = null;
  let bestCount = 0;
  let tie = false;
  for (const choice of CHOICES) {
    const count = tally[choice];
    if (count > bestCount) {
      best = choice;
      bestCount = count;
      tie = false;
    } else if (count === bestCount && count > 0) {
      tie = true;
    }
  }
  return tie ? null : best;
}

function toPublic(q: Question, index: number, total: number): PublicQuestion {
  return {
    id: q.id,
    category: q.category,
    text: q.text,
    options: q.options,
    timeLimitSec: q.timeLimitSec,
    number: index + 1,
    total,
  };
}
