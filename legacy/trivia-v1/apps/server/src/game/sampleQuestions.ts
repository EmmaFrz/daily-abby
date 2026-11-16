import type { Question } from '@abby/shared';

/**
 * Preguntas de ejemplo para probar el motor.
 * En la fase 2 se reemplazan por las que se gestionan desde el panel admin (base de datos).
 */
export const sampleQuestions: Question[] = [
  {
    id: 'demo-1',
    category: 'Twitch',
    text: '¿Qué emote clásico de Twitch se usa para indicar sarcasmo?',
    options: { A: 'PogChamp', B: 'Kappa', C: 'LUL', D: 'Kreygasm' },
    correct: 'B',
    timeLimitSec: 20,
  },
  {
    id: 'demo-2',
    category: 'Videojuegos',
    text: '¿En qué videojuego aparece el famoso "Creeper"?',
    options: { A: 'Terraria', B: 'Roblox', C: 'Minecraft', D: 'Fortnite' },
    correct: 'C',
    timeLimitSec: 20,
  },
  {
    id: 'demo-3',
    category: 'Internet',
    text: '¿Qué significa "GG" al final de una partida?',
    options: { A: 'Good Game', B: 'Get Going', C: 'Great Goal', D: 'Go Go' },
    correct: 'A',
    timeLimitSec: 20,
  },
  {
    id: 'demo-4',
    category: 'Videojuegos',
    text: '¿Cómo se llama la princesa que Mario suele rescatar?',
    options: { A: 'Zelda', B: 'Daisy', C: 'Peach', D: 'Rosalina' },
    correct: 'C',
    timeLimitSec: 20,
  },
  {
    id: 'demo-5',
    category: 'Twitch',
    text: '¿Cómo se llama la función para mandar a tu audiencia al canal de otro streamer al terminar?',
    options: { A: 'Host', B: 'Raid', C: 'Clip', D: 'Hype Train' },
    correct: 'B',
    timeLimitSec: 20,
    explanation: 'El modo "Host" se eliminó en 2022; hoy se usa el Raid.',
  },
  {
    id: 'demo-6',
    category: 'Twitch',
    text: '¿De qué color es el logo de Twitch?',
    options: { A: 'Rojo', B: 'Verde', C: 'Azul', D: 'Morado' },
    correct: 'D',
    timeLimitSec: 15,
  },
];
