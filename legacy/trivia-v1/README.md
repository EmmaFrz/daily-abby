# Abby vs Chat — Trivia en vivo

Programa de trivia web donde **Abby compite contra su chat de Twitch**. Abby responde desde un pad
privado; el chat responde escribiendo `A`, `B`, `C` o `D` (también `1-4` o `!a`). Gana el punto quien acierta.

## Cómo arrancar

Requisitos: **Node 22+**.

```bash
npm install
cp .env.example .env     # y pon una HOST_KEY larga
npm run dev
```

| URL | Para quién | Qué es |
|---|---|---|
| http://localhost:5173/ | Stream | Pantalla del juego (Abby la captura en OBS) |
| http://localhost:5173/host | Abby o un mod | Consola: empezar, cerrar, revelar, marcador, fuente del chat |
| http://localhost:5173/abby | Abby | Pad privado para responder (celular/tablet, fuera de cámara) |
| http://localhost:5173/admin | Equipo | Panel de administración (fase 2) |

`/host` y `/abby` piden la clave `HOST_KEY` del `.env`. Si no hay ninguna (o es la de ejemplo), el servidor genera
una aleatoria en cada arranque y la muestra en la consola. Tras 20 claves incorrectas desde la misma IP, esa IP
queda bloqueada 10 minutos.

Para probar sin estar en directo, deja `CHAT_SOURCE=simulator`: cientos de espectadores falsos votan en cada pregunta.
Desde `/host` se cambia en vivo a **Twitch** (lee el chat de `TWITCH_CHANNEL`, en modo anónimo y solo lectura).

## Reglas del versus

- **Abby** suma 1 punto si acierta. Puede cambiar su respuesta hasta que el contador llega a 0.
- **El chat** suma 1 punto si su **opción más votada** es la correcta. Empate en el primer puesto = sin respuesta.
  Cada usuario tiene un voto por pregunta; si vuelve a votar, cuenta el último.
- **Nadie copia a nadie:** mientras la pregunta está abierta, la pantalla solo muestra *que* Abby respondió y
  *cuántos* votos van, nunca qué eligieron. La respuesta correcta no sale del servidor hasta el reveal.
- **Retraso del stream:** el chat ve todo unos segundos tarde. Ve el mismo contador desplazado, así que el
  servidor le deja votar `STREAM_DELAY_SEC` segundos más (+1 s de margen de red).
- Además del versus, se lleva un **ranking individual de chatters** (aciertos personales).

## Estructura

```
apps/
  server/   Node + Fastify + Socket.IO: motor del juego, lectura del chat, tiempo real
  web/      React + Vite + Tailwind: pantalla, consola del host, pad de Abby, admin
packages/
  shared/   Tipos y contratos de eventos compartidos entre server y web
```

El **servidor es la única fuente de verdad**: las pantallas solo muestran el estado que reciben, por eso
recargar la página (o que OBS se reinicie) no rompe la partida.

## Producción

```bash
npm run build   # compila el frontend en apps/web/dist
npm start       # el servidor sirve el frontend y el tiempo real en el mismo puerto
```

Un solo servicio Node (Railway, Render, Fly.io…). Necesita conexión persistente (WebSockets), así que
no sirve un hosting solo serverless.

## Hoja de ruta

1. ✅ **Motor del versus** jugable en 2D, chat simulado y chat real de Twitch
2. ⬜ **Panel admin** con base de datos (Supabase): preguntas, episodios, apariencia, roles, login con Twitch
3. ⬜ **Escena 3D** (React Three Fiber) sobre el motor
4. ⬜ **Temática de Abby**: estética, sonidos, animaciones
5. ⬜ Ensayo con stream real y ajuste del retraso
