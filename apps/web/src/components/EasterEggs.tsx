import { useCallback, useEffect, useRef, useState } from 'react';
import { EGGS, type EasterEgg } from '../data/eggs';
import type { TrackInfo } from '../lib/itunes';
import { soundSettings } from '../lib/sound';

/**
 * Easter eggs de los códigos promocionales (datos en src/data/eggs.ts): una escena de fondo, una carta
 * "full art" que gira y una canción (previa oficial de Apple Music). Todo se anima con CSS
 * (transform/opacity) y dura DURATION ms. Una escena nueva lleva su fondo en <Scene>, su ilustración en
 * <Art> y sus estilos en src/eggs.css.
 */

/** Duración total en pantalla y de la animación de salida (ms). */
const DURATION = 20_000;
const LEAVE = 900;
const FADE_MS = 2_000;

export interface ActiveEgg {
  egg: EasterEgg;
  /** Audio "desbloqueado" en el clic de canjear (los navegadores móviles lo exigen); null si está silenciado. */
  audio: HTMLAudioElement | null;
  /** Previa de Apple Music (null si no hay conexión: el easter egg sale igual, sin música). */
  track: Promise<TrackInfo | null>;
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
    // La canción empieza aquí y no en el clic: si React desmonta y vuelve a montar el efecto (modo
    // estricto en desarrollo), la limpieza la pausa y esta parte la vuelve a poner. Antes, al canjear un
    // código por segunda vez la previa ya estaba en caché, sonaba al instante y la limpieza la paraba.
    void active.track.then((info) => {
      if (!alive || !info) return;
      setLink(info.url);
      if (!audio) return;
      if (audio.src !== info.previewUrl) audio.src = info.previewUrl;
      audio.volume = Math.max(0.05, soundSettings().volume);
      void audio.play().catch(() => {});
    });
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
      t.length = 0;
      window.clearInterval(fade.current);
      window.removeEventListener('keydown', onKey);
      audio?.pause();
    };
  }, [active.track, audio, leave]);

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

/** Hojas de arce del Subathon: [posición %, duración s, retraso s]. */
const LEAVES: [number, number, number][] = [
  [6, 11, -2],
  [18, 14, -9],
  [33, 12, -5],
  [61, 13, -1],
  [78, 10, -7],
  [92, 15, -11],
];

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
        <span className="lol-beam" />
        <span className="lol-beam lol-beam-2" />
        <span className="egg-ring" />
        <span className="egg-ring egg-ring-2" />
        <span className="embers embers-gold" />
      </div>
    );
  if (scene === 'valorant')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="vlr-lines" />
        <span className="vlr-slash" />
        <span className="vlr-slash vlr-slash-2" />
        <span className="vlr-shard" />
        <span className="vlr-shard vlr-shard-2" />
        <span className="vlr-shard vlr-shard-3" />
      </div>
    );
  if (scene === 'subathon')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="sub-mountains" />
        <span className="sub-mountains sub-mountains-near" />
        <span className="sub-foliage" />
        {LEAVES.map((l, i) => (
          <span key={i} className="sub-leaf" style={{ left: `${l[0]}%`, animationDuration: `${l[1]}s`, animationDelay: `${l[2]}s` }}>
            🍁
          </span>
        ))}
        <span className="sub-alert">+1 sub · +2:00</span>
        <span className="sub-alert sub-alert-2">+5 subs · +10:00</span>
        <span className="sub-alert sub-alert-3">+1 sub · +2:00</span>
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
        {/* Peregrino original: capucha, capa clara y bastón con un carrete de hilo. */}
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
        {/* Minimapa de la Grieta: bases, calles, río, jungla, Barón, dragón, un ping, dos campeones e Irelia. */}
        <span className="lol-map">
          <i className="lol-lanes" />
          <i className="lol-nexus lol-nexus-blue" />
          <i className="lol-nexus lol-nexus-red" />
          <i className="lol-baron" />
          <i className="art-emoji lol-drake">🐉</i>
          <i className="lol-ping" />
          <i className="lol-champ lol-champ-blue" />
          <i className="lol-champ lol-champ-red" />
          {/* La campeona de Abby en la calle superior: retrato propio (no el arte de Riot) y su nombre. */}
          <i className="lol-hero">
            <i className="lol-hero-pulse" />
            <i className="lol-hero-face">🗡️</i>
            <i className="lol-hero-tag">Irelia</i>
          </i>
        </span>
        <span className="art-emoji lol-crown">👑</span>
      </>
    );
  if (scene === 'valorant')
    return (
      <>
        <span className="vlr-lines" />
        <span className="vlr-slash art-vlr-band" />
        <span className="vlr-cross">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="art-vlr-tag">1 vs 5</span>
        <span className="art-vlr-ace">ACE</span>
      </>
    );
  if (scene === 'subathon')
    return (
      <>
        <span className="sub-mountains" />
        <span className="pagoda">
          <i className="pg-roof pg-1" />
          <i className="pg-body pg-b1" />
          <i className="pg-roof pg-2" />
          <i className="pg-body pg-b2" />
          <i className="pg-roof pg-3" />
          <i className="pg-body pg-b3" />
        </span>
        <span className="sub-tree art-tree-l" />
        <span className="sub-tree art-tree-r" />
        {/* El contador: cuenta atrás con tiras de dígitos animadas solo con CSS. */}
        <span className="sub-timer">
          <span className="sub-timer-label">● En directo</span>
          <span className="sub-timer-clock">
            47:59:
            <span className="dg">
              <span className="dg-strip dg-tens">543210</span>
            </span>
            <span className="dg">
              <span className="dg-strip dg-ones">9876543210</span>
            </span>
          </span>
        </span>
        <span className="sub-pop">+1 sub · +2:00</span>
        {/* Selfie de las tres amigas delante de la pagoda. */}
        <span className="friends">
          <span className="friend friend-l">
            <i className="hair" />
            <i className="face" />
            <i className="bangs" />
          </span>
          <span className="friend friend-r">
            <i className="hair" />
            <i className="face" />
            <i className="bangs" />
          </span>
          <span className="friend friend-c">
            <i className="hair" />
            <i className="face" />
            <i className="bangs" />
          </span>
          <span className="art-emoji friend-peace">✌️</span>
        </span>
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
