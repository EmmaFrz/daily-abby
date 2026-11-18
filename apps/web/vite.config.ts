import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

/**
 * En `npm run dev` no existe el runtime de Vercel, así que servimos
 * /api/report-bug con la misma función que se despliega (api/report-bug.js).
 * Para probarlo en local, pon DISCORD_WEBHOOK_URL en un .env de la raíz.
 */
function devBugReportApi(): Plugin {
  return {
    name: 'dev-bug-report-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv('development', repoRoot, '');
      if (env.DISCORD_WEBHOOK_URL) process.env.DISCORD_WEBHOOK_URL ??= env.DISCORD_WEBHOOK_URL;

      server.middlewares.use('/api/report-bug', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);

        // Las mismas cabeceras que recibiría en Vercel: la función comprueba el origen con ellas.
        const headers = new Headers();
        for (const name of ['content-type', 'origin', 'sec-fetch-site', 'user-agent']) {
          const value = req.headers[name];
          if (typeof value === 'string') headers.set(name, value);
        }
        const ip = req.socket.remoteAddress ?? '127.0.0.1';
        headers.set('x-real-ip', ip);
        headers.set('x-forwarded-for', ip);

        const { POST } = await import(new URL('../../api/report-bug.js', import.meta.url).href);
        const response: Response = await POST(
          new Request(`http://${req.headers.host ?? 'localhost'}/api/report-bug`, {
            method: 'POST',
            headers,
            body: Buffer.concat(chunks),
          }),
        );
        res.statusCode = response.status;
        res.setHeader('content-type', 'application/json');
        res.end(await response.text());
      });
    },
  };
}

/**
 * Cabeceras de seguridad de vercel.json (CSP, anti-iframe…). `npm run preview`
 * las aplica también, para probar en local que la CSP no rompe nada antes de publicar.
 */
function securityHeaders(): Record<string, string> {
  const vercel = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
    headers?: { source: string; headers: { key: string; value: string }[] }[];
  };
  const all = vercel.headers?.find((h) => h.source === '/(.*)')?.headers ?? [];
  return Object.fromEntries(all.map((h) => [h.key, h.value]));
}

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), devBugReportApi()],
  define: {
    // Herramientas de prueba ("avanzar día"): solo en `npm run dev` y en despliegues de vista
    // previa de Vercel. En producción no existen, así que un enlace con ?dev no hace nada.
    __DEV_TOOLS__: JSON.stringify(command === 'serve' || process.env.VERCEL_ENV === 'preview'),
  },
  server: { port: 5173 },
  preview: { headers: securityHeaders() },
}));
