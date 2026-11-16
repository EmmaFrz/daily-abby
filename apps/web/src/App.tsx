import { useEffect, useState } from 'react';
import { Background } from './components/Background';
import { PreAlphaModal } from './components/PreAlphaModal';
import { SocialLinks } from './components/SocialLinks';
import { SoundToggle } from './components/SoundControls';
import { Toasts } from './components/Toasts';
import { ABBY } from './config/abby';
import { sfx } from './lib/sound';
import { MINIGAMES } from './minigames/meta';
import { AchievementsPage } from './pages/AchievementsPage';
import { DailiesPage } from './pages/DailiesPage';
import { doneToday, liveStreak } from './state/progress';
import { useStore } from './state/store';

type Tab = 'diarios' | 'logros';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'diarios', icon: '🧩', label: 'Diarios' },
  { id: 'logros', icon: '🏆', label: 'Logros' },
];

/** #diarios, #diarios/<minijuego> o #logros */
function parseHash(): { tab: Tab; game: string | null } {
  const [tab, game] = location.hash.slice(1).split('/');
  if (tab === 'logros') return { tab: 'logros', game: null };
  return { tab: 'diarios', game: game || null };
}

export function App() {
  const { state, today, devMode, devNextDay } = useStore();
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (hash: string) => {
    sfx('pop');
    location.hash = hash;
  };

  const done = doneToday(state, today);
  const pending = done < MINIGAMES.length;
  const streak = liveStreak(state.streak, state.lastPlayDay, today);

  return (
    <>
      <Background />
      <Toasts />
      <PreAlphaModal />
      <header className="sticky top-0 z-40 border-b border-white/8 bg-ink/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button onClick={() => go('diarios')} className="flex items-center gap-2 text-left">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-abby to-twitch text-lg shadow-[0_0_20px_rgb(255_79_163/0.5)]">
              💜
            </span>
            <span className="hidden leading-none sm:block">
              <span className="block font-display text-lg font-bold">
                <span className="text-gradient">{ABBY.name}</span> · Diarios
              </span>
              <span className="text-xs font-bold text-white/45">twitch.tv/{ABBY.handle}</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 md:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={`relative rounded-xl px-4 py-1.5 font-display text-sm font-semibold transition ${
                  route.tab === t.id ? 'bg-gradient-to-r from-abby to-twitch text-white shadow-lg' : 'text-white/65 hover:bg-white/8 hover:text-white'
                }`}
              >
                {t.icon} {t.label}
                {t.id === 'diarios' && pending && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-abby ring-2 ring-ink" />}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 text-sm font-extrabold tabular-nums">
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-1" title="Retos completados hoy">
              ✅ <span className="text-emerald-200">{done}/{MINIGAMES.length}</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-1" title="Días seguidos jugando">
              🔥 <span className="text-orange-200">{streak}</span>
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-1 sm:flex" title="Logros">
              🏆 <span className="text-amber-200">{state.achievements.length}</span>
            </span>
            <SoundToggle />
          </div>
        </div>
      </header>

      <main key={`${route.tab}-${route.game}`} className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 md:pb-12">
        {route.tab === 'diarios' ? (
          <DailiesPage openId={route.game} onOpen={(id) => go(id ? `diarios/${id}` : 'diarios')} />
        ) : (
          <AchievementsPage />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-28 text-center text-xs font-bold text-white/30 md:pb-8">
        <div className="mb-3">
          <SocialLinks compact />
        </div>
        Juego fan hecho con 💜 para{' '}
        <a href={ABBY.twitchUrl} target="_blank" rel="noreferrer" className="text-abby-soft/70 hover:text-abby-soft">
          {ABBY.name}
        </a>{' '}
        · Tu progreso se guarda en este navegador
        {devMode && (
          <button onClick={devNextDay} className="ml-3 rounded-lg bg-amber-400/20 px-2 py-1 text-amber-200">
            🛠️ Dev: avanzar día ({today})
          </button>
        )}
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-xs grid-cols-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-extrabold transition ${
                route.tab === t.id ? 'text-white' : 'text-white/45'
              }`}
            >
              <span className={`text-xl ${route.tab === t.id ? 'drop-shadow-[0_0_8px_rgb(255_79_163/0.9)]' : ''}`}>{t.icon}</span>
              {t.label}
              {t.id === 'diarios' && pending && <span className="absolute right-[30%] top-1.5 h-2 w-2 rounded-full bg-abby" />}
              {route.tab === t.id && <span className="absolute inset-x-8 top-0 h-0.5 rounded-full bg-gradient-to-r from-abby to-twitch" />}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
