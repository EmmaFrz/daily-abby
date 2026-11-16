import type { ChatSource, MessageHandler, StatusHandler } from './types';

const TWITCH_IRC_URL = 'wss://irc-ws.chat.twitch.tv:443';

/**
 * Lee el chat de un canal de Twitch como usuario anónimo ("justinfan"):
 * solo lectura, sin cuenta, sin token. Suficiente para contar votos.
 * Si más adelante queremos que un bot escriba en el chat, se cambia por EventSub.
 */
export class TwitchIrcChat implements ChatSource {
  readonly kind = 'twitch' as const;
  private ws: WebSocket | null = null;
  private stopped = true;
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly channel: string,
    private readonly onMessage: MessageHandler,
    private readonly onStatus: StatusHandler,
  ) {}

  start(): void {
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    const ws = this.ws;
    this.ws = null;
    ws?.close();
  }

  private status(connected: boolean, detail?: string): void {
    this.onStatus({ source: 'twitch', connected, channel: this.channel, detail });
  }

  private connect(): void {
    this.status(false, 'Conectando…');
    const ws = new WebSocket(TWITCH_IRC_URL);
    this.ws = ws;

    ws.addEventListener('open', () => {
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      ws.send(`NICK justinfan${Math.floor(10000 + Math.random() * 89999)}`);
      ws.send(`JOIN #${this.channel}`);
    });

    ws.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      for (const line of event.data.split('\r\n')) {
        if (line) this.handleLine(ws, line);
      }
    });

    ws.addEventListener('close', () => {
      if (this.ws !== ws || this.stopped) return;
      this.ws = null;
      this.scheduleReconnect();
    });
  }

  private handleLine(ws: WebSocket, line: string): void {
    if (line.startsWith('PING')) {
      ws.send(`PONG${line.slice(4)}`);
      return;
    }
    const msg = parseIrcLine(line);
    if (!msg) return;

    switch (msg.command) {
      case 'ROOMSTATE': // llega al unirse al canal
        this.attempts = 0;
        this.status(true);
        break;
      case 'PRIVMSG':
        this.onMessage({
          userId: msg.tags['user-id'] || msg.nick,
          name: msg.tags['display-name'] || msg.nick,
          text: msg.trailing,
        });
        break;
      case 'RECONNECT': // Twitch pide reconectar (mantenimiento de sus servidores)
        ws.close();
        break;
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(30_000, 1000 * 2 ** this.attempts++);
    this.status(false, `Desconectado. Reintentando en ${Math.round(delay / 1000)} s…`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.stopped) this.connect();
    }, delay);
  }
}

export interface IrcMessage {
  tags: Record<string, string>;
  nick: string;
  command: string;
  params: string[];
  trailing: string;
}

/** Parser mínimo de líneas IRC con tags de Twitch: `@tags :prefijo COMANDO params :texto`. */
export function parseIrcLine(line: string): IrcMessage | null {
  let rest = line;
  const tags: Record<string, string> = {};

  if (rest.startsWith('@')) {
    const space = rest.indexOf(' ');
    if (space === -1) return null;
    for (const pair of rest.slice(1, space).split(';')) {
      const eq = pair.indexOf('=');
      if (eq === -1) tags[pair] = '';
      else tags[pair.slice(0, eq)] = unescapeTag(pair.slice(eq + 1));
    }
    rest = rest.slice(space + 1);
  }

  let nick = '';
  if (rest.startsWith(':')) {
    const space = rest.indexOf(' ');
    if (space === -1) return null;
    nick = rest.slice(1, space).split('!')[0] ?? '';
    rest = rest.slice(space + 1);
  }

  let trailing = '';
  const trailingAt = rest.indexOf(' :');
  if (trailingAt !== -1) {
    trailing = rest.slice(trailingAt + 2);
    rest = rest.slice(0, trailingAt);
  }

  const [command = '', ...params] = rest.split(' ');
  return { tags, nick, command, params, trailing };
}

function unescapeTag(value: string): string {
  return value.replace(/\\(.)/g, (_, c: string) =>
    c === 's' ? ' ' : c === ':' ? ';' : c === 'r' ? '\r' : c === 'n' ? '\n' : c,
  );
}
