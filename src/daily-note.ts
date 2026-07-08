import { emojiRow } from "./game";
import type { DailyNoteDisplay, GameState, Puzzle, Stats } from "./types";

export const START = "<!-- daily-five:start -->";
export const END = "<!-- daily-five:end -->";
export const PLACEHOLDER = "{{daily-five}}";
export const OPEN_PUZZLE_URI = "obsidian://daily-five";

function statusLabel(game: GameState): string {
  if (game.status === "won") return `Solved in ${game.guesses.length}/6`;
  if (game.status === "lost") return "Missed today";
  if (game.guesses.length) return `In progress · ${game.guesses.length}/6`;
  return "Not started";
}

function noteRows(game: GameState, display: DailyNoteDisplay): string[] {
  if (!game.guesses.length) return ["> _No guesses yet._"];
  return game.guesses.map((guess) => {
    const squares = emojiRow(guess.score);
    const word = `\`${guess.word}\``;
    const row = display === "squares" ? squares : display === "words" ? word : `${word} ${squares}`;
    return `> ${row}`;
  });
}

export function resultBlock(game: GameState, puzzle: Puzzle, stats: Stats, display: DailyNoteDisplay = "both"): string {
  const lines = [
    START,
    `> [!note]+ Today’s puzzle`,
    `> **${statusLabel(game)}** · Difficulty **${puzzle.difficulty}/6** · Streak **${stats.currentStreak}**`,
    `> [Open Daily Five](${OPEN_PUZZLE_URI})`,
    ...(game.status === "lost" ? [`> Answer: **${puzzle.answer}**`] : []),
    `>`,
    ...noteRows(game, display),
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
