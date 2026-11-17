import type { ComponentType, CSSProperties } from 'react';
import { PageHeader, Pieces, Slot, Sticker, StickerArt, StickerNumber, tilt } from '../components/Album';
import { Avatar } from '../components/Avatar';
import { BoosterPack } from '../components/BoosterPack';
import { SocialLinks } from '../components/SocialLinks';
import { Card } from '../components/ui';
import { ABBY } from '../config/abby';
import { CHARTS_DATE } from '../data/heardleGenres';
import { useCountdown } from '../hooks/useCountdown';
import { dayOfYear, puzzleNumber } from '../lib/daily';
import { MINIGAME_COMPONENTS } from '../minigames';
import { ALBUM, CATEGORIES, CATEGORY_COLOR, HEARDLE_GROUP, META, MINIGAMES, albumColor, albumNumber, type MinigameMeta } from '../minigames/meta';
import { doneToday, liveStreak } from '../state/progress';
import { useStore } from '../state/store';

export function DailiesPage({ openId, onOpen }: { openId: string | null; onOpen: (id: string | null) => void }) {
  const meta = openId ? META[openId] : undefined;
  const Game = openId ? MINIGAME_COMPONENTS[openId] : undefined;
  if (openId === HEARDLE_GROUP.id) return <GroupView group={HEARDLE_GROUP} onOpen={onOpen} />;
  if (meta && Game) return <GameView id={meta.id} onBack={() => onOpen(meta.parent ?? null)} backLabel={meta.parent ? `← ${HEARDLE_GROUP.name}` : '← Volver al álbum'} Game={Game} />;
  return <Hub onOpen={onOpen} />;
}

type Group = typeof HEARDLE_GROUP;
type Status = 'new' | 'playing' | 'won' | 'lost';

/** Estado del día de un reto: 'new' | 'playing' | 'won' | 'lost'. */
function useStatus() {
  const { state, today } = useStore();
  return (id: string): Status => {
    const run = state.runs[id];
    return run && run.day === today ? run.status : 'new';
  };
}

/** Un reto en el álbum: hueco si no se ha jugado, cromo si sí. */
function GameCard({ m, n, delay, onOpen }: { m: MinigameMeta; n: number | string; delay: number; onOpen: (id: string) => void }) {
  const { state, today } = useStore();
  const run = state.runs[m.id];
  const rec = state.records[m.id];
  const status = useStatus()(m.id);
  const streak = rec ? liveStreak(rec.streak, rec.lastWinDay, today) : 0;
  const color = albumColor(m.id);

  if (status === 'new') {
    const extra =
      rec?.best != null || streak > 0 ? (
        <span className="flex flex-wrap gap-x-2 text-[11px] font-bold text-dim">
          {rec?.best != null && <span>Récord: {m.formatScore(rec.best)}</span>}
          {streak > 0 && <span>Racha {streak}</span>}
        </span>
      ) : null;
    return <Slot n={n} name={m.name} tagline={m.tagline} extra={extra} delay={delay} onClick={() => onOpen(m.id)} />;
  }
  const sub = status === 'playing' ? 'A medias: sigue jugando' : run?.summary || (status === 'won' ? 'Hecho' : 'Fallado');
  return (
    <Sticker
      n={n}
      icon={m.icon}
      color={color}
      name={m.name}
      sub={sub}
      status={status}
      delay={delay}
      onClick={() => onOpen(m.id)}
      footer={streak > 1 ? <span className="text-[11px] font-bold text-orange-200">Racha {streak}</span> : undefined}
    />
  );
}

/** Cromo de varias piezas: los géneros del Heardle. */
function GroupCard({ group, n, delay, onOpen }: { group: Group; n: number; delay: number; onOpen: (id: string) => void }) {
  const status = useStatus();
  const children = MINIGAMES.filter((m) => m.parent === group.id);
  const states = children.map((m) => status(m.id));
  const done = states.filter((s) => s === 'won' || s === 'lost').length;
  const color = albumColor(group.id);

  if (states.every((s) => s === 'new')) {
    return <Slot n={n} name={group.name} tagline={`Cromo de ${children.length} piezas · ${group.tagline}`} delay={delay} onClick={() => onOpen(group.id)} />;
  }
  const pieces = states.map((s) => (s === 'won' ? 'won' : s === 'lost' ? 'lost' : 'new'));
  return (
    <Sticker
      n={n}
      icon={group.icon}
      color={color}
      name={group.name}
      sub={done === children.length ? `Completo: ${children.length} de ${children.length} piezas` : `${done} de ${children.length} piezas pegadas`}
      status={done === children.length ? (states.some((s) => s === 'won') ? 'won' : 'lost') : 'playing'}
      delay={delay}
      onClick={() => onOpen(group.id)}
      footer={<Pieces states={pieces} color={color} />}
    />
  );
}

/** Página del Heardle: un cromo por género. */
function GroupView({ group, onOpen }: { group: Group; onOpen: (id: string | null) => void }) {
  const children = MINIGAMES.filter((m) => m.parent === group.id);
  const status = useStatus();
  const n = albumNumber(group.id);
  const color = albumColor(group.id);
  const pieces = children.map((m) => {
    const s = status(m.id);
    return s === 'won' ? 'won' : s === 'lost' ? 'lost' : 'new';
  });
  return (
    <div className="grid grid-cols-1 gap-5">
      <button className="btn btn-ghost w-fit text-sm" onClick={() => onOpen(null)}>
        ← Volver al álbum
      </button>
      <Card>
        <div className="flex items-center gap-4">
          <div className="sticker w-24 shrink-0" style={{ '--r': `${tilt(n)}deg` } as CSSProperties}>
            <StickerNumber n={n} className="absolute left-2 top-2 z-10" />
            <StickerArt icon={group.icon} color={color} className="h-16 text-3xl" />
            <span className="mt-1.5 block px-0.5">
              <Pieces states={pieces} color={color} />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-dim">Cromo nº {n} · {children.length} piezas</p>
            <h1 className="font-display text-3xl font-extrabold leading-tight [font-variation-settings:'wdth'_85]">
              {group.name} <span className="text-abby">por géneros</span>
            </h1>
            <p className="text-sm text-dim">Cada género es una pieza: 5 canciones al día, con tramos de 1 · 2 · 4 · 7 · 11 · 16 segundos.</p>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {children.map((m, i) => (
          <GameCard key={m.id} m={m} n={`${n}·${i + 1}`} delay={i * 50} onOpen={onOpen} />
        ))}
      </div>
      <p className="text-center text-xs font-bold text-dim">
        Canciones: éxitos de Apple Music por género (catálogo del {CHARTS_DATE}) + selección propia.
      </p>
    </div>
  );
}

function Hub({ onOpen }: { onOpen: (id: string) => void }) {
  const { state, today } = useStore();
  const countdown = useCountdown();
  const status = useStatus();
  const done = doneToday(state, today);
  const total = MINIGAMES.length;
  const left = total - done;
  const streak = liveStreak(state.streak, state.lastPlayDay, today);
  const rawDate = new Date(`${today}T12:00:00`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <div className="grid grid-cols-1 gap-7">
      <section className="glass animate-rise grid grid-cols-1 items-center gap-6 rounded-[20px] p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6">
        {/* El sobre del día: número = día del año; colores y patrón cambian cada día. */}
        <BoosterPack today={today} total={total} className="mx-auto" />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <Avatar size={34} />
            <span className="text-sm font-bold">
              Los diarios de {ABBY.name} <span className="text-dim">· twitch.tv/{ABBY.handle}</span>
            </span>
          </div>
          <p className="mt-3 text-xs font-extrabold text-dim">
            {dateLabel} · sobre #{dayOfYear(today)}
            {streak > 0 && <span> · {streak} {streak === 1 ? 'día' : 'días'} seguidos</span>}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-[1.05] tracking-tight [font-variation-settings:'wdth'_85] sm:text-4xl">
            {left === 0 ? (
              <>
                ¡Día completo! <span className="text-abby">Todos los cromos pegados</span>
              </>
            ) : done === 0 ? (
              <>
                Hoy hay <span className="text-abby">{total} cromos</span> por conseguir
              </>
            ) : (
              <>
                Te {left === 1 ? 'falta' : 'faltan'} <span className="text-abby">{left} {left === 1 ? 'cromo' : 'cromos'}</span> para completar el día
              </>
            )}
          </h1>

          {/* Un hueco por reto (los 7 Heardle incluidos), en orden del álbum. */}
          <div className="mt-4 grid max-w-[480px] grid-cols-[repeat(27,minmax(0,1fr))] gap-[3px]" aria-label={`${done} de ${total} retos completados`}>
            {ALBUM.flatMap((a) => (a.id === HEARDLE_GROUP.id ? MINIGAMES.filter((m) => m.parent === a.id) : [META[a.id]!])).map((m) => {
              const s = status(m.id);
              const filled = s === 'won' || s === 'lost';
              return (
                <span
                  key={m.id}
                  title={m.name}
                  className={`aspect-[3/4] rounded-[2px] ${filled ? '' : 'border-[1.5px] border-dashed border-slot'}`}
                  style={filled ? { background: s === 'won' ? CATEGORY_COLOR[m.category] : 'var(--color-absent)' } : undefined}
                />
              );
            })}
          </div>
          <p className="mt-2.5 text-xs font-semibold text-dim">
            <b className="text-white">{done}</b> de {total} hechos · Sobre nuevo en <b className="tabular-nums text-white">{countdown}</b> · Los mismos cromos para toda la comunidad
          </p>

          <div className="mt-4">
            <SocialLinks />
          </div>
        </div>
      </section>

      {CATEGORIES.map((cat, ci) => {
        const cards = ALBUM.filter((a) => a.category === cat);
        const ids = MINIGAMES.filter((m) => m.category === cat).map((m) => m.id);
        const catDone = ids.filter((id) => ['won', 'lost'].includes(status(id))).length;
        return (
          <section key={cat}>
            <PageHeader page={`Página ${ci + 1}`} title={cat} right={`${catDone} de ${ids.length} hechos`} />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {cards.map((a, i) => {
                const n = albumNumber(a.id);
                return a.id === HEARDLE_GROUP.id ? (
                  <GroupCard key={a.id} group={HEARDLE_GROUP} n={n} delay={ci * 60 + i * 40} onOpen={onOpen} />
                ) : (
                  <GameCard key={a.id} m={META[a.id]!} n={n} delay={ci * 60 + i * 40} onOpen={onOpen} />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GameView({ id, onBack, backLabel, Game }: { id: string; onBack: () => void; backLabel: string; Game: ComponentType }) {
  const { state, today } = useStore();
  const meta = META[id]!;
  const idx = MINIGAMES.findIndex((m) => m.id === id);
  const nextPending = [...MINIGAMES.slice(idx + 1), ...MINIGAMES.slice(0, idx)].find(
    (m) => !(state.runs[m.id]?.day === today && state.runs[m.id]?.status !== 'playing'),
  );
  const finished = state.runs[id]?.day === today && state.runs[id]?.status !== 'playing';
  const n = albumNumber(id);
  const piece = meta.parent ? MINIGAMES.filter((m) => m.parent === meta.parent).findIndex((m) => m.id === id) + 1 : 0;

  return (
    <div className="grid grid-cols-1 gap-4">
      <button className="btn btn-ghost w-fit text-sm" onClick={onBack}>
        {backLabel}
      </button>
      <Card key={id}>
        <div className="mb-5 flex items-center gap-3.5">
          <div className="sticker w-[68px] shrink-0 p-[5px]" style={{ '--r': `${tilt(n)}deg` } as CSSProperties}>
            <StickerArt icon={meta.icon} color={albumColor(id)} className="h-14 text-3xl" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-dim">
              Cromo nº {piece ? `${n}·${piece}` : n} · {meta.category} · #{puzzleNumber(today)}
            </p>
            <h1 className="font-display text-3xl font-extrabold leading-tight [font-variation-settings:'wdth'_85]">{meta.name}</h1>
            <p className="text-sm text-dim">{meta.tagline}</p>
          </div>
        </div>
        <Game />
      </Card>
      {finished && nextPending && <NextButton id={nextPending.id} />}
    </div>
  );
}

function NextButton({ id }: { id: string }) {
  const m = META[id]!;
  return (
    <a href={`#diarios/${id}`} className="btn btn-primary mx-auto w-full max-w-md py-3 text-lg">
      Siguiente cromo: {m.icon} {m.name} →
    </a>
  );
}
