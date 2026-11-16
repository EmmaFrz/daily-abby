import { useState } from 'react';
import { ABBY } from '../config/abby';

/**
 * Avatar con aro de neón giratorio. Si existe public/abby.png se usa esa imagen;
 * si no, un monograma.
 */
export function Avatar({ size = 96, live = false }: { size?: number; live?: boolean }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="animate-spin-slow absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#ff4fa3,#b14bff,#5ce1ff,#ff9ad0,#ff4fa3)] blur-[2px]" />
      <div className="absolute inset-[3px] overflow-hidden rounded-full bg-gradient-to-br from-[#2b1350] to-[#140a26]">
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
              className="font-display font-bold text-gradient leading-none"
              style={{ fontSize: size * 0.46 }}
            >
              {ABBY.name[0]}
            </span>
            <span style={{ fontSize: size * 0.18 }} className="-mt-1">
              🎧
            </span>
          </div>
        )}
      </div>
      {live && (
        <span className="animate-pulse-live absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-white">
          LIVE
        </span>
      )}
    </div>
  );
}
