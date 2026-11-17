/**
 * Géneros del Heardle. El catálogo de cada uno junta:
 *  - los éxitos de Apple Music de ese género (heardle-charts.json, se regenera con `npm run musica:actualizar`)
 *  - las canciones elegidas a mano de music.ts que pertenecen al género.
 */
import charts from './heardle-charts.json';
import { SONGS } from './music';

export type GenreId = 'pop' | 'latino' | 'rock' | 'hiphop' | 'kpop' | 'edm' | 'espana' | 'juegos';

export interface Genre {
  id: GenreId;
  name: string;
  icon: string;
  tagline: string;
  gradient: string;
}

export const GENRES: Genre[] = [
  { id: 'pop', name: 'Pop', icon: '🎤', tagline: 'Hits pop de ayer y de hoy', gradient: 'from-pink-500 to-fuchsia-600' },
  { id: 'latino', name: 'Latino', icon: '💃', tagline: 'Reguetón, pop latino y más', gradient: 'from-amber-400 to-rose-500' },
  { id: 'rock', name: 'Rock', icon: '🎸', tagline: 'Clásicos y rock actual', gradient: 'from-slate-500 to-red-600' },
  { id: 'hiphop', name: 'Hip-Hop', icon: '🎧', tagline: 'Rap y hip-hop', gradient: 'from-violet-600 to-indigo-700' },
  { id: 'kpop', name: 'K-Pop', icon: '💖', tagline: 'Idols, grupos y bandas sonoras', gradient: 'from-sky-400 to-pink-500' },
  { id: 'edm', name: 'EDM', icon: '🎛️', tagline: 'Electrónica y dance: de Avicii al festival', gradient: 'from-cyan-400 to-violet-600' },
  { id: 'espana', name: 'España', icon: '🌞', tagline: 'Solo artistas de España: de Mecano a Quevedo', gradient: 'from-red-500 to-yellow-400' },
  { id: 'juegos', name: 'Videojuegos', icon: '🕹️', tagline: 'Bandas sonoras: de Undertale a Final Fantasy', gradient: 'from-emerald-400 to-indigo-600' },
];

export const GENRES_BY_ID = Object.fromEntries(GENRES.map((g) => [g.id, g])) as Record<GenreId, Genre>;

export interface HeardleSong {
  /** trackId de Apple Music como texto (sirve de id). */
  id: string;
  trackId: number;
  title: string;
  artist: string;
  year: number | null;
  /** Tienda de Apple donde está la canción (para pedir la previa). */
  store: string;
}

/** Canciones de music.ts asignadas a cada género. */
const CURATED: Record<GenreId, string[]> = {
  pop: ['blinding', 'shape', 'bad-guy', 'levitating', 'as-it-was', 'flowers', 'anti-hero', 'drivers', 'uptown', 'rolling', 'espresso', 'die-with-a-smile', 'billie-jean', 'get-lucky'],
  latino: ['despacito', 'titi', 'me-porto-bonito', 'dakiti', 'tusa', 'provenza', 'bzrp53', 'quevedo52', 'la-bachata', 'gasolina', 'hips', 'waka', 'bailando', 'vivir-mi-vida', 'malamente', 'despecha', 'ella-baila-sola', 'mi-gente', 'hawai'],
  rock: ['believer', 'bohemian', 'teen-spirit', 'brightside', 'viva-la-vida', 'in-the-end', 'do-i-wanna-know'],
  hiphop: [],
  kpop: ['dynamite', 'how-you-like', 'idol', 'gurenge'],
  edm: ['get-lucky'],
  espana: [], // la selección completa está en ANCHORS (scripts/update-heardle.mjs)
  juegos: [], // también: selección de canciones de videojuegos en ANCHORS
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

type ChartRow = { t: string; a: string; id: number; c: string; y: number | null };
const CHARTS = (charts as { generatedAt: string; genres: Record<string, ChartRow[]> }).genres;
export const CHARTS_DATE = (charts as { generatedAt: string }).generatedAt;

function build(genre: GenreId): HeardleSong[] {
  const out: HeardleSong[] = [];
  const seen = new Set<string>();
  const add = (s: HeardleSong) => {
    const key = `${norm(s.title)}|${norm(s.artist.split(/,|&| y | x /)[0] ?? '')}`;
    if (seen.has(key) || seen.has(s.id)) return;
    seen.add(key);
    seen.add(s.id);
    out.push(s);
  };
  for (const id of CURATED[genre]) {
    const s = SONGS.find((x) => x.id === id);
    if (s) add({ id: String(s.trackId), trackId: s.trackId, title: s.title, artist: s.artist, year: s.year, store: 'us' });
  }
  for (const r of CHARTS[genre] ?? []) add({ id: String(r.id), trackId: r.id, title: r.t, artist: r.a, year: r.y, store: r.c });
  return out;
}

const CATALOGS = Object.fromEntries(GENRES.map((g) => [g.id, build(g.id)])) as Record<GenreId, HeardleSong[]>;

export const genreCatalog = (genre: GenreId) => CATALOGS[genre];

/** Mínimo de canciones para que un género aparezca (si el catálogo aún no se ha generado, se oculta). */
export const MIN_GENRE_SONGS = 5;

/** Géneros con canciones suficientes: son los que se muestran y cuentan como retos. */
export const AVAILABLE_GENRES = GENRES.filter((g) => CATALOGS[g.id].length >= MIN_GENRE_SONGS);
