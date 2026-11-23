/**
 * Previas oficiales de 30 s de Apple Music (API pública de iTunes, sin clave).
 * Se piden por trackId para obtener siempre la versión original.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { appleUrl } from './appleUrl';
import { musicGain, subscribeSound } from './sound';

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
    const query = new URLSearchParams({ id: String(trackId), country: store });
    p = fetch(`https://itunes.apple.com/lookup?${query}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ results?: { previewUrl?: unknown; artworkUrl100?: unknown; trackViewUrl?: unknown }[] }>;
      })
      .then((j) => {
        const t = j.results?.[0];
        const previewUrl = appleUrl(t?.previewUrl, ['apple.com', 'mzstatic.com']);
        if (!previewUrl) throw new Error('Sin previa');
        const artwork = appleUrl(t?.artworkUrl100, ['mzstatic.com']);
        return {
          previewUrl,
          artwork: artwork ? artwork.replace('100x100bb', '600x600bb') : '',
          url: appleUrl(t?.trackViewUrl, ['apple.com']) ?? 'https://music.apple.com',
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
 *
 * El corte no depende de `requestAnimationFrame` (el navegador lo congela con la pestaña en segundo
 * plano o la ventana tapada, y entonces sonaba la previa entera): lo vigilan un temporizador y el
 * evento `timeupdate` del propio audio. Además se para al ocultar la pestaña y no deja reanudar el
 * audio desde fuera (controles multimedia del sistema o del navegador).
 */
export function useClip(url: string | null) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const raf = useRef(0);
  const timer = useRef(0);
  /** Segundo en el que hay que cortar; null si no se está reproduciendo por `play()`. */
  const limit = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    window.clearTimeout(timer.current);
    limit.current = null;
    audio.current?.pause();
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    a.preload = 'auto';
    a.volume = musicGain();
    audio.current = a;

    const overLimit = () => limit.current == null || a.currentTime >= limit.current;
    // Cualquier reproducción que no venga de play() (p. ej. la tecla multimedia o el reproductor
    // global del navegador) o que pase del límite se corta en seco.
    const guard = () => {
      if (!a.paused && overLimit()) stop();
    };
    const onHidden = () => {
      if (document.hidden) stop();
    };
    const unsubscribe = subscribeSound(() => {
      a.volume = musicGain();
    });
    a.addEventListener('play', guard);
    a.addEventListener('playing', guard);
    a.addEventListener('timeupdate', guard);
    a.addEventListener('ended', stop);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      unsubscribe();
      a.removeEventListener('play', guard);
      a.removeEventListener('playing', guard);
      a.removeEventListener('timeupdate', guard);
      a.removeEventListener('ended', stop);
      document.removeEventListener('visibilitychange', onHidden);
      cancelAnimationFrame(raf.current);
      window.clearTimeout(timer.current);
      limit.current = null;
      a.pause();
      a.src = '';
      audio.current = null;
      setPlaying(false);
      setProgress(0);
    };
  }, [url, stop]);

  const play = useCallback(
    (seconds: number) => {
      const a = audio.current;
      if (!a || document.hidden) return;
      cancelAnimationFrame(raf.current);
      window.clearTimeout(timer.current);
      a.volume = musicGain();
      a.currentTime = 0;
      limit.current = seconds;
      setProgress(0);
      setPlaying(true);
      void a.play().catch(() => {
        if (limit.current === seconds) stop();
      });
      // Corte de seguridad aunque no se pinten fotogramas: se reprograma con lo que falte de verdad,
      // por si el audio tardó en arrancar.
      const schedule = () => {
        if (limit.current == null) return;
        if (a.currentTime >= seconds || a.ended) return stop();
        timer.current = window.setTimeout(schedule, Math.max(20, (seconds - a.currentTime) * 1000));
      };
      timer.current = window.setTimeout(schedule, seconds * 1000);
      // La barra de progreso sí va con requestAnimationFrame (solo es visual).
      const tick = () => {
        if (limit.current == null) return;
        setProgress(Math.min(a.currentTime, seconds));
        if (a.currentTime >= seconds || a.ended) return stop();
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [stop],
  );

  return { play, stop, playing, progress };
}
