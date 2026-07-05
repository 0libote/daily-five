import type { HistoryEntry, Stats } from "./types";

export const START = "<!-- daily-five:start -->";
export const END = "<!-- daily-five:end -->";

export function resultBlock(entry: HistoryEntry, stats: Stats): string {
  const result = entry.won ? `${entry.guesses}/6` : "X/6";
  return `${START}
## Daily Five
Result: ${result}
Difficulty: ${entry.difficulty} / 6
Streak: ${stats.currentStreak}

${entry.rows.join("\n")}
${END}`;
}

export function replaceResultBlock(content: string, block: string): string {
  const start = content.indexOf(START);
  const end = content.indexOf(END, start + START.length);
  if (start >= 0 && end >= 0) return content.slice(0, start) + block + content.slice(end + END.length);
  return `${content.trimEnd()}${content.trim() ? "\n\n" : ""}${block}\n`;
}
