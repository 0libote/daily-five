import { daysBetween } from "./date";
import { emojiRow } from "./game";
import type { GameState, Puzzle, Stats } from "./types";

export const emptyStats = (): Stats => ({
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  failures: 0,
  history: {}
});

export function recordResult(stats: Stats, game: GameState, puzzle: Puzzle): Stats {
  if (game.status === "playing" || stats.history[game.date]) return stats;
  const won = game.status === "won";
  const consecutive = stats.lastPlayedDate && daysBetween(stats.lastPlayedDate, game.date) === 1;
  const currentStreak = won ? (consecutive ? stats.currentStreak + 1 : 1) : 0;
  return {
    ...stats,
    gamesPlayed: stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + Number(won),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    distribution: { ...stats.distribution, ...(won && { [game.guesses.length]: stats.distribution[game.guesses.length] + 1 }) },
    failures: stats.failures + Number(!won),
    lastPlayedDate: game.date,
    history: {
      ...stats.history,
      [game.date]: {
        date: game.date,
        game: puzzle.game,
        won,
        guesses: game.guesses.length,
        difficulty: puzzle.difficulty,
        rows: game.guesses.map((guess) => emojiRow(guess.score))
      }
    }
  };
}

export const winPercentage = (stats: Stats) =>
  stats.gamesPlayed ? Math.round(stats.gamesWon / stats.gamesPlayed * 100) : 0;
