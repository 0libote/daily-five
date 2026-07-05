import type { Puzzle } from "./types";

type FetchJson = (url: string) => Promise<unknown>;

function normalise(value: unknown, today: string): Puzzle {
  const raw = value as Record<string, unknown>;
  const answer = String(raw.answer ?? raw.word ?? "").toUpperCase();
  const date = String(raw.date ?? today).slice(0, 10);
  const game = Number(raw.game ?? raw.gameNumber ?? raw.number);
  const difficulty = Number(raw.difficulty);
  if (date !== today || !/^[A-Z]{5}$/.test(answer) || !Number.isFinite(game) || !Number.isFinite(difficulty)) {
    throw new Error("Puzzle response was invalid");
  }
  return {
    date,
    game,
    dayName: String(raw.dayName ?? raw.day_name ?? ""),
    answer,
    wordLength: 5,
    difficulty,
    source: "wordlehints.co.uk",
    generatedAt: String(raw.generatedAt ?? new Date().toISOString())
  };
}

export async function getPuzzle(
  today: string,
  cacheBaseUrl: string,
  apiBaseUrl: string,
  fetchJson: FetchJson
): Promise<Puzzle> {
  try {
    return normalise(await fetchJson(`${cacheBaseUrl.replace(/\/$/, "")}/${today}.json`), today);
  } catch {
    try {
      return normalise(await fetchJson(`${apiBaseUrl.replace(/\/$/, "")}/answers/latest`), today);
    } catch {
      throw new Error("Today's game isn't ready yet. Check back a little later.");
    }
  }
}
