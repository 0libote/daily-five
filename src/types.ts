export type LetterState = "absent" | "present" | "correct";
export type GameStatus = "playing" | "won" | "lost";
export type DailyNoteDisplay = "squares" | "words" | "both";
export type PuzzleSource = "wordlehints.co.uk" | "daily-five-fallback";

export interface Puzzle {
  date: string;
  game: number;
  dayName: string;
  answer: string;
  wordLength: 5;
  difficulty: number;
  source: PuzzleSource;
  generatedAt: string;
}

export interface Guess {
  word: string;
  score: LetterState[];
}

export interface GameState {
  date: string;
  guesses: Guess[];
  draft: string;
  status: GameStatus;
}

export interface HistoryEntry {
  date: string;
  game: number;
  won: boolean;
  guesses: number;
  difficulty: number;
  rows: string[];
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  distribution: Record<number, number>;
  failures: number;
  lastPlayedDate?: string;
  history: Record<string, HistoryEntry>;
}

export interface Settings {
  cacheBaseUrl: string;
  apiBaseUrl: string;
  dailyNotesEnabled: boolean;
  dailyNoteFolder: string;
  dailyNoteDateFormat: string;
  dailyNoteDisplay: DailyNoteDisplay;
  highContrast: boolean;
  dataFileEnabled: boolean;
  dataFilePath: string;
}

export interface PluginData {
  settings: Settings;
  stats: Stats;
  game?: GameState;
  puzzle?: Puzzle;
}
