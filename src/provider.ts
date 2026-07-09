import type { Puzzle, PuzzleSource } from "./types";

type FetchJson = (url: string) => Promise<unknown>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LEGACY_FALLBACK_SOURCE = "daily-five-fallback";
const DEFAULT_DIFFICULTY = 3;

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

function dayName(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!ISO_DATE.test(date) || Number.isNaN(parsedDate.getTime())) throw new Error("Puzzle date was invalid");
  return WEEKDAYS[parsedDate.getUTCDay()];
}

function puzzleSource(raw: Record<string, unknown>): PuzzleSource {
  const source = String(raw.source ?? "");
  if (source === LEGACY_FALLBACK_SOURCE) throw new Error("Legacy fallback puzzle cache is not valid");
  if (source === "nytimes.com" || source === "wordlehints.co.uk" || source === "manual") return source;
  return "wordlehints.co.uk";
}

function normalise(value: unknown, today: string): Puzzle {
  const raw = value as Record<string, unknown>;
  const source = puzzleSource(raw);
  const answer = String(raw.answer ?? raw.word ?? raw.solution ?? "").toUpperCase();
  const date = String(raw.date ?? raw.print_date ?? today).slice(0, 10);
  const game = Number(raw.game ?? raw.gameNumber ?? raw.number ?? raw.days_since_launch);
  const difficulty = Number(raw.difficulty ?? raw.averageScore ?? raw.average_score ?? DEFAULT_DIFFICULTY);

  if (date !== today || !ISO_DATE.test(date) || !/^[A-Z]{5}$/.test(answer) || !Number.isFinite(game) || !Number.isFinite(difficulty)) {
    throw new Error("Puzzle response was invalid");
  }

  return {
    date,
    game,
    dayName: String(raw.dayName ?? raw.day_name ?? dayName(date)),
    answer,
    wordLength: 5,
    difficulty,
    source,
    generatedAt: String(raw.generatedAt ?? new Date().toISOString())
  };
}

export async function getPuzzle(
  today: string,
  cacheBaseUrl: string,
  apiBaseUrl: string,
  fetchJson: FetchJson
): Promise<Puzzle> {
  const cacheRoot = trimTrailingSlash(cacheBaseUrl);
  const apiRoot = trimTrailingSlash(apiBaseUrl);
  const candidates = [
    `${cacheRoot}/${today}.json`,
    `${cacheRoot}/latest.json`,
    `${apiRoot}/answers/latest`
  ];

  for (const url of candidates) {
    try {
      return normalise(await fetchJson(url), today);
    } catch {
      continue;
    }
  }

  throw new Error("Today's game isn't ready yet. Check back a little later.");
}
