import all from "sowpods-five";

const words = new Set(all.map((word) => word.toUpperCase()));

export const isValidGuess = (word: string, answer: string) =>
  word.toUpperCase() === answer.toUpperCase() || words.has(word.toUpperCase());
