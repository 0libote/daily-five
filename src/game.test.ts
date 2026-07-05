import assert from "node:assert/strict";
import test from "node:test";
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
