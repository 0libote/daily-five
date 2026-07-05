import { describe, expect, it } from "vitest";
import { daysBetween, localDate } from "./date";
import { replaceResultBlock, resultBlock } from "./daily-note";
import { keyboardStates, newGame, scoreGuess, submitGuess } from "./game";
import { getPuzzle } from "./provider";
import { emptyStats, recordResult } from "./stats";
import type { Puzzle } from "./types";

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

it("replaces only the marked Daily Note block", () => {
  expect(replaceResultBlock("before\n<!-- daily-five:start -->old<!-- daily-five:end -->\nafter", "NEW"))
    .toBe("before\nNEW\nafter");
});

it("inserts the Daily Note block at the template placeholder", () => {
  expect(replaceResultBlock("# Morning\n\n{{daily-five}}\n\n## Notes", "BLOCK"))
    .toBe("# Morning\n\nBLOCK\n\n## Notes");
});

it("renders not-started and in-progress Daily Note states", () => {
  const stats = emptyStats();
  expect(resultBlock(newGame(puzzle.date), puzzle, stats)).toContain("Result: Not started");
  const started = submitGuess(newGame(puzzle.date), puzzle.answer, "CRANE");
  expect(resultBlock(started, puzzle, stats)).toContain("Result: In progress (1/6)");
  expect(resultBlock(started, puzzle, stats)).toContain("⬛⬛🟩⬛⬛");
});

it("uses cache first and falls back to upstream", async () => {
  const calls: string[] = [];
  const fetched = await getPuzzle(puzzle.date, "https://cache", "https://api", async (url) => {
    calls.push(url);
    if (url.includes("cache")) throw new Error();
    return puzzle;
  });
  expect(fetched.answer).toBe("SWAMI");
  expect(calls).toEqual(["https://cache/2026-07-05.json", "https://api/answers/latest"]);
});

it("does not call upstream when cache has today's puzzle", async () => {
  const calls: string[] = [];
  await getPuzzle(puzzle.date, "https://cache", "https://api", async (url) => {
    calls.push(url);
    return puzzle;
  });
  expect(calls).toEqual(["https://cache/2026-07-05.json"]);
});

it("handles local and consecutive dates", () => {
  expect(localDate(new Date(2026, 6, 5, 23, 59))).toBe("2026-07-05");
  expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
});
