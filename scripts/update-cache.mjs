import { mkdir, readFile, writeFile } from "node:fs/promises";

const endpoint = "https://wordlehints.co.uk/wp-json/wordlehint/v1/answers/latest";
const response = await fetch(endpoint);
if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
const raw = await response.json();
const answer = String(raw.answer ?? "").toUpperCase();
const date = String(raw.date ?? "").slice(0, 10);
const game = Number(raw.game);
const difficulty = Number(raw.difficulty);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^[A-Z]{5}$/.test(answer) || !Number.isFinite(game) || !Number.isFinite(difficulty)) {
  throw new Error("Upstream response was invalid");
}

let generatedAt = new Date().toISOString();
try {
  const existing = JSON.parse(await readFile(`cache/${date}.json`, "utf8"));
  if (existing.game === game && existing.answer === answer) generatedAt = existing.generatedAt;
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
index.dates = [...new Set([...(Array.isArray(index.dates) ? index.dates : []), date])].sort().reverse();
const json = `${JSON.stringify(puzzle, null, 2)}\n`;
await Promise.all([
  writeFile(`cache/${date}.json`, json),
  writeFile("cache/latest.json", json),
  writeFile("cache/index.json", `${JSON.stringify(index, null, 2)}\n`)
]);
