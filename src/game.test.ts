import assert from "node:assert/strict";
import test from "node:test";
import { readAnswer } from "./cache";
import { scoreGuess } from "./game";

test("scores exact, present, and absent letters", () => {
  assert.deepEqual(scoreGuess("crane", "cider"), [
    "correct",
    "present",
    "absent",
    "absent",
    "present",
  ]);
});

test("does not score duplicate letters more than once", () => {
  assert.deepEqual(scoreGuess("eerie", "serve"), [
    "absent",
    "correct",
    "correct",
    "absent",
    "correct",
  ]);
});

test("rejects invalid words", () => {
  assert.throws(() => scoreGuess("four", "cider"), /five letters/);
});

test("reads supported answer-cache formats", () => {
  const date = "2026-07-05";
  assert.equal(readAnswer({ [date]: "crane" }, date), "CRANE");
  assert.equal(readAnswer({ date, answer: "slate" }, date), "SLATE");
  assert.equal(readAnswer({ answers: { [date]: "adieu" } }, date), "ADIEU");
  assert.equal(readAnswer({ [date]: "nope" }, date), null);
});
