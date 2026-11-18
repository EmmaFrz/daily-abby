import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ACHIEVEMENTS } from '../data/achievements';
import { dayOffset, setDayOffset, todayKey } from '../lib/daily';
import { sfx } from '../lib/sound';
import { createSave } from './progress';
import { sanitizeSave } from './sanitize';
import type { SaveState } from './types';

const SAVE_KEY = 'abby-diarios:v2';
const DEV_KEY = 'abby-dev';

export interface Toast {
  id: number;
  icon: string;
  title: string;
  text?: string;
  tone?: 'good' | 'bad' | 'epic' | 'neutral';
}

interface Store {
  state: SaveState;
  today: string;
  /** Aplica un cambio puro al estado. */
  act: (fn: (s: SaveState) => SaveState) => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
  reset: () => void;
  devMode: boolean;
  devNextDay: () => void;
}

const StoreContext = createContext<Store | null>(null);

function load(today: string): SaveState {
  try {
    localStorage.removeItem('abby-modo-carrera:v1'); // partida de la versión anterior
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const save = sanitizeSave(JSON.parse(raw), today);
      if (save) return save;
    }
  } catch {
    /* partida corrupta o almacenamiento bloqueado: empezamos de cero */
  }
  return createSave(today);
}

/**
 * "Avanzar día" para pruebas: se activa con ?dev, pero solo donde existen las herramientas
 * de prueba (`npm run dev` y vistas previas). En producción un enlace con ?dev no hace nada.
 */
function detectDevMode(): boolean {
  try {
    if (!__DEV_TOOLS__) {
      // Antes ?dev funcionaba también en producción: se limpia lo que pudiera haber quedado.
      localStorage.removeItem(DEV_KEY);
      setDayOffset(0);
      return false;
    }
    if (new URLSearchParams(location.search).has('dev')) localStorage.setItem(DEV_KEY, '1');
    return localStorage.getItem(DEV_KEY) === '1';
  } catch {
    return false;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(() => todayKey());
  const [state, setState] = useState<SaveState>(() => load(todayKey()));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [devMode] = useState(detectDevMode);
  const seq = useRef(0);
  const seenAchievements = useRef(new Set(state.achievements));

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++seq.current;
    setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);

  const act = useCallback((fn: (s: SaveState) => SaveState) => setState(fn), []);

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      /* sin almacenamiento: la partida dura lo que la pestaña */
    }
  }, [state]);

  useEffect(() => {
    for (const id of state.achievements) {
      if (seenAchievements.current.has(id)) continue;
      seenAchievements.current.add(id);
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) {
        toast({ icon: a.icon, title: `Logro: ${a.title}`, text: a.desc, tone: 'epic' });
        sfx('achievement', { delay: 1100 }); // después de la fanfarria de victoria
      }
    }
  }, [state.achievements, toast]);

  // Cambio de día: a medianoche o al volver a la pestaña.
  const checkDay = useCallback(() => setToday(todayKey()), []);
  useEffect(() => {
    const id = setInterval(checkDay, 30_000);
    const onVisible = () => document.visibilityState === 'visible' && checkDay();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [checkDay]);

  const reset = useCallback(() => {
    setDayOffset(0);
    const t = todayKey();
    seenAchievements.current = new Set();
    setToday(t);
    setState(createSave(t));
  }, []);

  const devNextDay = useCallback(() => {
    setDayOffset(dayOffset() + 1);
    checkDay();
  }, [checkDay]);

  const value = useMemo(
    () => ({ state, today, act, toasts, toast, dismissToast, reset, devMode, devNextDay }),
    [state, today, act, toasts, toast, dismissToast, reset, devMode, devNextDay],
  );

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStore(): Store {
  const s = use(StoreContext);
  if (!s) throw new Error('useStore fuera de StoreProvider');
  return s;
}
