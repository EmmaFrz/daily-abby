#!/usr/bin/env node
/**
 * Actualiza el catálogo del Heardle por géneros con los éxitos de Apple Music (iTunes).
 *
 *   npm run musica:actualizar            → todos los géneros
 *   npm run musica:actualizar -- edm     → solo los géneros indicados (el resto se conserva)
 *
 * Por cada género:
 *  1. Busca los "clásicos" de ANCHORS en el catálogo de cada artista (versión original).
 *  2. Añade las listas "Top Songs" del género en varias tiendas.
 * Descarta karaokes, covers, remixes y duplicados, y guarda el resultado en src/data/heardle-charts.json.
 * El juego usa esa "foto" para que todo el mundo reciba las mismas canciones cada día.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'heardle-charts.json');
const STORES = ['us', 'mx', 'es', 'gb'];
const MAX_PER_GENRE = 150;

/** id del género en el juego → ids de género de Apple. */
const GENRES = {
  pop: [14],
  latino: [12, 1119],
  rock: [21],
  hiphop: [18],
  kpop: [51],
  edm: [17, 7], // Dance + Electronic
  espana: [], // Sin lista de Apple: solo la selección de ANCHORS (artistas de España)
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

const BAD = /karaoke|cover|tribute|instrumental|remix|rmx|versi[oó]n|version|live|en vivo|en directo|sped up|slowed|lullaby|8[- ]bit|medley|acoustic|ac[uú]stic|piano|orchestra|kidz bop|rockabye|8d audio|bass boosted|extended|nightcore/i;
/** "(Deep House)", "(Afro House)", "(Techno Bootleg)"…: suelen ser versiones de otra canción. */
const BAD_TAG = /[([][^)\]]*\b(\w*house|techno|bootleg|rework|flip|phonk|hardstyle|vip)\b[^)\]]*[)\]]/i;
const isBad = (title, artist) => BAD.test(title) || BAD.test(artist) || BAD_TAG.test(title);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Deja solo el nombre de la canción: quita "(feat. X)", "[with X]", "(From …)",
 * "(2018 Remaster)", "[K-Mix]", "(Radio Edit)", "(Japanese Ver.)", "- Remastered 2011"…
 */
const EXTRA = /\b(?:feat|ft|with|con|from|remaster\w*|mix|edit|version|sessions?|official|single|bonus|prod|interludio|original)\b|\bver\./i;
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

/* ───────────── Main ───────────── */

const only = process.argv.slice(2).filter((a) => a in GENRES);
const unknown = process.argv.slice(2).filter((a) => !(a in GENRES));
if (unknown.length) console.warn(`Géneros desconocidos (se ignoran): ${unknown.join(', ')}. Válidos: ${Object.keys(GENRES).join(', ')}`);
const targets = only.length ? only : Object.keys(GENRES);

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { genres: {} };
const result = { generatedAt: new Date().toISOString().slice(0, 10), genres: { ...previous.genres } };

for (const id of targets) {
  const songs = [];
  const seen = new Set();
  const add = (s) => {
    const key = `${norm(s.t)}|${norm(s.a.split(/,|&| x | y /)[0])}`;
    if (seen.has(key) || seen.has(String(s.id)) || songs.length >= MAX_PER_GENRE) return;
    seen.add(key);
    seen.add(String(s.id));
    songs.push(s);
  };

  for (const [artist, title] of ANCHORS[id] ?? []) {
    const s = await resolveAnchor(artist, title, ANCHOR_STORE[id] ?? 'us');
    if (s) add(s);
  }
  const anchors = songs.length;

  // Intercalamos tiendas: primero el nº 1 de cada una, luego el nº 2…
  const lists = [];
  for (const g of GENRES[id]) {
    for (const store of STORES) {
      lists.push({ store, entries: await chart(store, g) });
      await sleep(1200);
    }
  }
  const longest = Math.max(0, ...lists.map((l) => l.entries.length));
  for (let rank = 0; rank < longest; rank++) {
    for (const { store, entries } of lists) {
      const e = entries[rank];
      if (!e) continue;
      const title = e['im:name']?.label ?? '';
      const artist = e['im:artist']?.label ?? '';
      const trackId = Number(e.id?.attributes?.['im:id']);
      const hasPreview = [].concat(e.link ?? []).some((l) => l.attributes?.rel === 'enclosure');
      if (!trackId || !hasPreview || isBad(title, artist)) continue;
      add({ t: cleanTitle(title), a: artist, id: trackId, c: store, y: Number(e['im:releaseDate']?.label?.slice(0, 4)) || null });
    }
  }
  result.genres[id] = songs;
  console.log(`${id.padEnd(8)} ${songs.length} canciones (${anchors} clásicos) · ej.: ${songs.slice(0, 3).map((s) => `${s.t} — ${s.a}`).join(' | ')}`);
}

writeFileSync(OUT, JSON.stringify(result, null, 0) + '\n');
console.log(`\nGuardado en ${OUT}`);
