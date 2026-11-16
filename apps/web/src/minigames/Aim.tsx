import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Result } from '../components/Result';
import { haptic, sfx } from '../lib/sound';
import { useStore } from '../state/store';
import { aimTargetsOfDay, AIM_TARGETS } from './content';
import { useDaily } from './useDaily';

const PENALTY = 500;
const FAST = 10_000;
const secs = (ms: number) => (ms / 1000).toFixed(2).replace('.', ',');

export function Aim() {
  const { today } = useStore();
  const targets = aimTargetsOfDay(today);
  const [phase, setPhase] = useState<'idle' | 'count' | 'run'>('idle');
  const [count, setCount] = useState(3);
  const [hit, setHit] = useState(0);
  const [misses, setMisses] = useState(0);
  const [now, setNow] = useState(0);
  const start = useRef(0);
  const { data, playing, play } = useDaily<{ timeMs: number | null; misses: number }>(
    'aim',
    () => ({ timeMs: null, misses: 0 }),
    (d) =>
      d.timeMs == null
        ? null
        : {
            won: true,
            score: d.timeMs,
            summary: `${AIM_TARGETS} dianas en ${secs(d.timeMs)} s (${d.misses} ${d.misses === 1 ? 'fallo' : 'fallos'}).`,
            share: `🎯 ${secs(d.timeMs)} s · ${d.misses ? `❌×${d.misses}` : 'sin fallos ✨'}`,
            flags: d.timeMs < FAST ? ['aim-fast'] : [],
          },
  );

  useEffect(() => {
    if (phase !== 'count') return;
    sfx(count === 0 ? 'go' : 'tick');
    if (count === 0) {
      start.current = performance.now();
      setPhase('run');
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 650);
    return () => clearTimeout(t);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== 'run') return;
    let raf = 0;
    const tick = () => {
      setNow(performance.now() - start.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const begin = () => {
    setHit(0);
    setMisses(0);
    setCount(3);
    setPhase('count');
  };

  const shoot = (e: PointerEvent) => {
    e.stopPropagation();
    sfx('hit', { pitch: 1 + hit * 0.03 });
    const next = hit + 1;
    if (next < AIM_TARGETS) return setHit(next);
    const total = Math.round(performance.now() - start.current + misses * PENALTY);
    setPhase('idle');
    play(() => ({ timeMs: total, misses }));
  };

  const target = targets[hit]!;
  const elapsed = phase === 'run' ? now + misses * PENALTY : (data.timeMs ?? 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex justify-between text-sm font-bold text-white/65">
        <span>
          🎯 {phase === 'run' ? hit : playing ? 0 : AIM_TARGETS}/{AIM_TARGETS}
        </span>
        <span className="font-display text-lg tabular-nums text-white">⏱️ {secs(elapsed)} s</span>
        <span>❌ {phase === 'run' ? misses : data.misses} (+0,5 s)</span>
      </div>
      <div
        onPointerDown={() => {
          if (phase !== 'run') return;
          sfx('miss');
          haptic(40);
          setMisses((m) => m + 1);
        }}
        className="relative aspect-[4/5] select-none overflow-hidden rounded-3xl border border-red-400/30 bg-[radial-gradient(circle_at_center,#3b0f2a,#140a1f)] sm:aspect-video"
        style={{ cursor: phase === 'run' ? 'crosshair' : 'default' }}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'linear-gradient(rgb(255 80 120) 1px, transparent 1px), linear-gradient(90deg, rgb(255 80 120) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {phase === 'run' && (
          <button
            key={hit}
            onPointerDown={shoot}
            className="animate-pop absolute grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-[radial-gradient(circle,#ff4fa3_0%,#ff4fa3_30%,white_31%,white_45%,#ef4444_46%)] text-xl shadow-[0_0_30px_rgb(255_79_163/0.8)]"
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            aria-label="Diana"
          />
        )}
        {phase === 'count' && (
          <div key={count} className="animate-bounce-in absolute inset-0 grid place-items-center font-display text-8xl font-bold text-white">
            {count || '¡YA!'}
          </div>
        )}
        {phase === 'idle' && playing && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <div className="text-6xl">😤🎯</div>
              <p className="mt-3 font-bold text-white/80">
                Haz clic en las {AIM_TARGETS} dianas lo más rápido posible.
                <br />
                Cada clic fuera suma 0,5 s. ¡Solo cuenta tu primer intento completo!
              </p>
              <button className="btn btn-primary mt-4 px-10 py-3 text-lg" onClick={begin}>
                Empezar
              </button>
            </div>
          </div>
        )}
        {!playing && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="font-display text-6xl font-bold text-gradient">{secs(data.timeMs ?? 0)} s</div>
              <div className="mt-1 font-bold text-white/60">Tu tiempo de hoy</div>
            </div>
          </div>
        )}
      </div>
      <Result id="aim" />
    </div>
  );
}
