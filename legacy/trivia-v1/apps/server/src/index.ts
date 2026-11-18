import { existsSync } from 'node:fs';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { Server } from 'socket.io';
import {
  AUTH_ERROR,
  isChoice,
  type Ack,
  type ClientToServerEvents,
  type HandshakeAuth,
  type HostCommand,
  type Role,
  type ServerToClientEvents,
} from '@abby/shared';
import { createKeyChecker } from './auth';
import { ChatManager } from './chat/manager';
import { config, hostKeyGenerated, MIN_HOST_KEY_LENGTH } from './config';
import { GameEngine, GameError } from './game/engine';
import { sampleQuestions } from './game/sampleQuestions';

const app = Fastify({ logger: { level: 'warn' } });

app.get('/api/health', async () => ({ ok: true }));

// En producción el mismo servidor entrega el frontend ya compilado.
if (existsSync(config.webDist)) {
  await app.register(fastifyStatic, { root: config.webDist });
  app.setNotFoundHandler((request, reply) => {
    if (request.method === 'GET' && !request.url.startsWith('/api')) return reply.sendFile('index.html');
    return reply.code(404).send({ error: 'No encontrado' });
  });
}

const engine = new GameEngine(sampleQuestions, config.streamDelaySec);
const chat = new ChatManager(engine, config);

interface SocketData {
  role: Role;
}

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(app.server);
const checkKey = createKeyChecker(config.hostKey);

io.use((socket, next) => {
  const auth = socket.handshake.auth as Partial<HandshakeAuth>;
  const role: Role = auth.role === 'host' || auth.role === 'abby' ? auth.role : 'stage';
  if (role !== 'stage' && !checkKey(auth.key, socket.handshake.address)) return next(new Error(AUTH_ERROR));
  socket.data.role = role;
  next();
});

io.on('connection', (socket) => {
  const { role } = socket.data;
  void socket.join(role);
  socket.emit('state', engine.getState());
  if (role === 'abby') socket.emit('abby:choice', engine.getAbbyChoice());

  socket.on('host:command', (cmd, ack) => {
    run(ack, () => {
      if (role !== 'host') throw new GameError('Sin permiso');
      execute(cmd);
    });
  });

  socket.on('abby:answer', (choice, ack) => {
    run(ack, () => {
      if (role !== 'abby') throw new GameError('Sin permiso');
      if (!isChoice(choice)) throw new GameError('Opción no válida');
      engine.answerAbby(choice);
    });
  });
});

function execute(cmd: HostCommand): void {
  switch (cmd?.type) {
    case 'next':
      return engine.next();
    case 'lockNow':
      return engine.lockNow();
    case 'reset':
      return engine.reset();
    case 'setChatSource':
      if (cmd.source !== 'twitch' && cmd.source !== 'simulator' && cmd.source !== 'off') {
        throw new GameError('Fuente de chat no válida');
      }
      return chat.use(cmd.source);
    default:
      throw new GameError('Comando desconocido');
  }
}

/** Ejecuta una acción y responde al cliente; los GameError se muestran tal cual en la UI. */
function run(ack: Ack | undefined, action: () => void): void {
  const reply: Ack = typeof ack === 'function' ? ack : () => {};
  try {
    action();
    reply({ ok: true });
  } catch (error) {
    if (error instanceof GameError) return reply({ ok: false, error: error.message });
    app.log.error(error);
    reply({ ok: false, error: 'Error interno del servidor' });
  }
}

engine.stateChanged.on((state) => {
  io.emit('state', state);
  io.to('abby').emit('abby:choice', engine.getAbbyChoice());
});

chat.use(config.chatSource);

await app.listen({ port: config.port, host: '0.0.0.0' });
console.log(`🎮 Servidor del juego escuchando en http://localhost:${config.port}`);
console.log(`💬 Chat: ${config.chatSource}${config.chatSource === 'twitch' ? ` (#${config.twitchChannel})` : ''}`);
if (hostKeyGenerated) {
  console.warn(`🔑 HOST_KEY no está configurada: clave temporal de esta sesión → ${config.hostKey}`);
  console.warn('   Ponla en .env (HOST_KEY=...) si quieres que no cambie en cada arranque.');
} else if (config.hostKey.length < MIN_HOST_KEY_LENGTH) {
  console.warn(`⚠️  HOST_KEY es corta (menos de ${MIN_HOST_KEY_LENGTH} caracteres). Usa una más larga antes de ir en directo.`);
}
