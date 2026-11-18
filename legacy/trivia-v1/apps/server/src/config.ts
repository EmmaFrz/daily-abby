import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { ChatSourceKind } from '@abby/shared';

// Carga el .env de la raíz del repo si existe (en producción se usan variables de entorno reales).
try {
  process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)));
} catch {
  // sin .env: valores por defecto
}

/** Clave de ejemplo del .env.example: nunca se acepta como clave real. */
export const DEFAULT_HOST_KEY = 'cambia-esta-clave';
/** Por debajo de esta longitud se avisa de que la clave es débil. */
export const MIN_HOST_KEY_LENGTH = 12;

const configuredKey = process.env.HOST_KEY?.trim() ?? '';
/**
 * Sin HOST_KEY (o con la de ejemplo) se genera una clave aleatoria en cada arranque y se
 * muestra en la consola: nunca queda una clave conocida por todos.
 */
export const hostKeyGenerated = !configuredKey || configuredKey === DEFAULT_HOST_KEY;

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(value) ? value : fallback;
}

function chatSource(raw: string | undefined): ChatSourceKind {
  return raw === 'twitch' || raw === 'off' || raw === 'simulator' ? raw : 'simulator';
}

export const config = {
  port: num('PORT', 3001),
  hostKey: hostKeyGenerated ? randomBytes(18).toString('base64url') : configuredKey,
  twitchChannel: (process.env.TWITCH_CHANNEL || 'littleragergirl').toLowerCase().replace(/^#/, ''),
  chatSource: chatSource(process.env.CHAT_SOURCE),
  streamDelaySec: num('STREAM_DELAY_SEC', 4),
  simulatedViewers: num('SIM_VIEWERS', 300),
  /** Build del frontend; si existe, este servidor también lo sirve (un solo deploy). */
  webDist: fileURLToPath(new URL('../../web/dist', import.meta.url)),
};
