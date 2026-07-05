export type LetterResult = "absent" | "present" | "correct";

export interface GameState {
  date: string;
  guesses: string[];
  completed: boolean;
  won: boolean;
}

export function scoreGuess(guess: string, answer: string): LetterResult[] {
  if (!/^[a-z]{5}$/i.test(guess) || !/^[a-z]{5}$/i.test(answer)) {
    throw new Error("Guess and answer must be five letters.");
  }

  const guessed = [...guess.toUpperCase()];
  const remaining = [...answer.toUpperCase()];
  const result: LetterResult[] = guessed.map((letter, index) => {
    if (letter !== remaining[index]) return "absent";
    remaining[index] = "";
    return "correct";
  });

  guessed.forEach((letter, index) => {
    if (result[index] === "correct") return;
    const match = remaining.indexOf(letter);
    if (match === -1) return;
    result[index] = "present";
    remaining[match] = "";
  });

  return result;
}
