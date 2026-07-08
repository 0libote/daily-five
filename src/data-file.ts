import type { PluginData } from "./types";

export const DATA_START = "<!-- daily-five:data:start -->";
export const DATA_END = "<!-- daily-five:data:end -->";
export const DEFAULT_DATA_FILE_PATH = "Daily Five Data.md";

const escapeCell = (value: unknown) => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

function statusText(data: PluginData): string {
  const game = data.game;
  if (!game) return "Not started";
  if (game.status === "won") return `Solved in ${game.guesses.length}/6`;
  if (game.status === "lost") return "Missed";
  return game.guesses.length ? `In progress (${game.guesses.length}/6)` : "Not started";
}

function historyMarkdown(data: PluginData): string {
  const entries = Object.values(data.stats.history ?? {}).sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) return "| No games recorded yet | - | - | - |\n";
  return entries.map((entry) => [
    escapeCell(entry.date),
    escapeCell(entry.won ? `${entry.guesses}/6` : "X/6"),
    escapeCell(`${entry.difficulty}/6`),
    escapeCell(entry.rows.join(" "))
  ].join(" | ")).map((row) => `| ${row} |`).join("\n");
}

function currentPuzzleMarkdown(data: PluginData): string {
  const puzzle = data.puzzle;
  if (!puzzle) return "- Puzzle: Not loaded yet\n- Status: Not started";
  return [
    `- Date: ${puzzle.date}`,
    `- Game: No. ${puzzle.game}`,
    `- Difficulty: ${puzzle.difficulty}/6`,
    `- Status: ${statusText(data)}`,
    `- Source: ${puzzle.source}`
  ].join("\n");
}

export function dataFileMarkdown(data: PluginData, savedAt = new Date().toISOString()): string {
  const payload = JSON.stringify({ version: 1, savedAt, data }, null, 2);
  return `# Daily Five Data

> [!info] Backup note
> This note is maintained by the Daily Five plugin. It is safe to read, copy, back up, and sync with the rest of your vault.

Last updated: ${savedAt}

## Current puzzle

${currentPuzzleMarkdown(data)}

## Lifetime stats

- Games played: ${data.stats.gamesPlayed}
- Games won: ${data.stats.gamesWon}
- Failures: ${data.stats.failures}
- Current streak: ${data.stats.currentStreak}
- Best streak: ${data.stats.bestStreak}

## History

| Date | Result | Difficulty | Rows |
| --- | ---: | ---: | --- |
${historyMarkdown(data)}

## Restore data

The block below is used by Daily Five to restore your data if the plugin's internal storage is lost. Keep it in this note.

${DATA_START}
\`\`\`json
${payload}
\`\`\`
${DATA_END}
`;
}

export function backupDataFromMarkdown(content: string): Partial<PluginData> | null {
  const start = content.indexOf(DATA_START);
  const end = content.indexOf(DATA_END, start + DATA_START.length);
  if (start < 0 || end < 0) return null;
  const raw = content.slice(start + DATA_START.length, end).trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(raw) as { data?: Partial<PluginData> } | Partial<PluginData>;
    return "data" in parsed && parsed.data ? parsed.data : parsed as Partial<PluginData>;
  } catch {
    return null;
  }
}
