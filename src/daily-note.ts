import { emojiRow } from "./game";
import type { DailyNoteDisplay, GameState, Puzzle, Stats } from "./types";

export const START = "<!-- daily-five:start -->";
export const END = "<!-- daily-five:end -->";
export const PLACEHOLDER = "{{daily-five}}";

export function resultBlock(game: GameState, puzzle: Puzzle, stats: Stats, display: DailyNoteDisplay = "both"): string {
  const result = game.status === "won"
    ? `${game.guesses.length}/6`
    : game.status === "lost"
      ? "X/6"
      : game.guesses.length
        ? `In progress (${game.guesses.length}/6)`
        : "Not started";
  const rows = game.guesses.map((guess) => {
    const squares = emojiRow(guess.score);
    return display === "squares" ? squares : display === "words" ? guess.word : `${guess.word} ${squares}`;
  });
  return `${START}
## Daily Five
Result: ${result}
Difficulty: ${puzzle.difficulty} / 6
Streak: ${stats.currentStreak}
${game.status === "lost" ? `Answer: ${puzzle.answer}\n` : ""}

${rows.join("\n")}
${END}`;
}

export function replaceResultBlock(content: string, block: string): string {
  const start = content.indexOf(START);
  const end = content.indexOf(END, start + START.length);
  if (start >= 0 && end >= 0) return content.slice(0, start) + block + content.slice(end + END.length);
  if (content.includes(PLACEHOLDER)) return content.replace(PLACEHOLDER, block);
  return `${content.trimEnd()}${content.trim() ? "\n\n" : ""}${block}\n`;
}
