import { useEffect } from 'react';
import { normalizeWord } from '../lib/format';
import { sfx } from '../lib/sound';

export type KeyState = 'ok' | 'present' | 'absent';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];

const KEY: Record<KeyState, string> = {
  ok: 'bg-emerald-500 text-white',
  present: 'bg-amber-500 text-white',
  absent: 'bg-white/5 text-white/25',
};

/**
 * Escucha el teclado físico: letras (A-Z, Ñ), ENTER y BORRAR.
 * `tapSound`: clic suave al escribir (desactivado en juegos que ya suenan por letra, como el Ahorcado).
 */
export function usePhysicalKeys(onKey: (k: string) => void, active: boolean, tapSound = true) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (e.key === 'Enter') onKey('ENTER');
      else if (e.key === 'Backspace') {
        if (tapSound) sfx('tap', { pitch: 0.8 });
        onKey('BORRAR');
      } else if (e.key.length === 1) {
        const k = normalizeWord(e.key);
        if (/^[A-ZÑ]$/.test(k)) {
          if (tapSound) sfx('tap');
          onKey(k);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onKey, active, tapSound]);
}

export function Keyboard({
  states,
  onKey,
  withEnter = true,
}: {
  states: Record<string, KeyState>;
  onKey: (k: string) => void;
  withEnter?: boolean;
}) {
  return (
    <div className="mx-auto grid w-full max-w-lg gap-1.5">
      {ROWS.map((row, ri) => (
        <div key={row} className="flex justify-center gap-1">
          {ri === 2 && withEnter && (
            <button className="btn rounded-lg bg-gradient-to-r from-abby to-twitch px-2 py-3 text-xs" onClick={() => onKey('ENTER')}>
              ENVIAR
            </button>
          )}
          {[...row].map((k) => {
            const st = states[k];
            return (
              <button
                key={k}
                onClick={() => {
                  if (withEnter) sfx('tap');
                  onKey(k);
                }}
                disabled={!withEnter && !!st}
                className={`h-12 min-w-0 flex-1 rounded-lg font-display text-base font-bold transition active:scale-95 sm:max-w-11 ${
                  st ? KEY[st] : 'bg-white/14 text-white hover:bg-white/22'
                }`}
              >
                {k}
              </button>
            );
          })}
          {ri === 2 && withEnter && (
            <button
              className="btn rounded-lg bg-white/14 px-2.5 py-3 text-base"
              onClick={() => {
                sfx('tap', { pitch: 0.8 });
                onKey('BORRAR');
              }}
              aria-label="Borrar"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
