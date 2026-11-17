import { useState } from 'react';
import { ABBY } from '../config/abby';

/**
 * Avatar con borde blanco de cromo. Si existe public/abby.png se usa esa imagen;
 * si no, un monograma.
 */
export function Avatar({ size = 96, live = false }: { size?: number; live?: boolean }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="absolute inset-0 overflow-hidden rounded-full bg-gradient-to-br from-abby to-twitch ring-[3px] ring-paper shadow-[0_3px_8px_-2px_rgb(42_26_60/0.4)]">
        {imgOk ? (
          <img
            src={ABBY.avatarUrl}
            alt={ABBY.name}
            className="h-full w-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <span
              className="font-display font-extrabold leading-none text-paper"
              style={{ fontSize: size * 0.46 }}
            >
              {ABBY.name[0]}
            </span>
          </div>
        )}
      </div>
      {live && (
        <span className="animate-pulse-live absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-paper">
          LIVE
        </span>
      )}
    </div>
  );
}
