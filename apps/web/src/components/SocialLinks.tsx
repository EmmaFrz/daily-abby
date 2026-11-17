import { SOCIALS } from '../config/abby';

/** Botones a las redes de Abby. `compact`: solo iconos (para el pie de página). */
export function SocialLinks({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? 'justify-center' : 'justify-center sm:justify-start'}`}>
      {SOCIALS.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          title={`${s.label}: ${s.user}`}
          aria-label={`${s.label} de Abby (${s.user})`}
          className={`group inline-flex items-center gap-2 rounded-full border border-slot bg-paper font-bold text-white shadow-[0_2px_0_var(--color-slot)] transition hover:-translate-y-0.5 ${
            compact ? 'h-9 w-9 justify-center text-sm' : 'py-1.5 pl-1.5 pr-3.5 text-sm'
          }`}
                  >
          <span
            className={`grid place-items-center rounded-full font-black shadow ${compact ? 'h-7 w-7 text-xs' : 'h-7 w-7 text-sm'}`}
            style={{ background: s.color, color: s.id === 'tiktok' ? '#000' : '#fff' }}
          >
            {s.icon}
          </span>
          {!compact && (
            <span className="leading-none">
              {s.label}
              <span className="ml-1 text-xs font-bold text-dim group-hover:text-white/80">{s.user}</span>
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
