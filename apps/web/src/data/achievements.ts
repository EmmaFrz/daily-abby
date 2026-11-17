import { MINIGAMES } from '../minigames/meta';
import type { SaveState } from '../state/types';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  check: (s: SaveState) => boolean;
}

const HEARDLE_COUNT = MINIGAMES.filter((m) => m.parent === 'heardle').length;
const flag = (f: string) => (s: SaveState) => s.flags.includes(f);
const played = (s: SaveState) => MINIGAMES.filter((m) => (s.records[m.id]?.played ?? 0) > 0).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-win', icon: '🌱', title: 'Primer reto', desc: 'Gana tu primer minijuego.', check: (s) => s.totalWins >= 1 },
  { id: 'explorer', icon: '🧭', title: 'Exploración total', desc: `Juega los ${MINIGAMES.length} minijuegos al menos una vez.`, check: (s) => played(s) >= MINIGAMES.length },
  { id: 'wins-10', icon: '💜', title: 'Calentando', desc: 'Gana 10 retos.', check: (s) => s.totalWins >= 10 },
  { id: 'wins-50', icon: '💎', title: 'Veteranía', desc: 'Gana 50 retos.', check: (s) => s.totalWins >= 50 },
  { id: 'wins-200', icon: '👑', title: 'Leyenda de los diarios', desc: 'Gana 200 retos.', check: (s) => s.totalWins >= 200 },
  { id: 'streak-3', icon: '🔥', title: 'En racha', desc: 'Juega 3 días seguidos.', check: (s) => s.bestStreak >= 3 },
  { id: 'streak-7', icon: '📅', title: 'Constancia', desc: 'Juega 7 días seguidos.', check: (s) => s.bestStreak >= 7 },
  { id: 'streak-30', icon: '🗓️', title: 'Un mes entero', desc: 'Juega 30 días seguidos.', check: (s) => s.bestStreak >= 30 },
  { id: 'perfect', icon: '🏅', title: 'Día perfecto', desc: 'Gana todos los minijuegos del mismo día.', check: (s) => s.perfectDays >= 1 },
  { id: 'gamedle-1', icon: '🎮', title: 'Telepatía', desc: 'Acierta el Gamedle a la primera.', check: flag('gamedle-1') },
  { id: 'emojidle-1', icon: '🫣', title: 'Con un emoji basta', desc: 'Acierta el Emojidle a la primera.', check: flag('emojidle-1') },
  { id: 'pixeldle-1', icon: '👾', title: 'Ojo de halcón', desc: 'Acierta el Pixeldle a la primera.', check: flag('pixeldle-1') },
  { id: 'anodle-1', icon: '📅', title: 'Enciclopedia', desc: 'Acierta el año exacto a la primera.', check: flag('anodle-1') },
  { id: 'wordle-2', icon: '🟩', title: 'Lingüista', desc: 'Resuelve el Wordle en 2 intentos o menos.', check: flag('wordle-2') },
  { id: 'palabrdle-2', icon: '🔤', title: 'Diccionario andante', desc: 'Resuelve el Palabrdle en 2 intentos o menos.', check: flag('palabrdle-2') },
  { id: 'ahorcado-clean', icon: '🪢', title: 'Sin un rasguño', desc: 'Gana el Ahorcado sin fallar ninguna letra.', check: flag('ahorcado-clean') },
  { id: 'anagrama-clean', icon: '🔀', title: 'Sin pistas', desc: 'Resuelve el Anagrama a la primera y sin pistas.', check: flag('anagrama-clean') },
  { id: 'crucigrama-clean', icon: '✍️', title: 'Bolígrafo de tinta', desc: 'Resuelve el Crucigrama sin comprobar ni revelar nada.', check: flag('crucigrama-clean') },
  { id: 'cripto-clean', icon: '🕵️', title: 'Código Enigma', desc: 'Resuelve el Críptico a la primera y sin pistas (100 puntos).', check: flag('cripto-clean') },
  { id: 'conexiones-perfect', icon: '🧩', title: 'Todo conectado', desc: 'Resuelve Conexiones sin fallos.', check: flag('conexiones-perfect') },
  { id: 'cronologia-1', icon: '⏳', title: 'Libro de historia', desc: 'Ordena la Cronología al primer intento.', check: flag('cronologia-1') },
  { id: 'quiz-5', icon: '❓', title: 'Cerebrito', desc: 'Acierta las 5 preguntas del Quiz.', check: flag('quiz-5') },
  { id: 'masomenos-10', icon: '↕️', title: 'Máquina del tiempo', desc: 'Llega a 10/10 en ¿Antes o después?', check: flag('masomenos-10') },
  { id: 'memoria-perfect', icon: '🃏', title: 'Memoria de elefante', desc: 'Completa Memoria en 12 movimientos o menos.', check: flag('memoria-perfect') },
  { id: 'heardle-1', icon: '🎧', title: 'Oído absoluto', desc: 'Acierta una canción del Heardle con solo 1 segundo.', check: flag('heardle-1') },
  { id: 'heardle-perfect', icon: '💿', title: 'Disco de oro', desc: 'Acierta las 5 canciones de un género del Heardle.', check: flag('heardle-perfect') },
  {
    id: 'heardle-gira',
    icon: '🌍',
    title: 'Gira mundial',
    desc: `Completa los ${HEARDLE_COUNT} géneros del Heardle el mismo día.`,
    check: (s) => {
      const runs = MINIGAMES.filter((m) => m.parent === 'heardle').map((m) => s.runs[m.id]);
      const day = runs[0]?.day;
      return runs.every((r) => r && r.status !== 'playing' && r.day === day);
    },
  },
  { id: 'quiencanta-5', icon: '📻', title: 'Shazam humano', desc: 'Acierta los 5 artistas de ¿Quién canta?', check: flag('quiencanta-5') },
  {
    id: 'melomana',
    icon: '🎵',
    title: 'Melomanía',
    desc: `Gana todos los retos de música el mismo día (incluidos los ${HEARDLE_COUNT} Heardle).`,
    check: (s) => {
      const music = MINIGAMES.filter((m) => m.category === 'Música').map((m) => s.runs[m.id]);
      const day = music[0]?.day;
      return music.every((r) => r?.status === 'won' && r.day === day);
    },
  },
  { id: 'paises-25', icon: '🌍', title: 'Atlas humano', desc: 'Consigue 25 aciertos en ¿Cuál es más grande?', check: flag('paises-25') },
  { id: 'aim-fast', icon: '🎯', title: 'Reflejos de pro', desc: 'Termina Rage Aim en menos de 10 segundos.', check: flag('aim-fast') },
];

/** Devuelve el estado con los logros nuevos añadidos (puro). */
export function withAchievements(s: SaveState): SaveState {
  const fresh = ACHIEVEMENTS.filter((a) => !s.achievements.includes(a.id) && a.check(s)).map((a) => a.id);
  return fresh.length ? { ...s, achievements: [...s.achievements, ...fresh] } : s;
}
