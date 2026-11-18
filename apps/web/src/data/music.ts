/**
 * 🎵 Catálogo musical.
 *
 * El audio son las previas oficiales de 30 s de Apple Music (API pública de iTunes).
 * `trackId` apunta a la versión ORIGINAL de cada canción: la búsqueda de Apple suele devolver
 * antes versiones de karaoke o nanas, así que no busques por nombre, usa el id.
 * Para añadir una canción, busca su id en music.apple.com (el número tras "?i=" en el enlace).
 */

export interface Song {
  id: string;
  title: string;
  /** Artista tal como sale en los créditos. */
  artist: string;
  /** Artista principal, para las opciones de "¿Quién canta?" (deben ser distintos entre sí). */
  main: string;
  year: number;
  trackId: number;
  /** 5 pistas para el Emoji musical, de más difícil a más fácil. */
  clues: [string, string, string, string, string];
}

export const SONGS: Song[] = [
  { id: 'despacito', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', main: 'Luis Fonsi', year: 2017, trackId: 1447401620, clues: ['🌴', '💃', '🎤', '🐢', '🐌'] },
  { id: 'titi', title: 'Tití Me Preguntó', artist: 'Bad Bunny', main: 'Bad Bunny', year: 2022, trackId: 1622045635, clues: ['☀️', '🐰', '💑', '❓', '👩‍🦳'] },
  { id: 'me-porto-bonito', title: 'Me Porto Bonito', artist: 'Bad Bunny y Chencho Corleone', main: 'Bad Bunny', year: 2022, trackId: 1622045634, clues: ['🐰', '😈', '➡️', '😇', '✨'] },
  { id: 'dakiti', title: 'DÁKITI', artist: 'Bad Bunny y Jhayco', main: 'Bad Bunny', year: 2020, trackId: 1542103620, clues: ['🌙', '🐰', '🌊', '🏝️', '💃'] },
  { id: 'tusa', title: 'Tusa', artist: 'KAROL G y Nicki Minaj', main: 'KAROL G', year: 2019, trackId: 1485476561, clues: ['🍾', '👯‍♀️', '😢', '🎀', '💔'] },
  { id: 'provenza', title: 'PROVENZA', artist: 'KAROL G', main: 'KAROL G', year: 2022, trackId: 1670245875, clues: ['☀️', '🚗', '🌾', '💜', '🇫🇷'] },
  { id: 'bzrp53', title: 'Shakira: Bzrp Music Sessions, Vol. 53', artist: 'Bizarrap y Shakira', main: 'Bizarrap', year: 2023, trackId: 1660098823, clues: ['🎛️', '🧢', '🐺', '⌚', '🏎️'] },
  { id: 'quevedo52', title: 'Quevedo: Bzrp Music Sessions, Vol. 52', artist: 'Bizarrap y Quevedo', main: 'Bizarrap', year: 2022, trackId: 1632746802, clues: ['🌃', '🎛️', '🧢', '🏝️', '🙏'] },
  { id: 'la-bachata', title: 'La Bachata', artist: 'Manuel Turizo', main: 'Manuel Turizo', year: 2022, trackId: 1624563284, clues: ['🌹', '🎸', '💔', '🕺', '💃'] },
  { id: 'gasolina', title: 'Gasolina', artist: 'Daddy Yankee', main: 'Daddy Yankee', year: 2004, trackId: 1786000124, clues: ['🔥', '💃', '🏎️', '🛢️', '⛽'] },
  { id: 'hips', title: "Hips Don't Lie", artist: 'Shakira ft. Wyclef Jean', main: 'Shakira', year: 2006, trackId: 1817217063, clues: ['🎺', '🌍', '🕺', '💃', '🤥'] },
  { id: 'waka', title: 'Waka Waka', artist: 'Shakira', main: 'Shakira', year: 2010, trackId: 371784883, clues: ['🦁', '🥁', '🌍', '🏆', '⚽'] },
  { id: 'bailando', title: 'Bailando', artist: 'Enrique Iglesias', main: 'Enrique Iglesias', year: 2014, trackId: 1443206483, clues: ['🇨🇺', '🎸', '❤️', '🔥', '💃'] },
  { id: 'vivir-mi-vida', title: 'Vivir Mi Vida', artist: 'Marc Anthony', main: 'Marc Anthony', year: 2013, trackId: 668743167, clues: ['🎺', '🥁', '🎉', '😄', '🌞'] },
  { id: 'malamente', title: 'MALAMENTE', artist: 'ROSALÍA', main: 'ROSALÍA', year: 2018, trackId: 1386337708, clues: ['🔮', '🐂', '👏', '💅', '⚠️'] },
  { id: 'despecha', title: 'DESPECHÁ', artist: 'ROSALÍA', main: 'ROSALÍA', year: 2022, trackId: 1636782444, clues: ['🏖️', '🍹', '😎', '💃', '💔'] },
  { id: 'ella-baila-sola', title: 'Ella Baila Sola', artist: 'Eslabon Armado y Peso Pluma', main: 'Peso Pluma', year: 2023, trackId: 1677446410, clues: ['🤠', '🎸', '🌙', '💃', '1️⃣'] },
  { id: 'mi-gente', title: 'Mi Gente', artist: 'J Balvin y Willy William', main: 'J Balvin', year: 2017, trackId: 1368816792, clues: ['🌍', '📢', '🔊', '💃', '👥'] },
  { id: 'hawai', title: 'Hawái', artist: 'Maluma', main: 'Maluma', year: 2020, trackId: 1523698843, clues: ['📸', '💔', '🌺', '✈️', '🏝️'] },
  { id: 'blinding', title: 'Blinding Lights', artist: 'The Weeknd', main: 'The Weeknd', year: 2019, trackId: 1499378607, clues: ['🌃', '🚗', '😎', '💡', '🔦'] },
  { id: 'shape', title: 'Shape of You', artist: 'Ed Sheeran', main: 'Ed Sheeran', year: 2017, trackId: 1193701392, clues: ['🍺', '💃', '🛏️', '💪', '🔷'] },
  { id: 'bad-guy', title: 'bad guy', artist: 'Billie Eilish', main: 'Billie Eilish', year: 2019, trackId: 1450695739, clues: ['💚', '🤫', '😏', '🦹', '😈'] },
  { id: 'levitating', title: 'Levitating', artist: 'Dua Lipa', main: 'Dua Lipa', year: 2020, trackId: 1538003843, clues: ['🪩', '✨', '🌙', '🧚', '🎈'] },
  { id: 'as-it-was', title: 'As It Was', artist: 'Harry Styles', main: 'Harry Styles', year: 2022, trackId: 1615585008, clues: ['🔴', '🎹', '👋', '🔁', '⏳'] },
  { id: 'flowers', title: 'Flowers', artist: 'Miley Cyrus', main: 'Miley Cyrus', year: 2023, trackId: 1674691586, clues: ['✍️', '🏖️', '💔', '🌸', '💐'] },
  { id: 'anti-hero', title: 'Anti-Hero', artist: 'Taylor Swift', main: 'Taylor Swift', year: 2022, trackId: 1649434293, clues: ['🌙', '🪞', '👻', '⚠️', '🦹'] },
  { id: 'drivers', title: 'drivers license', artist: 'Olivia Rodrigo', main: 'Olivia Rodrigo', year: 2021, trackId: 1560735480, clues: ['🏠', '🚦', '😭', '💔', '🚗'] },
  { id: 'uptown', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', main: 'Mark Ronson', year: 2014, trackId: 943946671, clues: ['🏙️', '🎷', '🔥', '🕺', '🎺'] },
  { id: 'rolling', title: 'Rolling in the Deep', artist: 'Adele', main: 'Adele', year: 2010, trackId: 1544491233, clues: ['🔥', '🎹', '💔', '🌊', '🎳'] },
  { id: 'believer', title: 'Believer', artist: 'Imagine Dragons', main: 'Imagine Dragons', year: 2017, trackId: 1411628233, clues: ['😣', '🥁', '⚡', '💥', '🙏'] },
  { id: 'dynamite', title: 'Dynamite', artist: 'BTS', main: 'BTS', year: 2020, trackId: 1627575419, clues: ['🌟', '🕺', '🎆', '💥', '🧨'] },
  { id: 'how-you-like', title: 'How You Like That', artist: 'BLACKPINK', main: 'BLACKPINK', year: 2020, trackId: 1533894669, clues: ['👑', '👊', '❓', '🖤', '💗'] },
  { id: 'espresso', title: 'Espresso', artist: 'Sabrina Carpenter', main: 'Sabrina Carpenter', year: 2024, trackId: 1752214923, clues: ['🌞', '😏', '💤', '🫘', '☕'] },
  { id: 'die-with-a-smile', title: 'Die With A Smile', artist: 'Lady Gaga y Bruno Mars', main: 'Lady Gaga', year: 2024, trackId: 1762656732, clues: ['🌎', '🎸', '💑', '💀', '😊'] },
  { id: 'bohemian', title: 'Bohemian Rhapsody', artist: 'Queen', main: 'Queen', year: 1975, trackId: 6781024437, clues: ['🎭', '⚡', '🎹', '🔫', '👑'] },
  { id: 'teen-spirit', title: 'Smells Like Teen Spirit', artist: 'Nirvana', main: 'Nirvana', year: 1991, trackId: 1440783625, clues: ['🤘', '🎸', '🧴', '🧑‍🎤', '👃'] },
  { id: 'brightside', title: 'Mr. Brightside', artist: 'The Killers', main: 'The Killers', year: 2003, trackId: 1440891171, clues: ['🎸', '💔', '🚬', '🔦', '☀️'] },
  { id: 'viva-la-vida', title: 'Viva la Vida', artist: 'Coldplay', main: 'Coldplay', year: 2008, trackId: 1122773680, clues: ['🎻', '🔔', '⚔️', '🎉', '👑'] },
  { id: 'in-the-end', title: 'In the End', artist: 'Linkin Park', main: 'Linkin Park', year: 2001, trackId: 590431785, clues: ['🎹', '🧱', '🤘', '⏳', '🔚'] },
  { id: 'do-i-wanna-know', title: 'Do I Wanna Know?', artist: 'Arctic Monkeys', main: 'Arctic Monkeys', year: 2013, trackId: 663097965, clues: ['🌃', '🍸', '📞', '❓', '🐒'] },
  { id: 'get-lucky', title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell Williams', main: 'Daft Punk', year: 2013, trackId: 617154366, clues: ['🌅', '🎸', '🎲', '🤖', '🍀'] },
  { id: 'billie-jean', title: 'Billie Jean', artist: 'Michael Jackson', main: 'Michael Jackson', year: 1983, trackId: 269573364, clues: ['🧤', '👶', '🚶', '💡', '🕺'] },
  { id: 'idol', title: 'Idol', artist: 'YOASOBI', main: 'YOASOBI', year: 2023, trackId: 1679278167, clues: ['👁️', '🎀', '🎤', '⭐', '🌟'] },
  { id: 'gurenge', title: 'Gurenge', artist: 'LiSA', main: 'LiSA', year: 2019, trackId: 1529543135, clues: ['🌸', '🧣', '🔥', '👹', '🗡️'] },
  { id: 'megalovania', title: 'Megalovania', artist: 'Toby Fox', main: 'Toby Fox', year: 2015, trackId: 6813343186, clues: ['⚔️', '💙', '😁', '🦴', '💀'] },
  { id: 'sweden', title: 'Sweden', artist: 'C418', main: 'C418', year: 2011, trackId: 1867885632, clues: ['🌅', '🎹', '🐷', '🧱', '⛏️'] },
];

export const SONGS_BY_ID: Record<string, Song> = Object.fromEntries(SONGS.map((s) => [s.id, s]));
export const songById = (id: string) => SONGS_BY_ID[id]!;

/* ───────────── Artistas (Artistdle) ───────────── */

export type Region = 'Latinoamérica' | 'Norteamérica' | 'Europa' | 'Asia';
export type Format = 'Solista' | 'Dúo' | 'Grupo';
/** Voz principal del artista o grupo (Mixta = voces masculinas y femeninas). */
export type Voice = 'Masculina' | 'Femenina' | 'Mixta';

export interface Artist {
  id: string;
  name: string;
  country: string;
  region: Region;
  genre: string;
  /** Década en la que empezó su carrera musical. */
  decade: number;
  format: Format;
  voice: Voice;
  languages: string[];
}

const ES = ['Español'];
const EN = ['Inglés'];

export const ARTISTS: Artist[] = [
  { id: 'bad-bunny', name: 'Bad Bunny', country: 'Puerto Rico', region: 'Latinoamérica', genre: 'Urbano latino', decade: 2010, format: 'Solista', voice: 'Masculina', languages: ES },
  { id: 'karol-g', name: 'KAROL G', country: 'Colombia', region: 'Latinoamérica', genre: 'Urbano latino', decade: 2000, format: 'Solista', voice: 'Femenina', languages: ES },
  { id: 'shakira', name: 'Shakira', country: 'Colombia', region: 'Latinoamérica', genre: 'Pop latino', decade: 1990, format: 'Solista', voice: 'Femenina', languages: ['Español', 'Inglés'] },
  { id: 'daddy-yankee', name: 'Daddy Yankee', country: 'Puerto Rico', region: 'Latinoamérica', genre: 'Urbano latino', decade: 1990, format: 'Solista', voice: 'Masculina', languages: ES },
  { id: 'luis-fonsi', name: 'Luis Fonsi', country: 'Puerto Rico', region: 'Latinoamérica', genre: 'Pop latino', decade: 1990, format: 'Solista', voice: 'Masculina', languages: ES },
  { id: 'j-balvin', name: 'J Balvin', country: 'Colombia', region: 'Latinoamérica', genre: 'Urbano latino', decade: 2000, format: 'Solista', voice: 'Masculina', languages: ES },
  { id: 'maluma', name: 'Maluma', country: 'Colombia', region: 'Latinoamérica', genre: 'Urbano latino', decade: 2010, format: 'Solista', voice: 'Masculina', languages: ES },
  { id: 'manuel-turizo', name: 'Manuel Turizo', country: 'Colombia', region: 'Latinoamérica', genre: 'Urbano latino', decade: 2010, format: 'Solista', voice: 'Masculina', languages: ES },
  { id: 'bizarrap', name: 'Bizarrap', country: 'Argentina', region: 'Latinoamérica', genre: 'Urbano latino', decade: 2010, format: 'Solista', voice: 'Masculina', languages: ES },
  { id: 'peso-pluma', name: 'Peso Pluma', country: 'México', region: 'Latinoamérica', genre: 'Regional mexicano', decade: 2020, format: 'Solista', voice: 'Masculina', languages: ES },
  { id: 'rosalia', name: 'ROSALÍA', country: 'España', region: 'Europa', genre: 'Pop', decade: 2010, format: 'Solista', voice: 'Femenina', languages: ES },
  { id: 'enrique', name: 'Enrique Iglesias', country: 'España', region: 'Europa', genre: 'Pop latino', decade: 1990, format: 'Solista', voice: 'Masculina', languages: ['Español', 'Inglés'] },
  { id: 'marc-anthony', name: 'Marc Anthony', country: 'EE. UU.', region: 'Norteamérica', genre: 'Salsa', decade: 1980, format: 'Solista', voice: 'Masculina', languages: ['Español', 'Inglés'] },
  { id: 'the-weeknd', name: 'The Weeknd', country: 'Canadá', region: 'Norteamérica', genre: 'R&B', decade: 2010, format: 'Solista', voice: 'Masculina', languages: EN },
  { id: 'ed-sheeran', name: 'Ed Sheeran', country: 'Reino Unido', region: 'Europa', genre: 'Pop', decade: 2000, format: 'Solista', voice: 'Masculina', languages: EN },
  { id: 'billie-eilish', name: 'Billie Eilish', country: 'EE. UU.', region: 'Norteamérica', genre: 'Pop', decade: 2010, format: 'Solista', voice: 'Femenina', languages: EN },
  { id: 'dua-lipa', name: 'Dua Lipa', country: 'Reino Unido', region: 'Europa', genre: 'Pop', decade: 2010, format: 'Solista', voice: 'Femenina', languages: EN },
  { id: 'harry-styles', name: 'Harry Styles', country: 'Reino Unido', region: 'Europa', genre: 'Pop', decade: 2010, format: 'Solista', voice: 'Masculina', languages: EN },
  { id: 'taylor-swift', name: 'Taylor Swift', country: 'EE. UU.', region: 'Norteamérica', genre: 'Pop', decade: 2000, format: 'Solista', voice: 'Femenina', languages: EN },
  { id: 'miley-cyrus', name: 'Miley Cyrus', country: 'EE. UU.', region: 'Norteamérica', genre: 'Pop', decade: 2000, format: 'Solista', voice: 'Femenina', languages: EN },
  { id: 'olivia-rodrigo', name: 'Olivia Rodrigo', country: 'EE. UU.', region: 'Norteamérica', genre: 'Pop', decade: 2020, format: 'Solista', voice: 'Femenina', languages: EN },
  { id: 'adele', name: 'Adele', country: 'Reino Unido', region: 'Europa', genre: 'Pop', decade: 2000, format: 'Solista', voice: 'Femenina', languages: EN },
  { id: 'lady-gaga', name: 'Lady Gaga', country: 'EE. UU.', region: 'Norteamérica', genre: 'Pop', decade: 2000, format: 'Solista', voice: 'Femenina', languages: EN },
  { id: 'sabrina-carpenter', name: 'Sabrina Carpenter', country: 'EE. UU.', region: 'Norteamérica', genre: 'Pop', decade: 2010, format: 'Solista', voice: 'Femenina', languages: EN },
  { id: 'michael-jackson', name: 'Michael Jackson', country: 'EE. UU.', region: 'Norteamérica', genre: 'Pop', decade: 1960, format: 'Solista', voice: 'Masculina', languages: EN },
  { id: 'imagine-dragons', name: 'Imagine Dragons', country: 'EE. UU.', region: 'Norteamérica', genre: 'Rock', decade: 2000, format: 'Grupo', voice: 'Masculina', languages: EN },
  { id: 'queen', name: 'Queen', country: 'Reino Unido', region: 'Europa', genre: 'Rock', decade: 1970, format: 'Grupo', voice: 'Masculina', languages: EN },
  { id: 'nirvana', name: 'Nirvana', country: 'EE. UU.', region: 'Norteamérica', genre: 'Rock', decade: 1980, format: 'Grupo', voice: 'Masculina', languages: EN },
  { id: 'the-killers', name: 'The Killers', country: 'EE. UU.', region: 'Norteamérica', genre: 'Rock', decade: 2000, format: 'Grupo', voice: 'Masculina', languages: EN },
  { id: 'coldplay', name: 'Coldplay', country: 'Reino Unido', region: 'Europa', genre: 'Rock', decade: 1990, format: 'Grupo', voice: 'Masculina', languages: EN },
  { id: 'linkin-park', name: 'Linkin Park', country: 'EE. UU.', region: 'Norteamérica', genre: 'Rock', decade: 1990, format: 'Grupo', voice: 'Masculina', languages: EN },
  { id: 'arctic-monkeys', name: 'Arctic Monkeys', country: 'Reino Unido', region: 'Europa', genre: 'Rock', decade: 2000, format: 'Grupo', voice: 'Masculina', languages: EN },
  { id: 'daft-punk', name: 'Daft Punk', country: 'Francia', region: 'Europa', genre: 'Electrónica', decade: 1990, format: 'Dúo', voice: 'Masculina', languages: EN },
  { id: 'bts', name: 'BTS', country: 'Corea del Sur', region: 'Asia', genre: 'K-pop', decade: 2010, format: 'Grupo', voice: 'Masculina', languages: ['Coreano', 'Inglés'] },
  { id: 'blackpink', name: 'BLACKPINK', country: 'Corea del Sur', region: 'Asia', genre: 'K-pop', decade: 2010, format: 'Grupo', voice: 'Femenina', languages: ['Coreano', 'Inglés'] },
  { id: 'yoasobi', name: 'YOASOBI', country: 'Japón', region: 'Asia', genre: 'J-pop', decade: 2010, format: 'Dúo', voice: 'Mixta', languages: ['Japonés'] },
  { id: 'lisa', name: 'LiSA', country: 'Japón', region: 'Asia', genre: 'J-pop', decade: 2010, format: 'Solista', voice: 'Femenina', languages: ['Japonés'] },
];

export const ARTISTS_BY_ID: Record<string, Artist> = Object.fromEntries(ARTISTS.map((a) => [a.id, a]));
