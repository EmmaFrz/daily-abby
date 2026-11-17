import { useState } from 'react';
import { ABBY } from '../config/abby';
import { sfx } from '../lib/sound';
import { MINIGAMES } from '../minigames/meta';
import { Modal } from './ui';

const SEEN_KEY = 'abby-prealfa-visto';

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

/** Aviso de versión pre-alfa: solo se muestra la primera vez que se abre la página. */
export function PreAlphaModal() {
  const [open, setOpen] = useState(() => !alreadySeen());

  const close = () => {
    sfx('pop');
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* sin almacenamiento: no podemos recordar que ya se vio */
    }
    setOpen(false);
  };

  const points = [
    ['🧪', 'Es una versión muy temprana', 'Puede haber errores, cosas a medio pulir y cambios de un día para otro.'],
    ['🧩', `${MINIGAMES.length} minijuegos diarios`, 'Cada día a medianoche hay retos nuevos, los mismos para toda la comunidad.'],
    ['💾', 'Tu progreso vive en este navegador', 'Rachas y logros se guardan aquí. En futuras versiones podrían reiniciarse.'],
    ['🛠️', 'Va a crecer', 'Vendrán más juegos, contenido y mejoras. ¡Gracias por probarlo tan pronto!'],
  ];

  return (
    <Modal open={open} onClose={close}>
      <div className="text-center">
        <div className="animate-bounce-in mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-300/15 px-4 py-1.5 font-display text-sm font-bold uppercase tracking-[0.2em] text-amber-200">
          🚧 Pre-alfa
        </div>
        <h2 className="font-display text-3xl font-bold leading-tight">
          ¡Hola! Estos son los diarios de <span className="text-gradient">{ABBY.name}</span>
        </h2>
        <p className="mt-2 text-white/65">Antes de empezar, una cosita importante:</p>
      </div>

      <ul className="mt-5 grid gap-2.5">
        {points.map(([icon, title, text], i) => (
          <li
            key={title}
            className="animate-rise flex gap-3 rounded-xl border border-slot/70 bg-page p-3"
            style={{ animationDelay: `${150 + i * 90}ms` }}
          >
            <span className="text-2xl">{icon}</span>
            <span>
              <span className="block font-display font-semibold">{title}</span>
              <span className="block text-sm text-white/60">{text}</span>
            </span>
          </li>
        ))}
      </ul>

      <button className="btn btn-primary mt-6 w-full py-3 text-lg" onClick={close} autoFocus>
        ¡Entendido, a jugar!
      </button>
    </Modal>
  );
}
