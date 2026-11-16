import type { ClientToServerEvents, Role, ServerToClientEvents } from '@abby/shared';
import { io, type Socket } from 'socket.io-client';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Conecta al servidor del juego (mismo origen; en desarrollo pasa por el proxy de Vite). */
export function connectGame(role: Role, key?: string): GameSocket {
  return io({ auth: { role, key } });
}
