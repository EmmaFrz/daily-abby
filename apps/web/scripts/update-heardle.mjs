#!/usr/bin/env node
/**
 * Actualiza el catálogo del Heardle por géneros con los éxitos de Apple Music (iTunes).
 *
 *   npm run musica:actualizar            → todos los géneros
 *   npm run musica:actualizar -- edm     → solo los géneros indicados (el resto se conserva)
 *
 *   npm run musica:actualizar -- --dry   → solo muestra qué canciones pasarían el filtro (sin iTunes ni guardar)
 *
 * Por cada género:
 *  1. Busca los "clásicos" de ANCHORS en el catálogo de cada artista (versión original).
 *  2. Toma candidatas de playlists editoriales de Deezer (éxitos de varias décadas) y de los primeros
 *     puestos de las listas "Top Songs" de Apple (novedades).
 *  3. Filtro de renombre (API pública de Deezer, sin clave): el artista debe tener muchos fans y la canción
 *     debe estar entre las más escuchadas de ese artista. Así no se cuelan desconocidos ni "caras B".
 *  4. Busca cada candidata en iTunes (la previa sale de Apple) y se queda con su edición más antigua.
 * Descarta karaokes, covers, remixes, villancicos y duplicados, y guarda el resultado en src/data/heardle-charts.json.
 * El juego usa esa "foto" para que todo el mundo reciba las mismas canciones cada día.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'heardle-charts.json');
const MAX_PER_GENRE = 150;
/** Solo los primeros puestos de las listas de ventas de Apple: más abajo hay sobre todo relleno. */
const CHART_TOP = 25;
/** Fans mínimos en Deezer del artista de una novedad de Apple. */
const MIN_FANS = 300_000;
/** Fans mínimos del artista de una canción de playlist editorial (ya elegida como éxito). */
const MIN_FANS_LIST = 100_000;
/** Una novedad de Apple debe estar entre las N canciones más escuchadas del artista en Deezer. */
const TOP_N = 15;

/**
 * Por género del juego:
 *  - apple: ids de género de Apple para la lista "Top Songs" (novedades).
 *  - stores: tiendas de Apple donde mirar esa lista y buscar las canciones (la primera es la preferida).
 *  - deezer: playlists editoriales de Deezer (éxitos de varias décadas).
 *  - minFans / topN: para afinar el filtro de renombre en un género.
 */
const GENRES = {
  pop: {
    apple: [14],
    stores: ['us', 'gb'],
    // Pop Essentials, 80s Hits, 90s Hits, 00s Hits, 00s Pop, 10s Hits, 10s Pop
    deezer: [1036183001, 867825522, 878989033, 248297032, 8326097522, 14917741483, 8282573142],
  },
  latino: {
    apple: [12, 1119],
    stores: ['us', 'mx'],
    // Reggaeton Classics, Fuego Latino Essentials, Latin Classics, 00s/10s/20s Latin Music, Esenciales Pop en español, Reggaeton Hits
    deezer: [789123393, 13288040963, 5104249748, 6987556164, 5174094184, 13668653381, 9185904182, 1273315391],
  },
  rock: {
    apple: [21],
    stores: ['us', 'gb'],
    // Rock Essentials, Modern Rock Essentials, Hard Rock Essentials, 80s Rock, 90s Rock, 2000s Rock, 2010s Rock, Grunge Essentials
    deezer: [1306931615, 11335739484, 761604441, 8621268482, 1728093421, 1419215845, 1057779131, 1431800665],
  },
  hiphop: {
    apple: [18],
    stores: ['us'],
    // East Coast Essentials, West Coast Essentials, '90s Rap, 2000s Rap, '10s Rap, 2020s Rap, Rap Bangers
    deezer: [1976915302, 2979302822, 1724212365, 4676818664, 7662551722, 12547421383, 1996494362],
  },
  kpop: {
    apple: [51],
    stores: ['us'],
    // K-Pop Essentials, Top K-Pop, 2010s K-Pop Hits, K-Pop 2nd/3rd/4th Generation
    deezer: [873660353, 4096400722, 9001527742, 10738561582, 11012274682, 11012482922],
    // Los fandoms de K-Pop están en otras plataformas: en Deezer tienen muchos menos fans que en Occidente.
    minFansList: 30_000,
    minFans: 100_000,
  },
  edm: {
    apple: [17, 7], // Dance + Electronic
    stores: ['us', 'gb'],
    // Electronic Hits, Dance Essentials, 90s Dance, 00s Dance, 10s Dance, Dance Party Classics
    // (la de festival "Mainstage" traía temas poco conocidos)
    deezer: [1902101402, 4613753548, 4135981802, 4135818362, 2159765062, 6237312204],
  },
  // Sin listas: solo la selección de ANCHORS (artistas de España).
  espana: { apple: [], stores: ['es'], deezer: [] },
  // Apple tiene el subgénero "Video Game" (100032), pero su lista trae sobre todo versiones de fans y pistas
  // poco conocidas. Para que se pueda adivinar, solo usamos la selección de ANCHORS (versiones originales).
  juegos: { apple: [], stores: ['us'], deezer: [] },
};

/** Tienda donde buscar los clásicos de cada género (por defecto EE. UU.). */
const ANCHOR_STORE = { espana: 'es' };

/**
 * Clásicos que siempre entran en el género (van primero), como [artista, título].
 * Útil cuando las listas de ventas traen sobre todo novedades poco conocidas.
 */
const ANCHORS = {
  edm: [
    ['Avicii', 'Levels'],
    ['Avicii', 'Wake Me Up'],
    ['Avicii', 'The Nights'],
    ['Avicii', 'Waiting For Love'],
    ['David Guetta', 'Titanium'],
    ['David Guetta', "Baby Don't Hurt Me"],
    ['Martin Garrix', 'Animals'],
    ['Major Lazer', 'Lean On'],
    ['Zedd', 'Clarity'],
    ['Swedish House Mafia', "Don't You Worry Child"],
    ['Calvin Harris', 'Summer'],
    ['Calvin Harris', 'One Kiss'],
    ['Calvin Harris', 'This Is What You Came For'],
    ['Alan Walker', 'Faded'],
    ['The Chainsmokers', 'Closer'],
    ['The Chainsmokers', 'Something Just Like This'],
    ['Skrillex', 'Scary Monsters and Nice Sprites'],
    ['Skrillex', 'Where Are U Now'],
    ['DJ Snake', 'Turn Down for What'],
    ['Darude', 'Sandstorm'],
    ['deadmau5', 'Strobe'],
    ['Daft Punk', 'One More Time'],
    ['Daft Punk', 'Harder, Better, Faster, Stronger'],
    ['Eiffel 65', 'Blue'],
    ['Disclosure', 'Latch'],
    ['FISHER', 'Losing It'],
    ['Kygo', 'Firestone'],
    ['Marshmello', 'Alone'],
    ['Marshmello', 'Happier'],
    ['Tiësto', 'The Business'],
  ],
  // Canciones y bandas sonoras de videojuegos conocidas (versión original del compositor o del juego),
  // como [artista, título, juego]: en este género se adivina el juego, no el título.
  // No están en Apple con su versión original: Still Alive, Live & Learn, To Zanarkand, Subwoofer Lullaby…
  juegos: [
    ['Toby Fox', 'Megalovania', 'Undertale'], ['Toby Fox', 'Hopes and Dreams', 'Undertale'], ['Toby Fox', 'Undertale', 'Undertale'], ['Toby Fox', 'Fallen Down', 'Undertale'],
    ['Toby Fox', 'Spider Dance', 'Undertale'], ['Toby Fox', 'Death by Glamour', 'Undertale'], ['Toby Fox', 'Bonetrousle', 'Undertale'], ['Toby Fox', 'Rude Buster', 'Deltarune'],
    ['Toby Fox', 'Field of Hopes and Dreams', 'Deltarune'], ['Toby Fox', 'BIG SHOT', 'Deltarune'], ['Toby Fox', 'THE WORLD REVOLVING', 'Deltarune'],
    ['C418', 'Sweden', 'Minecraft'], ['C418', 'Wet Hands', 'Minecraft'], ['C418', 'Living Mice', 'Minecraft'], ['C418', 'Mice on Venus', 'Minecraft'],
    ['C418', 'Haggstrom', 'Minecraft'], ['C418', 'Danny', 'Minecraft'], ['C418', 'Moog City', 'Minecraft'],
    ['Lena Raine', 'Resurrections', 'Celeste'], ['Lena Raine', 'First Steps', 'Celeste'], ['Lena Raine', 'Reach for the Summit', 'Celeste'], ['Lena Raine', 'Pigstep', 'Minecraft'],
    ['Christopher Larkin', 'Hollow Knight', 'Hollow Knight'], ['Christopher Larkin', 'City of Tears', 'Hollow Knight'], ['Christopher Larkin', 'Dirtmouth', 'Hollow Knight'],
    ['Christopher Larkin', 'Greenpath', 'Hollow Knight'], ['Christopher Larkin', 'Sealed Vessel', 'Hollow Knight'], ['Christopher Larkin', 'Silksong', 'Hollow Knight: Silksong'],
    ['Darren Korb', 'In the Blood', 'Hades'], ['Darren Korb', 'Good Riddance', 'Hades'], ['Darren Korb', 'Build That Wall', 'Bastion'], ['Darren Korb', 'Out of Tartarus', 'Hades'],
    ['Andrew Prahlow', 'Travelers', 'Outer Wilds'], ['Andrew Prahlow', 'Outer Wilds', 'Outer Wilds'], ['Andrew Prahlow', 'Timber Hearth', 'Outer Wilds'],
    ['ConcernedApe', 'Stardew Valley Overture', 'Stardew Valley'], ['ConcernedApe', 'Cloud Country', 'Stardew Valley'],
    ['Kristofer Maddigan', 'Floral Fury', 'Cuphead'], ['Kristofer Maddigan', 'Inkwell Isle One', 'Cuphead'],
    ['Gareth Coker', 'Light of Nibel', 'Ori and the Blind Forest'], ['Austin Wintory', 'Apotheosis', 'Journey'],
    ['Jeremy Soule', 'Dragonborn', 'Skyrim'], ['Jeremy Soule', 'Far Horizons', 'Skyrim'], ['Jeremy Soule', 'Secunda', 'Skyrim'], ['Jeremy Soule', 'Sovngarde', 'Skyrim'],
    ['Jeremy Soule', 'The Streets of Whiterun', 'Skyrim'],
    ['Mick Gordon', 'BFG Division', 'DOOM'], ['Mick Gordon', 'Rip & Tear', 'DOOM'], ['Mick Gordon', "At Doom's Gate", 'DOOM'],
    ['Nobuo Uematsu', 'One-Winged Angel', 'Final Fantasy'], ['Nobuo Uematsu', 'Prelude', 'Final Fantasy'], ['Nobuo Uematsu', "Aerith's Theme", 'Final Fantasy'],
    ['Nobuo Uematsu', 'Liberi Fatali', 'Final Fantasy'],
    ['Emiko Shiratori', 'Melodies of Life', 'Final Fantasy'], ['Faye Wong', 'Eyes On Me', 'Final Fantasy'],
    ['Hikaru Utada', 'Simple And Clean', 'Kingdom Hearts'], ['Hikaru Utada', 'Sanctuary', 'Kingdom Hearts'],
    ['Jonathan Coulton', 'Want You Gone', 'Portal 2'],
    ['Rosa Walton', 'I Really Want to Stay at Your House', 'Cyberpunk 2077'],
    ['Crush 40', 'Open Your Heart', 'Sonic Adventure'],
    ["Martin O'Donnell", 'Halo', 'Halo'], ['Cynthia Harrell', 'Snake Eater', 'Metal Gear Solid'],
    ['Akira Yamaoka', 'Promise', 'Silent Hill'], ['Akira Yamaoka', 'Theme of Laura', 'Silent Hill'],
    ['Motoi Sakuraba', 'Gwyn, Lord of Cinder', 'Dark Souls'],
    ['Borislav Slavov', 'Down by the River', "Baldur's Gate 3"],
    ['Jesper Kyd', "Ezio's Family", "Assassin's Creed"], ['Gustavo Santaolalla', 'The Last of Us', 'The Last of Us'], ['Bear McCreary', 'God of War', 'God of War'],
    ['Daniel Lanois', "That's the Way It Is", 'Red Dead Redemption 2'], ['Dan Salvato', 'Your Reality', 'Doki Doki Literature Club'],
    ['League of Legends', 'Legends Never Die', 'League of Legends'], ['League of Legends', 'Phoenix', 'League of Legends'],
    ['League of Legends', 'GODS', 'League of Legends'], ['League of Legends', 'Burn It All Down', 'League of Legends'], ['Imagine Dragons', 'Warriors', 'League of Legends'],
    ['K/DA', 'POP/STARS', 'League of Legends'], ['K/DA', 'MORE', 'League of Legends'], ['K/DA', 'THE BADDEST', 'League of Legends'], ['K/DA', 'DRUM GO DUM', 'League of Legends'],
    ['VALORANT', 'Die For You', 'VALORANT'], ['LINKIN PARK', 'Heavy Is the Crown', 'League of Legends'],
  ],
  // Solo artistas de España, de varias épocas.
  espana: [
    ['ROSALÍA', 'Malamente'], ['ROSALÍA', 'Con Altura'], ['ROSALÍA', 'DESPECHÁ'], ['ROSALÍA', 'SAOKO'], ['ROSALÍA', 'LA FAMA'],
    ['Quevedo', 'Columbia'], ['Quevedo', 'Punto G'], ['Quevedo', 'Playa del Inglés'],
    ['Aitana', 'Teléfono'], ['Aitana', 'Los Ángeles'], ['Aitana', 'Formentera'], ['Aitana', 'Las Babas'],
    ['Lola Indigo', 'Ya No Quiero Ná'], ['Lola Indigo', 'Mujer Bruja'],
    ['C. Tangana', 'Tú Me Dejaste De Querer'], ['C. Tangana', 'Demasiadas Mujeres'], ['C. Tangana', 'Comerte Entera'],
    ['Enrique Iglesias', 'Bailando'], ['Enrique Iglesias', 'Hero'], ['Enrique Iglesias', 'Duele el Corazón'], ['Enrique Iglesias', 'Experiencia Religiosa'],
    ['Alejandro Sanz', 'Corazón Partío'], ['Alejandro Sanz', 'Amiga Mía'], ['Alejandro Sanz', 'Looking for Paradise'],
    ['Pablo Alborán', 'Solamente Tú'], ['Pablo Alborán', 'Saturno'], ['Pablo Alborán', 'Prometo'],
    ['David Bisbal', 'Ave María'], ['David Bisbal', 'Bulería'],
    ['Melendi', 'Tu Jardín Con Enanitos'], ['Melendi', 'Caminando por la Vida'], ['Melendi', 'Lágrimas Desordenadas'],
    ['Estopa', 'Como Camarón'], ['Estopa', 'Vino Tinto'], ['Estopa', 'La Raja de Tu Falda'],
    ['La Oreja de Van Gogh', 'Rosas'], ['La Oreja de Van Gogh', 'La Playa'], ['La Oreja de Van Gogh', 'Puedes Contar Conmigo'],
    ['El Canto del Loco', 'Zapatillas'], ['El Canto del Loco', 'La Madre de José'], ['El Canto del Loco', 'Puede Ser'],
    ['Amaral', 'Sin Ti No Soy Nada'], ['Amaral', 'Como Hablar'], ['Amaral', 'El Universo Sobre Mí'],
    ['Mecano', 'Hijo de la Luna'], ['Mecano', 'Me Cuesta Tanto Olvidarte'], ['Mecano', 'La Fuerza del Destino'], ['Mecano', 'Cruz de Navajas'],
    ['Héroes del Silencio', 'Entre Dos Tierras'], ['Héroes del Silencio', 'Maldito Duende'],
    ['Los Del Río', 'Macarena'],
    ['Las Ketchup', 'Aserejé'],
    ['Camela', 'Cuando Zarpa el Amor'],
    ['Joaquín Sabina', '19 Días y 500 Noches'], ['Joaquín Sabina', 'Y Nos Dieron las Diez'],
    ['Fito y Fitipaldis', 'Soldadito Marinero'], ['Fito y Fitipaldis', 'Por la Boca Vive el Pez'],
    ['Extremoduro', 'So Payaso'],
    ['Rels B', 'A Mí'],
    ['Bad Gyal', 'Fiebre'],
    ['Omar Montes', 'Alocao'],
    ['Abraham Mateo', 'Loco Enamorado'],
    ['Ana Mena', 'Quiero Decirte'],
    ['Juan Magán', 'Bailando por Ahí'],
    ['Dani Martín', 'Cero'],
    ['Antonio Orozco', 'Devuélveme la Vida'],
    ['Malú', 'Aprendiz'],
    ['Rozalén', 'La Puerta Violeta'],
    ['Manuel Carrasco', 'Que Nadie'],
    ['Chanel', 'SloMo'],
    ['Nebulossa', 'ZORRA'],
    ['Dani Fernández', 'Me Has Invitado a Bailar'],
    ['Rocío Jurado', 'Como Una Ola'],
    ['Raphael', 'Mi Gran Noche'], ['Raphael', 'Escándalo'],
    ['Julio Iglesias', 'Me Olvidé de Vivir'], ['Julio Iglesias', 'Soy un Truhán, Soy un Señor'],
    ['Mónica Naranjo', 'Sobreviviré'],
    ['Marta Sánchez', 'Desesperada'],
    ['Hombres G', 'Devuélveme a Mi Chica'], ['Hombres G', 'Venecia'],
    ['Los Secretos', 'Déjame'],
    ['El Último de la Fila', 'Insurrección'],
    ['Nena Daconte', 'Tenía Tanto Que Darte'],
    ['Pignoise', 'Te Entiendo'],
    ['Café Quijano', 'La Lola'],
    ['Chenoa', 'Cuando Tú Vas'],
    ['La Casa Azul', 'La Revolución Sexual'],
    ['Vetusta Morla', 'Copenhague'],
    ['Izal', 'Copacabana'],
    ['Leiva', 'Terriblemente Cruel'],
    ['Taburete', 'Sirenas'],
    ['Mala Rodríguez', 'Quién Manda'],
    ['Sergio Dalma', 'Bailar Pegados'],
    ['Danza Invisible', 'Sabor de Amor'],
    ['Rosana', 'El Talismán'],
    ['Manolo García', 'Pájaros de Barro'],
    ['Love of Lesbian', 'Club de Fans de John Boy'],
    ['Bombai', 'Solo Si Es Contigo'],
    ['Bebe', 'Malo'],
    ['Mägo de Oz', 'Fiesta Pagana'],
    ['Ska-P', 'Cannabis'],
    ['Saiko', 'Supernova'],
    ['Melendi', 'Destino o Casualidad'],
    ['Pablo López', 'El Patio'],
    ['Vanesa Martín', 'Complicidad'],
  ],
};

/** Títulos o discos que delatan una versión que no es la original (o un villancico de temporada). */
const BAD =
  /karaoke|\bcover\b|tribute|instrumental|remix|rmx|\bversi[oó]n\b|\bversion\b|\blive\b|en vivo|en directo|sped up|slowed|lullaby|8[- ]bit|medley|acoustic|ac[uú]stic|kidz bop|8d audio|bass boosted|extended|nightcore|christmas|navidad|xmas|jingle bell|villancico|\bdemo\b|\bmixed\b|dj mix|cast recording/i;
/** Artistas que hacen versiones de canciones ajenas. */
const BAD_ARTIST = /karaoke|tribute|kidz bop|rockabye|lullaby|8d audio|nightcore|bass boosted|\bcovers?\b|string quartet|piano guys/i;
/** "(Deep House)", "(Afro House)", "(Techno Bootleg)"…: suelen ser versiones de otra canción. */
const BAD_TAG = /[([][^)\]]*\b(\w*house|techno|bootleg|rework|flip|phonk|hardstyle|vip)\b[^)\]]*[)\]]/i;
const isBad = (title, artist) => BAD.test(title) || BAD_ARTIST.test(artist) || BAD_TAG.test(title);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Deja solo el nombre de la canción: quita "(feat. X)", "[with X]", "(From …)",
 * "(2018 Remaster)", "[K-Mix]", "(Radio Edit)", "(Japanese Ver.)", "- Remastered 2011"…
 */
const EXTRA = /\b(?:feat|ft|with|con|from|remaster\w*|mix|edit|edited|clean|version|edition|anniversary|sessions?|official|single|bonus|prod|interludio|original)\b|\bver\./i;
const dropIfExtra = (m, inner) => (EXTRA.test(inner) ? '' : m);
const cleanTitle = (t) =>
  t
    .replace(/\s*\[([^\]]*)\]/g, dropIfExtra) // corchetes primero: pueden llevar paréntesis dentro
    .replace(/\s*\(([^)]*)\)/g, dropIfExtra)
    .replace(/\s+-\s+.*\b(remaster\w*|mix|edit|version)\b.*$/i, '')
    .trim();

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      console.warn(`  reintento (${e.message}): ${url}`);
      await sleep(4000);
    }
  }
  return null;
}

async function chart(store, genre) {
  const j = await getJson(`https://itunes.apple.com/${store}/rss/topsongs/limit=200/genre=${genre}/json`);
  return [].concat(j?.feed?.entry ?? []);
}

/** Catálogo de canciones de un artista (cacheado). */
const artistSongs = new Map();
async function songsOf(artist, store) {
  const key = `${store}:${artist}`;
  if (!artistSongs.has(key)) {
    const a = await getJson(`https://itunes.apple.com/search?${new URLSearchParams({ term: artist, entity: 'musicArtist', limit: '1', country: store })}`);
    await sleep(3200);
    const id = a?.results?.[0]?.artistId;
    const s = id ? await getJson(`https://itunes.apple.com/lookup?id=${id}&entity=song&limit=200&country=${store}`) : null;
    await sleep(3200);
    artistSongs.set(key, (s?.results ?? []).filter((r) => r.wrapperType === 'track' && r.previewUrl));
  }
  return artistSongs.get(key);
}

async function resolveAnchor(artist, title, store) {
  const want = norm(title);
  const hit = (await songsOf(artist, store)).find(
    (r) =>
      norm(r.trackName).startsWith(want) &&
      // La búsqueda de artista a veces devuelve a otro con una canción del mismo nombre.
      norm(r.artistName).includes(norm(artist)) &&
      !BAD.test(r.trackName) &&
      !BAD.test(r.collectionName ?? ''),
  );
  if (!hit) {
    console.warn(`  ✗ clásico no encontrado: ${artist} — ${title}`);
    return null;
  }
  return { t: cleanTitle(hit.trackName), a: hit.artistName, id: hit.trackId, c: store, y: Number(hit.releaseDate?.slice(0, 4)) || null };
}

/** Artista principal: "Bad Bunny & Jhay Cortez" → "Bad Bunny". */
const mainArtist = (a) => a.split(/,|&| x | y | feat\.? | ft\.? | with /i)[0].trim();
/** Mismo título, admitiendo coletillas: "levels" ≈ "levels radio edit". */
const sameTitle = (a, b) => a === b || a.startsWith(`${b} `) || b.startsWith(`${a} `);
const titleKey = (t) => norm(cleanTitle(t));

/** Busca una canción en iTunes por artista y título y devuelve su edición más antigua (no la de un recopilatorio). */
async function resolveSearch(artist, title, stores) {
  const want = titleKey(title);
  const who = norm(mainArtist(artist));
  for (const store of stores) {
    const j = await getJson(`https://itunes.apple.com/search?${new URLSearchParams({ term: `${mainArtist(artist)} ${cleanTitle(title)}`, entity: 'song', limit: '25', country: store })}`);
    await sleep(3200);
    const hits = (j?.results ?? [])
      .filter(
        (r) =>
          r.wrapperType === 'track' &&
          r.previewUrl &&
          sameTitle(titleKey(r.trackName), want) &&
          (norm(r.artistName).includes(who) || who.includes(norm(mainArtist(r.artistName)))) &&
          !isBad(r.trackName, r.artistName) &&
          !BAD.test(r.collectionName ?? ''),
      )
      .sort((a, b) => String(a.releaseDate).localeCompare(String(b.releaseDate)));
    const hit = hits[0];
    if (hit) return { t: cleanTitle(hit.trackName), a: hit.artistName, id: hit.trackId, c: store, y: Number(hit.releaseDate?.slice(0, 4)) || null };
  }
  // Con éxitos muy versionados ("Creep", "Boulevard of Broken Dreams") la búsqueda devuelve solo covers y karaokes:
  // entonces buscamos la canción en el catálogo del propio artista.
  for (const store of stores) {
    const hit = (await songsOf(mainArtist(artist), store))
      .filter(
        (r) =>
          sameTitle(titleKey(r.trackName), want) &&
          (norm(r.artistName).includes(who) || who.includes(norm(mainArtist(r.artistName)))) &&
          !isBad(r.trackName, r.artistName) &&
          !BAD.test(r.collectionName ?? ''),
      )
      .sort((a, b) => String(a.releaseDate).localeCompare(String(b.releaseDate)))[0];
    if (hit) return { t: cleanTitle(hit.trackName), a: hit.artistName, id: hit.trackId, c: store, y: Number(hit.releaseDate?.slice(0, 4)) || null };
  }
  return null;
}

/* ───────────── Deezer: filtro de renombre ───────────── */

let lastDeezer = 0;
/** API pública de Deezer (límite: 50 peticiones cada 5 s). */
async function deezer(path) {
  const wait = 130 - (Date.now() - lastDeezer);
  if (wait > 0) await sleep(wait);
  lastDeezer = Date.now();
  const j = await getJson(`https://api.deezer.com/${path}`);
  if (j?.error?.code === 4) {
    await sleep(5000); // cuota superada: esperamos y repetimos
    return deezer(path);
  }
  return j?.error ? null : j;
}

/** Fans y canciones más escuchadas de un artista de Deezer (cacheado). */
const dzArtists = new Map();
function dzArtist(id) {
  if (!dzArtists.has(id)) {
    dzArtists.set(
      id,
      (async () => {
        const a = await deezer(`artist/${id}`);
        const top = await deezer(`artist/${id}/top?limit=50`);
        const titles = [...new Set((top?.data ?? []).map((t) => titleKey(t.title_short ?? t.title)))];
        return { name: a?.name ?? '?', fans: a?.nb_fan ?? 0, top: titles };
      })(),
    );
  }
  return dzArtists.get(id);
}

/**
 * Id de Deezer de un artista por su nombre: de los perfiles con ese nombre exacto, el de más fans
 * (Deezer tiene perfiles duplicados casi vacíos). Prueba el nombre completo y luego el artista principal.
 */
const dzByName = new Map();
async function dzArtistId(name) {
  for (const q of [...new Set([name, mainArtist(name)])]) {
    const key = norm(q);
    if (!dzByName.has(key)) {
      const j = await deezer(`search/artist?limit=10&q=${encodeURIComponent(q)}`);
      const best = (j?.data ?? []).filter((a) => norm(a.name) === key).sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0))[0];
      dzByName.set(key, best?.id ?? null);
    }
    if (dzByName.get(key)) return dzByName.get(key);
  }
  return null;
}

/**
 * ¿Es una canción conocida? Devuelve null si pasa, o el motivo por el que no.
 *  - De una playlist editorial: el editor ya eligió el éxito; basta con que el artista sea conocido.
 *  - Novedad de Apple: además debe estar entre las más escuchadas del artista (el "top" de Deezer
 *    refleja lo que se escucha ahora, así que solo sirve para novedades).
 */
async function renown(c, cfg, editorial) {
  const ids = [...new Set([c.dzArtistId, await dzArtistId(c.a)].filter(Boolean))];
  if (!ids.length) return 'artista no está en Deezer';
  const infos = await Promise.all(ids.map(dzArtist));
  const info = infos.sort((a, b) => b.fans - a.fans)[0];
  const minFans = editorial ? (cfg.minFansList ?? MIN_FANS_LIST) : (cfg.minFans ?? MIN_FANS);
  if (info.fans < minFans) return `pocos fans (${info.fans.toLocaleString('es')})`;
  if (editorial) return null;
  const want = titleKey(c.t);
  const pos = info.top.findIndex((t) => sameTitle(t, want));
  if (pos < 0 || pos >= (cfg.topN ?? TOP_N)) return pos < 0 ? 'no está en el top del artista' : `puesto ${pos + 1} del artista`;
  return null;
}

/** Candidatas de una playlist de Deezer, de más a menos escuchada. */
async function playlistCandidates(id) {
  const j = await deezer(`playlist/${id}/tracks?limit=300`);
  return (j?.data ?? [])
    .filter((t) => t.readable !== false)
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
    .map((t) => ({ t: t.title_short ?? t.title, a: t.artist?.name ?? '', dzArtistId: t.artist?.id }));
}

/** Candidatas de los primeros puestos de la lista "Top Songs" de Apple (ya traen su trackId). */
async function appleCandidates(store, genre) {
  const entries = (await chart(store, genre)).slice(0, CHART_TOP);
  await sleep(1200);
  return entries
    .filter((e) => [].concat(e.link ?? []).some((l) => l.attributes?.rel === 'enclosure'))
    .map((e) => ({
      t: e['im:name']?.label ?? '',
      a: e['im:artist']?.label ?? '',
      id: Number(e.id?.attributes?.['im:id']) || null,
      c: store,
      y: Number(e['im:releaseDate']?.label?.slice(0, 4)) || null,
    }));
}

/* ───────────── Main ───────────── */

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const names = args.filter((a) => !a.startsWith('--'));
const only = names.filter((a) => a in GENRES);
const unknown = names.filter((a) => !(a in GENRES));
if (unknown.length) console.warn(`Géneros desconocidos (se ignoran): ${unknown.join(', ')}. Válidos: ${Object.keys(GENRES).join(', ')}`);
const targets = only.length ? only : Object.keys(GENRES);

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { genres: {} };
const result = { generatedAt: new Date().toISOString().slice(0, 10), genres: { ...previous.genres } };

for (const id of targets) {
  const cfg = GENRES[id];
  const songs = [];
  const seen = new Set();
  const keyOf = (s) => `${titleKey(s.t)}|${norm(mainArtist(s.a))}`;
  const add = (s) => {
    const key = keyOf(s);
    if (seen.has(key) || seen.has(String(s.id)) || songs.length >= MAX_PER_GENRE) return false;
    seen.add(key);
    seen.add(String(s.id));
    songs.push(s);
    return true;
  };

  if (!DRY) {
    for (const [artist, title, game] of ANCHORS[id] ?? []) {
      const s = await resolveAnchor(artist, title, ANCHOR_STORE[id] ?? 'us');
      if (s) add(game ? { ...s, g: game } : s);
    }
  }
  const anchors = DRY ? (ANCHORS[id] ?? []).length : songs.length;

  // Fuentes: novedades de Apple y playlists editoriales de Deezer, intercaladas (el nº 1 de cada una, luego el nº 2…).
  const lists = [];
  for (const g of cfg.apple) for (const store of cfg.stores) lists.push(await appleCandidates(store, g));
  for (const p of cfg.deezer) lists.push(await playlistCandidates(p));
  // Si una novedad de Apple también está en una playlist editorial, cuenta como elegida por el editor.
  const editorialKeys = new Set(lists.flat().filter((c) => c.dzArtistId).map(keyOf));
  const queue = [];
  const queued = new Set(seen);
  for (let rank = 0; rank < Math.max(0, ...lists.map((l) => l.length)); rank++) {
    for (const l of lists) {
      const c = l[rank];
      if (!c || !c.t || isBad(c.t, c.a) || queued.has(keyOf(c))) continue;
      queued.add(keyOf(c));
      queue.push(c);
    }
  }

  const rejected = {};
  const reject = (why, c) => (rejected[why.replace(/\(.*\)|\d+/g, '').trim()] ??= []).push(`${c.t} — ${c.a}${why.includes('(') || /\d/.test(why) ? ` [${why}]` : ''}`);
  let accepted = anchors;
  let checked = 0;
  for (const c of queue) {
    if (accepted >= MAX_PER_GENRE) break;
    checked++;
    const why = await renown(c, cfg, editorialKeys.has(keyOf(c)));
    if (why) {
      reject(why, c);
      continue;
    }
    if (DRY) {
      songs.push(c);
      accepted++;
      continue;
    }
    const s = c.id ? c : await resolveSearch(c.a, c.t, cfg.stores);
    if (!s) reject('no encontrada en iTunes', c);
    else if (add({ ...s, t: cleanTitle(s.t) })) accepted++;
  }

  console.log(`\n${id.padEnd(8)} ${accepted} canciones (${anchors} clásicos, ${checked} de ${queue.length} candidatas revisadas)`);
  for (const [why, list] of Object.entries(rejected)) console.log(`  ✗ ${why}: ${list.length} · ej.: ${list.slice(0, 6).join(' | ')}`);
  if (DRY) console.log(`  ✓ ej.: ${songs.filter((_, i) => i % 6 === 0).slice(0, 20).map((s) => `${s.t} — ${s.a}`).join(' | ')}`);
  else result.genres[id] = songs;
}

if (!DRY) {
  writeFileSync(OUT, JSON.stringify(result, null, 0) + '\n');
  console.log(`\nGuardado en ${OUT}`);
}
