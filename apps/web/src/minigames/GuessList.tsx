import { gameById } from '../data/games';

/** Lista de intentos fallidos/acertados para los juegos de adivinar un juego. */
export function GuessList({ guesses, answerId, showIcons = true }: { guesses: string[]; answerId: string; showIcons?: boolean }) {
  if (!guesses.length) return null;
  return (
    <div className="mx-auto mt-4 flex max-w-lg flex-wrap justify-center gap-2">
      {guesses.map((id) => {
        const g = gameById(id);
        const ok = id === answerId;
        return (
          <span
            key={id}
            className={`animate-pop chip px-3 py-1.5 text-sm ${ok ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/25 text-rose-100 line-through decoration-2'}`}
          >
            {(showIcons || ok) && g.icon} {g.name}
          </span>
        );
      })}
    </div>
  );
}

export function guessShare(guesses: string[], answerId: string): string {
  return guesses.map((id) => (id === answerId ? '🟩' : '🟥')).join('');
}
