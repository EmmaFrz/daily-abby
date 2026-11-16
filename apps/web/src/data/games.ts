export type Mode = 'Solo' | 'Co-op' | 'PvP';
export type Platform = 'PC' | 'PlayStation' | 'Xbox' | 'Switch' | 'Móvil';

export interface Game {
  id: string;
  name: string;
  icon: string;
  genre: string;
  modes: Mode[];
  view: string;
  platforms: Platform[];
  f2p: boolean;
  year: number;
  studio: string;
  /** 5 pistas para el Emojidle, de más difícil a más fácil. */
  clues: [string, string, string, string, string];
}

const ALL: Platform[] = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Móvil'];
const CONSOLES: Platform[] = ['PC', 'PlayStation', 'Xbox', 'Switch'];

export const GAMES: Game[] = [
  { id: 'minecraft', name: 'Minecraft', icon: '⛏️', genre: 'Sandbox', modes: ['Solo', 'Co-op', 'PvP'], view: '1ª persona', platforms: ALL, f2p: false, year: 2011, studio: 'Mojang', clues: ['🌳', '🐷', '🧱', '💥', '⛏️'] },
  { id: 'valorant', name: 'Valorant', icon: '🎯', genre: 'Shooter', modes: ['PvP'], view: '1ª persona', platforms: ['PC', 'PlayStation', 'Xbox'], f2p: true, year: 2020, studio: 'Riot Games', clues: ['🧨', '🛡️', '🗺️', '🎯', '🔫'] },
  { id: 'lol', name: 'League of Legends', icon: '🧙', genre: 'MOBA', modes: ['PvP'], view: 'Isométrica', platforms: ['PC'], f2p: true, year: 2009, studio: 'Riot Games', clues: ['🌿', '🐉', '🏰', '🧙', '⚔️'] },
  { id: 'fortnite', name: 'Fortnite', icon: '🪂', genre: 'Battle Royale', modes: ['Solo', 'Co-op', 'PvP'], view: '3ª persona', platforms: ALL, f2p: true, year: 2017, studio: 'Epic Games', clues: ['🌀', '🕺', '🏗️', '🚌', '🪂'] },
  { id: 'among-us', name: 'Among Us', icon: '🧑‍🚀', genre: 'Party', modes: ['PvP'], view: 'Cenital', platforms: ALL, f2p: false, year: 2018, studio: 'Innersloth', clues: ['🗳️', '🕵️', '🔧', '🔪', '🧑‍🚀'] },
  { id: 'fall-guys', name: 'Fall Guys', icon: '🫘', genre: 'Party', modes: ['PvP'], view: '3ª persona', platforms: CONSOLES, f2p: true, year: 2020, studio: 'Mediatonic', clues: ['🎪', '💨', '👑', '🏃‍♀️', '🫘'] },
  { id: 'stardew', name: 'Stardew Valley', icon: '🌾', genre: 'Simulación', modes: ['Solo', 'Co-op'], view: 'Cenital', platforms: ALL, f2p: false, year: 2016, studio: 'ConcernedApe', clues: ['🎣', '🐔', '⛏️', '🍓', '🌾'] },
  { id: 'sims4', name: 'Los Sims 4', icon: '💎', genre: 'Simulación', modes: ['Solo'], view: 'Isométrica', platforms: ['PC', 'PlayStation', 'Xbox'], f2p: true, year: 2014, studio: 'Maxis', clues: ['🍳', '🔥', '👪', '🏠', '💎'] },
  { id: 'acnh', name: 'Animal Crossing: New Horizons', icon: '🏝️', genre: 'Simulación', modes: ['Solo', 'Co-op'], view: '3ª persona', platforms: ['Switch'], f2p: false, year: 2020, studio: 'Nintendo', clues: ['🐟', '🍑', '✈️', '🦝', '🏝️'] },
  { id: 'mk8', name: 'Mario Kart 8 Deluxe', icon: '🏎️', genre: 'Carreras', modes: ['Solo', 'Co-op', 'PvP'], view: '3ª persona', platforms: ['Switch'], f2p: false, year: 2017, studio: 'Nintendo', clues: ['🐢', '🍌', '🏁', '🍄', '🏎️'] },
  { id: 'phasmophobia', name: 'Phasmophobia', icon: '👻', genre: 'Terror', modes: ['Solo', 'Co-op'], view: '1ª persona', platforms: ['PC', 'PlayStation', 'Xbox'], f2p: false, year: 2020, studio: 'Kinetic Games', clues: ['🌡️', '🧂', '📸', '🔦', '👻'] },
  { id: 'lethal-company', name: 'Lethal Company', icon: '🛸', genre: 'Terror', modes: ['Solo', 'Co-op'], view: '1ª persona', platforms: ['PC'], f2p: false, year: 2023, studio: 'Zeekerss', clues: ['💰', '📦', '🔦', '💀', '🛸'] },
  { id: 'elden-ring', name: 'Elden Ring', icon: '💍', genre: 'RPG', modes: ['Solo', 'Co-op', 'PvP'], view: '3ª persona', platforms: ['PC', 'PlayStation', 'Xbox'], f2p: false, year: 2022, studio: 'FromSoftware', clues: ['🌳', '🐴', '💀', '🐉', '💍'] },
  { id: 'hollow-knight', name: 'Hollow Knight', icon: '🪲', genre: 'Metroidvania', modes: ['Solo'], view: 'Lateral', platforms: CONSOLES, f2p: false, year: 2017, studio: 'Team Cherry', clues: ['🌧️', '🕳️', '🦋', '🗡️', '🪲'] },
  { id: 'genshin', name: 'Genshin Impact', icon: '✨', genre: 'RPG', modes: ['Solo', 'Co-op'], view: '3ª persona', platforms: ['PC', 'PlayStation', 'Móvil'], f2p: true, year: 2020, studio: 'HoYoverse', clues: ['🎲', '🌬️', '⚡', '🗡️', '✨'] },
  { id: 'roblox', name: 'Roblox', icon: '🟥', genre: 'Sandbox', modes: ['Solo', 'Co-op', 'PvP'], view: '3ª persona', platforms: ['PC', 'PlayStation', 'Xbox', 'Móvil'], f2p: true, year: 2006, studio: 'Roblox Corporation', clues: ['🛠️', '🎮', '👾', '🧱', '🟥'] },
  { id: 'dbd', name: 'Dead by Daylight', icon: '🪝', genre: 'Terror', modes: ['Co-op', 'PvP'], view: '3ª persona', platforms: CONSOLES, f2p: false, year: 2016, studio: 'Behaviour Interactive', clues: ['🔧', '🏃‍♀️', '🩸', '🔪', '🪝'] },
  { id: 'overwatch', name: 'Overwatch 2', icon: '🦸', genre: 'Shooter', modes: ['PvP'], view: '1ª persona', platforms: CONSOLES, f2p: true, year: 2022, studio: 'Blizzard', clues: ['🐒', '🛡️', '🚚', '🔫', '🦸'] },
  { id: 'apex', name: 'Apex Legends', icon: '🦾', genre: 'Battle Royale', modes: ['PvP'], view: '1ª persona', platforms: CONSOLES, f2p: true, year: 2019, studio: 'Respawn', clues: ['🧬', '🏆', '🦾', '🔫', '🪂'] },
  { id: 'gta5', name: 'Grand Theft Auto V', icon: '🚗', genre: 'Acción', modes: ['Solo', 'Co-op', 'PvP'], view: '3ª persona', platforms: ['PC', 'PlayStation', 'Xbox'], f2p: false, year: 2013, studio: 'Rockstar North', clues: ['🌴', '💰', '🚓', '⭐', '🚗'] },
  { id: 'bg3', name: "Baldur's Gate 3", icon: '🎲', genre: 'RPG', modes: ['Solo', 'Co-op'], view: 'Isométrica', platforms: ['PC', 'PlayStation', 'Xbox'], f2p: false, year: 2023, studio: 'Larian Studios', clues: ['🐻', '🐙', '🧙‍♀️', '🏰', '🎲'] },
  { id: 'hogwarts', name: 'Hogwarts Legacy', icon: '🪄', genre: 'RPG', modes: ['Solo'], view: '3ª persona', platforms: CONSOLES, f2p: false, year: 2023, studio: 'Avalanche Software', clues: ['🧹', '🦉', '⚡', '🏰', '🪄'] },
  { id: 'it-takes-two', name: 'It Takes Two', icon: '💑', genre: 'Aventura', modes: ['Co-op'], view: '3ª persona', platforms: CONSOLES, f2p: false, year: 2021, studio: 'Hazelight', clues: ['🐘', '🔨', '📚', '🌸', '💑'] },
  { id: 'overcooked2', name: 'Overcooked! 2', icon: '🧑‍🍳', genre: 'Party', modes: ['Co-op'], view: 'Cenital', platforms: CONSOLES, f2p: false, year: 2018, studio: 'Ghost Town Games', clues: ['⏱️', '🔥', '🍔', '🍳', '🧑‍🍳'] },
  { id: 'celeste', name: 'Celeste', icon: '🍓', genre: 'Plataformas', modes: ['Solo'], view: 'Lateral', platforms: CONSOLES, f2p: false, year: 2018, studio: 'Maddy Makes Games', clues: ['🪶', '💨', '❤️', '🍓', '🏔️'] },
  { id: 'terraria', name: 'Terraria', icon: '🌳', genre: 'Sandbox', modes: ['Solo', 'Co-op', 'PvP'], view: 'Lateral', platforms: ALL, f2p: false, year: 2011, studio: 'Re-Logic', clues: ['🏠', '🌙', '👁️', '🗡️', '⛏️'] },
  { id: 'rocket-league', name: 'Rocket League', icon: '⚽', genre: 'Deportes', modes: ['Co-op', 'PvP'], view: '3ª persona', platforms: CONSOLES, f2p: true, year: 2015, studio: 'Psyonix', clues: ['🥅', '🚀', '💥', '⚽', '🚗'] },
  { id: 'cs2', name: 'Counter-Strike 2', icon: '💣', genre: 'Shooter', modes: ['PvP'], view: '1ª persona', platforms: ['PC'], f2p: true, year: 2023, studio: 'Valve', clues: ['🗺️', '🛡️', '🧨', '🔫', '💣'] },
  { id: 'fnaf', name: "Five Nights at Freddy's", icon: '🐻', genre: 'Terror', modes: ['Solo'], view: '1ª persona', platforms: ALL, f2p: false, year: 2014, studio: 'Scott Cawthon', clues: ['🔋', '🚪', '📹', '🍕', '🐻'] },
  { id: 'pokemon-sv', name: 'Pokémon Escarlata y Púrpura', icon: '⚡', genre: 'RPG', modes: ['Solo', 'Co-op'], view: '3ª persona', platforms: ['Switch'], f2p: false, year: 2022, studio: 'Game Freak', clues: ['🥪', '🎒', '🏫', '🐭', '⚡'] },
  { id: 'zelda-totk', name: 'Zelda: Tears of the Kingdom', icon: '🗡️', genre: 'Aventura', modes: ['Solo'], view: '3ª persona', platforms: ['Switch'], f2p: false, year: 2023, studio: 'Nintendo', clues: ['☁️', '🏹', '🔩', '🛡️', '🗡️'] },
  { id: 'geometry-dash', name: 'Geometry Dash', icon: '🔺', genre: 'Plataformas', modes: ['Solo'], view: 'Lateral', platforms: ['PC', 'Móvil'], f2p: false, year: 2013, studio: 'RobTop Games', clues: ['🎵', '🔁', '💥', '🟨', '🔺'] },
  { id: 'cult-lamb', name: 'Cult of the Lamb', icon: '🐑', genre: 'Roguelike', modes: ['Solo', 'Co-op'], view: 'Cenital', platforms: CONSOLES, f2p: false, year: 2022, studio: 'Massive Monster', clues: ['🍄', '🕯️', '⛪', '🗡️', '🐑'] },
  { id: 'undertale', name: 'Undertale', icon: '❤️', genre: 'RPG', modes: ['Solo'], view: 'Cenital', platforms: CONSOLES, f2p: false, year: 2015, studio: 'Toby Fox', clues: ['🌼', '🍝', '🦴', '💀', '❤️'] },
  { id: 'sea-of-thieves', name: 'Sea of Thieves', icon: '🏴‍☠️', genre: 'Aventura', modes: ['Co-op', 'PvP'], view: '1ª persona', platforms: ['PC', 'PlayStation', 'Xbox'], f2p: false, year: 2018, studio: 'Rare', clues: ['🦜', '🌊', '💰', '⚓', '🏴‍☠️'] },
];

export const GAMES_BY_ID: Record<string, Game> = Object.fromEntries(GAMES.map((g) => [g.id, g]));

export function gameById(id: string): Game {
  const g = GAMES_BY_ID[id];
  if (!g) throw new Error(`Juego desconocido: ${id}`);
  return g;
}
