import { useState } from 'react';

interface Props {
  title: string;
  error?: string | null;
  onSubmit: (key: string) => void;
}

/** Pide la clave de acceso para /host y /abby. */
export function KeyGate({ title, error, onSubmit }: Props) {
  const [value, setValue] = useState('');

  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSubmit(value.trim());
        }}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
      >
        <h1 className="text-xl font-bold">{title}</h1>
        <label className="block space-y-2">
          <span className="text-sm text-white/70">Clave de acceso</span>
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg bg-black/40 px-3 py-2 ring-1 ring-white/20 focus:ring-2 focus:ring-chat focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button className="w-full rounded-lg bg-chat py-2 font-semibold hover:brightness-110">Entrar</button>
      </form>
    </div>
  );
}
