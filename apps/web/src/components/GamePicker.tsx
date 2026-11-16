import { GAMES, gameById, type Game } from '../data/games';
import { SearchPicker, type PickerItem } from './SearchPicker';

const ITEMS: PickerItem[] = GAMES.map((g) => ({ id: g.id, label: g.name, sub: String(g.year), icon: g.icon, searchSub: false }));

/** Buscador de juegos para los minijuegos de adivinar un juego. */
export function GamePicker({
  exclude,
  onPick,
  disabled,
  placeholder = 'Escribe un juego…',
  hideIcons = false,
}: {
  exclude: string[];
  onPick: (g: Game) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Oculta los iconos para no delatar la respuesta (Emojidle, Pixeldle). */
  hideIcons?: boolean;
}) {
  return (
    <SearchPicker
      items={ITEMS}
      exclude={exclude}
      onPick={(id) => onPick(gameById(id))}
      disabled={disabled}
      placeholder={placeholder}
      hideIcons={hideIcons}
    />
  );
}
