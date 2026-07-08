import { describe, expect, it } from "vitest";
import { backupDataFromMarkdown, DATA_START, dataFileMarkdown } from "./data-file";
import { daysBetween, localDate } from "./date";
import { OPEN_PUZZLE_URI, replaceResultBlock, resultBlock } from "./daily-note";
import { fallbackPuzzle } from "./fallback";
import { keyboardStates, newGame, scoreGuess, submitGuess } from "./game";
import { getPuzzle } from "./provider";
import { emptyStats, recordResult } from "./stats";
import type { PluginData, Puzzle } from "./types";
import { isValidGuess } from "./words";

const puzzle: Puzzle = {
  date: "2026-07-05", game: 1842, dayName: "Sunday", answer: "SWAMI",
  wordLength: 5, difficulty: 4.8, source: "wordlehints.co.uk", generatedAt: "2026-07-05T00:10:00Z"
};

describe("game", () => {
  it("scores positions", () => expect(scoreGuess("SLATE", "SWAMI")).toEqual(["correct", "absent", "correct", "absent", "absent"]));
  it("does not score duplicate letters twice", () => expect(scoreGuess("SHEEP", "SWAMI")).toEqual(["correct", "absent", "absent", "absent", "absent"]));
  it("keeps the strongest keyboard state for each letter", () => {
    const states = keyboardStates([
      { word: "SHEEP", score: scoreGuess("SHEEP", "SWAMI") },
      { word: "CRANE", score: scoreGuess("CRANE", "SWAMI") }
    ]);
    expect(states.get("S")).toBe("correct");
    expect(states.get("A")).toBe("correct");
    expect(states.get("E")).toBe("absent");
  });
  it("wins and loses after six guesses", () => {
    expect(submitGuess(newGame(puzzle.date), puzzle.answer, "SWAMI").status).toBe("won");
    let game = newGame(puzzle.date);
    for (let i = 0; i < 6; i++) game = submitGuess(game, puzzle.answer, "CRANE");
    expect(game.status).toBe("lost");
  });
});

describe("stats", () => {
  it("records wins, failures, distribution and streaks once", () => {
    const won = submitGuess(newGame(puzzle.date), puzzle.answer, "SWAMI");
    const first = recordResult(emptyStats(), won, puzzle);
    expect(first).toMatchObject({ gamesPlayed: 1, gamesWon: 1, currentStreak: 1, bestStreak: 1 });
    expect(first.distribution[1]).toBe(1);
    expect(recordResult(first, won, puzzle)).toBe(first);
    const next = { ...puzzle, date: "2026-07-06" };
    const second = recordResult(first, { ...won, date: next.date }, next);
    expect(second).toMatchObject({ currentStreak: 2, bestStreak: 2 });
    const later = { ...puzzle, date: "2026-07-08" };
    const lost = { ...newGame(later.date), status: "lost" as const };
    expect(recordResult(second, lost, later)).toMatchObject({ gamesPlayed: 3, failures: 1, currentStreak: 0 });
  });
});

it("writes and restores a readable markdown data backup", () => {
  const won = submitGuess(newGame(puzzle.date), puzzle.answer, "SWAMI");
  const data: PluginData = {
    settings: {
      cacheBaseUrl: "https://cache",
      apiBaseUrl: "https://api",
      dailyNotesEnabled: true,
      dailyNoteFolder: "",
      dailyNoteDateFormat: "YYYY-MM-DD",
      dailyNoteDisplay: "both",
      highContrast: false,
      dataFileEnabled: true,
      dataFilePath: "Daily Five Data.md"
    },
    stats: recordResult(emptyStats(), won, puzzle),
    game: won,
    puzzle
  };
  const markdown = dataFileMarkdown(data, "2026-07-05T00:10:00Z");
  expect(markdown).toContain("# Daily Five Data");
  expect(markdown).toContain("## Lifetime stats");
  expect(markdown).toContain(DATA_START);
  expect(markdown).toContain("| 2026-07-05 | 1/6 | 4.8/6 |");
  const restored = backupDataFromMarkdown(markdown);
  expect(restored?.stats?.gamesPlayed).toBe(1);
  expect(restored?.game?.status).toBe("won");
  expect(restored?.puzzle?.answer).toBe("SWAMI");
});

it("replaces only the marked Daily Note block", () => {
  expect(replaceResultBlock("before\n<!-- daily-five:start -->old<!-- daily-five:end -->\nafter", "NEW"))
    .toBe("before\nNEW\nafter");
});

it("inserts the Daily Note block at the template placeholder", () => {
  expect(replaceResultBlock("# Wordle\n\n{{daily-five}}\n\n## Notes", "BLOCK"))
    .toBe("# Wordle\n\nBLOCK\n\n## Notes");
});

it("renders a compact Daily Note block without adding a duplicate heading", () => {
  const block = resultBlock(newGame(puzzle.date), puzzle, emptyStats());
  expect(block).toContain("[!note]+ Today’s puzzle");
  expect(block).toContain("**Not started**");
  expect(block).toContain(`](${OPEN_PUZZLE_URI})`);
  expect(block).not.toContain("## Daily Five");
  expect(block).toContain("> _No guesses yet._");
  expect(block).not.toContain("⬜⬜⬜⬜⬜");
});

it("renders in-progress Daily Note states", () => {
  const stats = emptyStats();
  const started = submitGuess(newGame(puzzle.date), puzzle.answer, "CRANE");
  const block = resultBlock(started, puzzle, stats);
  expect(block).toContain("**In progress · 1/6**");
  expect(block).toContain("> `CRANE` ⬛⬛🟩⬛⬛");
  expect(block).not.toContain("⬜⬜⬜⬜⬜");
});

it("supports word-only notes and reveals the answer after a loss", () => {
  const lost = { ...newGame(puzzle.date), status: "lost" as const, guesses: [
    { word: "CRANE", score: scoreGuess("CRANE", puzzle.answer) }
  ] };
  const block = resultBlock(lost, puzzle, emptyStats(), "words");
  expect(block).toContain("Answer: **SWAMI**");
  expect(block).toContain("\n> `CRANE`\n");
  expect(block).not.toContain("⬛");
});

it("uses cache first and falls back to upstream", async () => {
  const calls: string[] = [];
  const fetched = await getPuzzle(puzzle.date, "https://cache", "https://api", async (url) => {
    calls.push(url);
    if (url.includes("cache")) throw new Error();
    return puzzle;
  });
  expect(fetched.answer).toBe("SWAMI");
  expect(calls).toEqual(["https://cache/2026-07-05.json", "https://cache/latest.json", "https://api/answers/latest"]);
});

it("uses latest cache before upstream when dated cache is unavailable", async () => {
  const calls: string[] = [];
  const fetched = await getPuzzle(puzzle.date, "https://cache", "https://api", async (url) => {
    calls.push(url);
    if (url.endsWith("/2026-07-05.json")) throw new Error();
    return puzzle;
  });
  expect(fetched.answer).toBe("SWAMI");
  expect(calls).toEqual(["https://cache/2026-07-05.json", "https://cache/latest.json"]);
});

it("ignores stale cached latest before falling back upstream", async () => {
  const calls: string[] = [];
  const stale = { ...puzzle, date: "2026-07-04" };
  const fetched = await getPuzzle(puzzle.date, "https://cache", "https://api", async (url) => {
    calls.push(url);
    if (url.endsWith("/2026-07-05.json")) throw new Error();
    if (url.endsWith("/latest.json")) return stale;
    return puzzle;
  });
  expect(fetched.date).toBe(puzzle.date);
  expect(calls).toEqual(["https://cache/2026-07-05.json", "https://cache/latest.json", "https://api/answers/latest"]);
});

it("keeps fallback source when today's cache contains a fallback puzzle", async () => {
  const cached = fallbackPuzzle(puzzle.date, "2026-07-05T00:10:00Z");
  const fetched = await getPuzzle(puzzle.date, "https://cache", "https://api", async (url) => {
    if (url.endsWith("/2026-07-05.json")) return cached;
    throw new Error("unexpected source");
  });
  expect(fetched).toMatchObject({ date: puzzle.date, source: "daily-five-fallback", answer: cached.answer });
});

it("does not call upstream when cache has today's puzzle", async () => {
  const calls: string[] = [];
  await getPuzzle(puzzle.date, "https://cache", "https://api", async (url) => {
    calls.push(url);
    return puzzle;
  });
  expect(calls).toEqual(["https://cache/2026-07-05.json"]);
});

it("uses a deterministic fallback when today's puzzle is not available remotely", async () => {
  const calls: string[] = [];
  const fetched = await getPuzzle("2026-07-08", "https://cache", "https://api", async (url) => {
    calls.push(url);
    throw new Error("missing");
  });
  expect(calls).toEqual(["https://cache/2026-07-08.json", "https://cache/latest.json", "https://api/answers/latest"]);
  expect(fetched).toMatchObject({ date: "2026-07-08", source: "daily-five-fallback", wordLength: 5 });
  expect(fetched.answer).toMatch(/^[A-Z]{5}$/);
  expect(fetched).toEqual(fallbackPuzzle("2026-07-08", fetched.generatedAt));
});

it("handles local and consecutive dates", () => {
  expect(localDate(new Date(2026, 6, 5, 23, 59))).toBe("2026-07-05");
  expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
});

it("accepts dictionary words and rejects non-words", () => {
  expect(isValidGuess("CRANE", puzzle.answer)).toBe(true);
  expect(isValidGuess("SWAMI", puzzle.answer)).toBe(true);
  expect(isValidGuess("ZZZZZ", puzzle.answer)).toBe(false);
});
