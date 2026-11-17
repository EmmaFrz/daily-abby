/**
 * Códigos promocionales: cada uno abre un easter egg con su escena, su carta y su canción
 * (componente en src/components/EasterEggs.tsx, estilos en src/eggs.css).
 *
 * Los códigos se comparan sin mayúsculas, tildes, espacios ni signos. Al canjear uno se guarda la
 * hazaña `code-<id>`; con todos se desbloquea el logro "Cazador de códigos".
 */

export interface EasterEgg {
  id: string;
  /** Códigos que lo activan (se normalizan con normalizeCode). */
  codes: string[];
  /** Nombre de la carta. */
  name: string;
  /** Rareza que se muestra arriba a la derecha. */
  rarity: string;
  /** Línea de tipo de la carta. */
  kind: string;
  flavor: string;
  scene: 'space' | 'silk' | 'rift' | 'valorant' | 'aru' | 'subathon';
  /** Previa oficial de Apple Music (trackId del enlace de music.apple.com, tras ?i=). */
  song: { trackId: number; title: string; artist: string; store?: string };
}

export const EGGS: EasterEgg[] = [
  {
    id: 'outerwilds',
    codes: ['outerwilds'],
    name: 'El Viajero',
    rarity: '★ Secreta',
    kind: 'Exploración · Fuera del tiempo',
    flavor: 'El universo vuelve a empezar cada 22 minutos. Asa un malvavisco junto al fuego y escucha.',
    scene: 'space',
    song: { trackId: 1467259940, title: 'Travelers', artist: 'Andrew Prahlow' },
  },
  {
    id: 'silksong',
    codes: ['silksong', 'hollowknightsilksong'],
    name: 'Hornet',
    rarity: '★ Secreta',
    kind: 'Pharloom · Hilo y aguja',
    flavor: 'Una aguja, un hilo rojo y una ciudadela que escalar. Cada campana que suena es un paso más del camino.',
    scene: 'silk',
    song: { trackId: 1838953941, title: 'Silksong', artist: 'Christopher Larkin' },
  },
  {
    id: 'lol',
    codes: ['lol', 'leagueoflegends'],
    name: 'La Grieta',
    rarity: '★ Secreta',
    kind: 'MOBA · Grieta del Invocador',
    flavor: 'Abby sube por la calle superior con Irelia, su campeona de siempre. Pesada es la corona de quien llega a lo más alto.',
    scene: 'rift',
    song: { trackId: 1766137053, title: 'Heavy Is the Crown', artist: 'LINKIN PARK' },
  },
  {
    id: 'valorant',
    codes: ['valorant', 'valo'],
    name: 'Clutch',
    rarity: '★ Secreta',
    kind: 'Táctico · 5 contra 5',
    flavor: 'Uno contra cinco, la spike puesta y diez segundos. Respira, cruza la esquina y apunta a la cabeza.',
    scene: 'valorant',
    song: { trackId: 1833372290, title: 'Die For You', artist: 'VALORANT Music & Grabbitz' },
  },
  {
    id: 'aru',
    codes: ['aru'],
    name: 'Aru',
    rarity: '♥ Única',
    kind: 'Gato de Abby · Dormilón',
    flavor: 'Blanco, peludo y casi siempre dormido. Si lo despiertas, que sea con mimos.',
    scene: 'aru',
    song: { trackId: 1443843920, title: "Ev'rybody Wants to Be a Cat", artist: 'Los Aristogatos' },
  },
  {
    id: 'subathon',
    codes: ['subathon'],
    name: 'Subathon',
    rarity: '★ Evento anual',
    kind: 'Directo sin fin · Corea del Sur',
    flavor: 'Cada sub suma tiempo y el directo no acaba hasta llegar a cero. Edición Corea, con Jesskiu y Pausenpai.',
    scene: 'subathon',
    song: { trackId: 1703712321, title: 'BESO BRUMA', artist: 'Ralphie Choo' },
  },
];

/** Hazaña que se guarda al canjear un código. */
export const codeFlag = (id: string) => `code-${id}`;

/** Minúsculas, sin tildes, espacios ni signos: "Outer Wilds!" → "outerwilds". */
export function normalizeCode(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]/g, '');
}

export function findEgg(raw: string): EasterEgg | undefined {
  const code = normalizeCode(raw);
  if (!code) return undefined;
  return EGGS.find((e) => e.codes.some((c) => normalizeCode(c) === code));
}
