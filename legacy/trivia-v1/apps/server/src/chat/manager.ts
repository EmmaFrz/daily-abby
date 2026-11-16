import type { ChatSourceKind, ChatStatus } from '@abby/shared';
import type { GameEngine } from '../game/engine';
import { parseVote } from './parseVote';
import { ChatSimulator } from './simulator';
import { TwitchIrcChat } from './twitchIrc';
import type { ChatMessage, ChatSource } from './types';

/** Conecta la fuente de chat activa con el motor. Se puede cambiar en vivo desde /host. */
export class ChatManager {
  private source: ChatSource | null = null;

  constructor(
    private readonly engine: GameEngine,
    private readonly opts: { twitchChannel: string; simulatedViewers: number },
  ) {}

  use(kind: ChatSourceKind): void {
    this.source?.stop();
    this.source = null;

    const onMessage = (msg: ChatMessage) => {
      const choice = parseVote(msg.text);
      if (choice) this.engine.registerVote(msg.userId, msg.name, choice);
    };
    const onStatus = (status: ChatStatus) => this.engine.setChatStatus(status);

    if (kind === 'twitch') {
      this.source = new TwitchIrcChat(this.opts.twitchChannel, onMessage, onStatus);
    } else if (kind === 'simulator') {
      this.source = new ChatSimulator(this.engine, this.opts.simulatedViewers, onMessage, onStatus);
    } else {
      onStatus({ source: 'off', connected: false });
    }
    this.source?.start();
  }
}
