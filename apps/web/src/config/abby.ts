/**
 * ✏️  PERFIL DE ABBY — nombre, canal, redes y avatar que se muestran en el juego.
 * El contenido de los retos está en src/data/ (juegos, palabras, música, grupos de Conexiones…).
 */

export interface Social {
  id: 'twitch' | 'x' | 'instagram' | 'youtube' | 'tiktok';
  label: string;
  /** Nombre de usuario tal como se muestra. */
  user: string;
  url: string;
  icon: string;
  /** Color de marca para el botón. */
  color: string;
}

export const SOCIALS: Social[] = [
  { id: 'twitch', label: 'Twitch', user: 'abby_', url: 'https://www.twitch.tv/abby_', icon: '💜', color: '#9146ff' },
  { id: 'x', label: 'X', user: '@abbyiimu', url: 'https://x.com/abbyiimu', icon: '𝕏', color: '#2a2a2a' },
  { id: 'instagram', label: 'Instagram', user: '@abbyimu', url: 'https://www.instagram.com/abbyimu', icon: '📸', color: '#e1306c' },
  { id: 'youtube', label: 'YouTube', user: 'littleragergirlx', url: 'https://www.youtube.com/c/littleragergirlx', icon: '▶', color: '#ff0033' },
  { id: 'tiktok', label: 'TikTok', user: '@abbyimu', url: 'https://www.tiktok.com/@abbyimu', icon: '♪', color: '#25f4ee' },
];

export const ABBY = {
  name: 'Abby',
  handle: 'abby_',
  twitchUrl: 'https://www.twitch.tv/abby_',

  /** Imagen opcional: pon un archivo en apps/web/public/abby.png y se usará como avatar. */
  avatarUrl: '/abby.png',
} as const;
