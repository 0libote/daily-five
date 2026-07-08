import type { Puzzle } from "./types";

const DAY_MS = 86_400_000;
const GAME_ZERO_DATE = Date.UTC(2021, 5, 19);
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const FALLBACK_ANSWERS = [
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

const utcDate = (value: string): number => {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

export function hashDate(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function fallbackPuzzle(date: string, generatedAt = new Date().toISOString()): Puzzle {
  const hash = hashDate(date);
  const answer = FALLBACK_ANSWERS[hash % FALLBACK_ANSWERS.length];
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Cannot generate fallback puzzle for invalid date: ${date}`);
  }
  return {
    date,
    game: Math.round((utcDate(date) - GAME_ZERO_DATE) / DAY_MS),
    dayName: WEEKDAYS[parsedDate.getUTCDay()],
    answer,
    wordLength: 5,
    difficulty: Number((3 + ((hash >>> 8) % 31) / 10).toFixed(1)),
    source: "daily-five-fallback",
    generatedAt
  };
}
