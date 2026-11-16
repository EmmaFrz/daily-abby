import type { ChatSourceKind, Choice, PublicGameState } from './game';

/**
 * Quién se conecta:
 * - stage: la pantalla del juego (pública, solo mira)
 * - host:  consola que controla el ritmo del programa (requiere clave)
 * - abby:  el pad privado donde Abby responde (requiere clave)
 */
export type Role = 'stage' | 'host' | 'abby';

export interface HandshakeAuth {
  role: Role;
  key?: string;
}

/** Mensaje de error del servidor cuando la clave no es válida. */
export const AUTH_ERROR = 'Clave incorrecta';

export type HostCommand =
  | { type: 'next' }
  | { type: 'lockNow' }
  | { type: 'reset' }
  | { type: 'setChatSource'; source: ChatSourceKind };

export type AckResponse = { ok: true } | { ok: false; error: string };
export type Ack = (res: AckResponse) => void;

export interface ServerToClientEvents {
  state: (state: PublicGameState) => void;
  /** Solo se envía al pad de Abby: su propia elección. */
  'abby:choice': (choice: Choice | null) => void;
}

export interface ClientToServerEvents {
  'host:command': (cmd: HostCommand, ack: Ack) => void;
  'abby:answer': (choice: Choice, ack: Ack) => void;
}
