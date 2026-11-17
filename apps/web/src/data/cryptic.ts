/**
 * Pistas crípticas del Críptico diario (escritas a mano, originales).
 *
 * Cada pista es una frase con dos caminos a la misma respuesta:
 * - la DEFINICIÓN (al principio o al final de la frase), un sinónimo de la respuesta;
 * - el JUEGO DE PALABRAS: un INDICADOR que dice qué hacer y el MATERIAL con el que hacerlo.
 *
 * `def`, `ind` y `mat` son trozos LITERALES de `clue` (se resaltan al pedir pistas).
 * La longitud "(n)" se añade sola a partir de `answer`. `answer` se escribe con su tilde.
 */
export type Mechanism =
  | 'Anagrama'
  | 'Palabra oculta'
  | 'Inversión'
  | 'Charada'
  | 'Resta'
  | 'Iniciales'
  | 'Contenedor'
  | 'Doble definición'
  | 'Homófono'
  | 'Traducción'
  | 'Abreviaturas';

export interface CrypticClue {
  clue: string;
  answer: string;
  type: Mechanism;
  def: string[];
  ind: string[];
  mat: string[];
  /** Explicación del juego de palabras (se muestra al terminar). */
  how: string;
}

/** Guía de cada mecanismo: qué es y palabras que lo suelen indicar. */
export const MECHANISMS: Record<Mechanism, { icon: string; what: string; indicators: string }> = {
  Anagrama: { icon: '🔀', what: 'Las letras del material se reordenan.', indicators: 'loco, revuelto, agitado, desordena, raro, delira, torcido…' },
  'Palabra oculta': { icon: '🔍', what: 'La respuesta está escrita, seguida, dentro del material (puede saltar entre palabras).', indicators: 'esconde, oculta, guarda, dentro de, lleva dentro, en parte…' },
  Inversión: { icon: '↩️', what: 'El material se lee de atrás hacia delante.', indicators: 'al revés, regresa, de espaldas, vuelve…' },
  Charada: { icon: '➕', what: 'La respuesta se forma juntando piezas, cada una con su propia mini definición.', indicators: 'y, con, junto a… (a veces no hay indicador)' },
  Resta: { icon: '✂️', what: 'Al material se le quita una letra o un trozo.', indicators: 'sin cabeza, sin final, pierde, descabezado, sin principio…' },
  Iniciales: { icon: '🔠', what: 'Se toman las primeras letras de varias palabras.', indicators: 'al principio, cabezas de, encabezan, primeras letras…' },
  Contenedor: { icon: '🫂', what: 'Una pieza se mete dentro de otra.', indicators: 'abraza, dentro, rodea, se cuela…' },
  'Doble definición': { icon: '🪞', what: 'Dos definiciones distintas de la misma palabra, sin indicador.', indicators: '(no tiene)' },
  Homófono: { icon: '👂', what: 'Algo que suena igual que la respuesta, aunque se escribe distinto (B/V, H muda…).', indicators: 'suena, se oye, dicen, en voz alta…' },
  Traducción: { icon: '🇬🇧', what: 'Una o varias piezas se traducen (casi siempre al inglés).', indicators: 'en Londres, en inglés, yanqui…' },
  Abreviaturas: { icon: '🔣', what: 'Números romanos (L = 50, C = 100…), puntos cardinales, siglas como IA…', indicators: 'cincuenta, cien, nordeste, romanos…' },
};

type S = string | string[];
const arr = (s: S) => (Array.isArray(s) ? s : [s]);
const c = (type: Mechanism, clue: string, answer: string, def: S, ind: S, mat: S, how: string): CrypticClue => ({
  type,
  clue,
  answer,
  def: arr(def),
  ind: arr(ind),
  mat: arr(mat),
  how,
});

export const CRYPTIC_CLUES: readonly CrypticClue[] = [
  // Anagramas
  c('Anagrama', 'La Play, por ejemplo: son cola agitada', 'CONSOLA', 'La Play, por ejemplo', 'agitada', 'son cola', 'SON + COLA, agitadas, se reordenan en CONSOLA.'),
  c('Anagrama', 'Tocadle, loco: tiene todas las letras', 'TECLADO', 'tiene todas las letras', 'loco', 'Tocadle', 'TOCADLE desordenado forma TECLADO.'),
  c('Anagrama', 'Al notar algo raro, mueve el cursor', 'RATÓN', 'mueve el cursor', 'algo raro', 'notar', 'NOTAR, con las letras cambiadas, da RATÓN.'),
  c('Anagrama', 'Pesada y torcida, el arma del caballero', 'ESPADA', 'el arma del caballero', 'torcida', 'Pesada', 'PESADA, torcida, se convierte en ESPADA.'),
  c('Anagrama', 'Pedro delira: quiere el mando', 'PODER', 'el mando', 'delira', 'Pedro', 'PEDRO revuelto forma PODER.'),
  c('Anagrama', 'Partía, revuelto, el que roba en alta mar', 'PIRATA', 'el que roba en alta mar', 'revuelto', 'Partía', 'PARTÍA revuelto da PIRATA.'),
  c('Anagrama', 'Andor, desordenado, da una vuelta', 'RONDA', 'una vuelta', 'desordenado', 'Andor', 'ANDOR (la serie de Star Wars) desordenado da RONDA.'),
  c('Anagrama', 'Maorí revuelto: fontanero con bigote', 'MARIO', 'fontanero con bigote', 'revuelto', 'Maorí', 'MAORÍ revuelto da MARIO.'),
  c('Anagrama', 'Rival desquiciado: lo ve todo el mundo', 'VIRAL', 'lo ve todo el mundo', 'desquiciado', 'Rival', 'RIVAL desquiciado (anagrama) da VIRAL.'),
  c('Anagrama', 'Desordena «cielo sin» y tendrás lo que se pide en el cine', 'SILENCIO', 'lo que se pide en el cine', 'Desordena', 'cielo sin', 'CIELO + SIN, desordenadas, forman SILENCIO.'),

  // Palabra oculta
  c('Palabra oculta', 'En el panel solar manchado se oculta el rifle', 'ARMA', 'el rifle', 'se oculta', 'solar manchado', 'solAR MAnchado esconde ARMA.'),
  c('Palabra oculta', 'Hay mucha tensión dentro del canal de mensajes del directo', 'CHAT', 'canal de mensajes del directo', 'dentro del', 'mucha tensión', 'muCHA Tensión esconde CHAT.'),
  c('Palabra oculta', 'Como dices, en parte, es el que banea en el chat', 'MOD', 'el que banea en el chat', 'en parte', 'Como dices', 'coMO Dices esconde MOD.'),
  c('Palabra oculta', 'En el cometa se esconde la línea de llegada', 'META', 'la línea de llegada', 'se esconde', 'cometa', 'coMETA esconde META.'),
  c('Palabra oculta', 'El elefante lleva dentro un seguidor', 'FAN', 'un seguidor', 'lleva dentro', 'elefante', 'eleFANte esconde FAN.'),
  c('Palabra oculta', 'Te picoteo y escondo algo legendario', 'ÉPICO', 'algo legendario', 'escondo', 'Te picoteo', 'tE PICOteo esconde ÉPICO.'),
  c('Palabra oculta', 'La cucaracha guarda una buena serie de victorias', 'RACHA', 'una buena serie de victorias', 'guarda', 'cucaracha', 'cucaRACHA esconde RACHA.'),
  c('Palabra oculta', 'Sola gente esconde el retraso de la conexión', 'LAG', 'el retraso de la conexión', 'esconde', 'Sola gente', 'soLA Gente esconde LAG.'),
  c('Palabra oculta', 'El farol oculta un tipo de juego', 'ROL', 'un tipo de juego', 'oculta', 'farol', 'faROL esconde ROL (juegos de rol).'),
  c('Palabra oculta', 'La seriedad contiene algo para ver en Netflix', 'SERIE', 'algo para ver en Netflix', 'contiene', 'seriedad', 'SERIEdad esconde SERIE.'),
  c('Palabra oculta', 'Su uso nicotínico esconde un erizo azul', 'SONIC', 'un erizo azul', 'esconde', 'uso nicotínico', 'uSO NICotínico esconde SONIC.'),
  c('Palabra oculta', 'El papel sabe esconder a la reina del hielo', 'ELSA', 'la reina del hielo', 'esconder', 'papel sabe', 'papEL SAbe esconde ELSA, la de Frozen.'),

  // Inversiones
  c('Inversión', 'El oído, al revés, siente rencor', 'ODIO', 'siente rencor', 'al revés', 'oído', 'OÍDO leído al revés da ODIO.'),
  c('Inversión', 'Atar de espaldas al roedor', 'RATA', 'roedor', 'de espaldas', 'Atar', 'ATAR al revés da RATA.'),
  c('Inversión', 'Omar regresa con un manojo de flores', 'RAMO', 'un manojo de flores', 'regresa', 'Omar', 'OMAR al revés da RAMO.'),
  c('Inversión', 'Adán, de espaldas, no tiene ninguna cosa', 'NADA', 'ninguna cosa', 'de espaldas', 'Adán', 'ADÁN al revés da NADA.'),
  c('Inversión', 'Lámina al revés: una bestia', 'ANIMAL', 'una bestia', 'al revés', 'Lámina', 'LÁMINA al revés da ANIMAL.'),
  c('Inversión', 'La rama, al revés, sabe querer', 'AMAR', 'querer', 'al revés', 'rama', 'RAMA al revés da AMAR.'),

  // Charadas
  c('Charada', 'Tour del artista y estrella del día: una flor', 'GIRASOL', 'una flor', [], ['Tour del artista', 'estrella del día'], 'GIRA (tour del artista) + SOL (estrella del día) = GIRASOL.'),
  c('Charada', 'Uva seca con lo que mide el reloj: un hobby', 'PASATIEMPO', 'un hobby', [], ['Uva seca', 'lo que mide el reloj'], 'PASA (uva seca) + TIEMPO (lo que mide el reloj) = PASATIEMPO.'),
  c('Charada', 'Una estrella con lo que tiras en el parchís: un militar', 'SOLDADO', 'un militar', [], ['Una estrella', 'lo que tiras en el parchís'], 'SOL (una estrella) + DADO (lo que tiras en el parchís) = SOLDADO.'),
  c('Charada', 'Océano con infusiones: un día de la semana', 'MARTES', 'un día de la semana', [], ['Océano', 'infusiones'], 'MAR (océano) + TÉS (infusiones) = MARTES.'),
  c('Charada', 'Rostro y verdura: va lento con su casa a cuestas', 'CARACOL', 'va lento con su casa a cuestas', [], ['Rostro', 'verdura'], 'CARA (rostro) + COL (verdura) = CARACOL.'),
  c('Charada', 'Pelota con cesto de mimbre: un deporte', 'BALONCESTO', 'un deporte', [], ['Pelota', 'cesto de mimbre'], 'BALÓN (pelota) + CESTO = BALONCESTO.'),
  c('Charada', 'Lo que dispara el arquero y parte del ojo: sale tras la lluvia', 'ARCOÍRIS', 'sale tras la lluvia', [], ['Lo que dispara el arquero', 'parte del ojo'], 'ARCO (lo que usa el arquero) + IRIS (parte del ojo) = ARCOÍRIS.'),
  c('Charada', 'Flor que enreda: la de «Motomami»', 'ROSALÍA', 'la de «Motomami»', [], ['Flor', 'enreda'], 'ROSA (flor) + LÍA (enreda) = ROSALÍA.'),

  // Traducciones
  c('Traducción', 'Hombre en Londres y nota musical: con él juegas en el sofá', 'MANDO', 'con él juegas en el sofá', 'en Londres', ['Hombre', 'nota musical'], 'MAN (hombre, en inglés) + DO (nota musical) = MANDO.'),
  c('Traducción', 'Tienda del barrio y hombre en inglés: héroe con capa', 'SUPERMAN', 'héroe con capa', 'en inglés', ['Tienda del barrio', 'hombre'], 'SÚPER (tienda del barrio) + MAN (hombre, en inglés) = SUPERMAN.'),
  c('Traducción', 'Murciélago y hombre, en inglés: el caballero oscuro', 'BATMAN', 'el caballero oscuro', 'en inglés', ['Murciélago', 'hombre'], 'BAT (murciélago) + MAN (hombre), en inglés = BATMAN.'),
  c('Traducción', 'Caliente en Londres con el artículo: alojamiento', 'HOTEL', 'alojamiento', 'en Londres', ['Caliente', 'el artículo'], 'HOT (caliente, en inglés) + EL (el artículo) = HOTEL.'),
  c('Traducción', 'Coche y red, en inglés: documento de identidad', 'CARNET', 'documento de identidad', 'en inglés', ['Coche', 'red'], 'CAR (coche) + NET (red), en inglés = CARNET.'),
  c('Traducción', 'Diez es, en inglés, un deporte de raqueta', 'TENIS', 'un deporte de raqueta', 'en inglés', 'Diez es', 'TEN (diez) + IS (es), en inglés = TENIS.'),
  c('Traducción', 'Perro yanqui con mamá: creencia indiscutible', 'DOGMA', 'creencia indiscutible', 'yanqui', ['Perro', 'mamá'], 'DOG (perro, en inglés) + MA (mamá) = DOGMA.'),
  c('Traducción', 'Hombres en Londres toman infusión: lo que piensa', 'MENTE', 'lo que piensa', 'en Londres', ['Hombres', 'infusión'], 'MEN (hombres, en inglés) + TÉ (infusión) = MENTE.'),

  // Restas
  c('Resta', 'Casar sin final: hogar', 'CASA', 'hogar', 'sin final', 'Casar', 'CASAR sin su última letra = CASA.'),
  c('Resta', 'Toro sin cabeza: el primer premio', 'ORO', 'el primer premio', 'sin cabeza', 'Toro', 'TORO sin la primera letra = ORO.'),
  c('Resta', 'Nave sin cabeza es un pájaro', 'AVE', 'un pájaro', 'sin cabeza', 'Nave', 'NAVE sin la primera letra = AVE.'),
  c('Resta', 'Marte pierde el té: queda el océano', 'MAR', 'el océano', 'pierde', ['Marte', 'el té'], 'MARTE sin TE = MAR.'),
  c('Resta', 'Brisa descabezada: una carcajada', 'RISA', 'una carcajada', 'descabezada', 'Brisa', 'BRISA sin la primera letra = RISA.'),
  c('Resta', 'Palma sin cabeza: el espíritu', 'ALMA', 'el espíritu', 'sin cabeza', 'Palma', 'PALMA sin la primera letra = ALMA.'),
  c('Resta', 'Prosa sin principio: una flor', 'ROSA', 'una flor', 'sin principio', 'Prosa', 'PROSA sin la primera letra = ROSA.'),
  c('Resta', 'Corral pierde una erre: arrecife de colores', 'CORAL', 'arrecife de colores', 'pierde', ['Corral', 'una erre'], 'CORRAL sin una R = CORAL.'),

  // Iniciales
  c('Iniciales', 'Iniciales de los otros luchadores: la risa del chat', 'LOL', 'la risa del chat', 'Iniciales de', 'los otros luchadores', 'Los Otros Luchadores → LOL.'),
  c('Iniciales', 'Primeras letras de mil emojis muy exagerados: chiste de internet', 'MEME', 'chiste de internet', 'Primeras letras de', 'mil emojis muy exagerados', 'Mil Emojis Muy Exagerados → MEME.'),
  c('Iniciales', 'Encabezan algún buen baile yanqui: la streamer de esta web', 'ABBY', 'la streamer de esta web', 'Encabezan', 'algún buen baile yanqui', 'Algún Buen Baile Yanqui → ABBY.'),
  c('Iniciales', 'Encabezan cada loco instante publicado: el fragmento del directo', 'CLIP', 'el fragmento del directo', 'Encabezan', 'cada loco instante publicado', 'Cada Loco Instante Publicado → CLIP.'),
  c('Iniciales', 'Al principio, Inés bebe agua isotónica: organiza La Velada', 'IBAI', 'organiza La Velada', 'Al principio', 'Inés bebe agua isotónica', 'Inés Bebe Agua Isotónica → IBAI.'),

  // Contenedores
  c('Contenedor', 'Pero con una erre dentro: el mejor amigo del hombre', 'PERRO', 'el mejor amigo del hombre', 'dentro', ['Pero', 'una erre'], 'PERO con una R dentro: PE·R·RO = PERRO.'),
  c('Contenedor', 'Un árbol abraza la primera letra: instrumento de teclas', 'PIANO', 'instrumento de teclas', 'abraza', ['Un árbol', 'la primera letra'], 'PINO (un árbol) abraza la A (primera letra): PI·A·NO = PIANO.'),
  c('Contenedor', 'El dios del vino abraza una erre: navega', 'BARCO', 'navega', 'abraza', ['El dios del vino', 'una erre'], 'BACO (dios del vino) abraza una R: BA·R·CO = BARCO.'),

  // Dobles definiciones
  c('Doble definición', 'Asiento financiero', 'BANCO', ['Asiento', 'financiero'], [], [], 'Un BANCO es un asiento y también una entidad financiera.'),
  c('Doble definición', 'Animal que arde', 'LLAMA', ['Animal', 'que arde'], [], [], 'La LLAMA es un animal de los Andes y el fuego que arde.'),
  c('Doble definición', 'Felino que levanta el coche', 'GATO', ['Felino', 'que levanta el coche'], [], [], 'Un GATO es un felino y la herramienta para levantar el coche.'),
  c('Doble definición', 'Cordillera que corta madera', 'SIERRA', ['Cordillera', 'que corta madera'], [], [], 'Una SIERRA es una cordillera y una herramienta para cortar madera.'),
  c('Doble definición', 'Refresco para esperar tu turno', 'COLA', ['Refresco', 'para esperar tu turno'], [], [], 'COLA es un refresco y la fila donde esperas tu turno.'),
  c('Doble definición', 'Juguete de la mano', 'MUÑECA', ['Juguete', 'de la mano'], [], [], 'Una MUÑECA es un juguete y la articulación de la mano.'),
  c('Doble definición', 'Mujer pez de ambulancia', 'SIRENA', ['Mujer pez', 'de ambulancia'], [], [], 'Una SIRENA es una mujer pez y lo que suena en la ambulancia.'),
  c('Doble definición', 'Batería de platos', 'PILA', ['Batería', 'de platos'], [], [], 'Una PILA es una batería y un montón de platos.'),

  // Homófonos
  c('Homófono', 'Bello, según se oye, es el pelito del brazo', 'VELLO', 'el pelito del brazo', 'según se oye', 'Bello', 'BELLO suena igual que VELLO.'),
  c('Homófono', 'Suena a saludo lo que rompe en la playa', 'OLA', 'lo que rompe en la playa', 'Suena a', 'saludo', 'HOLA (saludo) suena igual que OLA.'),
  c('Homófono', 'En voz alta, elegir en las urnas es hacer rebotar el balón', 'BOTAR', 'hacer rebotar el balón', 'En voz alta', 'elegir en las urnas', 'VOTAR (elegir en las urnas) suena igual que BOTAR.'),
  c('Homófono', 'Tuvo, según dicen, forma de cañería', 'TUBO', 'cañería', 'según dicen', 'Tuvo', 'TUVO suena igual que TUBO.'),

  // Abreviaturas
  c('Abreviaturas', 'Cincuenta romanos y una: el satélite', 'LUNA', 'el satélite', 'romanos', ['Cincuenta', 'una'], 'L (50 en números romanos) + UNA = LUNA.'),
  c('Abreviaturas', 'Cinco, uno y negación: bebida de uva', 'VINO', 'bebida de uva', [], ['Cinco', 'uno', 'negación'], 'V (5) + I (1), en romanos, + NO (negación) = VINO.'),
  c('Abreviaturas', 'Cien, uno y nordeste: sala de pelis', 'CINE', 'sala de pelis', [], ['Cien', 'uno', 'nordeste'], 'C (100) + I (1), en romanos, + NE (nordeste) = CINE.'),
  c('Abreviaturas', 'Quinientos y lo que hace ChatGPT: jornada', 'DÍA', 'jornada', [], ['Quinientos', 'lo que hace ChatGPT'], 'D (500 en romanos) + IA (inteligencia artificial) = DÍA.'),
];
