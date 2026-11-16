import type { ReactNode } from 'react';
import { SearchPicker, type PickerItem } from '../../components/SearchPicker';
import { SONGS } from '../../data/music';
import { useClip, useTrack, type TrackState } from '../../lib/itunes';

const SONG_ITEMS: PickerItem[] = SONGS.map((s) => ({ id: s.id, label: s.title, sub: s.artist }));

export function SongPicker({ exclude, onPick }: { exclude: string[]; onPick: (id: string) => void }) {
  return <SearchPicker items={SONG_ITEMS} exclude={exclude} onPick={onPick} placeholder="Escribe el título o el artista…" />;
}

export interface RevealSong {
  trackId: number;
  title: string;
  artist: string;
  year: number | null;
  store?: string;
}

/** Portada, título, artista y enlace a Apple Music; con botón para escuchar la previa entera. */
export function SongReveal({ song }: { song: RevealSong }) {
  const t = useTrack(song.trackId, song.store);
  const ready = t.status === 'ready' ? t.info : null;
  const clip = useClip(ready?.previewUrl ?? null);
  return (
    <span className="mx-auto mt-3 flex max-w-md items-center gap-3 rounded-2xl bg-black/25 p-3 text-left">
      {ready?.artwork ? (
        <img src={ready.artwork} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-lg" />
      ) : (
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-white/10 text-3xl">🎵</span>
      )}
      <span className="min-w-0 flex-1">
        <b className="block truncate font-display text-lg text-white">{song.title}</b>
        <span className="block truncate text-sm text-white/65">
          {song.artist}
          {song.year ? ` · ${song.year}` : ''}
        </span>
        {ready && (
          <a href={ready.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-abby-soft hover:underline">
            Escuchar en Apple Music ↗
          </a>
        )}
      </span>
      {ready && (
        <button
          onClick={() => (clip.playing ? clip.stop() : clip.play(30))}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-abby to-twitch text-lg shadow-lg"
          aria-label={clip.playing ? 'Parar' : 'Escuchar'}
        >
          {clip.playing ? '■' : '▶'}
        </button>
      )}
    </span>
  );
}

/** Mensajes de carga / error del audio. Si está listo, pinta `children`. */
export function TrackGate({ track, children }: { track: TrackState; children: ReactNode }) {
  if (track.status === 'loading')
    return (
      <div className="grid place-items-center gap-2 py-10 text-white/60">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-abby" />
        Cargando canción…
      </div>
    );
  if (track.status === 'error')
    return (
      <div className="grid place-items-center gap-3 py-8 text-center text-white/70">
        <span className="text-4xl">📡</span>
        No se pudo cargar el audio. Revisa tu conexión a internet.
        <button className="btn btn-ghost" onClick={track.retry}>
          Reintentar
        </button>
      </div>
    );
  return <>{children}</>;
}

export const credit = (
  <p className="mt-6 text-center text-[11px] font-bold text-white/30">Fragmentos de audio: previas oficiales de Apple Music.</p>
);
