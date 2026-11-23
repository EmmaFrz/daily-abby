import { useEffect, useRef, useState } from 'react';
import { setMusicVolume, setSoundEnabled, setSoundVolume, sfx, useSoundSettings } from '../lib/sound';
import { Card, CardTitle } from './ui';

/** Botón de la barra superior: abre un desplegable con los mismos ajustes de sonido que la pestaña Logros. */
export function SoundToggle() {
  const { enabled } = useSoundSettings();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`grid h-8 w-8 place-items-center rounded-full border border-slot text-base transition hover:bg-page ${open ? 'bg-page' : 'bg-paper'}`}
        title="Ajustes de sonido"
        aria-label="Ajustes de sonido"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {enabled ? '🔊' : '🔇'}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Ajustes de sonido"
          className="glass animate-rise absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl p-4 text-sm font-normal text-white shadow-[0_24px_60px_-24px_rgb(42_26_60/0.5)]"
        >
          <div className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            <span className="text-lg">🔊</span> Sonido
          </div>
          <SoundSettingsControls />
        </div>
      )}
    </div>
  );
}

/** Ajustes de sonido (en la pestaña Logros). */
export function SoundSettingsCard({ delay = 0 }: { delay?: number }) {
  return (
    <Card delay={delay}>
      <CardTitle icon="🔊">Sonido</CardTitle>
      <SoundSettingsControls />
    </Card>
  );
}

/** Controles de sonido compartidos por la tarjeta de Logros y el desplegable de la cabecera. */
function SoundSettingsControls() {
  const { enabled, volume, music } = useSoundSettings();
  return (
    <>
      <label className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3 py-2.5 shadow-[0_1px_0_var(--color-slot)]">
        <span className="font-bold">Efectos de sonido y vibración</span>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => {
            setSoundEnabled(!enabled);
            if (!enabled) sfx('pop');
          }}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? 'bg-abby' : 'bg-white/20'}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-paper shadow transition-all ${enabled ? 'left-6' : 'left-1'}`} />
        </button>
      </label>
      <div className={`mt-3 flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5 shadow-[0_1px_0_var(--color-slot)] ${enabled ? '' : 'opacity-40'}`}>
        <span>🔈</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          disabled={!enabled}
          onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
          onPointerUp={() => sfx('ok')}
          onKeyUp={() => sfx('ok')}
          className="h-2 flex-1 cursor-pointer accent-[#ff3d97]"
          aria-label="Volumen de los efectos"
        />
        <span>🔊</span>
        <span className="w-10 text-right font-display text-sm tabular-nums text-white/70">{Math.round(volume * 100)}%</span>
      </div>
      <div className="mt-3 rounded-xl bg-paper px-3 py-2.5 shadow-[0_1px_0_var(--color-slot)]">
        <span className="font-bold">Volumen de la música</span>
        <span className="block text-xs text-white/50">Canciones de los Heardle y demás retos musicales.</span>
        <div className="mt-2 flex items-center gap-3">
          <span>🎵</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(music * 100)}
            onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
            className="h-2 flex-1 cursor-pointer accent-[#ff3d97]"
            aria-label="Volumen de la música"
          />
          <span className="w-10 text-right font-display text-sm tabular-nums text-white/70">{Math.round(music * 100)}%</span>
        </div>
      </div>
      <button className="btn btn-ghost mt-3 w-full text-sm" disabled={!enabled} onClick={() => sfx('win')}>
        🎵 Probar sonido
      </button>
    </>
  );
}
