import { mkdir, readFile, writeFile } from "node:fs/promises";

const wordleHintsEndpoint = "https://wordlehints.co.uk/wp-json/wordlehint/v1/answers/latest";
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const GAME_ZERO_DATE = Date.UTC(2021, 5, 19);
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_DIFFICULTY = 3;
const timeZone = process.env.DAILY_FIVE_TIME_ZONE ?? "Europe/London";

function localDate(zone = timeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now).reduce((record, part) => {
    if (part.type !== "literal") record[part.type] = part.value;
    return record;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

const today = process.env.DAILY_FIVE_DATE ?? localDate();

function utcDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function dayName(date) {
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!isoDate.test(date) || Number.isNaN(parsedDate.getTime())) throw new Error(`Invalid puzzle date: ${date}`);
  return WEEKDAYS[parsedDate.getUTCDay()];
}

function gameNumber(date, rawGame) {
  const game = Number(rawGame);
  if (Number.isFinite(game)) return game;
  return Math.round((utcDate(date) - GAME_ZERO_DATE) / DAY_MS);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "accept": "application/json",
      "user-agent": "DailyFiveCache/1.0 (+https://github.com/0libote/daily-five)"
    }
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

function normalise(raw, expectedDate, source) {
  const answer = String(raw.answer ?? raw.word ?? raw.solution ?? "").toUpperCase();
  const date = String(raw.date ?? raw.print_date ?? expectedDate).slice(0, 10);
  const game = gameNumber(date, raw.game ?? raw.gameNumber ?? raw.number ?? raw.days_since_launch);
  const difficulty = Number(raw.difficulty ?? raw.averageScore ?? raw.average_score ?? DEFAULT_DIFFICULTY);

  if (!isoDate.test(date) || date !== expectedDate || !/^[A-Z]{5}$/.test(answer) || !Number.isFinite(game) || !Number.isFinite(difficulty)) {
    throw new Error(`${source} response was invalid or stale`);
  }

  return {
    date,
    game,
    dayName: String(raw.day_name ?? raw.dayName ?? dayName(date)),
    answer,
    wordLength: 5,
    difficulty,
    source,
    generatedAt: new Date().toISOString()
  };
}

const providers = [
  {
    source: "nytimes.com",
    url: () => `https://www.nytimes.com/svc/wordle/v2/${today}.json`
  },
  {
    source: "wordlehints.co.uk",
    url: () => wordleHintsEndpoint
  }
];

async function puzzleForToday() {
  const errors = [];
  for (const provider of providers) {
    try {
      return normalise(await fetchJson(provider.url()), today, provider.source);
    } catch (error) {
      errors.push(`${provider.source}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(errors.join("; "));
}

async function preserveGeneratedAt(puzzle) {
  try {
    const existing = JSON.parse(await readFile(`cache/${puzzle.date}.json`, "utf8"));
    if (existing.game === puzzle.game && existing.answer === puzzle.answer && existing.source === puzzle.source) {
      return {
        ...puzzle,
        difficulty: Number.isFinite(Number(existing.difficulty)) ? Number(existing.difficulty) : puzzle.difficulty,
        generatedAt: existing.generatedAt
      };
    }
  } catch {}
  return puzzle;
}

let puzzle;
try {
  puzzle = await preserveGeneratedAt(await puzzleForToday());
} catch (error) {
  console.log(`No authoritative puzzle available for ${today}; cache not updated. ${error instanceof Error ? error.message : String(error)}`);
  process.exit(0);
}

let existingLatestDate = "";
try {
  const existingLatest = JSON.parse(await readFile("cache/latest.json", "utf8"));
  existingLatestDate = String(existingLatest.date ?? "").slice(0, 10);
} catch {}

await mkdir("cache", { recursive: true });
let index = { dates: [] };
try { index = JSON.parse(await readFile("cache/index.json", "utf8")); } catch {}
const dates = new Set(Array.isArray(index.dates) ? index.dates : []);
dates.add(puzzle.date);
if (isoDate.test(existingLatestDate)) dates.add(existingLatestDate);
index.dates = [...dates].filter((value) => isoDate.test(value)).sort((a, b) => b.localeCompare(a));
const json = `${JSON.stringify(puzzle, null, 2)}\n`;
const writes = [
  writeFile(`cache/${puzzle.date}.json`, json),
  writeFile("cache/index.json", `${JSON.stringify(index, null, 2)}\n`)
];
if (!isoDate.test(existingLatestDate) || puzzle.date >= existingLatestDate) {
  writes.push(writeFile("cache/latest.json", json));
} else {
  console.log(`Puzzle ${puzzle.date} is older than cached latest ${existingLatestDate}; leaving cache/latest.json unchanged.`);
}
await Promise.all(writes);
