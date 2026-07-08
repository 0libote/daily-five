import { mkdir, readFile, writeFile } from "node:fs/promises";

const endpoint = "https://wordlehints.co.uk/wp-json/wordlehint/v1/answers/latest";
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const GAME_ZERO_DATE = Date.UTC(2021, 5, 19);
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const fallbackAnswers = [
  "ABOUT", "ABOVE", "ABUSE", "ACTOR", "ACUTE", "ADMIT", "ADOPT", "ADULT", "AFTER", "AGAIN", "AGENT", "AGREE",
  "AHEAD", "ALARM", "ALBUM", "ALERT", "ALIKE", "ALIVE", "ALLOW", "ALONE", "ALONG", "ALTER", "AMONG", "ANGER",
  "ANGLE", "ANGRY", "APART", "APPLE", "APPLY", "ARENA", "ARGUE", "ARISE", "ARRAY", "ASIDE", "ASSET", "AUDIO",
  "AVOID", "AWARD", "AWARE", "BADLY", "BASIC", "BEACH", "BEGAN", "BEGIN", "BEING", "BELOW", "BENCH", "BIRTH",
  "BLACK", "BLAME", "BLIND", "BLOCK", "BLOOD", "BOARD", "BOOST", "BRAIN", "BRAND", "BREAD", "BREAK", "BRIEF",
  "BRING", "BROAD", "BROWN", "BUILD", "CABLE", "CARRY", "CATCH", "CAUSE", "CHAIN", "CHAIR", "CHART", "CHECK",
  "CHEST", "CHIEF", "CHILD", "CLAIM", "CLASS", "CLEAN", "CLEAR", "CLICK", "CLIMB", "CLOCK", "CLOSE", "COACH",
  "COAST", "COULD", "COUNT", "COURT", "COVER", "CRAFT", "CRASH", "CREAM", "CRIME", "CROSS", "CROWD", "CROWN",
  "CYCLE", "DAILY", "DANCE", "DEATH", "DELAY", "DEPTH", "DOUBT", "DOZEN", "DRAFT", "DREAM", "DRESS", "DRINK",
  "DRIVE", "EARLY", "EARTH", "EMPTY", "ENEMY", "ENJOY", "ENTER", "ENTRY", "EQUAL", "ERROR", "EVENT", "EVERY",
  "EXACT", "EXIST", "EXTRA", "FAITH", "FALSE", "FAULT", "FIBRE", "FIELD", "FINAL", "FIRST", "FIXED", "FLASH",
  "FLEET", "FLOOR", "FOCUS", "FORCE", "FORTH", "FRAME", "FRESH", "FRONT", "FRUIT", "FULLY", "GIANT", "GIVEN",
  "GLASS", "GLOBE", "GOING", "GRACE", "GRADE", "GRAND", "GRANT", "GRASS", "GREAT", "GREEN", "GROUP", "GUARD",
  "GUESS", "GUIDE", "HAPPY", "HEART", "HEAVY", "HORSE", "HOTEL", "HOUSE", "HUMAN", "IMAGE", "INDEX", "INNER",
  "INPUT", "ISSUE", "JOINT", "JUDGE", "KNOWN", "LABEL", "LARGE", "LASER", "LATER", "LAYER", "LEARN", "LEAST",
  "LEAVE", "LEVEL", "LIGHT", "LIMIT", "LOCAL", "LOGIC", "LUNCH", "MAGIC", "MAJOR", "MARCH", "MATCH", "MAYBE",
  "METAL", "MIGHT", "MINOR", "MODEL", "MONEY", "MONTH", "MOTOR", "MOUNT", "MOUSE", "MOVIE", "MUSIC", "NEVER",
  "NIGHT", "NOISE", "NORTH", "NOVEL", "NURSE", "OCCUR", "OCEAN", "OFFER", "OFTEN", "ORDER", "OTHER", "OWNER",
  "PANEL", "PAPER", "PARTY", "PEACE", "PHONE", "PHOTO", "PIECE", "PILOT", "PITCH", "PLACE", "PLAIN", "PLANE",
  "PLANT", "PLATE", "POINT", "POWER", "PRESS", "PRICE", "PRIDE", "PRIME", "PRINT", "PRIOR", "PRIZE", "PROOF",
  "PROUD", "QUICK", "QUIET", "RADIO", "RAISE", "RANGE", "RAPID", "REACH", "READY", "REFER", "RIGHT", "RIVAL",
  "RIVER", "ROUND", "ROUTE", "ROYAL", "SCALE", "SCENE", "SCOPE", "SCORE", "SENSE", "SERVE", "SEVEN", "SHADE",
  "SHARE", "SHEET", "SHELF", "SHIFT", "SHINE", "SHIRT", "SHOCK", "SHORT", "SHOWN", "SKILL", "SLEEP", "SMALL",
  "SMART", "SMILE", "SOLID", "SOLVE", "SOUND", "SOUTH", "SPACE", "SPARE", "SPEAK", "SPEED", "SPEND", "SPLIT",
  "SPORT", "STAFF", "STAGE", "STAND", "START", "STATE", "STEAM", "STEEL", "STICK", "STILL", "STOCK", "STONE",
  "STORE", "STORY", "STYLE", "SUGAR", "TABLE", "TAKEN", "TEACH", "THANK", "THEME", "THERE", "THICK", "THING",
  "THINK", "THIRD", "THOSE", "THREE", "THROW", "TIGHT", "TIMER", "TODAY", "TOTAL", "TOUCH", "TOWER", "TRACK",
  "TRADE", "TRAIN", "TREAT", "TREND", "TRIAL", "TRUST", "TRUTH", "UNDER", "UNION", "UNITY", "UNTIL", "UPPER",
  "UPSET", "URBAN", "USAGE", "USUAL", "VALID", "VALUE", "VIDEO", "VISIT", "VITAL", "VOICE", "WASTE", "WATCH",
  "WATER", "WHEEL", "WHERE", "WHICH", "WHILE", "WHITE", "WHOLE", "WOMAN", "WORLD", "WORTH", "WOULD", "WRITE",
  "WRONG", "YOUNG"
];

const today = process.env.DAILY_FIVE_DATE ?? new Date().toISOString().slice(0, 10);

function utcDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function hashDate(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function fallbackPuzzle(date, generatedAt = new Date().toISOString()) {
  const hash = hashDate(date);
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!isoDate.test(date) || Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Cannot generate fallback puzzle for invalid date: ${date}`);
  }
  return {
    date,
    game: Math.round((utcDate(date) - GAME_ZERO_DATE) / DAY_MS),
    dayName: WEEKDAYS[parsedDate.getUTCDay()],
    answer: fallbackAnswers[hash % fallbackAnswers.length],
    wordLength: 5,
    difficulty: Number((3 + ((hash >>> 8) % 31) / 10).toFixed(1)),
    source: "daily-five-fallback",
    generatedAt
  };
}

function normaliseUpstream(raw, expectedDate) {
  const answer = String(raw.answer ?? "").toUpperCase();
  const date = String(raw.date ?? "").slice(0, 10);
  const game = Number(raw.game);
  const difficulty = Number(raw.difficulty);
  if (!isoDate.test(date) || !/^[A-Z]{5}$/.test(answer) || !Number.isFinite(game) || !Number.isFinite(difficulty)) {
    throw new Error("Upstream response was invalid");
  }
  if (date !== expectedDate) {
    throw new Error(`Upstream latest is ${date}; expected ${expectedDate}`);
  }
  return {
    date,
    game,
    dayName: String(raw.day_name ?? raw.dayName ?? fallbackPuzzle(expectedDate).dayName),
    answer,
    wordLength: 5,
    difficulty,
    source: "wordlehints.co.uk",
    generatedAt: String(raw.generatedAt ?? new Date().toISOString())
  };
}

async function puzzleForToday() {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
    return normaliseUpstream(await response.json(), today);
  } catch (error) {
    console.log(`Using deterministic fallback for ${today}: ${error instanceof Error ? error.message : String(error)}`);
    return fallbackPuzzle(today);
  }
}

async function preserveGeneratedAt(puzzle) {
  try {
    const existing = JSON.parse(await readFile(`cache/${puzzle.date}.json`, "utf8"));
    if (existing.game === puzzle.game && existing.answer === puzzle.answer && existing.source === puzzle.source) {
      return { ...puzzle, generatedAt: existing.generatedAt };
    }
  } catch {}
  return puzzle;
}

const puzzle = await preserveGeneratedAt(await puzzleForToday());

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
