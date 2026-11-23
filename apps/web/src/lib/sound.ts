/**
 * Efectos de sonido sintetizados con la Web Audio API: sin archivos de audio,
 * así que no pesan nada ni tienen problemas de licencia.
 *
 * Los navegadores solo permiten sonar después de que la persona interactúa con la página;
 * como todos los sonidos salen de clics o teclas, el audio se activa solo.
 */
import { useSyncExternalStore } from 'react';

export type Sfx =
  | 'tap' | 'pop' | 'ok' | 'present' | 'absent' | 'wrong' | 'win' | 'lose'
  | 'flip' | 'match' | 'achievement' | 'hit' | 'miss' | 'tick' | 'go';

interface Settings {
  enabled: boolean;
  /** 0 a 1 */
  volume: number;
  /** Volumen de la música (previas de canciones), 0 a 1. Independiente de los efectos. */
  music: number;
}

const clamp01 = (n: unknown, fallback: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback);
const DEFAULTS: Settings = { enabled: true, volume: 0.7, music: 0.6 };

const KEY = 'abby-sonido';
const listeners = new Set<() => void>();

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<Settings>;
      return {
        enabled: typeof s.enabled === 'boolean' ? s.enabled : DEFAULTS.enabled,
        volume: clamp01(s.volume, DEFAULTS.volume),
        music: clamp01(s.music, DEFAULTS.music),
      };
    }
  } catch {
    /* sin almacenamiento: valores por defecto */
  }
  return { ...DEFAULTS };
}

let settings = loadSettings();

function save(next: Settings) {
  settings = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* no se recuerda entre visitas, pero funciona */
  }
  if (master) master.gain.value = next.volume * 0.8;
  listeners.forEach((l) => l());
}

export const soundSettings = () => settings;
export const setSoundEnabled = (enabled: boolean) => save({ ...settings, enabled });
export const setSoundVolume = (volume: number) => save({ ...settings, volume });
export const setMusicVolume = (music: number) => save({ ...settings, music: clamp01(music, DEFAULTS.music) });

/**
 * Volumen real para un `<audio>` de música. Curva cuadrática: el oído percibe el volumen de forma
 * logarítmica, así la mitad inferior del deslizador sirve de verdad para bajarlo.
 */
export const musicGain = () => settings.music ** 2;

/** Avisa cada vez que cambian los ajustes de sonido. Devuelve la función para dejar de escuchar. */
export function subscribeSound(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSoundSettings(): Settings {
  return useSyncExternalStore(
    subscribeSound,
    () => settings,
  );
}

/* ───────────── Motor ───────────── */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): AudioContext | null {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = settings.volume * 0.8;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOpts {
  freq: number;
  to?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  at?: number;
}

function tone(c: AudioContext, { freq, to, dur, type = 'sine', gain = 0.2, at = 0 }: ToneOpts) {
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master!);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noise(c: AudioContext, { dur, gain = 0.2, at = 0, freq = 1500 }: { dur: number; gain?: number; at?: number; freq?: number }) {
  const t0 = c.currentTime + at;
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(master!);
  src.start(t0);
}

type Recipe = (c: AudioContext, at: number, p: number) => void;

const RECIPES: Record<Sfx, Recipe> = {
  tap: (c, at, p) => tone(c, { freq: 540 * p, dur: 0.05, type: 'triangle', gain: 0.12, at }),
  pop: (c, at) => tone(c, { freq: 380, to: 760, dur: 0.09, gain: 0.18, at }),
  ok: (c, at, p) => {
    tone(c, { freq: 660 * p, dur: 0.18, type: 'triangle', gain: 0.2, at });
    tone(c, { freq: 990 * p, dur: 0.15, gain: 0.08, at: at + 0.03 });
  },
  present: (c, at, p) => tone(c, { freq: 500 * p, dur: 0.16, type: 'triangle', gain: 0.16, at }),
  absent: (c, at, p) => tone(c, { freq: 230 * p, dur: 0.12, gain: 0.12, at }),
  wrong: (c, at) => {
    tone(c, { freq: 190, to: 110, dur: 0.22, type: 'square', gain: 0.06, at });
    tone(c, { freq: 150, to: 95, dur: 0.24, type: 'sawtooth', gain: 0.04, at });
  },
  win: (c, at) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(c, { freq: f, dur: 0.28, type: 'triangle', gain: 0.2, at: at + i * 0.09 }));
    tone(c, { freq: 1568, dur: 0.6, gain: 0.08, at: at + 0.36 });
    tone(c, { freq: 2093, dur: 0.5, gain: 0.05, at: at + 0.42 });
  },
  lose: (c, at) => {
    [392, 330].forEach((f, i) => tone(c, { freq: f, dur: 0.3, type: 'triangle', gain: 0.16, at: at + i * 0.17 }));
    tone(c, { freq: 262, to: 185, dur: 0.6, type: 'triangle', gain: 0.16, at: at + 0.34 });
  },
  flip: (c, at) => {
    noise(c, { dur: 0.07, gain: 0.25, at, freq: 2800 });
    tone(c, { freq: 700, to: 480, dur: 0.07, gain: 0.06, at });
  },
  match: (c, at) => {
    tone(c, { freq: 880, dur: 0.2, gain: 0.16, at });
    tone(c, { freq: 1320, dur: 0.3, gain: 0.14, at: at + 0.08 });
  },
  achievement: (c, at) =>
    [784, 988, 1175, 1568, 1976].forEach((f, i) =>
      tone(c, { freq: f, dur: 0.32, type: i % 2 ? 'sine' : 'triangle', gain: 0.13, at: at + i * 0.07 }),
    ),
  hit: (c, at, p) => {
    tone(c, { freq: 900 * p, to: 1500 * p, dur: 0.07, type: 'square', gain: 0.05, at });
    noise(c, { dur: 0.04, gain: 0.12, at, freq: 4000 });
  },
  miss: (c, at) => {
    noise(c, { dur: 0.12, gain: 0.3, at, freq: 400 });
    tone(c, { freq: 140, to: 80, dur: 0.14, gain: 0.1, at });
  },
  tick: (c, at) => tone(c, { freq: 880, dur: 0.08, gain: 0.18, at }),
  go: (c, at) => tone(c, { freq: 1320, dur: 0.28, type: 'triangle', gain: 0.22, at }),
};

/**
 * Reproduce un efecto. `delay` en milisegundos; `pitch` multiplica la frecuencia
 * (útil para escalas, p. ej. cada casilla del Wordle un poco más aguda).
 */
export function sfx(name: Sfx, opts: { delay?: number; pitch?: number } = {}) {
  if (!settings.enabled || settings.volume <= 0) return;
  const c = audio();
  if (!c) return;
  try {
    RECIPES[name](c, (opts.delay ?? 0) / 1000, opts.pitch ?? 1);
  } catch {
    /* un sonido nunca debe romper el juego */
  }
}

/** Vibración corta en móviles (si el sonido está activado). */
export function haptic(pattern: number | number[]) {
  if (!settings.enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* no soportado */
  }
}
