import { useState } from 'react';

const STORAGE_KEY = 'abby-trivia:key';

function read(): string | undefined {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Clave de acceso de host/abby, recordada en este navegador. */
export function useStoredKey() {
  const [key, setKeyState] = useState<string | undefined>(read);

  const setKey = (next: string | undefined) => {
    try {
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // almacenamiento bloqueado: la clave solo dura esta sesión
    }
    setKeyState(next);
  };

  return [key, setKey] as const;
}
