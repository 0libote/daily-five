import { mkdir, readFile, writeFile } from "node:fs/promises";

const endpoint = "https://wordlehints.co.uk/wp-json/wordlehint/v1/answers/latest";
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const response = await fetch(endpoint);
if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
const raw = await response.json();
const answer = String(raw.answer ?? "").toUpperCase();
const date = String(raw.date ?? "").slice(0, 10);
const game = Number(raw.game);
const difficulty = Number(raw.difficulty);
if (!isoDate.test(date) || !/^[A-Z]{5}$/.test(answer) || !Number.isFinite(game) || !Number.isFinite(difficulty)) {
  throw new Error("Upstream response was invalid");
}

let generatedAt = new Date().toISOString();
try {
  const existing = JSON.parse(await readFile(`cache/${date}.json`, "utf8"));
  if (existing.game === game && existing.answer === answer) generatedAt = existing.generatedAt;
} catch {}

let existingLatestDate = "";
try {
  const existingLatest = JSON.parse(await readFile("cache/latest.json", "utf8"));
  existingLatestDate = String(existingLatest.date ?? "").slice(0, 10);
} catch {}

const puzzle = {
  date,
  game,
  dayName: String(raw.day_name ?? ""),
  answer,
  wordLength: 5,
  difficulty,
  source: "wordlehints.co.uk",
  generatedAt
};

await mkdir("cache", { recursive: true });
let index = { dates: [] };
try { index = JSON.parse(await readFile("cache/index.json", "utf8")); } catch {}
const dates = new Set(Array.isArray(index.dates) ? index.dates : []);
dates.add(date);
if (isoDate.test(existingLatestDate)) dates.add(existingLatestDate);
index.dates = [...dates].filter((value) => isoDate.test(value)).sort((a, b) => b.localeCompare(a));
const json = `${JSON.stringify(puzzle, null, 2)}\n`;
const writes = [
  writeFile(`cache/${date}.json`, json),
  writeFile("cache/index.json", `${JSON.stringify(index, null, 2)}\n`)
];
if (!isoDate.test(existingLatestDate) || date >= existingLatestDate) {
  writes.push(writeFile("cache/latest.json", json));
} else {
  console.log(`Upstream latest ${date} is older than cached latest ${existingLatestDate}; leaving cache/latest.json unchanged.`);
}
await Promise.all(writes);
