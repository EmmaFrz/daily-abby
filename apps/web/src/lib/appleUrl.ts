/**
 * Las URLs de la API de iTunes vienen de fuera y acaban en `href` o `src`: solo se aceptan
 * si son https (las http se suben a https) y de los dominios indicados. Si no, null.
 */
export function appleUrl(raw: unknown, domains: readonly string[]): string | null {
  if (typeof raw !== 'string') return null;
  try {
    const u = new URL(raw);
    if (u.protocol === 'http:') u.protocol = 'https:';
    const trusted = domains.some((d) => u.hostname === d || u.hostname.endsWith(`.${d}`));
    return u.protocol === 'https:' && trusted && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}
