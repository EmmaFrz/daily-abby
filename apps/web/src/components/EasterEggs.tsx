import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Easter eggs de los códigos promocionales: una escena de fondo, una carta "full art" que gira y una
 * canción (previa oficial de Apple Music). Todo se anima con CSS (transform/opacity) y dura DURATION ms.
 *
 * Para añadir uno: un objeto en EGGS (los códigos se comparan sin mayúsculas, tildes, espacios ni
 * signos) y, si quieres una escena nueva, su fondo en <Scene> y su ilustración en <Art>.
 */

export interface EasterEgg {
  id: string;
  /** Códigos que lo activan (se normalizan con normalizeCode). */
  codes: string[];
  /** Nombre de la carta. */
  name: string;
  /** Línea de tipo de la carta. */
  kind: string;
  flavor: string;
  scene: 'space' | 'blocks' | 'summit';
  song: { trackId: number; title: string; artist: string; store?: string };
}

export const EGGS: EasterEgg[] = [
  {
    id: 'outerwilds',
    codes: ['outerwilds', 'outer wilds'],
    name: 'El Viajero',
    kind: 'Exploración · Fuera del tiempo',
    flavor: 'El universo vuelve a empezar cada 22 minutos. Asa un malvavisco junto al fuego y escucha.',
    scene: 'space',
    song: { trackId: 1467259940, title: 'Travelers', artist: 'Andrew Prahlow' },
  },
  {
    id: 'minecraft',
    codes: ['minecraft'],
    name: 'Primer bloque',
    kind: 'Construcción · Supervivencia',
    flavor: 'Primero, un árbol. Después, un refugio. Y nunca caves justo hacia abajo.',
    scene: 'blocks',
    song: { trackId: 1867885632, title: 'Sweden', artist: 'C418' },
  },
  {
    id: 'celeste',
    codes: ['celeste'],
    name: 'La cima',
    kind: 'Escalada · Determinación',
    flavor: 'No hace falta llegar arriba de un salto. Basta con dar el siguiente paso.',
    scene: 'summit',
    song: { trackId: 1544899660, title: 'First Steps', artist: 'Lena Raine' },
  },
];

/** Minúsculas, sin tildes, espacios ni signos: "Outer Wilds!" → "outerwilds". */
export function normalizeCode(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]/g, '');
}

export function findEgg(raw: string): EasterEgg | undefined {
  const code = normalizeCode(raw);
  if (!code) return undefined;
  return EGGS.find((e) => e.codes.some((c) => normalizeCode(c) === code));
}

/** Duración total en pantalla y de la animación de salida (ms). */
const DURATION = 20_000;
const LEAVE = 900;
const FADE_MS = 2_000;

export interface ActiveEgg {
  egg: EasterEgg;
  /** Audio ya "desbloqueado" en el clic de canjear (los navegadores móviles lo exigen). */
  audio: HTMLAudioElement | null;
  /** Enlace a Apple Music cuando la previa ha cargado. */
  link: Promise<string | null>;
  key: number;
}

export function EasterEggOverlay({ active, onDone }: { active: ActiveEgg; onDone: () => void }) {
  const { egg, audio } = active;
  const [leaving, setLeaving] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const fade = useRef(0);

  const leave = useCallback(() => {
    setLeaving((was) => {
      if (!was) timers.current.push(window.setTimeout(onDone, LEAVE));
      return true;
    });
  }, [onDone]);

  useEffect(() => {
    let alive = true;
    void active.link.then((l) => alive && setLink(l));
    const t = timers.current;
    t.push(window.setTimeout(leave, DURATION - LEAVE));
    // La música baja de volumen los últimos segundos.
    t.push(
      window.setTimeout(() => {
        if (!audio) return;
        const start = audio.volume;
        const steps = 20;
        let i = 0;
        fade.current = window.setInterval(() => {
          i++;
          audio.volume = Math.max(0, start * (1 - i / steps));
          if (i >= steps) window.clearInterval(fade.current);
        }, FADE_MS / steps);
      }, DURATION - FADE_MS),
    );
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && leave();
    window.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      t.forEach(window.clearTimeout);
      window.clearInterval(fade.current);
      window.removeEventListener('keydown', onKey);
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [active.link, audio, leave]);

  return (
    <div className={`egg egg-${egg.scene} ${leaving ? 'leaving' : ''}`} role="dialog" aria-label={`Easter egg: ${egg.name}`} onClick={leave}>
      <Scene scene={egg.scene} />

      <div className="egg-stage">
        <div className="egg-card-wrap">
          <div className="egg-card">
            <div className="egg-face">
              <div className="egg-art">
                <Art scene={egg.scene} />
              </div>
              <div className="egg-top">
                <span>{egg.name}</span>
                <span className="egg-rarity">★ Secreta</span>
              </div>
              <div className="egg-bottom">
                <span className="egg-kind">{egg.kind}</span>
                <p>{egg.flavor}</p>
                <span className="egg-set">
                  <span>Abby · Diarios</span>
                  <span>Promo {String(EGGS.indexOf(egg) + 1).padStart(2, '0')}/{String(EGGS.length).padStart(2, '0')}</span>
                </span>
              </div>
            </div>
            <div className="egg-back" aria-hidden>
              <span>Abby</span>
              <small>Álbum de diarios</small>
            </div>
          </div>
        </div>

        <div className="egg-caption" onClick={(e) => e.stopPropagation()}>
          <span className="egg-caption-kicker">Código canjeado</span>
          <span className="egg-caption-song">
            ♪ {egg.song.title} · {egg.song.artist}
            {link && (
              <>
                {' · '}
                <a href={link} target="_blank" rel="noreferrer">
                  Escuchar en Apple Music
                </a>
              </>
            )}
          </span>
          <span className="egg-timer" aria-hidden />
        </div>
      </div>

      <button className="egg-close" onClick={leave} aria-label="Cerrar">
        ✕
      </button>
    </div>
  );
}

/** Fondo de pantalla de cada escena. */
function Scene({ scene }: { scene: EasterEgg['scene'] }) {
  if (scene === 'space')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="stars stars-far" />
        <span className="stars stars-near" />
        <span className="shooting" />
        <span className="shooting shooting-2" />
      </div>
    );
  if (scene === 'blocks')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="block-sun" />
        <span className="block-cloud" />
        <span className="block-cloud block-cloud-2" />
        <span className="block-ground" />
      </div>
    );
  return (
    <div className="egg-scene" aria-hidden>
      <span className="stars stars-far" />
      <span className="summit-range" />
      <span className="summit-range summit-range-front" />
      <span className="snow" />
      <span className="snow snow-near" />
    </div>
  );
}

/** Ilustración de la carta. */
function Art({ scene }: { scene: EasterEgg['scene'] }) {
  if (scene === 'space')
    return (
      <>
        <span className="stars stars-far" />
        <span className="art-sun" />
        <span className="art-planet" />
        <span className="art-emoji art-fire">🔥</span>
        <span className="art-emoji art-tent">🏕️</span>
        <span className="art-orbit">
          <span className="art-emoji">🚀</span>
        </span>
      </>
    );
  if (scene === 'blocks')
    return (
      <>
        <span className="block-sun art-block-sun" />
        <span className="block-cloud art-block-cloud" />
        <span className="art-grass-block" />
        <span className="art-emoji art-pick">⛏️</span>
        <span className="art-emoji art-tree">🌳</span>
      </>
    );
  return (
    <>
      <span className="stars stars-far" />
      <span className="summit-range art-summit" />
      <span className="art-emoji art-berry">🍓</span>
      <span className="snow" />
    </>
  );
}
