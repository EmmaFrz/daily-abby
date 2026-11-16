import type { ComponentType, ReactNode } from 'react';
import { Avatar } from '../components/Avatar';
import { SocialLinks } from '../components/SocialLinks';
import { Card } from '../components/ui';
import { ABBY } from '../config/abby';
import { CHARTS_DATE } from '../data/heardleGenres';
import { useCountdown } from '../hooks/useCountdown';
import { puzzleNumber } from '../lib/daily';
import { MINIGAME_COMPONENTS } from '../minigames';
import { CATEGORIES, HEARDLE_GROUP, META, MINIGAMES, type Category, type MinigameMeta } from '../minigames/meta';
import { doneToday, liveStreak } from '../state/progress';
import { useStore } from '../state/store';

const CATEGORY_ICON: Record<Category, string> = { Adivina: '🔍', Palabras: '🔤', Música: '🎵', Lógica: '🧠', Habilidad: '⚡' };

export function DailiesPage({ openId, onOpen }: { openId: string | null; onOpen: (id: string | null) => void }) {
  const meta = openId ? META[openId] : undefined;
  const Game = openId ? MINIGAME_COMPONENTS[openId] : undefined;
  if (openId === HEARDLE_GROUP.id) return <GroupView group={HEARDLE_GROUP} onOpen={onOpen} />;
  if (meta && Game) return <GameView id={meta.id} onBack={() => onOpen(meta.parent ?? null)} backLabel={meta.parent ? `← ${HEARDLE_GROUP.name}` : '← Todos los diarios'} Game={Game} />;
  return <Hub onOpen={onOpen} />;
}

type Group = typeof HEARDLE_GROUP;

/** Estado del día de un reto: 'new' | 'playing' | 'won' | 'lost'. */
function useStatus() {
  const { state, today } = useStore();
  return (id: string) => {
    const run = state.runs[id];
    return run && run.day === today ? run.status : 'new';
  };
}

function GameCard({ m, delay, onOpen }: { m: MinigameMeta; delay: number; onOpen: (id: string) => void }) {
  const { state, today } = useStore();
  const run = state.runs[m.id];
  const rec = state.records[m.id];
  const status = useStatus()(m.id);
  return (
    <CardShell icon={m.icon} gradient={m.gradient} delay={delay} onClick={() => onOpen(m.id)} badge={<StatusBadge status={status} />} name={m.name} tagline={m.tagline}>
      {run?.day === today && run.summary ? (
        <span className="chip bg-white/10 text-white/75">{run.summary}</span>
      ) : rec?.best != null ? (
        <span className="chip bg-amber-300/15 text-amber-200">🏆 {m.formatScore(rec.best)}</span>
      ) : null}
      {rec && liveStreak(rec.streak, rec.lastWinDay, today) > 0 && (
        <span className="chip bg-orange-400/15 text-orange-200">🔥 {liveStreak(rec.streak, rec.lastWinDay, today)}</span>
      )}
    </CardShell>
  );
}

/** Tarjeta que agrupa varios retos (los géneros del Heardle). */
function GroupCard({ group, delay, onOpen }: { group: Group; delay: number; onOpen: (id: string) => void }) {
  const status = useStatus();
  const children = MINIGAMES.filter((m) => m.parent === group.id);
  const done = children.filter((m) => ['won', 'lost'].includes(status(m.id))).length;
  const started = children.some((m) => status(m.id) !== 'new');
  const badge =
    done === children.length ? (
      <span className="chip bg-emerald-500/25 text-emerald-200">✅ {done}/{children.length}</span>
    ) : started ? (
      <span className="chip bg-sky-400/20 text-sky-200">⏸ {done}/{children.length}</span>
    ) : (
      <StatusBadge status="new" />
    );
  return (
    <CardShell icon={group.icon} gradient={group.gradient} delay={delay} onClick={() => onOpen(group.id)} badge={badge} name={group.name} tagline={group.tagline}>
      {children.map((m) => {
        const st = status(m.id);
        return (
          <span key={m.id} className={`chip ${st === 'won' ? 'bg-emerald-500/25' : st === 'lost' ? 'bg-rose-500/25' : 'bg-white/8'} text-white/80`}>
            {m.icon} {m.name.replace(`${group.name} `, '')}
          </span>
        );
      })}
    </CardShell>
  );
}

function CardShell({
  icon,
  gradient,
  delay,
  onClick,
  badge,
  name,
  tagline,
  children,
}: {
  icon: string;
  gradient: string;
  delay: number;
  onClick: () => void;
  badge: ReactNode;
  name: string;
  tagline: string;
  children?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="glass animate-rise group relative min-w-0 overflow-hidden rounded-3xl p-4 text-left transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgb(255_79_163/0.7)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br opacity-20 transition group-hover:opacity-35 ${gradient}`} />
      <span className="pointer-events-none absolute -bottom-4 -right-2 text-7xl opacity-15 transition group-hover:scale-110 group-hover:opacity-25">{icon}</span>
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg ${gradient}`}>{icon}</span>
          {badge}
        </div>
        <div className="mt-3 font-display text-lg font-semibold">{name}</div>
        <div className="text-sm text-white/60">{tagline}</div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">{children}</div>
      </div>
    </button>
  );
}

/** Pantalla de un grupo: elige género del Heardle. */
function GroupView({ group, onOpen }: { group: Group; onOpen: (id: string | null) => void }) {
  const children = MINIGAMES.filter((m) => m.parent === group.id);
  return (
    <div className="grid grid-cols-1 gap-4">
      <button className="btn btn-ghost w-fit text-sm" onClick={() => onOpen(null)}>
        ← Todos los diarios
      </button>
      <Card>
        <div className="flex items-center gap-3">
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-lg ${group.gradient}`}>{group.icon}</span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              <span className="text-gradient">{group.name}</span> por géneros
            </h2>
            <p className="text-sm text-white/55">
              Elige un género: 5 canciones al día en cada uno, con la progresión 1 · 2 · 4 · 7 · 11 · 16 segundos.
            </p>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((m, i) => (
          <GameCard key={m.id} m={m} delay={i * 60} onOpen={onOpen} />
        ))}
      </div>
      <p className="text-center text-xs font-bold text-white/35">
        Canciones: éxitos de Apple Music por género (catálogo del {CHARTS_DATE}) + selección propia.
      </p>
    </div>
  );
}

function Hub({ onOpen }: { onOpen: (id: string) => void }) {
  const { state, today } = useStore();
  const countdown = useCountdown();
  const done = doneToday(state, today);
  const total = MINIGAMES.length;
  const streak = liveStreak(state.streak, state.lastPlayDay, today);
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="grid grid-cols-1 gap-5">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-abby/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-twitch/30 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <Avatar size={104} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="chip bg-white/8 capitalize text-white/75">📅 {dateLabel}</span>
              <span className="chip bg-white/8 text-white/75">#{puzzleNumber(today)}</span>
              <span className="chip bg-orange-400/15 text-orange-200">🔥 Racha {streak}</span>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              Los diarios de <span className="text-gradient">{ABBY.name}</span>
            </h1>
            <p className="mt-1 text-white/60">{total} minijuegos nuevos cada día. Mismos retos para toda la comunidad.</p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs font-extrabold text-white/55">
                <span>
                  {done}/{total} completados hoy
                </span>
                <span>Nuevos retos en {countdown}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-abby via-fuchsia-500 to-twitch transition-[width] duration-1000"
                  style={{ width: `${(done / total) * 100}%` }}
                >
                  <div className="shine absolute inset-0" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2 text-xs font-black uppercase tracking-wider text-white/45">Sigue a {ABBY.name}</div>
              <SocialLinks />
            </div>
          </div>
        </div>
      </Card>

      {CATEGORIES.map((cat, ci) => (
        <section key={cat}>
          <h2 className="mb-3 flex items-center gap-2 px-1 font-display text-xl font-semibold">
            <span>{CATEGORY_ICON[cat]}</span> {cat}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MINIGAMES.filter((m) => m.category === cat)
              // Los retos con `parent` se muestran como una sola tarjeta de grupo.
              .filter((m, i, list) => !m.parent || list.findIndex((x) => x.parent === m.parent) === i)
              .map((m, i) =>
                m.parent ? (
                  <GroupCard key={m.parent} group={HEARDLE_GROUP} delay={ci * 80 + i * 50} onOpen={onOpen} />
                ) : (
                  <GameCard key={m.id} m={m} delay={ci * 80 + i * 50} onOpen={onOpen} />
                ),
              )}
          </div>
        </section>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'won') return <span className="chip bg-emerald-500/25 text-emerald-200">✅ Hecho</span>;
  if (status === 'lost') return <span className="chip bg-rose-500/25 text-rose-200">❌ Fallado</span>;
  if (status === 'playing') return <span className="chip bg-sky-400/20 text-sky-200">⏸ En curso</span>;
  return <span className="chip animate-pulse bg-abby/25 text-pink-100">▶ Jugar</span>;
}

function GameView({ id, onBack, backLabel, Game }: { id: string; onBack: () => void; backLabel: string; Game: ComponentType }) {
  const { state, today } = useStore();
  const meta = META[id]!;
  const idx = MINIGAMES.findIndex((m) => m.id === id);
  const nextPending = [...MINIGAMES.slice(idx + 1), ...MINIGAMES.slice(0, idx)].find(
    (m) => !(state.runs[m.id]?.day === today && state.runs[m.id]?.status !== 'playing'),
  );
  const finished = state.runs[id]?.day === today && state.runs[id]?.status !== 'playing';

  return (
    <div className="grid grid-cols-1 gap-4">
      <button className="btn btn-ghost w-fit text-sm" onClick={onBack}>
        {backLabel}
      </button>
      <Card key={id}>
        <div className="mb-5 flex items-center gap-3">
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-lg ${meta.gradient}`}>{meta.icon}</span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              <span className="text-gradient">{meta.name}</span>
              <span className="ml-2 text-lg text-white/40">#{puzzleNumber(today)}</span>
            </h2>
            <p className="text-sm text-white/55">{meta.tagline}</p>
          </div>
        </div>
        <Game />
      </Card>
      {finished && nextPending && (
        <NextButton id={nextPending.id} />
      )}
    </div>
  );
}

function NextButton({ id }: { id: string }) {
  const m = META[id]!;
  return (
    <a href={`#diarios/${id}`} className="btn btn-primary mx-auto w-full max-w-md py-3 text-lg">
      Siguiente reto: {m.icon} {m.name} →
    </a>
  );
}
