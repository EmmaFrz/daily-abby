import { useMemo, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['#ff4fa3', '#b14bff', '#5ce1ff', '#fde047', '#ff9ad0', '#4ade80'];

/** Lluvia de confeti de un solo uso. Cambia `burst` para lanzar otra. */
export function Confetti({ burst, pieces = 90 }: { burst: number; pieces?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: `${burst}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 2.2 + Math.random() * 1.8,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        drift: `${(Math.random() - 0.5) * 30}vw`,
        spin: `${(Math.random() - 0.5) * 1440}deg`,
        round: Math.random() > 0.6,
      })),
    [burst, pieces],
  );
  if (!burst) return null;
  return createPortal(
    <div key={burst} aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {items.map((p) => (
        <span
          key={p.id}
          className="absolute top-0"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.round ? p.w : p.h,
              background: p.color,
              borderRadius: p.round ? '999px' : '2px',
              animation: `confetti-fall ${p.dur}s cubic-bezier(.2,.6,.4,1) ${p.delay}s forwards`,
              '--drift': p.drift,
              '--spin': p.spin,
            } as CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  );
}
