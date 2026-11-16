import type { ReactNode } from 'react';

export function Centered({ children }: { children: ReactNode }) {
  return <div className="grid min-h-dvh place-items-center p-4 text-center text-xl text-white/70">{children}</div>;
}
