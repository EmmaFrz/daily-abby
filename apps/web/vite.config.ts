import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
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
        const { POST } = await import(new URL('../../api/report-bug.js', import.meta.url).href);
        const response: Response = await POST(
          new Request('http://localhost/api/report-bug', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-forwarded-for': req.socket.remoteAddress ?? 'local' },
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

export default defineConfig({
  plugins: [react(), tailwindcss(), devBugReportApi()],
  server: { port: 5173 },
});
