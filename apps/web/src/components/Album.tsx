import type { CSSProperties, ReactNode } from 'react';

/** Inclinación fija de cada cromo según su número: parece pegado a mano y no cambia entre visitas. */
const TILTS = [-1.6, 1.2, -0.8, 1.7, -1.2, 0.7, 1.4, -1.4, 0.9, -0.6];
export const tilt = (n: number) => TILTS[Math.abs(n) % TILTS.length]!;

type StickerStatus = 'won' | 'lost' | 'playing';

/** Ilustración del cromo: el icono sobre el color de su categoría. */
export function StickerArt({
  icon,
  color,
  grey = false,
  className = 'h-20 text-4xl',
}: {
  icon: string;
  color: string;
  grey?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`sticker-art ${className} ${grey ? 'grayscale contrast-75' : ''}`}
      style={{ '--c': color } as CSSProperties}
      aria-hidden
    >
      {/* Por encima del brillo, con un halo blanco para que se lea sobre su propio color (🟩 sobre verde). */}
      <span className="relative z-[1] [filter:drop-shadow(0_0_1.5px_rgb(255_255_255/0.95))_drop-shadow(0_3px_0_rgb(42_26_60/0.18))]">{icon}</span>
    </span>
  );
}

/** Número del cromo en una pastilla blanca. */
export function StickerNumber({ n, className = '' }: { n: ReactNode; className?: string }) {
  return (
    <span
      className={`num-display grid h-[22px] min-w-[22px] place-items-center rounded-full bg-paper px-1.5 text-xs text-white shadow-[0_1px_2px_rgb(42_26_60/0.25)] ${className}`}
    >
      {n}
    </span>
  );
}

/** Barra de piezas (p. ej. los 7 géneros del Heardle). */
export function Pieces({ states, color }: { states: ('won' | 'lost' | 'new')[]; color: string }) {
  return (
    <span className="flex gap-[3px]" aria-hidden>
      {states.map((s, i) => (
        <span
          key={i}
          className="h-1.5 flex-1 rounded-[2px]"
          style={{ background: s === 'won' ? color : s === 'lost' ? 'var(--color-absent)' : '#eee8f4' }}
        />
      ))}
    </span>
  );
}

/** Cromo pegado: reto ganado, fallado (en gris, con sello) o a medias (esquina despegada). */
export function Sticker({
  n,
  icon,
  color,
  name,
  sub,
  status,
  onClick,
  footer,
  delay = 0,
}: {
  n: ReactNode;
  icon: string;
  color: string;
  name: string;
  sub?: ReactNode;
  status: StickerStatus;
  onClick?: () => void;
  footer?: ReactNode;
  delay?: number;
}) {
  const r = typeof n === 'number' ? tilt(n) : 0;
  return (
    <button
      onClick={onClick}
      className={`sticker animate-rise w-full min-w-0 text-left ${status === 'playing' ? 'sticker-peel' : ''}`}
      style={{ '--r': `${r}deg`, animationDelay: `${delay}ms` } as CSSProperties}
      aria-label={`${name}: ${status === 'won' ? 'hecho' : status === 'lost' ? 'fallado' : 'a medias'}`}
    >
      <StickerNumber n={n} className="absolute left-3 top-3 z-10" />
      {status === 'lost' && <span className="stamp absolute right-3 top-14 z-10">FALLADO</span>}
      <StickerArt icon={icon} color={color} grey={status === 'lost'} />
      <span className="mx-1 mt-2 block truncate font-display text-[15px] font-bold leading-tight">{name}</span>
      {sub && <span className="mx-1 mt-0.5 block truncate text-xs font-semibold text-dim">{sub}</span>}
      {footer && <span className="mx-1 mt-2 block">{footer}</span>}
    </button>
  );
}

/** Hueco vacío del álbum: reto sin jugar. */
export function Slot({
  n,
  name,
  tagline,
  onClick,
  extra,
  delay = 0,
}: {
  n: ReactNode;
  name: string;
  tagline: string;
  onClick?: () => void;
  extra?: ReactNode;
  delay?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="slot animate-rise group flex min-h-[148px] w-full min-w-0 flex-col p-3 text-left"
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`${name}: sin jugar`}
    >
      <span className="num-display text-5xl text-slot transition group-hover:text-abby/40">{n}</span>
      <span className="mt-auto block font-display text-[15px] font-bold leading-tight">{name}</span>
      <span className="mt-0.5 block text-xs font-semibold leading-snug text-dim">{tagline}</span>
      {extra && <span className="mt-1.5 block">{extra}</span>}
      <span className="absolute right-3 top-3 rounded-full bg-abby px-2.5 py-0.5 font-display text-[11px] font-bold text-paper shadow-[0_2px_0_#c8166e]">
        Jugar
      </span>
    </button>
  );
}

/** Cabecera de una página del álbum. */
export function PageHeader({ page, title, right }: { page: ReactNode; title: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline gap-2.5 px-1">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-dim">{page}</span>
      <h2 className="font-display text-xl font-extrabold [font-variation-settings:'wdth'_85]">{title}</h2>
      {right && <span className="ml-auto text-xs font-bold text-dim">{right}</span>}
    </div>
  );
}
