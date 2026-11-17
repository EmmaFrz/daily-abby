import { useState, type FormEvent } from 'react';
import { withAchievements } from '../data/achievements';
import { codeFlag, findEgg } from '../data/eggs';
import { fetchTrack } from '../lib/itunes';
import { sfx, soundSettings } from '../lib/sound';
import { useStore } from '../state/store';
import type { ActiveEgg } from './EasterEggs';
import { Modal } from './ui';

/** WAV vacío: se reproduce dentro del clic para que el navegador deje sonar la canción después. */
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

/** Botón "Canjear código" y su ventana, como un código promocional. */
export function RedeemCode({ onRedeem }: { onRedeem: (egg: ActiveEgg) => void }) {
  const { act } = useStore();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(0);

  const close = () => {
    setOpen(false);
    setError(false);
    setCode('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const egg = findEgg(code);
    if (!egg) {
      sfx('wrong');
      setError(true);
      setShake((n) => n + 1);
      return;
    }

    // El audio se desbloquea aquí, dentro del clic (si no, los móviles no lo dejan sonar).
    // La canción la pone el easter egg cuando la previa está lista.
    let audio: HTMLAudioElement | null = null;
    if (soundSettings().enabled) {
      audio = new Audio(SILENCE);
      void audio.play().catch(() => {});
    }
    const track = fetchTrack(egg.song.trackId, egg.song.store).catch(() => null);

    // Guarda el código canjeado: con todos se gana el logro "Cazador de códigos".
    act((s) => (s.flags.includes(codeFlag(egg.id)) ? s : withAchievements({ ...s, flags: [...s.flags, codeFlag(egg.id)] })));

    sfx('achievement');
    close();
    onRedeem({ egg, audio, track, key: Date.now() });
  };

  return (
    <>
      <button
        onClick={() => {
          sfx('pop');
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slot bg-paper/80 px-3 py-1 text-xs font-bold text-dim transition hover:border-abby hover:text-white"
      >
        <span aria-hidden>🎟️</span> Canjear código
      </button>

      <Modal open={open} onClose={close}>
        <form onSubmit={submit} className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-dim">Código promocional</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold [font-variation-settings:'wdth'_85]">¿Tienes un código?</h2>
          <p className="mt-1 text-sm text-dim">Escríbelo y canjéalo. Si es bueno, pasará algo.</p>

          <label htmlFor="codigo-promo" className="sr-only">
            Código
          </label>
          <div key={shake} className={`redeem-ticket mt-5 ${shake ? 'animate-shake' : ''}`}>
            <input
              id="codigo-promo"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={32}
              placeholder="XXXX-XXXX"
              className="w-full bg-transparent text-center font-display text-2xl font-extrabold uppercase tracking-[0.14em] text-white outline-none placeholder:text-slot"
            />
          </div>
          <p className={`mt-2 h-5 text-sm font-bold text-rose-200 ${error ? '' : 'invisible'}`} role="status">
            Ese código no existe. Prueba con otro.
          </p>

          <button type="submit" className="btn btn-primary mt-3 w-full py-3" disabled={!code.trim()}>
            Canjear
          </button>
        </form>
      </Modal>
    </>
  );
}
