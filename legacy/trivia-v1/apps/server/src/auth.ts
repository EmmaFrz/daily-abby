import { createHash, timingSafeEqual } from 'node:crypto';

/** Fallos permitidos por IP en cada ventana antes de dejar de comprobar sus claves. */
const MAX_FAILS = 20;
const FAIL_WINDOW_MS = 10 * 60 * 1000;
/** Tope de IPs recordadas (se olvidan primero las más antiguas). */
const MAX_TRACKED = 5000;

const digest = (s: string) => createHash('sha256').update(s).digest();

/**
 * Comprueba la clave de /host y /abby en tiempo constante (comparar con === filtra
 * cuántos caracteres coinciden) y frena a quien prueba muchas claves seguidas.
 */
export function createKeyChecker(secret: string) {
  const expected = digest(secret);
  const failures = new Map<string, number[]>();

  return function checkKey(key: unknown, ip: string, now = Date.now()): boolean {
    const recent = (failures.get(ip) ?? []).filter((t) => now - t < FAIL_WINDOW_MS);
    if (recent.length >= MAX_FAILS) return false; // bloqueada un rato, aunque acierte

    if (typeof key === 'string' && timingSafeEqual(digest(key), expected)) {
      failures.delete(ip);
      return true;
    }

    recent.push(now);
    failures.delete(ip); // reinsertar = la más reciente
    failures.set(ip, recent);
    for (const oldest of failures.keys()) {
      if (failures.size <= MAX_TRACKED) break;
      failures.delete(oldest);
    }
    return false;
  };
}
