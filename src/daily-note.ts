import { emojiRow } from "./game";
import type { DailyNoteDisplay, GameState, Puzzle, Stats } from "./types";

export const START = "<!-- daily-five:start -->";
export const END = "<!-- daily-five:end -->";
export const PLACEHOLDER = "{{daily-five}}";
export const OPEN_PUZZLE_URI = "obsidian://daily-five";

const EMPTY_ROW = "⬜⬜⬜⬜⬜";

function statusLabel(game: GameState): string {
  if (game.status === "won") return `Solved in ${game.guesses.length}/6`;
  if (game.status === "lost") return "Missed today";
  if (game.guesses.length) return `In progress · ${game.guesses.length}/6`;
  return "Not started";
}

function noteRows(game: GameState, display: DailyNoteDisplay): string[] {
  const played = game.guesses.map((guess) => {
    const squares = emojiRow(guess.score);
    return display === "squares" ? squares : display === "words" ? guess.word : `${guess.word} ${squares}`;
  });
  const emptyRows = Array.from({ length: Math.max(0, 6 - played.length) }, () => EMPTY_ROW);
  return [...played, ...emptyRows];
}

export function resultBlock(game: GameState, puzzle: Puzzle, stats: Stats, display: DailyNoteDisplay = "both"): string {
  const lines = [
    START,
    `> [!tip]+ Today’s puzzle`,
    `> **${statusLabel(game)}** · Difficulty **${puzzle.difficulty}/6** · Streak **${stats.currentStreak}**`,
    `> [▶ Open Daily Five](${OPEN_PUZZLE_URI})`,
    ...(game.status === "lost" ? [`> Answer: **${puzzle.answer}**`] : []),
    `>`,
    ...noteRows(game, display).map((row) => `> ${row}`),
    END
  ];
  return lines.join("\n");
}

export function replaceResultBlock(content: string, block: string): string {
  const start = content.indexOf(START);
  const end = content.indexOf(END, start + START.length);
  if (start >= 0 && end >= 0) return content.slice(0, start) + block + content.slice(end + END.length);
  if (content.includes(PLACEHOLDER)) return content.replace(PLACEHOLDER, block);
  return `${content.trimEnd()}${content.trim() ? "\n\n" : ""}${block}\n`;
}
