/** Palabras de 5 letras del mundo stream/gaming para el Palabrdle (sin tildes). */
export const WORDS: readonly string[] = [
  'CLIPS', 'EMOTE', 'GAMER', 'NIVEL', 'PIXEL', 'TROLL', 'COMBO', 'MANDO', 'HEROE', 'LOGRO',
  'PRIME', 'DONAR', 'TECLA', 'RATON', 'VIRAL', 'MEMES', 'RISAS', 'CANAL', 'PANEL', 'KAPPA',
  'BANEO', 'CHATS', 'MAPAS', 'ARMAS', 'VIDAS', 'PUNTO', 'RONDA', 'MUNDO', 'NOCHE', 'LUCES',
  'SILLA', 'AUDIO', 'VIDEO', 'JUEGO', 'MOVIL', 'GRITO', 'FURIA', 'RABIA', 'SUSTO', 'MAGIA',
  'BOTON', 'TURNO', 'GANAR', 'DUELO', 'SPAWN', 'SKINS', 'LOBBY', 'SQUAD', 'AMIGO', 'CLAVE',
  'FANES', 'RAIDS', 'SALTO', 'TRUCO', 'CAMPO', 'TORRE', 'MONTE', 'GOLPE', 'PODER', 'BICHO',
].filter((w) => w.length === 5);

/**
 * Palabras comunes del español para el Wordle clásico (sin tildes; la Ñ se conserva).
 * El filtro descarta duplicados y cualquier palabra que no tenga exactamente 5 letras.
 */
export const CLASSIC_WORDS: readonly string[] = [
  ...new Set([
    'ARBOL', 'CIELO', 'PERRO', 'LIBRO', 'PLAYA', 'NUBES', 'FUEGO', 'CARTA', 'PIANO', 'SUEÑO',
    'VERDE', 'NEGRO', 'HIELO', 'LLAVE', 'BARCO', 'COCHE', 'CALLE', 'HOGAR', 'TECHO', 'PARED',
    'SUELO', 'RELOJ', 'FRESA', 'LIMON', 'MANGO', 'PERAS', 'PASTA', 'QUESO', 'LECHE', 'HUEVO',
    'ARROZ', 'TORTA', 'DULCE', 'SALSA', 'TAZAS', 'VASOS', 'PLATO', 'FELIZ', 'MIEDO', 'NOVIO',
    'PADRE', 'MADRE', 'PRIMO', 'NIÑOS', 'GATOS', 'LOBOS', 'OSITO', 'TIGRE', 'CEBRA', 'PANDA',
    'KOALA', 'PATOS', 'POLLO', 'CERDO', 'VACAS', 'BURRO', 'CABRA', 'OVEJA', 'ABEJA', 'MOSCA',
    'PULPO', 'PERLA', 'PLATA', 'COBRE', 'METAL', 'ARENA', 'VALLE', 'ISLAS', 'NIEVE', 'RAYOS',
    'SOLAR', 'LUNAR', 'TARDE', 'HORAS', 'LAPIZ', 'PAPEL', 'GOMAS', 'REGLA', 'CLASE', 'NOTAS',
    'BAILE', 'CANTO', 'RADIO', 'DISCO', 'TEXTO', 'VERSO', 'POEMA', 'SALUD', 'BRAZO', 'MANOS',
    'DEDOS', 'NARIZ', 'LABIO', 'FALDA', 'BOTAS', 'GORRO', 'NADAR', 'COMER', 'BEBER', 'SOÑAR',
    'ABRIR', 'MIRAR', 'TOCAR', 'VIVIR', 'ESTAR', 'TENER', 'HACER', 'SABER', 'VENIR', 'SALIR',
    'FLACO', 'GORDO', 'LARGO', 'CORTO', 'ALTOS', 'LENTO', 'LISTO', 'TONTO', 'SUAVE', 'FINAL',
    'COMUN', 'IDEAL', 'ROSAS', 'LIRIO', 'PALMA', 'TRIGO', 'CAMPO',
  ]),
].filter((w) => w.length === 5);
