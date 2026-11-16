import { useStore } from '../state/store';
import { wordOfDay } from './content';
import { WordleBoard } from './WordleBoard';

/** Wordle con palabras del mundo stream y gaming. */
export function Palabrdle() {
  const { today } = useStore();
  return <WordleBoard id="palabrdle" answer={wordOfDay(today)} intro="Palabra de 5 letras del mundo stream y gaming." flag="palabrdle-2" />;
}
