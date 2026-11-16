import { setSoundEnabled, setSoundVolume, sfx, useSoundSettings } from '../lib/sound';
import { Card, CardTitle } from './ui';

/** Botón de la barra superior para silenciar o activar el sonido. */
export function SoundToggle() {
  const { enabled } = useSoundSettings();
  return (
    <button
      onClick={() => {
        setSoundEnabled(!enabled);
        if (!enabled) sfx('pop');
      }}
      className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/6 text-base transition hover:bg-white/12"
      title={enabled ? 'Silenciar' : 'Activar sonido'}
      aria-label={enabled ? 'Silenciar' : 'Activar sonido'}
      aria-pressed={!enabled}
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  );
}

/** Ajustes de sonido (en la pestaña Logros). */
export function SoundSettingsCard({ delay = 0 }: { delay?: number }) {
  const { enabled, volume } = useSoundSettings();
  return (
    <Card delay={delay}>
      <CardTitle icon="🔊">Sonido</CardTitle>
      <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
        <span className="font-bold">Efectos de sonido y vibración</span>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => {
            setSoundEnabled(!enabled);
            if (!enabled) sfx('pop');
          }}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? 'bg-gradient-to-r from-abby to-twitch' : 'bg-white/15'}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-6' : 'left-1'}`} />
        </button>
      </label>
      <div className={`mt-3 flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5 ${enabled ? '' : 'opacity-40'}`}>
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
          className="h-2 flex-1 cursor-pointer accent-[#ff4fa3]"
          aria-label="Volumen"
        />
        <span>🔊</span>
        <span className="w-10 text-right font-display text-sm tabular-nums text-white/70">{Math.round(volume * 100)}%</span>
      </div>
      <button className="btn btn-ghost mt-3 w-full text-sm" disabled={!enabled} onClick={() => sfx('win')}>
        🎵 Probar sonido
      </button>
    </Card>
  );
}
