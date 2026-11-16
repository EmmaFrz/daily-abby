import { useStore } from '../state/store';
import { classicWordOfDay } from './content';
import { WordleBoard } from './WordleBoard';

/** Wordle clásico con palabras comunes del español. */
export function Wordle() {
  const { today } = useStore();
  return <WordleBoard id="wordle" answer={classicWordOfDay(today)} intro="La palabra del día: 5 letras, 6 intentos." flag="wordle-2" />;
}
