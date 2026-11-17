# Abby · Diarios

Juego diario de navegador, para un solo jugador, con **27 retos nuevos cada día** con la temática de
**Abby ([twitch.tv/abby_](https://www.twitch.tv/abby_))**, streamer de Twitch, y del mundo gamer. Todo el mundo recibe los mismos retos cada día:
salen de la fecha con una semilla fija.

| Categoría | Minijuego | Cómo se juega |
|---|---|---|
| 🔍 Adivina | 🎮 Gamedle | Adivina el juego del día por sus atributos (género, modo, año…), estilo Loldle/Narutodle |
| | 🫣 Emojidle | Descubre el juego con emojis; cada fallo revela uno más |
| | 👾 Pixeldle | El icono del juego empieza muy pixelado y se aclara con cada fallo |
| | 📅 Añodle | Adivina el año de salida con pistas de "antes/después" y "frío/caliente" |
| 🔤 Palabras | 🟩 Wordle | El clásico: palabra común del español en 6 intentos, con teclado español y Ñ |
| | 🔤 Palabrdle | Wordle gamer: palabras del mundo stream |
| | 🪢 Ahorcado | Descubre el nombre de un juego letra a letra |
| | 🔀 Anagrama | Ordena las letras revueltas de una palabra gamer, con pistas |
| | ✍️ Crucigrama | Mini crucigrama (máx. 9×9) de cultura pop: música, series, pelis, juegos e internet |
| | 🕵️ Críptico | Una pista críptica al día: una frase con definición + juego de palabras (anagrama, palabra oculta, charada…) |
| 🎵 Música | 🎧 Heardle (7 géneros) | Pop, Latino, Rock, Hip-Hop, K-Pop, EDM y España (solo artistas españoles). Cada género es un reto de 5 fases (5 canciones); cada canción suena por tramos de 1, 2, 4, 7, 11 y 16 s |
| | 📻 ¿Quién canta? | 5 fragmentos de 5 s: elige al artista entre 4 opciones |
| | 🎤 Artistdle | Adivina el artista por país, género, década de debut, formato e idioma |
| | 🎶 Emoji musical | Descubre la canción a partir de emojis |
| 🧠 Lógica | 🧩 Conexiones | 16 palabras en 4 grupos secretos |
| | ⏳ Cronología | Ordena 5 juegos del más antiguo al más nuevo |
| | ❓ Quiz gamer | 5 preguntas generadas a partir del catálogo de juegos |
| | ↕️ ¿Antes o después? | ¿Qué juego salió antes? Llega a 10 seguidos |
| ⚡ Habilidad | 🃏 Memoria | Encuentra las 8 parejas en los menos movimientos posibles |
| | 🎯 Rage Aim | 20 dianas lo más rápido posible |
| | 🌍 ¿Cuál es más grande? | 60 s para elegir el país con más superficie en cada pareja; cada fallo resta 5 s |

Cada minijuego guarda tu racha, tu récord y un resultado para compartir con cuadritos de colores, como Wordle.
La pestaña **Logros** reúne 31 logros y las estadísticas por juego.

### Crucigrama, Críptico y países

- **Crucigrama**: cada día se genera solo a partir de `popclues.ts` (~160 pistas), cruzando 5-7 palabras sin que
  aparezcan palabras accidentales. Para añadir pistas, añade pares `[RESPUESTA, pista]` (una palabra, sin tildes,
  de 3 a 10 letras). Comprobar y revelar letras cuentan como ayudas; resolverlo sin ayudas da un logro.
- **Críptico**: una pista críptica al día, al estilo de los crucigramas crípticos. La frase tiene una *definición*
  (al principio o al final) y un *juego de palabras*: un *indicador* dice qué hacer con el *material* (anagrama,
  palabra oculta, inversión, charada, resta, iniciales, contenedor, doble definición, homófono, traducción,
  abreviaturas). Hay 5 intentos y 5 pistas (mecanismo, definición, indicador, material y primera letra) que resaltan
  la frase por colores. Puntos: 100 a la primera; cada intento fallado y cada pista restan 10. Al terminar se
  muestra el desglose. Para añadir pistas, usa `c(tipo, frase, RESPUESTA, definición, indicador, material, explicación)`
  en `cryptic.ts`: los tres trozos deben copiarse tal cual de la frase.
- **¿Cuál es más grande?**: ~190 países dan más de 15.000 parejas posibles; solo se comparan países que se
  diferencian al menos un 20 % (así las diferencias entre fuentes no cambian la respuesta) y la dificultad sube
  con cada ronda. Las banderas se cargan de flagcdn.com.

### Audio de los juegos de música

El audio son las **previas oficiales de 30 s de Apple Music**, obtenidas en el navegador con la API pública de
iTunes (`src/lib/itunes.ts`), que no necesita clave. No se guarda ni se sirve ningún archivo de audio propio. Cada
canción lleva un enlace "Escuchar en Apple Music". Necesita conexión a internet; sin ella, el juego muestra un aviso con
el botón "Reintentar".

El catálogo está en `src/data/music.ts`. Cada canción apunta a su `trackId`, el número que aparece tras `?i=` en
el enlace de music.apple.com. No busques por nombre: Apple suele devolver antes versiones de karaoke o nanas.

### Catálogo del Heardle por géneros

Cada género junta las canciones de `music.ts` de ese género con los **éxitos de Apple Music** (listas "Top Songs"
por género de las tiendas de EE. UU., México, España y Reino Unido), guardados en `src/data/heardle-charts.json`.
Ahora hay unas 110-160 canciones por género, así que pasan 3-4 semanas sin que se repita ninguna.
EDM junta las listas Dance y Electronic de Apple, más 30 clásicos (Avicii, David Guetta, Calvin Harris, Daft Punk…)
definidos en `ANCHORS`, dentro del script.
**España** no usa listas de Apple, porque las listas de la tienda española mezclan artistas de todo el mundo.
Es una selección de éxitos de artistas españoles, de Mecano y Raphael a ROSALÍA, Aitana y Quevedo, que se busca
en la tienda de España (`ANCHORS.espana`). Para ampliarla, añade pares `[artista, título]` y ejecuta
`npm run musica:actualizar -- espana`.

Para refrescarlo con los éxitos actuales:

```bash
npm run musica:actualizar            # todos los géneros
npm run musica:actualizar -- edm     # solo los géneros indicados; el resto no cambia
```

Para añadir un género nuevo:
1. Añádelo a `GENRES` en el script, con sus ids de género de Apple.
2. Si quieres, añade sus clásicos a `ANCHORS`.
3. Añádelo a `GENRES` en `src/data/heardleGenres.ts`.
4. Ejecuta `npm run musica:actualizar -- <género>`.

El script (`apps/web/scripts/update-heardle.mjs`) descarta karaokes, covers, remixes, versiones en directo y
duplicados, y limpia los títulos ("(2018 Remaster)", "(feat. …)"…). El catálogo es una foto fija, así que todo el
mundo recibe las mismas canciones cada día hasta que lo vuelvas a actualizar. Al actualizarlo cambia el orden de las
canciones, así que conviene hacerlo de madrugada o entre temporadas.

## Web publicada

🌐 **https://daily-abby.vercel.app**: proyecto `daily-abby` en Vercel.

El código está en el repositorio privado **github.com/EmmaFrz/daily-abby**, conectado a Vercel:

| Acción | Qué pasa |
|---|---|
| `git push` a `main` (o merge de un PR) | Vercel compila y **publica en producción** solo (~1 min) |
| `git push` a otra rama / abrir un PR | Vercel crea una **vista previa** con su propia URL para probar antes |

```bash
git add -A
git commit -m "Describe el cambio"
git push            # → se publica solo en https://daily-abby.vercel.app
```

Vercel instala, compila (`npm run build`) y publica `apps/web/dist`, según `vercel.json`. Si actualizas el catálogo
de música (`npm run musica:actualizar`), haz commit y push del `heardle-charts.json` para que llegue a la web.

Publicar a mano sin pasar por GitHub sigue funcionando: `npx vercel deploy --prod`.

## Arrancar

Requisitos: **Node 22+**.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # versión estática en apps/web/dist (vale cualquier hosting estático)
```

No hay servidor: el progreso se guarda en el `localStorage` del navegador.

La primera vez que alguien abre la página aparece un aviso de **versión pre-alfa** (`src/components/PreAlphaModal.tsx`). Solo se muestra una vez por navegador; para volver a verlo, borra la clave `abby-prealfa-visto` del `localStorage`.

## Sonido

Los efectos se sintetizan en el navegador con la Web Audio API (`src/lib/sound.ts`): no hay archivos de audio.
Hay sonidos para teclas, aciertos, fallos, victoria, derrota, logros, cartas y dianas, además de vibración en el móvil.
Se silencian con el botón 🔊 de la barra superior, y el volumen se regula en **Logros → Sonido**.

Para añadir un efecto, crea una receta en `RECIPES` y llámala con `sfx('nombre')`.

**Modo pruebas:** abre `http://localhost:5173/?dev` y en el pie de página aparecerá **"Avanzar día"**.

## Personalizar

| Archivo | Qué cambiar |
|---|---|
| `apps/web/src/config/abby.ts` | Nombre, canal de Twitch, redes sociales (`SOCIALS`) y avatar |
| `apps/web/public/abby.png` | Opcional: su avatar (si no existe se usa un monograma) |
| `apps/web/src/data/games.ts` | Catálogo de juegos (alimenta Gamedle, Emojidle, Pixeldle, Añodle, Ahorcado, Cronología, Quiz, ¿Antes o después? y Memoria) |
| `apps/web/src/data/words.ts` | Palabras de 5 letras del Wordle (`CLASSIC_WORDS`) y del Palabrdle (`WORDS`) |
| `apps/web/src/data/anagrams.ts` | Palabras del Anagrama |
| `apps/web/src/data/popclues.ts` | Pistas de cultura pop del Crucigrama |
| `apps/web/src/data/cryptic.ts` | Pistas del Críptico (con su definición, indicador, material y explicación) |
| `apps/web/src/data/countries.ts` | Países con su superficie (km²) para ¿Cuál es más grande? |
| `apps/web/src/data/music.ts` | Canciones (con su `trackId` de Apple Music y pistas de emojis) y artistas del Artistdle |
| `apps/web/src/data/connections.ts` | Grupos de Conexiones (ningún elemento puede encajar en dos grupos) |
| `apps/web/src/data/achievements.ts` | Logros |

## Diseño: álbum de cromos

La web es un álbum. Cada día llega un "sobre" (#número del reto) y cada reto es un cromo numerado: los que
no has jugado son huecos con borde discontinuo y los que terminas se pegan (en gris y con sello si se fallaron;
con la esquina despegada si están a medias). El Heardle es un cromo de 7 piezas, una por género. En **Logros**,
los 31 logros son cromos dorados.

- Colores y fuentes (Bricolage Grotesque + Figtree): `@theme` de `src/index.css`. Cada categoría tiene su color
  (`--color-cat-*`), que es el fondo del cromo.
- Los minijuegos usan clases pensadas para fondo oscuro (`text-white/60`, `bg-white/10`…). En vez de
  reescribirlas, `index.css` reasigna `white` → tinta, `black` → blanco papel e `ink` → fondo del álbum. Para
  un blanco de verdad usa `paper` (`bg-paper`, `text-paper`).
- Piezas del álbum (`Sticker`, `Slot`, `StickerArt`, `Pieces`…): `src/components/Album.tsx`. El número de
  cada cromo sale del orden de la portada (`ALBUM` y `albumNumber()` en `src/minigames/meta.ts`).

## Añadir un minijuego

1. Añade sus datos (nombre, icono, categoría…) en `src/minigames/meta.ts`.
2. Crea el componente en `src/minigames/`. Usa `useDaily(id, estadoInicial, juzgar)`: `juzgar` devuelve el
   resultado cuando la partida termina. Las rachas, récords, logros y el botón de compartir funcionan solos.
3. Regístralo en `src/minigames/index.ts`.

## Estructura

```
apps/web/src/
  minigames/  los minijuegos (los de música en minigames/music/), su contenido diario (content.ts) y el registro
  data/       juegos, palabras, grupos, logros
  state/      progreso: partidas del día, rachas, récords, logros (localStorage)
  pages/      Diarios (portada + juego) y Logros
```

Las versiones anteriores están archivadas en `legacy/trivia-v1/` (trivia en vivo "Abby vs Chat").
