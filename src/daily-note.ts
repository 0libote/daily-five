import { emojiRow } from "./game";
import type { GameState, Puzzle, Stats } from "./types";

export const START = "<!-- daily-five:start -->";
export const END = "<!-- daily-five:end -->";

export function resultBlock(game: GameState, puzzle: Puzzle, stats: Stats): string {
  const result = game.status === "won"
    ? `${game.guesses.length}/6`
    : game.status === "lost"
      ? "X/6"
      : game.guesses.length
        ? `In progress (${game.guesses.length}/6)`
        : "Not started";
  return `${START}
## Daily Five
Result: ${result}
Difficulty: ${puzzle.difficulty} / 6
Streak: ${stats.currentStreak}

${game.guesses.map((guess) => emojiRow(guess.score)).join("\n")}
${END}`;
}

export function replaceResultBlock(content: string, block: string): string {
  const start = content.indexOf(START);
  const end = content.indexOf(END, start + START.length);
  if (start >= 0 && end >= 0) return content.slice(0, start) + block + content.slice(end + END.length);
  return `${content.trimEnd()}${content.trim() ? "\n\n" : ""}${block}\n`;
}
