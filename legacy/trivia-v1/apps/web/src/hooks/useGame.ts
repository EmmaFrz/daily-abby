import type { Choice, PublicGameState, Role } from '@abby/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { connectGame, type GameSocket } from '../lib/socket';

export type ConnectionStatus = 'connecting' | 'connected' | 'error';

/** Se suscribe al estado del juego. host y abby necesitan clave; stage no. */
export function useGame(role: Role, key?: string) {
  const [state, setState] = useState<PublicGameState | null>(null);
  const [abbyChoice, setAbbyChoice] = useState<Choice | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const clockOffset = useRef(0);

  useEffect(() => {
    if (role !== 'stage' && !key) return;
    setStatus('connecting');
    setError(null);

    const s = connectGame(role, key);
    s.on('connect', () => {
      setStatus('connected');
      setError(null);
    });
    s.on('connect_error', (err) => {
      setStatus('error');
      setError(err.message);
    });
    s.on('disconnect', () => setStatus('connecting'));
    s.on('state', (next) => {
      clockOffset.current = next.serverNow - Date.now();
      setState(next);
    });
    s.on('abby:choice', setAbbyChoice);
    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [role, key]);

  /** Hora actual según el reloj del servidor: los contadores se calculan con esto. */
  const now = useCallback(() => Date.now() + clockOffset.current, []);

  return { state, abbyChoice, status, error, socket, now };
}
