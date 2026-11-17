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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
      <Card>
        <CardTitle icon="🏆" right={<span className="chip bg-white/10 text-white/75">{unlocked.size}/{ACHIEVEMENTS.length}</span>}>
          Logros
        </CardTitle>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 via-abby to-twitch transition-[width] duration-700"
            style={{ width: `${(unlocked.size / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a, i) => {
            const ok = unlocked.has(a.id);
            return (
              <div
                key={a.id}
                className={`animate-rise flex min-w-0 items-center gap-3 rounded-2xl border p-3 ${
                  ok ? 'border-amber-300/30 bg-gradient-to-r from-amber-300/15 to-fuchsia-500/10' : 'border-white/8 bg-white/3'
                }`}
                style={{ animationDelay: `${i * 25}ms` }}
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl ${ok ? 'bg-white/15' : 'bg-white/5 opacity-40 grayscale'}`}>
                  {ok ? a.icon : '🔒'}
                </span>
                <span className="min-w-0">
                  <span className={`block font-display font-semibold ${ok ? '' : 'text-white/55'}`}>{a.title}</span>
                  <span className="block text-xs text-white/50">{a.desc}</span>
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid min-w-0 grid-cols-1 content-start gap-4">
        <Card delay={60}>
          <CardTitle icon="📊">Estadísticas</CardTitle>
          <div className="grid grid-cols-2 gap-2">
            {stats.map(([icon, label, value]) => (
              <div key={label} className="rounded-2xl bg-white/5 p-3">
                <div className="font-display text-xl font-bold">
                  {icon} {value}
                </div>
                <div className="text-[11px] font-bold text-white/50">{label}</div>
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
                  className="flex items-center gap-2 rounded-xl bg-white/4 px-3 py-2 text-sm transition hover:bg-white/10"
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
