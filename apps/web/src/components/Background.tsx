import { useMemo } from 'react';

/** Fondo animado: manchas de neón, rejilla y estrellitas. */
export function Background() {
  const stars = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2.4 + 1,
        delay: Math.random() * 3,
        dur: 2 + Math.random() * 3,
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2a1650_0%,#0b0716_60%)]" />
      <div className="animate-float absolute -left-[15%] -top-[20%] h-[65vmax] w-[65vmax] rounded-full bg-[#ff4fa3]/25 blur-[110px]" />
      <div className="animate-float-slow absolute -right-[20%] top-[10%] h-[60vmax] w-[60vmax] rounded-full bg-[#7c3aed]/30 blur-[120px] [animation-delay:-4s]" />
      <div className="animate-float absolute -bottom-[30%] left-[20%] h-[55vmax] w-[55vmax] rounded-full bg-[#22d3ee]/12 blur-[120px] [animation-delay:-8s]" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
        }}
      />
      {stars.map((s) => (
        <span
          key={s.id}
          className="animate-twinkle absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
            boxShadow: '0 0 6px rgb(255 255 255 / 0.8)',
          }}
        />
      ))}
    </div>
  );
}
