import { useMemo, useState } from 'react';
import { normalizeWord } from '../lib/format';

export interface PickerItem {
  id: string;
  label: string;
  /** Texto secundario (año, artista…), también se busca en él. */
  sub?: string;
  icon?: string;
  /** Si es false, `sub` se muestra pero no sirve para buscar (para no regalar la respuesta). */
  searchSub?: boolean;
}

/** Buscador con autocompletado (flechas + Enter) para los juegos de adivinar. */
export function SearchPicker({
  items,
  exclude,
  onPick,
  disabled,
  placeholder,
  hideIcons = false,
}: {
  items: PickerItem[];
  exclude: string[];
  onPick: (id: string) => void;
  disabled?: boolean;
  placeholder: string;
  hideIcons?: boolean;
}) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  const options = useMemo(() => {
    const nq = normalizeWord(q.trim());
    if (!nq) return [];
    const hay = (it: PickerItem) => normalizeWord(it.searchSub === false || !it.sub ? it.label : `${it.label} ${it.sub}`);
    return items
      .filter((it) => !exclude.includes(it.id) && hay(it).includes(nq))
      .sort((a, b) => Number(!normalizeWord(a.label).startsWith(nq)) - Number(!normalizeWord(b.label).startsWith(nq)))
      .slice(0, 7);
  }, [q, exclude, items]);

  const choose = (it: PickerItem | undefined) => {
    if (!it) return;
    onPick(it.id);
    setQ('');
    setActive(0);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          value={q}
          disabled={disabled}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              choose(options[active]);
            } else if (e.key === 'Escape') setQ('');
          }}
          placeholder={placeholder}
          className="w-full min-w-0 rounded-2xl border-2 border-slot bg-paper px-4 py-3 font-bold text-white outline-none transition placeholder:text-white/35 focus:border-abby/70 focus:shadow-[0_0_0_4px_rgb(255_79_163/0.15)] disabled:opacity-50"
        />
        <button className="btn btn-primary shrink-0" disabled={disabled || !options[active]} onClick={() => choose(options[active])}>
          Probar
        </button>
      </div>
      {options.length > 0 && (
        <ul className="glass-strong animate-pop absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl shadow-2xl">
          {options.map((it, i) => (
            <li key={it.id}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(it)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left font-bold transition ${i === active ? 'bg-abby/25' : ''}`}
              >
                {!hideIcons && it.icon && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-lg">{it.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.sub && <span className="shrink-0 text-xs font-bold text-white/40">{it.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
