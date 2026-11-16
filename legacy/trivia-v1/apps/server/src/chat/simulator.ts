import { CHOICES, type Choice } from '@abby/shared';
import type { GameEngine, QuestionStartInfo } from '../game/engine';
import type { ChatSource, MessageHandler, StatusHandler } from './types';

/**
 * Chat falso para probar sin estar en directo: en cada pregunta, una parte de los
 * espectadores vota durante la ventana del chat, con un % de acierto aleatorio por ronda.
 */
export class ChatSimulator implements ChatSource {
  readonly kind = 'simulator' as const;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private unsubscribe: Array<() => void> = [];

  constructor(
    private readonly engine: GameEngine,
    private readonly viewers: number,
    private readonly onMessage: MessageHandler,
    private readonly onStatus: StatusHandler,
  ) {}

  start(): void {
    this.onStatus({ source: 'simulator', connected: true, detail: `${this.viewers} espectadores simulados` });
    this.unsubscribe = [
      this.engine.questionStarted.on((info) => this.simulateRound(info)),
      this.engine.questionEnded.on(() => this.clear()),
    ];
  }

  stop(): void {
    for (const off of this.unsubscribe) off();
    this.unsubscribe = [];
    this.clear();
  }

  private simulateRound({ correct, windowMs }: QuestionStartInfo): void {
    this.clear();
    const knowledge = 0.25 + Math.random() * 0.45; // qué parte del chat "sabe" la respuesta
    const turnout = 0.4 + Math.random() * 0.4; //     qué parte del chat participa
    const voters = Math.round(this.viewers * turnout);

    for (let i = 0; i < voters; i++) {
      const choice: Choice =
        Math.random() < knowledge ? correct : CHOICES[Math.floor(Math.random() * CHOICES.length)]!;
      // Mezcla formatos para ejercitar el parser: "b", "2", "!b"
      const roll = Math.random();
      const text = roll < 0.6 ? choice.toLowerCase() : roll < 0.85 ? String(CHOICES.indexOf(choice) + 1) : `!${choice}`;
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        this.onMessage({ userId: `sim-${i}`, name: `espectador_${String(i + 1).padStart(3, '0')}`, text });
      }, Math.random() * windowMs * 0.95);
      this.timers.add(timer);
    }
  }

  private clear(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
  }
}
