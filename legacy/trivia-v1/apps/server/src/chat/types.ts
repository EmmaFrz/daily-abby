import type { ChatSourceKind, ChatStatus } from '@abby/shared';

export interface ChatMessage {
  userId: string;
  name: string;
  text: string;
}

export type MessageHandler = (msg: ChatMessage) => void;
export type StatusHandler = (status: ChatStatus) => void;

/** Cualquier origen de mensajes de chat: Twitch real, simulador, (más adelante) EventSub. */
export interface ChatSource {
  readonly kind: ChatSourceKind;
  start(): void;
  stop(): void;
}
