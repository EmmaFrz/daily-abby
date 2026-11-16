import { createElement, type ComponentType } from 'react';
import { AVAILABLE_GENRES } from '../data/heardleGenres';
import { Ahorcado } from './Ahorcado';
import { Aim } from './Aim';
import { Anagrama } from './Anagrama';
import { Anodle } from './Anodle';
import { Conexiones } from './Conexiones';
import { Cronologia } from './Cronologia';
import { Emojidle } from './Emojidle';
import { Gamedle } from './Gamedle';
import { MasOMenos } from './MasOMenos';
import { Memoria } from './Memoria';
import { Palabrdle } from './Palabrdle';
import { Pixeldle } from './Pixeldle';
import { Quiz } from './Quiz';
import { Wordle } from './Wordle';
import { Artistdle } from './music/Artistdle';
import { EmojiCancion } from './music/EmojiCancion';
import { HeardleGenre } from './music/Heardle';
import { QuienCanta } from './music/QuienCanta';

/** id del minijuego → componente. Los datos (nombre, icono…) están en meta.ts. */
export const MINIGAME_COMPONENTS: Record<string, ComponentType> = {
  gamedle: Gamedle,
  emojidle: Emojidle,
  pixeldle: Pixeldle,
  anodle: Anodle,
  wordle: Wordle,
  palabrdle: Palabrdle,
  ahorcado: Ahorcado,
  anagrama: Anagrama,
  // Un Heardle por género (heardle-pop, heardle-latino…)
  ...Object.fromEntries(
    AVAILABLE_GENRES.map((g) => {
      const C = () => createElement(HeardleGenre, { genre: g.id });
      C.displayName = `Heardle-${g.id}`;
      return [`heardle-${g.id}`, C];
    }),
  ),
  quiencanta: QuienCanta,
  artistdle: Artistdle,
  emojicancion: EmojiCancion,
  conexiones: Conexiones,
  cronologia: Cronologia,
  quiz: Quiz,
  masomenos: MasOMenos,
  memoria: Memoria,
  aim: Aim,
};
