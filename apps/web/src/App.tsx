import { useEffect, useState } from 'react';
import { BugReport } from './components/BugReport';
import { EasterEggOverlay, type ActiveEgg } from './components/EasterEggs';
import { PreAlphaModal } from './components/PreAlphaModal';
import { RedeemCode } from './components/RedeemCode';
import { SocialLinks } from './components/SocialLinks';
import { SoundToggle } from './components/SoundControls';
import { Toasts } from './components/Toasts';
import { ABBY } from './config/abby';
import { sfx } from './lib/sound';
import { ACHIEVEMENTS } from './data/achievements';
import { MINIGAMES } from './minigames/meta';
import { AchievementsPage } from './pages/AchievementsPage';
import { DailiesPage } from './pages/DailiesPage';
import { doneToday, liveStreak } from './state/progress';
import { useStore } from './state/store';

type Tab = 'diarios' | 'logros';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'diarios', icon: '📒', label: 'Diarios' },
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
  const [egg, setEgg] = useState<ActiveEgg | null>(null);

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
      <Toasts />
      <PreAlphaModal />
      <BugReport />
      <header className="sticky top-0 z-40 border-b border-slot/70 bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <button onClick={() => go('diarios')} className="flex items-center gap-2.5 text-left">
            <span className="font-display text-2xl font-extrabold leading-none tracking-tight text-abby [font-variation-settings:'wdth'_80]">
              {ABBY.name}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-dim">Álbum de diarios</span>
              <span className="block text-xs font-semibold text-dim">twitch.tv/{ABBY.handle}</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={`relative rounded-full px-4 py-1.5 font-display text-sm font-bold transition ${
                  route.tab === t.id ? 'bg-white text-paper' : 'text-dim hover:bg-white/6 hover:text-white'
                }`}
              >
                {t.label}
                {t.id === 'diarios' && pending && <span className="absolute -right-0.5 top-0 h-2.5 w-2.5 rounded-full bg-abby ring-2 ring-page" />}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-xs font-semibold text-dim">
            <span title="Retos completados hoy">
              <b className="num-display text-base text-white">{done}</b>/{MINIGAMES.length} <span className="hidden sm:inline">cromos</span>
            </span>
            <span title="Días seguidos jugando">
              <b className="num-display text-base text-white">{streak}</b> {streak === 1 ? 'día' : 'días'}
            </span>
            <span className="hidden sm:inline" title="Logros">
              <b className="num-display text-base text-white">{state.achievements.length}</b>/{ACHIEVEMENTS.length} logros
            </span>
            <SoundToggle />
          </div>
        </div>
      </header>

      {/* Código promocional: arriba a la derecha, bajo la cabecera. */}
      <div className="mx-auto flex max-w-6xl justify-end px-4 pt-3">
        <RedeemCode onRedeem={setEgg} />
      </div>
      {egg && <EasterEggOverlay key={egg.key} active={egg} onDone={() => setEgg(null)} />}

      <main key={`${route.tab}-${route.game}`} className="mx-auto w-full max-w-6xl px-4 pb-28 pt-3 md:pb-12">
        {route.tab === 'diarios' ? (
          <DailiesPage openId={route.game} onOpen={(id) => go(id ? `diarios/${id}` : 'diarios')} />
        ) : (
          <AchievementsPage />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-28 text-center text-xs font-bold text-dim md:pb-8">
        <div className="mb-3">
          <SocialLinks compact />
        </div>
        Juego fan hecho con cariño para{' '}
        <a href={ABBY.twitchUrl} target="_blank" rel="noreferrer" className="text-abby-soft hover:underline">
          {ABBY.name}
        </a>{' '}
        · Tu progreso se guarda en este navegador
        {devMode && (
          <button onClick={devNextDay} className="ml-3 rounded-lg bg-amber-400/25 px-2 py-1 text-amber-200">
            🛠️ Dev: avanzar día ({today})
          </button>
        )}
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slot/70 bg-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-xs grid-cols-2 gap-2 px-3 py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`relative flex items-center justify-center gap-1.5 rounded-full py-2 font-display text-sm font-bold transition ${
                route.tab === t.id ? 'bg-white text-paper' : 'text-dim'
              }`}
            >
              <span aria-hidden>{t.icon}</span>
              {t.label}
              {t.id === 'diarios' && pending && <span className="absolute right-3 top-1.5 h-2 w-2 rounded-full bg-abby" />}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
