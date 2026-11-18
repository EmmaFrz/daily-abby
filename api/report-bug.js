// Función serverless de Vercel: recibe un reporte de bug desde la web y lo
// reenvía a un canal de Discord mediante un webhook.
//
// La URL del webhook vive SOLO en el servidor, en la variable de entorno
// DISCORD_WEBHOOK_URL (Vercel → Project → Settings → Environment Variables).
// Así nadie puede copiarla desde el navegador y spamear el canal.

const MAX_DESC = 1000;
const MAX_CONTACT = 80;
const MAX_FIELD = 200;

// Límite sencillo por IP (vive mientras la instancia siga caliente).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Evita que el texto del usuario rompa el formato o haga menciones. */
const safe = (s) => s.replace(/@(everyone|here)/gi, '@​$1').replace(/```/g, "'''");

/** @param {Request} request */
export async function POST(request) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return json(500, { error: 'El webhook de Discord no está configurado.' });

  let data;
  try {
    data = await request.json();
  } catch {
    return json(400, { error: 'Petición inválida.' });
  }

  // Honeypot: campo oculto que solo rellenan los bots.
  if (clean(data?.website, 200)) return json(200, { ok: true });

  const description = clean(data?.description, MAX_DESC);
  if (description.length < 5) return json(400, { error: 'Describe el problema con un poco más de detalle.' });

  const ip = (request.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim();
  if (rateLimited(ip)) return json(429, { error: 'Has enviado muchos reportes seguidos. Prueba en unos minutos.' });

  const contact = clean(data?.contact, MAX_CONTACT);
  const page = clean(data?.page, MAX_FIELD);
  const userAgent = clean(data?.userAgent, MAX_FIELD);
  const viewport = clean(data?.viewport, 40);

  const fields = [
    contact && { name: 'Quién reporta', value: safe(contact), inline: true },
    page && { name: 'Sección', value: safe(page), inline: true },
    viewport && { name: 'Pantalla', value: viewport, inline: true },
    userAgent && { name: 'Navegador', value: safe(userAgent) },
  ].filter(Boolean);

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'Reportes de bugs · Abby Diarios',
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: '🐞 Nuevo reporte de bug',
          description: safe(description),
          color: 0xff3d97,
          fields,
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!res.ok) return json(502, { error: 'No se pudo enviar el reporte a Discord.' });
  return json(200, { ok: true });
}
