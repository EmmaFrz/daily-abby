/**
 * Grupos para Conexiones. Cada día se eligen 4 grupos y 4 elementos de cada uno.
 * Regla: ningún elemento puede encajar en otro grupo (se mezclan entre sí cualquier día).
 */
export interface ConnGroup {
  title: string;
  items: string[];
}

export const CONNECTION_GROUPS: ConnGroup[] = [
  { title: 'Emotes de Twitch', items: ['KEKW', 'PogChamp', 'LUL', 'Kappa', 'monkaS', 'OMEGALUL'] },
  { title: 'Cosas del setup', items: ['Micrófono', 'Webcam', 'Ring light', 'Silla gamer', 'Capturadora', 'Pantalla verde'] },
  { title: 'Funciones de Twitch', items: ['Raid', 'Bits', 'Sub', 'Clip', 'Predicción', 'Hype Train'] },
  { title: 'Mobs de Minecraft', items: ['Creeper', 'Enderman', 'Esqueleto', 'Aldeano', 'Ghast', 'Wither'] },
  { title: 'Personajes de Mario', items: ['Luigi', 'Peach', 'Bowser', 'Yoshi', 'Toad', 'Wario'] },
  { title: 'Pokémon iniciales', items: ['Bulbasaur', 'Charmander', 'Squirtle', 'Chikorita', 'Totodile', 'Piplup'] },
  { title: 'Battle royales', items: ['Fortnite', 'Apex Legends', 'Warzone', 'PUBG', 'Free Fire', 'Fall Guys'] },
  { title: 'Juegos de terror', items: ['Phasmophobia', 'Outlast', 'Amnesia', 'Silent Hill', 'Resident Evil', 'Lethal Company'] },
  { title: 'Consolas', items: ['PlayStation', 'Xbox', 'Switch', 'Game Boy', 'Wii', 'Steam Deck'] },
  { title: 'Jerga gamer', items: ['GG', 'AFK', 'Noob', 'Lag', 'Nerf', 'Buff'] },
  { title: 'Agentes de Valorant', items: ['Jett', 'Sage', 'Reyna', 'Phoenix', 'Omen', 'Sova'] },
  { title: 'Campeones de LoL', items: ['Ahri', 'Jinx', 'Lux', 'Teemo', 'Yasuo', 'Thresh'] },
  { title: 'Plataformas de vídeo', items: ['Twitch', 'Kick', 'YouTube', 'TikTok', 'Instagram', 'Discord'] },
  { title: 'Mundo de Zelda', items: ['Link', 'Ganon', 'Epona', 'Navi', 'Hyrule', 'Trifuerza'] },
  { title: 'Periféricos', items: ['Teclado', 'Ratón', 'Mando', 'Auriculares', 'Alfombrilla', 'Volante'] },
  { title: 'Géneros de juegos', items: ['Roguelike', 'Metroidvania', 'MOBA', 'Soulslike', 'Sandbox', 'Shooter'] },
];

export const GROUP_COLORS = [
  { bg: 'from-yellow-300 to-amber-400', text: 'text-amber-950', emoji: '🟨' },
  { bg: 'from-emerald-300 to-green-500', text: 'text-emerald-950', emoji: '🟩' },
  { bg: 'from-sky-300 to-blue-500', text: 'text-blue-950', emoji: '🟦' },
  { bg: 'from-fuchsia-300 to-purple-500', text: 'text-purple-950', emoji: '🟪' },
];
