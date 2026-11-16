import { fileURLToPath } from 'node:url';
import type { ChatSourceKind } from '@abby/shared';

// Carga el .env de la raíz del repo si existe (en producción se usan variables de entorno reales).
try {
  process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)));
} catch {
  // sin .env: valores por defecto
}

export const DEFAULT_HOST_KEY = 'cambia-esta-clave';

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
  hostKey: process.env.HOST_KEY || DEFAULT_HOST_KEY,
  twitchChannel: (process.env.TWITCH_CHANNEL || 'littleragergirl').toLowerCase().replace(/^#/, ''),
  chatSource: chatSource(process.env.CHAT_SOURCE),
  streamDelaySec: num('STREAM_DELAY_SEC', 4),
  simulatedViewers: num('SIM_VIEWERS', 300),
  /** Build del frontend; si existe, este servidor también lo sirve (un solo deploy). */
  webDist: fileURLToPath(new URL('../../web/dist', import.meta.url)),
};
