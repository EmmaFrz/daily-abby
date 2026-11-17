import type { CSSProperties } from 'react';
import { ABBY } from '../config/abby';
import { dailyPick, dayOfYear, seeded } from '../lib/daily';

/**
 * El sobre del día, al estilo de un sobre de cartas coleccionables: bordes dentados, banda ondulada,
 * brillo metalizado y una estrella con el número. Cada día cambian la edición (colores) y el patrón.
 * Todo sale de la fecha, así que toda la comunidad ve el mismo sobre.
 */

interface Edition {
  name: string;
  /** Degradado de fondo. */
  c1: string;
  c2: string;
  /** Color del patrón (con transparencia). */
  p: string;
  /** Estrella del número y su texto. */
  star: string;
  starText: string;
  /** Texto sobre el sobre. */
  text: string;
}

const INK = '#2a1a3c';
const WHITE = '#ffffff';

const EDITIONS: Edition[] = [
  { name: 'Atardecer', c1: '#ff8a3d', c2: '#ff2f7a', p: 'rgb(255 255 255 / 0.18)', star: '#ffe14d', starText: INK, text: WHITE },
  { name: 'Océano', c1: '#27c4ff', c2: '#4b4bff', p: 'rgb(255 255 255 / 0.16)', star: '#a6ffe9', starText: INK, text: WHITE },
  { name: 'Selva', c1: '#3fd98a', c2: '#0e8a6a', p: 'rgb(0 60 40 / 0.2)', star: '#f3ff7a', starText: INK, text: WHITE },
  { name: 'Limonada', c1: '#ffe45c', c2: '#ffa62e', p: 'rgb(255 255 255 / 0.4)', star: '#ff3d97', starText: WHITE, text: INK },
  { name: 'Galaxia', c1: '#8a4dff', c2: '#2b1a6b', p: 'rgb(255 255 255 / 0.13)', star: '#ff8ad8', starText: INK, text: WHITE },
  { name: 'Glaciar', c1: '#c4f4ff', c2: '#7aa8ff', p: 'rgb(255 255 255 / 0.5)', star: '#4b4bff', starText: WHITE, text: INK },
  { name: 'Medianoche', c1: '#3a2d66', c2: '#120d26', p: 'rgb(255 90 172 / 0.25)', star: '#5ce1ff', starText: INK, text: WHITE },
  { name: 'Chicle', c1: '#ffb8de', c2: '#ff4fa3', p: 'rgb(255 255 255 / 0.32)', star: '#7c4dff', starText: WHITE, text: INK },
  { name: 'Volcán', c1: '#ff5640', c2: '#7a1036', p: 'rgb(0 0 0 / 0.2)', star: '#ffb020', starText: INK, text: WHITE },
  { name: 'Menta', c1: '#8af5d2', c2: '#22b8c9', p: 'rgb(255 255 255 / 0.34)', star: '#ff5aac', starText: WHITE, text: INK },
];

/** Patrones de fondo; `var(--p)` es el color del patrón de la edición. */
const PATTERNS: { name: string; css: string }[] = [
  { name: 'rayas', css: 'repeating-linear-gradient(135deg, var(--p) 0 7px, transparent 7px 16px)' },
  { name: 'lunares', css: 'radial-gradient(var(--p) 2.6px, transparent 3.2px) 0 0 / 13px 13px' },
  { name: 'rayos', css: 'repeating-conic-gradient(from 0deg at 50% 47%, var(--p) 0 9deg, transparent 9deg 22deg)' },
  { name: 'cuadros', css: 'conic-gradient(var(--p) 25%, transparent 0 50%, var(--p) 0 75%, transparent 0) 0 0 / 16px 16px' },
  {
    name: 'zigzag',
    css: [
      'linear-gradient(135deg, var(--p) 25%, transparent 25%) -8px 0 / 16px 16px',
      'linear-gradient(225deg, var(--p) 25%, transparent 25%) -8px 0 / 16px 16px',
      'linear-gradient(315deg, var(--p) 25%, transparent 25%) 0 0 / 16px 16px',
      'linear-gradient(45deg, var(--p) 25%, transparent 25%) 0 0 / 16px 16px',
    ].join(', '),
  },
  { name: 'escamas', css: 'radial-gradient(circle at 50% 100%, transparent 5px, var(--p) 6px 8px, transparent 9px) 0 0 / 18px 9px' },
  { name: 'confeti', css: 'radial-gradient(var(--p) 1.4px, transparent 2px) 0 0 / 9px 9px, radial-gradient(var(--p) 3px, transparent 3.6px) 4px 6px / 23px 19px' },
  { name: 'rombos', css: 'linear-gradient(45deg, var(--p) 25%, transparent 25% 75%, var(--p) 75%) 0 0 / 14px 14px, linear-gradient(45deg, var(--p) 25%, transparent 25% 75%, var(--p) 75%) 7px 7px / 14px 14px' },
  { name: 'ondas', css: 'repeating-radial-gradient(circle at 50% 47%, var(--p) 0 4px, transparent 4px 12px)' },
];

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Polígono de estrella para clip-path. */
function starPolygon(points: number, inner: number, turn: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 50 : 50 * inner;
    const a = (Math.PI * i) / points + turn;
    pts.push(`${(50 + r * Math.sin(a)).toFixed(2)}% ${(50 - r * Math.cos(a)).toFixed(2)}%`);
  }
  return `polygon(${pts.join(', ')})`;
}

/** Edición, patrón y forma del sobre de un día. */
export function packOf(today: string) {
  const rng = seeded(today, 'sobre');
  return {
    number: dayOfYear(today),
    edition: dailyPick(EDITIONS, today, 'sobre-edicion'),
    pattern: dailyPick(PATTERNS, today, 'sobre-patron'),
    star: starPolygon(12 + Math.floor(rng() * 3) * 2, 0.8 + rng() * 0.06, rng() * Math.PI),
    tilt: -6 + rng() * 4,
  };
}

export function BoosterPack({ today, total, className = '' }: { today: string; total: number; className?: string }) {
  const { number, edition: e, pattern, star, tilt } = packOf(today);
  const date = new Date(`${today}T12:00:00`);
  return (
    <div
      className={`pack-wrap ${className}`}
      style={{ '--r': `${tilt}deg` } as CSSProperties}
      title={`Sobre #${number} · Edición ${e.name} · patrón de ${pattern.name}`}
    >
      <div
        className="pack"
        style={{ '--c1': e.c1, '--c2': e.c2, '--p': e.p, color: e.text } as CSSProperties}
        role="img"
        aria-label={`Sobre número ${number} del año, edición ${e.name}`}
      >
        <span className="pack-pattern" style={{ background: pattern.css }} />
        <span className="pack-wave" />
        <span className="pack-foil" />
        <span className="pack-crimp pack-crimp-top" />
        <span className="pack-crimp pack-crimp-bottom" />

        <span className="relative z-[2] flex h-full flex-col items-center px-2 pb-[18px] pt-[19px] text-center">
          <span className="text-[8.5px] font-extrabold uppercase tracking-[0.2em] opacity-90">{ABBY.name} · Diarios</span>
          <span className="pack-star mt-auto" style={{ clipPath: star, background: e.star, color: e.starText }}>
            <span className="text-[8px] font-extrabold uppercase tracking-[0.18em] opacity-80">Sobre</span>
            <span className="num-display text-[30px] leading-none">#{number}</span>
          </span>
          <span className="pack-ribbon mt-2" style={{ color: e.text }}>
            Edición {e.name}
          </span>
          <span className="mt-auto text-[9px] font-extrabold uppercase tracking-[0.14em] opacity-90">
            {total} cromos · {date.getDate()} {MONTHS[date.getMonth()]}
          </span>
        </span>
      </div>
    </div>
  );
}
