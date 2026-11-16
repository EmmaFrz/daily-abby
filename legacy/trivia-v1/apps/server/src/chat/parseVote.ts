import type { Choice } from '@abby/shared';

const VOTES: Record<string, Choice> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  '1': 'A',
  '2': 'B',
  '3': 'C',
  '4': 'D',
};

/**
 * Convierte un mensaje del chat en voto. Solo cuenta si el mensaje es exactamente
 * la opción ("a", "B", "3", "!c"), para no confundir frases normales con votos.
 */
export function parseVote(message: string): Choice | null {
  const token = message.trim().replace(/^!/, '').toUpperCase();
  return VOTES[token] ?? null;
}
