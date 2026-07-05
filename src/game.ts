import type { GameState, LetterState } from "./types";

export function scoreGuess(guess: string, answer: string): LetterState[] {
  const letters = answer.toUpperCase().split("");
  const input = guess.toUpperCase().split("");
  const score: LetterState[] = ["absent", "absent", "absent", "absent", "absent"];

  input.forEach((letter, index) => {
    if (letter === letters[index]) {
      score[index] = "correct";
      letters[index] = "";
      input[index] = "";
    }
  });
  input.forEach((letter, index) => {
    const match = letters.indexOf(letter);
    if (letter && match >= 0) {
      score[index] = "present";
      letters[match] = "";
    }
  });
  return score;
}

export function newGame(date: string): GameState {
  return { date, guesses: [], draft: "", status: "playing" };
}

export function submitGuess(state: GameState, answer: string, word: string): GameState {
  if (state.status !== "playing" || !/^[A-Z]{5}$/i.test(word)) return state;
  const score = scoreGuess(word, answer);
  const guesses = [...state.guesses, { word: word.toUpperCase(), score }];
  return {
    ...state,
    draft: "",
    guesses,
    status: score.every((value) => value === "correct") ? "won" : guesses.length === 6 ? "lost" : "playing"
  };
}

export const emojiRow = (score: LetterState[]) =>
  score.map((value) => value === "correct" ? "🟩" : value === "present" ? "🟨" : "⬛").join("");
