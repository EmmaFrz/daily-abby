/**
 * Previas oficiales de 30 s de Apple Music (API pública de iTunes, sin clave).
 * Se piden por trackId para obtener siempre la versión original.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { soundSettings } from './sound';

export interface TrackInfo {
  previewUrl: string;
  artwork: string;
  /** Enlace a la canción en Apple Music. */
  url: string;
}

const cache = new Map<string, Promise<TrackInfo>>();

/** `store`: tienda de Apple donde está la canción (us, mx, es, gb…). */
export function fetchTrack(trackId: number, store = 'us'): Promise<TrackInfo> {
  const key = `${store}:${trackId}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`https://itunes.apple.com/lookup?id=${trackId}&country=${store}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ results?: { previewUrl?: string; artworkUrl100?: string; trackViewUrl?: string }[] }>;
      })
      .then((j) => {
        const t = j.results?.[0];
        if (!t?.previewUrl) throw new Error('Sin previa');
        return {
          previewUrl: t.previewUrl,
          artwork: (t.artworkUrl100 ?? '').replace('100x100bb', '600x600bb'),
          url: t.trackViewUrl ?? 'https://music.apple.com',
        };
      })
      .catch((e: unknown) => {
        cache.delete(key); // que se pueda reintentar
        throw e;
      });
    cache.set(key, p);
  }
  return p;
}

export type TrackState = { status: 'loading' } | { status: 'error'; retry: () => void } | { status: 'ready'; info: TrackInfo };

export function useTrack(trackId: number, store = 'us'): TrackState {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<TrackState>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    fetchTrack(trackId, store).then(
      (info) => alive && setState({ status: 'ready', info }),
      () => alive && setState({ status: 'error', retry: () => setAttempt((a) => a + 1) }),
    );
    return () => {
      alive = false;
    };
  }, [trackId, store, attempt]);
  return state;
}

/**
 * Reproduce un fragmento de una previa: `play(segundos)` suena desde el principio
 * y se para sola. `progress` va de 0 a los segundos reproducidos.
 */
export function useClip(url: string | null) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const raf = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    audio.current?.pause();
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    a.preload = 'auto';
    audio.current = a;
    return () => {
      cancelAnimationFrame(raf.current);
      a.pause();
      a.src = '';
      audio.current = null;
      setPlaying(false);
      setProgress(0);
    };
  }, [url]);

  const play = useCallback(
    (seconds: number) => {
      const a = audio.current;
      if (!a) return;
      cancelAnimationFrame(raf.current);
      a.volume = Math.max(0.05, soundSettings().volume);
      a.currentTime = 0;
      setProgress(0);
      setPlaying(true);
      void a.play().catch(() => setPlaying(false));
      const tick = () => {
        setProgress(a.currentTime);
        if (a.currentTime >= seconds || a.ended) {
          a.pause();
          setPlaying(false);
          return;
        }
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [],
  );

  return { play, stop, playing, progress };
}
