import type { CSSProperties } from 'react';
import { StickerArt, StickerNumber, tilt } from '../components/Album';
import { SoundSettingsCard } from '../components/SoundControls';
import { Card, CardTitle } from '../components/ui';
import { ACHIEVEMENTS } from '../data/achievements';
import { MINIGAMES } from '../minigames/meta';
import { doneToday, liveStreak } from '../state/progress';
import { useStore } from '../state/store';

export function AchievementsPage() {
  const { state, today, reset } = useStore();
  const unlocked = new Set(state.achievements);
  const played = Object.values(state.records).reduce((n, r) => n + r.played, 0);

  const stats = [
    ['🏆', 'Retos ganados', state.totalWins],
    ['🎲', 'Retos jugados', played],
    ['🔥', 'Racha actual', liveStreak(state.streak, state.lastPlayDay, today)],
    ['📆', 'Mejor racha', state.bestStreak],
    ['🏅', 'Días perfectos', state.perfectDays],
    ['✅', 'Hechos hoy', `${doneToday(state, today)}/${MINIGAMES.length}`],
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        <div className="glass mb-5 flex flex-wrap items-end gap-x-6 gap-y-3 rounded-[20px] p-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-dim">Álbum de logros</p>
            <h1 className="font-display text-3xl font-extrabold leading-tight [font-variation-settings:'wdth'_85]">
              <span className="text-abby">{unlocked.size}</span> de {ACHIEVEMENTS.length} cromos dorados
            </h1>
          </div>
          <div className="grid min-w-[180px] flex-1 grid-cols-[repeat(31,minmax(0,1fr))] gap-[3px] pb-1.5" aria-hidden>
            {ACHIEVEMENTS.map((a) => (
              <span
                key={a.id}
                className={`aspect-[3/4] rounded-[2px] ${unlocked.has(a.id) ? 'bg-gold' : 'border-[1.5px] border-dashed border-slot'}`}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {ACHIEVEMENTS.map((a, i) => {
            const ok = unlocked.has(a.id);
            const n = i + 1;
            return ok ? (
              <div
                key={a.id}
                className="sticker animate-rise min-w-0"
                style={{ '--r': `${tilt(n)}deg`, animationDelay: `${i * 20}ms` } as CSSProperties}
              >
                <StickerNumber n={n} className="absolute left-3 top-3 z-10" />
                <StickerArt icon={a.icon} color="linear-gradient(135deg, #ffd66b, #ffad2e 55%, #ff8a3d)" className="h-20 text-4xl" />
                <span className="mx-1 mt-2 block font-display text-[15px] font-bold leading-tight">{a.title}</span>
                <span className="mx-1 mt-0.5 block text-xs font-semibold leading-snug text-dim">{a.desc}</span>
              </div>
            ) : (
              <div
                key={a.id}
                className="slot animate-rise flex min-h-[148px] min-w-0 flex-col p-3"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <span className="num-display text-5xl text-slot">{n}</span>
                <span className="mt-auto block font-display text-[15px] font-bold leading-tight text-white/70">{a.title}</span>
                <span className="mt-0.5 block text-xs font-semibold leading-snug text-dim">{a.desc}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 content-start gap-4">
        <Card delay={60}>
          <CardTitle icon="📊">Estadísticas</CardTitle>
          <div className="grid grid-cols-2 gap-2">
            {stats.map(([icon, label, value]) => (
              <div key={label} className="rounded-xl bg-paper p-3 shadow-[0_1px_0_var(--color-slot)]">
                <div className="num-display text-2xl">{value}</div>
                <div className="text-[11px] font-bold text-dim">
                  {icon} {label}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <SoundSettingsCard delay={90} />

        <Card delay={120}>
          <CardTitle icon="🎮">Por minijuego</CardTitle>
          {/* Altura fija con scroll: la lista crece con cada minijuego nuevo. */}
          <div className="scroll-thin -mr-2 grid max-h-[22rem] gap-1.5 overflow-y-auto overscroll-contain pr-2">
            {MINIGAMES.map((m) => {
              const r = state.records[m.id];
              return (
                <a
                  key={m.id}
                  href={`#diarios/${m.id}`}
                  className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm shadow-[0_1px_0_var(--color-slot)] transition hover:bg-page"
                >
                  <span className="text-lg">{m.icon}</span>
                  <span className="min-w-0 flex-1 truncate font-bold">{m.name}</span>
                  {r ? (
                    <span className="shrink-0 text-xs font-bold text-white/60">
                      {r.won}/{r.played} · 🔥{liveStreak(r.streak, r.lastWinDay, today)}
                      {r.best != null && ` · 🏆 ${m.formatScore(r.best)}`}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-white/35">sin jugar</span>
                  )}
                </a>
              );
            })}
          </div>
          <button
            className="btn btn-ghost mt-5 w-full text-sm text-rose-200"
            onClick={() => {
              if (confirm('¿Seguro? Se borrarán todas tus estadísticas y logros.')) reset();
            }}
          >
            🗑️ Borrar progreso
          </button>
        </Card>
      </div>
    </div>
  );
}
