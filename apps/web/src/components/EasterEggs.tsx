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
  /** Rareza que se muestra arriba a la derecha. */
  rarity: string;
  /** Línea de tipo de la carta. */
  kind: string;
  flavor: string;
  scene: 'space' | 'silk' | 'rift' | 'aru';
  song: { trackId: number; title: string; artist: string; store?: string };
}

export const EGGS: EasterEgg[] = [
  {
    id: 'outerwilds',
    codes: ['outerwilds'],
    name: 'El Viajero',
    rarity: '★ Secreta',
    kind: 'Exploración · Fuera del tiempo',
    flavor: 'El universo vuelve a empezar cada 22 minutos. Asa un malvavisco junto al fuego y escucha.',
    scene: 'space',
    song: { trackId: 1467259940, title: 'Travelers', artist: 'Andrew Prahlow' },
  },
  {
    id: 'silksong',
    codes: ['silksong', 'hollowknightsilksong'],
    name: 'Hilo y aguja',
    rarity: '★ Secreta',
    kind: 'Peregrinaje · La ciudadela',
    flavor: 'Sube hasta lo más alto. Cada campana que suena es un paso más del camino.',
    scene: 'silk',
    song: { trackId: 1838953941, title: 'Silksong', artist: 'Christopher Larkin' },
  },
  {
    id: 'lol',
    codes: ['lol', 'leagueoflegends'],
    name: 'Invocador',
    rarity: '★ Secreta',
    kind: 'Estrategia · La Grieta',
    flavor: '¡Bienvenidos a la Grieta del Invocador! Cinco contra cinco y un nexo que defender.',
    scene: 'rift',
    song: { trackId: 1833078315, title: 'Legends Never Die', artist: 'League of Legends Music & Against The Current' },
  },
  {
    id: 'aru',
    codes: ['aru'],
    name: 'Aru',
    rarity: '♥ Única',
    kind: 'Gato de Abby · Dormilón',
    flavor: 'Blanco, peludo y casi siempre dormido. Si lo despiertas, que sea con mimos.',
    scene: 'aru',
    song: { trackId: 1443843920, title: "Ev'rybody Wants to Be a Cat", artist: 'Los Aristogatos' },
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
                <span className="egg-rarity">{egg.rarity}</span>
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
  if (scene === 'silk')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="embers" />
        <span className="threads" />
        <span className="threads threads-near" />
        <span className="citadel" />
      </div>
    );
  if (scene === 'rift')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="egg-ring" />
        <span className="egg-ring egg-ring-2" />
        <span className="embers embers-gold" />
      </div>
    );
  return (
    <div className="egg-scene" aria-hidden>
      <span className="stars stars-far" />
      <span className="moon" />
      <span className="zz zz-1">z</span>
      <span className="zz zz-2">z</span>
      <span className="zz zz-3">Z</span>
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
  if (scene === 'silk')
    return (
      <>
        <span className="embers" />
        <span className="threads" />
        <span className="citadel" />
        <span className="art-bell">
          <span className="art-emoji">🔔</span>
        </span>
        {/* Pequeña figura con capa roja, máscara blanca con cuernos y su aguja. */}
        <span className="wanderer">
          <span className="wanderer-needle" />
          <span className="wanderer-cloak" />
          <span className="wanderer-head" />
        </span>
      </>
    );
  if (scene === 'rift')
    return (
      <>
        <span className="embers embers-gold" />
        <span className="egg-ring art-ring" />
        <span className="egg-ring egg-ring-2 art-ring-2" />
        <span className="art-glow" />
        <span className="art-crystal" />
        <span className="art-emoji art-swords">⚔️</span>
      </>
    );
  // Aru: gato blanco y muy peludo, dormido en su cojín; de vez en cuando abre sus ojos claros.
  return (
    <>
      <span className="stars stars-far" />
      <span className="moon art-moon" />
      <span className="aru">
        <span className="aru-cushion" />
        <span className="aru-body" />
        <span className="aru-tail" />
        <span className="aru-head">
          <span className="aru-ear aru-ear-l" />
          <span className="aru-ear aru-ear-r" />
          <span className="aru-eye aru-eye-l" />
          <span className="aru-eye aru-eye-r" />
          <span className="aru-nose" />
        </span>
      </span>
      <span className="zz zz-1">z</span>
      <span className="zz zz-2">z</span>
      <span className="zz zz-3">Z</span>
    </>
  );
}
