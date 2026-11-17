/**
 * Contenido del día de cada minijuego. Todo sale de la fecha con una semilla,
 * así que todo el mundo recibe los mismos retos.
 */
import { ANAGRAM_WORDS } from '../data/anagrams';
import { CONNECTION_GROUPS } from '../data/connections';
import { COUNTRIES, type Country } from '../data/countries';
import { CRYPTIC_CLUES } from '../data/cryptic';
import { GAMES, type Game } from '../data/games';
import { ARTISTS, SONGS, type Song } from '../data/music';
import { CLASSIC_WORDS, WORDS } from '../data/words';
import { genreCatalog, type GenreId, type HeardleSong } from '../data/heardleGenres';
import { dailyPick, puzzleNumber, seeded, shuffled } from '../lib/daily';
import { crosswordOfDay } from './crossword';

/* ───────────── Juego del día (sin repetir entre minijuegos) ───────────── */

/**
 * Emojis compuestos (🏴‍☠️, 🧑‍🚀…) no se dibujan bien en <canvas> en todos los sistemas,
 * así que los juegos que pintan el icono (Pixeldle) o lo usan como carta (Memoria) los evitan.
 */
const isSimpleIcon = (g: Game) => !g.icon.includes('‍');
const SIMPLE_ICON_GAMES = GAMES.filter(isSimpleIcon);

function gameOfDay(day: string, salt: string, avoid: string[], list: readonly Game[] = GAMES): Game {
  let g = dailyPick(list, day, salt);
  for (let i = 1; avoid.includes(g.id); i++) g = dailyPick(list, day, `${salt}-${i}`);
  return g;
}

export function dailyGames(day: string) {
  const gamedle = gameOfDay(day, 'gamedle', []);
  const emojidle = gameOfDay(day, 'emojidle', [gamedle.id]);
  const pixeldle = gameOfDay(day, 'pixeldle', [gamedle.id, emojidle.id], SIMPLE_ICON_GAMES);
  const anodle = gameOfDay(day, 'anodle', [gamedle.id, emojidle.id, pixeldle.id]);
  const ahorcado = gameOfDay(day, 'ahorcado', [gamedle.id, emojidle.id, pixeldle.id, anodle.id]);
  return { gamedle, emojidle, pixeldle, anodle, ahorcado };
}

export const wordOfDay = (day: string) => dailyPick(WORDS, day, 'palabrdle');

/** Palabra del Wordle clásico (nunca la misma que la del Palabrdle). */
export function classicWordOfDay(day: string): string {
  const w = dailyPick(CLASSIC_WORDS, day, 'wordle');
  return w === wordOfDay(day) ? dailyPick(CLASSIC_WORDS, day, 'wordle-b') : w;
}

/* ───────────── Anagrama ───────────── */

export function anagramOfDay(day: string) {
  const word = dailyPick(ANAGRAM_WORDS, day, 'anagrama');
  const rng = seeded('anagrama-mezcla', day);
  let letters = shuffled([...word], rng);
  for (let i = 0; letters.join('') === word && i < 10; i++) letters = shuffled([...word], rng);
  return { word, letters };
}

/* ───────────── Conexiones ───────────── */

export function connectionsOfDay(day: string) {
  const rng = seeded('conexiones', day);
  const groups = shuffled(CONNECTION_GROUPS, rng)
    .slice(0, 4)
    .map((g) => ({ title: g.title, items: shuffled(g.items, rng).slice(0, 4) }));
  const board = shuffled(
    groups.flatMap((g, gi) => g.items.map((item) => ({ item, group: gi }))),
    rng,
  );
  return { groups, board };
}

/* ───────────── Cronología ───────────── */

export function chronologyOfDay(day: string) {
  const rng = seeded('cronologia', day);
  const picked: Game[] = [];
  for (const g of shuffled(GAMES, rng)) {
    if (picked.length === 5) break;
    if (!picked.some((p) => p.year === g.year)) picked.push(g);
  }
  const answer = [...picked].sort((a, b) => a.year - b.year).map((g) => g.id);
  let start = shuffled(answer, rng);
  if (start.join() === answer.join()) start = [...answer].reverse();
  return { answer, start };
}

/* ───────────── ¿Antes o después? ───────────── */

export const CHAIN_ROUNDS = 10;

export function chainOfDay(day: string): Game[] {
  const rng = seeded('masomenos', day);
  const pool = shuffled(GAMES, rng);
  const chain: Game[] = [pool[0]!];
  let i = 1;
  while (chain.length < CHAIN_ROUNDS + 1) {
    const g = pool[i % pool.length]!;
    i++;
    const prev = chain[chain.length - 1]!;
    if (g.year !== prev.year && !chain.slice(-3).includes(g)) chain.push(g);
  }
  return chain;
}

/* ───────────── Quiz ───────────── */

export interface Question {
  text: string;
  icon: string;
  options: string[];
  correct: number;
}

export function quizOfDay(day: string): Question[] {
  const rng = seeded('quiz', day);
  const pool = shuffled(GAMES, rng);
  const used = new Set<string>();
  const take = (pred: (g: Game) => boolean, n = 1): Game[] => {
    const out: Game[] = [];
    for (const g of pool) {
      if (out.length === n) break;
      if (!used.has(g.id) && pred(g) && !out.includes(g)) out.push(g);
    }
    out.forEach((g) => used.add(g.id));
    return out;
  };
  const build = (text: string, icon: string, right: string, wrong: string[]): Question => {
    const options = shuffled([right, ...wrong.slice(0, 3)], rng);
    return { text, icon, options, correct: options.indexOf(right) };
  };

  const makers: (() => Question)[] = [
    () => {
      const [g] = take(() => true) as [Game];
      const years = shuffled(
        [-6, -4, -3, -2, -1, 1, 2, 3, 4].map((d) => g.year + d).filter((y) => y <= 2025),
        rng,
      );
      return build(`¿En qué año salió ${g.name}?`, g.icon, String(g.year), years.map(String));
    },
    () => {
      const [g] = take(() => true) as [Game];
      const studios = shuffled([...new Set(GAMES.map((x) => x.studio))].filter((s) => s !== g.studio), rng);
      return build(`¿Qué estudio creó ${g.name}?`, g.icon, g.studio, studios);
    },
    () => {
      const [g] = take(() => true) as [Game];
      const others = take((x) => x.genre !== g.genre, 3);
      return build(`¿Cuál de estos juegos es de género «${g.genre}»?`, '🏷️', g.name, others.map((x) => x.name));
    },
    () => {
      const [g] = take((x) => x.f2p) as [Game];
      const others = take((x) => !x.f2p, 3);
      return build('¿Cuál de estos juegos es gratis (free-to-play)?', '💸', g.name, others.map((x) => x.name));
    },
    () => {
      const four: Game[] = [];
      for (const g of pool) {
        if (four.length === 4) break;
        if (!used.has(g.id) && !four.some((f) => f.year === g.year)) four.push(g);
      }
      four.forEach((g) => used.add(g.id));
      const oldest = [...four].sort((a, b) => a.year - b.year)[0]!;
      return build('¿Cuál de estos juegos salió primero?', '⏳', oldest.name, four.filter((g) => g !== oldest).map((g) => g.name));
    },
    () => {
      const [g] = take(() => true) as [Game];
      const views = shuffled(['1ª persona', '3ª persona', 'Cenital', 'Lateral', 'Isométrica'].filter((v) => v !== g.view), rng);
      return build(`¿Qué vista de cámara tiene ${g.name}?`, '🎥', g.view, views);
    },
  ];
  return shuffled(makers, rng)
    .slice(0, 5)
    .map((m) => m());
}

/* ───────────── Memoria ───────────── */

export function memoryDeckOfDay(day: string): string[] {
  const rng = seeded('memoria', day);
  const icons = [...new Set(shuffled(SIMPLE_ICON_GAMES, rng).map((g) => g.icon))].slice(0, 8);
  return shuffled([...icons, ...icons], rng);
}

/* ───────────── Música ───────────── */

export function musicOfDay(day: string) {
  const heardle = dailyPick(SONGS, day, 'heardle');
  let emoji = dailyPick(SONGS, day, 'emojicancion');
  for (let i = 1; emoji.id === heardle.id; i++) emoji = dailyPick(SONGS, day, `emojicancion-${i}`);

  // ¿Quién canta?: 5 canciones de artistas distintos, cada una con 4 artistas como opción.
  const rng = seeded('quiencanta', day);
  const rounds: { song: Song; options: string[]; correct: number }[] = [];
  const usedMains = new Set<string>();
  for (const song of shuffled(SONGS, rng)) {
    if (rounds.length === QUIEN_CANTA_ROUNDS) break;
    if (song.id === heardle.id || song.id === emoji.id || usedMains.has(song.main)) continue;
    usedMains.add(song.main);
    const others = shuffled([...new Set(SONGS.map((s) => s.main))].filter((m) => m !== song.main), rng).slice(0, 3);
    const options = shuffled([song.main, ...others], rng);
    rounds.push({ song, options, correct: options.indexOf(song.main) });
  }

  const artist = dailyPick(ARTISTS, day, 'artistdle');
  return { heardle, emoji, rounds, artist };
}

export const QUIEN_CANTA_ROUNDS = 5;

/* ───────────── Heardle por géneros ───────────── */

export const HEARDLE_PHASES = 5;

/** Las 5 canciones del día de un género, recorriendo el catálogo sin repetir hasta agotarlo. */
export function heardleGenreOfDay(genre: GenreId, day: string): HeardleSong[] {
  const order = shuffled(genreCatalog(genre), seeded('orden', `heardle-${genre}`));
  const len = order.length;
  const start = ((((puzzleNumber(day) - 1) * HEARDLE_PHASES) % len) + len) % len;
  return Array.from({ length: Math.min(HEARDLE_PHASES, len) }, (_, i) => order[(start + i) % len]!);
}

/* ───────────── Rage Aim ───────────── */

export const AIM_TARGETS = 20;

export function aimTargetsOfDay(day: string): { x: number; y: number }[] {
  const rng = seeded('aim', day);
  const out: { x: number; y: number }[] = [];
  while (out.length < AIM_TARGETS) {
    const p = { x: 8 + rng() * 84, y: 10 + rng() * 80 };
    const prev = out[out.length - 1];
    // Que cada diana esté algo lejos de la anterior.
    if (!prev || Math.hypot(p.x - prev.x, p.y - prev.y) > 22) out.push(p);
  }
  return out;
}

/* ───────────── ¿Cuál es más grande? (países) ───────────── */

export const COUNTRY_DUELS = 150;
/** Dos países solo se enfrentan si uno es al menos un 20 % más grande que el otro. */
export const MIN_RATIO = 1.2;

/** Dificultad creciente: [ratio mínimo, ratio máximo] según la ronda. */
function duelRange(round: number): [number, number] {
  if (round < 5) return [3, Infinity];
  if (round < 12) return [1.8, 8];
  if (round < 25) return [1.4, 3.5];
  return [MIN_RATIO, 2.2];
}

/**
 * Duelos del día: ~190 países dan más de 15.000 parejas válidas, y cada día sale una
 * secuencia distinta. Un país no vuelve a salir hasta pasadas unas cuantas rondas.
 */
export function countryDuelsOfDay(day: string): [Country, Country][] {
  const rng = seeded('paises', day);
  const out: [Country, Country][] = [];
  const recent: string[] = [];
  const pick = () => COUNTRIES[Math.floor(rng() * COUNTRIES.length)]!;
  while (out.length < COUNTRY_DUELS) {
    let [lo, hi] = duelRange(out.length);
    for (let tries = 0; ; tries++) {
      // Si cuesta encontrar pareja, se relaja el rango (sin bajar nunca del 20 %).
      if (tries > 400) [lo, hi] = [MIN_RATIO, Infinity];
      const a = pick();
      const b = pick();
      if (a.code === b.code || recent.includes(a.code) || recent.includes(b.code)) continue;
      const ratio = Math.max(a.area, b.area) / Math.min(a.area, b.area);
      if (ratio < lo || ratio > hi) continue;
      out.push([a, b]);
      recent.push(a.code, b.code);
      if (recent.length > 16) recent.splice(0, 2);
      break;
    }
  }
  return out;
}

/* ───────────── Crucigrama y Críptico ───────────── */

export { crosswordOfDay };

/** Pista críptica del día: recorre todas las pistas antes de repetir ninguna. */
export const crypticOfDay = (day: string) => dailyPick(CRYPTIC_CLUES, day, 'criptico');
