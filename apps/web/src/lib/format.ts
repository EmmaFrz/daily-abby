export function fmt(n: number): string {
  const v = Math.round(n);
  if (Math.abs(v) >= 1_000_000) return `${trim(v / 1_000_000)}M`;
  if (Math.abs(v) >= 10_000) return `${trim(v / 1_000)}k`;
  return v.toLocaleString('es');
}

const trim = (n: number) => n.toFixed(1).replace(/\.0$/, '').replace('.', ',');

export function signed(n: number): string {
  return `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n))}`;
}

export function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/** Mayúsculas sin tildes, pero conservando la Ñ. */
export function normalizeWord(s: string): string {
  return s
    .toUpperCase()
    .replace(/Ñ/g, '\u0001')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0001/g, 'Ñ');
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
