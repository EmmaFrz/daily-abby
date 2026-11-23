import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { EGGS, type EasterEgg } from '../data/eggs';
import type { TrackInfo } from '../lib/itunes';
import { musicGain } from '../lib/sound';

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
  const left = useRef(false);
  // onDone llega como función nueva en cada render de App. Se guarda en una ref para que `leave` sea
  // estable: si no, un render de App mientras la carta se va (p. ej., al quitarse el aviso de un logro)
  // reiniciaba el efecto, borraba el temporizador de salida y la capa quedaba invisible tapando la página.
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  const leave = useCallback(() => {
    if (left.current) return;
    left.current = true;
    setLeaving(true);
    timers.current.push(window.setTimeout(() => doneRef.current(), LEAVE));
  }, []);

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
      audio.volume = musicGain();
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

/** Hojas de arce del Subathon, pétalos de la granja y del Sakura y talismanes de Nine Sols: [posición %, duración s, retraso s]. */
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
  if (scene === 'blocks')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="mc-sun" />
        <span className="mc-cloud" />
        <span className="mc-cloud mc-cloud-2" />
        <span className="mc-cloud mc-cloud-3" />
        <span className="mc-hills" />
        <span className="mc-ground" />
      </div>
    );
  if (scene === 'soul')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="ut-heart ut-heart-bg" />
        <span className="ut-pellets" />
        <span className="ut-pellets ut-pellets-near" />
        <span className="ut-line">* Eso te llena de DETERMINACIÓN.</span>
      </div>
    );
  if (scene === 'taopunk')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="ns-grid" />
        <span className="ns-halo" />
        <span className="egg-ring ns-ring" />
        <span className="egg-ring egg-ring-2 ns-ring" />
        {LEAVES.map((l, i) => (
          <span key={i} className="ns-fu" style={{ left: `${l[0]}%`, animationDuration: `${l[1]}s`, animationDelay: `${l[2]}s` }}>
            敕令
          </span>
        ))}
      </div>
    );
  if (scene === 'twilight')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="tw-sun" />
        <span className="tw-castle" />
        <span className="tw-motes" />
        <span className="tw-motes tw-motes-near" />
      </div>
    );
  if (scene === 'boxing')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="vd-flash" />
        <span className="vd-flash vd-flash-2" />
        <span className="vd-beam" />
        <span className="vd-beam vd-beam-2" />
        <span className="vd-beam vd-beam-3" />
        <span className="vd-ropes" />
        <span className="vd-canvas" />
        <span className="vd-confetti" />
        <span className="vd-confetti vd-confetti-near" />
      </div>
    );
  if (scene === 'sakura')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="sk-slash" />
        <span className="sk-light sk-light-l" />
        <span className="sk-light sk-light-r" />
        <span className="sk-pitch" />
        {LEAVES.map((l, i) => (
          <span key={i} className="sub-leaf sk-petal" style={{ left: `${l[0]}%`, animationDuration: `${l[1]}s`, animationDelay: `${l[2]}s` }} />
        ))}
      </div>
    );
  if (scene === 'farm')
    return (
      <div className="egg-scene" aria-hidden>
        <span className="fm-sun" />
        <span className="fm-cloud" />
        <span className="fm-cloud fm-cloud-2" />
        <span className="fm-hills" />
        <span className="fm-field" />
        {LEAVES.map((l, i) => (
          <span key={i} className="sub-leaf" style={{ left: `${l[0]}%`, animationDuration: `${l[1] + 4}s`, animationDelay: `${l[2]}s` }}>
            🌸
          </span>
        ))}
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
        {/* Emblema de Hornet: su aguja con un hilo rojo que se enrolla, y su nombre (no se dibuja su aspecto). */}
        <span className="silk-emblem">
          <i className="silk-thread" />
          <i className="silk-thread silk-thread-2" />
          <i className="silk-needle" />
          <i className="silk-tag">Hornet</i>
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
  if (scene === 'blocks')
    return (
      <>
        <span className="mc-sun" />
        <span className="mc-cloud" />
        <span className="mc-tree">
          <i className="mc-leaves" />
          <i className="mc-trunk" />
        </span>
        <span className="mc-ground" />
        {/* Un bloque de hierba que se agrieta mientras el pico lo pica, y sus trocitos saltando. */}
        <span className="mc-block" />
        <span className="mc-bits" />
        <span className="art-emoji mc-pick">⛏️</span>
      </>
    );
  if (scene === 'soul')
    return (
      <>
        {/* Caja de combate: el corazón esquiva los disparos (no se dibuja a ningún personaje). */}
        <span className="ut-box">
          <i className="ut-shot ut-shot-1" />
          <i className="ut-shot ut-shot-2" />
          <i className="ut-shot ut-shot-3" />
          <i className="ut-heart" />
        </span>
        <span className="ut-hp">
          ABBY&nbsp;&nbsp;NV 19&nbsp;&nbsp;PV <i className="ut-bar" /> 20 / 20
        </span>
        <span className="ut-menu">
          <i>Luchar</i>
          <i>Actuar</i>
          <i>Objeto</i>
          <i>Piedad</i>
        </span>
      </>
    );
  if (scene === 'taopunk')
    return (
      <>
        <span className="ns-grid" />
        {/* Nueve soles girando alrededor de un núcleo, y dos talismanes colgando (no se dibuja a Yi). */}
        <span className="ns-core" />
        <span className="ns-orbit">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} style={{ '--i': i } as CSSProperties} />
          ))}
        </span>
        <span className="ns-charm ns-charm-l">敕令</span>
        <span className="ns-charm ns-charm-r">敕令</span>
      </>
    );
  if (scene === 'twilight')
    return (
      <>
        <span className="tw-sun" />
        <span className="tw-motes" />
        <span className="tw-triforce">
          <i />
          <i />
          <i />
        </span>
        {/* La espada clavada en su pedestal y el lobo (emoji, no se dibuja a Link). */}
        <span className="tw-sword">
          <i className="tw-grip" />
          <i className="tw-guard" />
          <i className="tw-blade" />
        </span>
        <span className="tw-stone" />
        <span className="art-emoji tw-wolf">🐺</span>
      </>
    );
  if (scene === 'boxing')
    return (
      <>
        <span className="vd-beam" />
        <span className="vd-confetti" />
        <span className="art-emoji vd-glove">🥊</span>
        <span className="art-emoji vd-spark">✨</span>
        <span className="art-emoji vd-spark vd-spark-2">✨</span>
        {/* El cinturón de campeona: correa blanca con ribete rosa, placas doradas y la placa central rosa. */}
        <span className="vd-belt">
          <i className="vd-strap" />
          <i className="vd-side vd-side-l" />
          <i className="vd-side vd-side-r" />
          <i className="vd-plate">
            <b>★</b>
            <b>Campeona</b>
          </i>
        </span>
        <span className="vd-tag">La Velada del Año</span>
      </>
    );
  if (scene === 'sakura')
    return (
      <>
        <span className="sk-slash" />
        {/* Escudo propio: flor de cerezo de cinco pétalos con hojas turquesa (inspirado en el del equipo). */}
        <span className="sk-flower">
          <i className="sk-leaf sk-leaf-l" />
          <i className="sk-leaf sk-leaf-r" />
          {Array.from({ length: 5 }, (_, i) => (
            <i key={i} className="sk-petal-big" style={{ '--i': i } as CSSProperties} />
          ))}
          <i className="sk-core" />
        </span>
        <span className="sk-name">
          Sakura <small>FC</small>
        </span>
        <span className="sk-badge">Presidenta · Abby</span>
        <span className="art-emoji sk-ball">⚽</span>
      </>
    );
  if (scene === 'farm')
    return (
      <>
        <span className="fm-sun" />
        <span className="fm-cloud" />
        <span className="fm-hills" />
        <span className="fm-field" />
        <span className="fm-barn">
          <i className="fm-roof" />
          <i className="fm-wall" />
          <i className="fm-door" />
        </span>
        <span className="fm-sign">Día 1 · Primavera</span>
        <span className="fm-crops">
          <i className="art-emoji">🌱</i>
          <i className="art-emoji">🥕</i>
          <i className="art-emoji">🌱</i>
          <i className="art-emoji">🎃</i>
        </span>
        <span className="art-emoji fm-chicken">🐓</span>
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
