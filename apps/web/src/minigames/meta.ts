import { AVAILABLE_GENRES } from '../data/heardleGenres';

export type Category ='Adivina' | 'Palabras' | 'Música' | 'Lógica' | 'Habilidad';

export interface MinigameMeta {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  category: Category;
  gradient: string;
  /** Para el récord: ¿menos es mejor (intentos, tiempo) o más (aciertos)? */
  lowerIsBetter: boolean;
  formatScore: (n: number) => string;
  /** Si existe, el reto se agrupa bajo esa tarjeta en la portada (p. ej. los géneros del Heardle). */
  parent?: string;
}

/** Tarjeta que agrupa en la portada los Heardle de cada género. */
export const HEARDLE_GROUP = {
  id: 'heardle',
  name: 'Heardle',
  icon: '🎧',
  tagline: `${AVAILABLE_GENRES.length} géneros · 5 canciones cada uno`,
  gradient: 'from-rose-500 to-fuchsia-600',
};

const tries = (n: number) => `${n} ${n === 1 ? 'intento' : 'intentos'}`;
const fails = (n: number) => `${n} ${n === 1 ? 'fallo' : 'fallos'}`;

export const MINIGAMES: MinigameMeta[] = [
  { id: 'gamedle', name: 'Gamedle', icon: '🎮', tagline: 'Adivina el juego por sus atributos', category: 'Adivina', gradient: 'from-fuchsia-500 to-violet-600', lowerIsBetter: true, formatScore: tries },
  { id: 'emojidle', name: 'Emojidle', icon: '🫣', tagline: 'Descubre el juego a partir de emojis', category: 'Adivina', gradient: 'from-violet-500 to-sky-500', lowerIsBetter: true, formatScore: tries },
  { id: 'pixeldle', name: 'Pixeldle', icon: '👾', tagline: 'El icono se va despixelando', category: 'Adivina', gradient: 'from-cyan-500 to-blue-600', lowerIsBetter: true, formatScore: tries },
  { id: 'anodle', name: 'Añodle', icon: '📅', tagline: '¿En qué año salió este juego?', category: 'Adivina', gradient: 'from-amber-400 to-orange-500', lowerIsBetter: true, formatScore: tries },
  { id: 'wordle', name: 'Wordle', icon: '🟩', tagline: 'La palabra del día en 6 intentos', category: 'Palabras', gradient: 'from-emerald-400 to-green-600', lowerIsBetter: true, formatScore: tries },
  { id: 'palabrdle', name: 'Palabrdle', icon: '🔤', tagline: 'Wordle gamer: palabras del mundo stream', category: 'Palabras', gradient: 'from-pink-500 to-rose-500', lowerIsBetter: true, formatScore: tries },
  { id: 'ahorcado', name: 'Ahorcado', icon: '🪢', tagline: 'Descubre el juego letra a letra', category: 'Palabras', gradient: 'from-rose-500 to-red-600', lowerIsBetter: true, formatScore: fails },
  { id: 'anagrama', name: 'Anagrama', icon: '🔀', tagline: 'Ordena las letras revueltas', category: 'Palabras', gradient: 'from-indigo-500 to-purple-600', lowerIsBetter: true, formatScore: tries },
  { id: 'crucigrama', name: 'Crucigrama', icon: '✍️', tagline: 'Mini crucigrama de cultura pop', category: 'Palabras', gradient: 'from-amber-400 to-rose-500', lowerIsBetter: true, formatScore: (n) => (n === 0 ? 'sin ayudas' : `${n} ${n === 1 ? 'ayuda' : 'ayudas'}`) },
  { id: 'cripto', name: 'Críptico', icon: '🕵️', tagline: 'Una pista con definición y juego de palabras', category: 'Palabras', gradient: 'from-emerald-500 to-teal-700', lowerIsBetter: false, formatScore: (n) => `${n} pts` },
  ...AVAILABLE_GENRES.map(
    (g): MinigameMeta => ({
      id: `heardle-${g.id}`,
      name: `Heardle ${g.name}`,
      icon: g.icon,
      tagline: `5 canciones · ${g.tagline}`,
      category: 'Música',
      gradient: g.gradient,
      lowerIsBetter: false,
      formatScore: (n) => `${n}/5`,
      parent: HEARDLE_GROUP.id,
    }),
  ),
  { id: 'quiencanta', name: '¿Quién canta?', icon: '📻', tagline: 'Escucha un fragmento y elige al artista', category: 'Música', gradient: 'from-orange-400 to-pink-500', lowerIsBetter: false, formatScore: (n) => `${n}/5` },
  { id: 'artistdle', name: 'Artistdle', icon: '🎤', tagline: 'Adivina el artista por sus pistas', category: 'Música', gradient: 'from-purple-500 to-indigo-600', lowerIsBetter: true, formatScore: tries },
  { id: 'emojicancion', name: 'Emoji musical', icon: '🎶', tagline: 'Descubre la canción a partir de emojis', category: 'Música', gradient: 'from-sky-400 to-violet-500', lowerIsBetter: true, formatScore: tries },
  { id: 'conexiones', name: 'Conexiones', icon: '🧩', tagline: '16 palabras, 4 grupos secretos', category: 'Lógica', gradient: 'from-yellow-400 to-pink-500', lowerIsBetter: true, formatScore: fails },
  { id: 'cronologia', name: 'Cronología', icon: '⏳', tagline: 'Ordena 5 juegos del más viejo al más nuevo', category: 'Lógica', gradient: 'from-teal-400 to-emerald-600', lowerIsBetter: true, formatScore: tries },
  { id: 'quiz', name: 'Quiz gamer', icon: '❓', tagline: '5 preguntas sobre videojuegos', category: 'Lógica', gradient: 'from-sky-400 to-indigo-500', lowerIsBetter: false, formatScore: (n) => `${n}/5` },
  { id: 'masomenos', name: '¿Antes o después?', icon: '↕️', tagline: '¿Qué juego salió antes? Llega a 10', category: 'Lógica', gradient: 'from-lime-400 to-emerald-500', lowerIsBetter: false, formatScore: (n) => `${n}/10` },
  { id: 'memoria', name: 'Memoria', icon: '🃏', tagline: 'Encuentra las 8 parejas', category: 'Habilidad', gradient: 'from-pink-400 to-fuchsia-600', lowerIsBetter: true, formatScore: (n) => `${n} movimientos` },
  { id: 'aim', name: 'Rage Aim', icon: '🎯', tagline: '20 dianas lo más rápido posible', category: 'Habilidad', gradient: 'from-red-500 to-orange-500', lowerIsBetter: true, formatScore: (n) => `${(n / 1000).toFixed(2).replace('.', ',')} s` },
  { id: 'paises', name: '¿Cuál es más grande?', icon: '🌍', tagline: 'Elige el país con más superficie: 60 segundos', category: 'Habilidad', gradient: 'from-sky-400 to-emerald-500', lowerIsBetter: false, formatScore: (n) => `${n} ${n === 1 ? 'acierto' : 'aciertos'}` },
];

export const META: Record<string, MinigameMeta> = Object.fromEntries(MINIGAMES.map((m) => [m.id, m]));

export const CATEGORIES: Category[] = ['Adivina', 'Palabras', 'Música', 'Lógica', 'Habilidad'];

/** Color del cromo de cada categoría (variable CSS de index.css). */
export const CATEGORY_COLOR: Record<Category, string> = {
  Adivina: 'var(--color-cat-adivina)',
  Palabras: 'var(--color-cat-palabras)',
  Música: 'var(--color-cat-musica)',
  Lógica: 'var(--color-cat-logica)',
  Habilidad: 'var(--color-cat-habilidad)',
};

/**
 * Orden del álbum: un cromo por tarjeta de la portada (los Heardle comparten el cromo de su grupo),
 * numerados desde 1 en el orden de las categorías.
 */
export const ALBUM: { id: string; category: Category }[] = CATEGORIES.flatMap((cat) =>
  MINIGAMES.filter((m) => m.category === cat)
    .filter((m, i, list) => !m.parent || list.findIndex((x) => x.parent === m.parent) === i)
    .map((m) => ({ id: m.parent ?? m.id, category: cat })),
);

/** Número de cromo de un reto o grupo (los géneros del Heardle dan el número de su grupo). */
export function albumNumber(id: string): number {
  const key = META[id]?.parent ?? id;
  return ALBUM.findIndex((a) => a.id === key) + 1;
}

/** Color del cromo de un reto o grupo. */
export function albumColor(id: string): string {
  const cat = META[id]?.category ?? ALBUM.find((a) => a.id === id)?.category ?? 'Música';
  return CATEGORY_COLOR[cat];
}
