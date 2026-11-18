// Función serverless de Vercel: recibe un reporte de bug desde la web y lo
// reenvía a un canal de Discord mediante un webhook.
//
// La URL del webhook vive SOLO en el servidor, en la variable de entorno
// DISCORD_WEBHOOK_URL (Vercel → Project → Settings → Environment Variables).
//
// Defensas, de la más barata a la más cara:
//  1. Solo se aceptan peticiones hechas desde la propia web: Origin y
//     Sec-Fetch-Site del mismo dominio y cuerpo application/json. Así otra página
//     no puede hacer que el navegador de un visitante envíe reportes por ella.
//  2. Cuerpo pequeño; cada campo se valida y se limpia (sin caracteres de
//     control ni invisibles, sin acentos graves).
//  3. Límite por IP y límite global por ventana de tiempo. Se comparten entre
//     instancias con el Runtime Cache de Vercel y hay respaldo en memoria.
//  4. El mismo texto no se reenvía dos veces seguidas.
//  5. En Discord, el texto del usuario va dentro de bloques de código: no puede
//     crear enlaces disfrazados, menciones ni formato.

import { createHash } from 'node:crypto';
import { getCache, ipAddress } from '@vercel/functions';

const MAX_BODY_BYTES = 16 * 1024;
const MIN_DESC = 5;
const MAX_DESC = 1000;
const MAX_DESC_LINES = 30;
const MAX_CONTACT = 80;
const MAX_USER_AGENT = 200;

const WINDOW_MS = 10 * 60 * 1000;
/** Reportes por IP en cada ventana. */
const MAX_PER_IP = 5;
/** Reportes en total en cada ventana: frena una inundación desde muchas IPs. */
const MAX_GLOBAL = 50;
/** El mismo texto no se reenvía durante este tiempo. */
const DUPLICATE_TTL_MS = 60 * 60 * 1000;

const DISCORD_TIMEOUT_MS = 8000;
const CACHE_TIMEOUT_MS = 800;
/** Tope de entradas en memoria (por IP y textos enviados). */
const MAX_TRACKED = 5000;

class HttpError extends Error {
  /** @param {number} status @param {string} message */
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** @param {number} status @param {unknown} body */
const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });

/** @param {string} s */
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// ─── 1. Solo desde la propia web ────────────────────────────────────────────

/**
 * Los navegadores siempre envían Origin en un POST, y Sec-Fetch-Site cuando lo
 * soportan. Una página de otro dominio no puede falsificar ninguno de los dos.
 * @param {Request} request
 */
function isSameOrigin(request) {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return false;

  const origin = request.headers.get('origin');
  if (!origin) return site === 'same-origin';

  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const hosts = new Set();
  try {
    hosts.add(new URL(request.url).host);
  } catch {
    /* URL relativa: valen las cabeceras */
  }
  for (const name of ['host', 'x-forwarded-host']) {
    const value = request.headers.get(name)?.split(',')[0]?.trim();
    if (value) hosts.add(value);
  }
  return hosts.has(originHost);
}

/**
 * Exigir JSON obliga a otros dominios a pasar por una consulta previa de CORS,
 * que esta función no autoriza (OPTIONS responde 405).
 * @param {Request} request
 */
const isJson = (request) =>
  (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase() === 'application/json';

/** @param {Request} request */
async function readBody(request) {
  const declared = Number(request.headers.get('content-length'));
  if (declared > MAX_BODY_BYTES) throw new HttpError(413, 'El reporte es demasiado largo.');

  let raw;
  try {
    raw = await request.text();
  } catch {
    throw new HttpError(400, 'Petición inválida.');
  }
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw new HttpError(413, 'El reporte es demasiado largo.');

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Petición inválida.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpError(400, 'Petición inválida.');
  return /** @type {Record<string, unknown>} */ (data);
}

// ─── 2. Limpieza de campos ──────────────────────────────────────────────────

/** Caracteres de control (menos tabulador y salto de línea). */
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
/** Invisibles y de dirección de texto: sirven para disfrazar lo que se lee. */
const INVISIBLE = /[\u00AD\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\u3164\uFEFF\uFFA0]/g;

/**
 * @param {unknown} value
 * @param {number} max longitud máxima en caracteres
 * @param {boolean} [multiline]
 */
function sanitize(value, max, multiline = false) {
  if (typeof value !== 'string') return '';
  let s = value
    .replace(/\r\n?|[\u2028\u2029]/g, '\n')
    .replace(CONTROL, '')
    .replace(INVISIBLE, '')
    // Sin acentos graves no se puede cerrar el bloque de código de Discord.
    .replace(/`/g, 'ˋ');

  if (multiline) {
    s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    const lines = s.split('\n');
    if (lines.length > MAX_DESC_LINES) {
      s = [...lines.slice(0, MAX_DESC_LINES - 1), lines.slice(MAX_DESC_LINES - 1).join(' ')].join('\n');
    }
  } else {
    s = s.replace(/\s+/g, ' ');
  }

  s = s.trim();
  const chars = Array.from(s); // por puntos de código: no parte emojis por la mitad
  return chars.length > max ? chars.slice(0, max).join('').trimEnd() : s;
}

/** `#diarios`, `#diarios/heardle-pop`, `#logros`… */
const PAGE = /^#[a-z0-9][a-z0-9/_-]{0,60}$/i;
const VIEWPORT = /^\d{1,5}×\d{1,5}$/;

// ─── 3 y 4. Límites y duplicados ────────────────────────────────────────────

const cache = getCache({ namespace: 'bug-report' });

/** @template T @param {Promise<T>} promise @returns {Promise<T>} */
async function withTimeout(promise) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), CACHE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Si el caché compartido falla o tarda, se sigue solo con los límites en memoria. */
async function sharedGet(/** @type {string} */ key) {
  try {
    return await withTimeout(cache.get(key));
  } catch {
    return null;
  }
}

async function sharedSet(/** @type {string} */ key, /** @type {unknown} */ value, /** @type {number} */ ttlMs) {
  try {
    await withTimeout(cache.set(key, value, { ttl: Math.ceil(ttlMs / 1000), name: '' }));
  } catch {
    /* sin caché compartido: queda el límite en memoria */
  }
}

/** @param {unknown} v */
const count = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Ventana deslizante en memoria (por instancia). @type {Map<string, number[]>} */
const ipHits = new Map();
/** @type {number[]} */
let globalHits = [];
/** Textos enviados o en camino → caducidad (ms). @type {Map<string, number>} */
const sentTexts = new Map();

/** @param {number[]} list @param {number} now */
const recent = (list, now) => list.filter((t) => now - t < WINDOW_MS);

/** Recorta un Map por las entradas más antiguas (el orden de inserción). @param {Map<string, unknown>} map */
function trim(map) {
  for (const key of map.keys()) {
    if (map.size <= MAX_TRACKED) break;
    map.delete(key);
  }
}

const PER_IP_ERROR = 'Has enviado muchos reportes seguidos. Prueba en unos minutos.';
const GLOBAL_ERROR = 'Estamos recibiendo muchos reportes ahora mismo. Prueba en unos minutos.';

/**
 * Cola de la instancia para los contadores compartidos. Leer, sumar y escribir no es
 * atómico: sin la cola, dos peticiones simultáneas leerían el mismo valor y se perdería
 * un incremento.
 */
let sharedQueue = Promise.resolve();

/** @template T @param {() => Promise<T>} task @returns {Promise<T>} */
function serialized(task) {
  const run = sharedQueue.then(task);
  sharedQueue = run.then(
    () => {},
    () => {},
  );
  return run;
}

/** Cuenta el reporte o lanza 429 si se pasa de algún límite. @param {string} ipKey */
async function enforceLimits(ipKey) {
  // 1. En memoria, sin ningún await entre comprobar y apuntar: una ráfaga de peticiones
  //    simultáneas que llega a la misma instancia no puede colarse entera.
  const now = Date.now();
  const mine = recent(ipHits.get(ipKey) ?? [], now);
  globalHits = recent(globalHits, now);
  if (mine.length >= MAX_PER_IP) throw new HttpError(429, PER_IP_ERROR);
  if (globalHits.length >= MAX_GLOBAL) throw new HttpError(429, GLOBAL_ERROR);
  mine.push(now);
  ipHits.delete(ipKey); // reinsertar = el más reciente; se recortan los más antiguos
  ipHits.set(ipKey, mine);
  trim(ipHits);
  globalHits.push(now);

  // 2. Contadores compartidos por ventana fija: todas las instancias ven los mismos.
  //    Si el caché falla o tarda, queda el límite en memoria.
  await serialized(async () => {
    const win = Math.floor(Date.now() / WINDOW_MS);
    const ipSlot = `ip:${ipKey}:${win}`;
    const allSlot = `all:${win}`;
    const [ipCount, allCount] = (await Promise.all([sharedGet(ipSlot), sharedGet(allSlot)])).map(count);
    if (ipCount >= MAX_PER_IP) throw new HttpError(429, PER_IP_ERROR);
    if (allCount >= MAX_GLOBAL) throw new HttpError(429, GLOBAL_ERROR);
    await Promise.all([sharedSet(ipSlot, ipCount + 1, 2 * WINDOW_MS), sharedSet(allSlot, allCount + 1, 2 * WINDOW_MS)]);
  });
}

/**
 * Aparta el texto antes de enviarlo (también sin await de por medio). Devuelve false si
 * ya se envió o se está enviando. @param {string} textKey
 */
async function reserveText(textKey) {
  const now = Date.now();
  for (const [key, until] of sentTexts) if (until <= now) sentTexts.delete(key);
  if (sentTexts.has(textKey)) return false;
  sentTexts.set(textKey, now + DUPLICATE_TTL_MS);
  trim(sentTexts);
  return (await sharedGet(`dup:${textKey}`)) == null;
}

// ─── 5. Mensaje para Discord ────────────────────────────────────────────────

/** Texto inerte: dentro de un bloque de código no hay enlaces, menciones ni formato. @param {string} s */
const codeBlock = (s) => '```text\n' + s + '\n```';
/** @param {string} s */
const inlineCode = (s) => '`' + s + '`';

/** @param {Request} request */
async function handle(request) {
  if (!isSameOrigin(request)) throw new HttpError(403, 'Los reportes solo se pueden enviar desde la web.');
  if (!isJson(request)) throw new HttpError(415, 'Petición inválida.');

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.error('report-bug: falta la variable DISCORD_WEBHOOK_URL');
    throw new HttpError(503, 'Los reportes no están disponibles ahora mismo.');
  }

  const data = await readBody(request);

  // Honeypot: campo oculto que solo rellenan los bots. Se finge éxito.
  if (sanitize(data.website, 200)) return json(200, { ok: true });

  const description = sanitize(data.description, MAX_DESC, true);
  if (Array.from(description).length < MIN_DESC) {
    throw new HttpError(400, 'Describe el problema con un poco más de detalle.');
  }
  const contact = sanitize(data.contact, MAX_CONTACT);
  const pageRaw = typeof data.page === 'string' ? data.page.trim() : '';
  const page = PAGE.test(pageRaw) ? pageRaw : '';
  const viewportRaw = typeof data.viewport === 'string' ? data.viewport.trim() : '';
  const viewport = VIEWPORT.test(viewportRaw) ? viewportRaw : '';
  // El navegador lo manda en su cabecera: no hace falta fiarse del cuerpo.
  const userAgent = sanitize(request.headers.get('user-agent'), MAX_USER_AGENT);

  const ip = ipAddress(request) ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconocida';
  await enforceLimits(sha256(`ip:${ip}`).slice(0, 32));

  const textKey = sha256(description.toLowerCase().replace(/\s+/g, ' ')).slice(0, 32);
  if (!(await reserveText(textKey))) return json(200, { ok: true }); // ya está (o va camino) del canal

  try {
    await sendToDiscord(webhook, { description, contact, page, viewport, userAgent });
  } catch (error) {
    sentTexts.delete(textKey); // no llegó: que se pueda volver a intentar
    throw error;
  }
  await sharedSet(`dup:${textKey}`, 1, DUPLICATE_TTL_MS);
  return json(200, { ok: true });
}

/**
 * @param {string} webhook
 * @param {{ description: string; contact: string; page: string; viewport: string; userAgent: string }} report
 */
async function sendToDiscord(webhook, { description, contact, page, viewport, userAgent }) {
  const fields = [
    contact && { name: 'Quién reporta', value: inlineCode(contact), inline: true },
    page && { name: 'Sección', value: inlineCode(page), inline: true },
    viewport && { name: 'Pantalla', value: inlineCode(viewport), inline: true },
    userAgent && { name: 'Navegador', value: inlineCode(userAgent) },
  ].filter(Boolean);

  let res;
  try {
    res = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'Reportes de bugs · Abby Diarios',
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: '🐞 Nuevo reporte de bug',
            description: codeBlock(description),
            color: 0xff3d97,
            fields,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
      signal: AbortSignal.timeout(DISCORD_TIMEOUT_MS),
    });
  } catch (error) {
    console.error('report-bug: Discord no respondió', error instanceof Error ? error.name : error);
    throw new HttpError(502, 'No se pudo enviar el reporte. Prueba de nuevo más tarde.');
  }
  if (!res.ok) {
    console.error('report-bug: Discord respondió', res.status);
    throw new HttpError(502, 'No se pudo enviar el reporte. Prueba de nuevo más tarde.');
  }
}

/** @param {Request} request */
export async function POST(request) {
  try {
    return await handle(request);
  } catch (error) {
    if (error instanceof HttpError) return json(error.status, { error: error.message });
    console.error('report-bug: error inesperado', error);
    return json(500, { error: 'No se pudo enviar el reporte.' });
  }
}
