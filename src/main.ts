import {
  App, ItemView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile,
  WorkspaceLeaf, moment, normalizePath, requestUrl
} from "obsidian";
import { createDailyNote } from "obsidian-daily-notes-interface";
import { daysBetween, localDate } from "./date";
import { PLACEHOLDER, replaceResultBlock, resultBlock } from "./daily-note";
import { keyboardStates, newGame, submitGuess } from "./game";
import { getPuzzle } from "./provider";
import { emptyStats, recordResult, winPercentage } from "./stats";
import type { GameState, PluginData, Puzzle, Settings, Stats } from "./types";
import { isValidGuess } from "./words";

const VIEW_TYPE = "daily-five-view";
const DEFAULT_SETTINGS: Settings = {
  cacheBaseUrl: "https://raw.githubusercontent.com/0libote/daily-five/main/cache",
  apiBaseUrl: "https://wordlehints.co.uk/wp-json/wordlehint/v1",
  dailyNotesEnabled: true,
  dailyNoteFolder: "",
  dailyNoteDateFormat: "YYYY-MM-DD",
  dailyNoteDisplay: "both",
  highContrast: false
};

export default class DailyFivePlugin extends Plugin {
  data: PluginData = { settings: DEFAULT_SETTINGS, stats: emptyStats() };
  puzzle?: Puzzle;

  async onload() {
    const saved = await this.loadData() as Partial<PluginData> | null;
    this.data = {
      settings: { ...DEFAULT_SETTINGS, ...saved?.settings },
      stats: { ...emptyStats(), ...saved?.stats },
      game: saved?.game
    };
    this.registerView(VIEW_TYPE, (leaf) => new DailyFiveView(leaf, this));
    this.addRibbonIcon("dice", "Open today's Daily Five", () => void this.openGame());
    this.addCommand({ id: "open-todays-puzzle", name: "Open today's puzzle", callback: () => void this.openGame() });
    this.addCommand({ id: "insert-daily-note-result", name: "Insert or update today's result in daily note", callback: () => void this.updateDailyNote() });
    this.addCommand({ id: "show-lifetime-stats", name: "Show lifetime stats", callback: () => new StatsModal(this.app, this.data.stats).open() });
    this.addCommand({ id: "export-stats-markdown", name: "Export stats as markdown", callback: () => void this.exportStats() });
    this.addCommand({ id: "reset-todays-puzzle", name: "Reset today's puzzle", callback: () => void this.resetToday() });
    this.addSettingTab(new DailyFiveSettings(this.app, this));
  }

  async ensurePuzzle() {
    const today = localDate();
    if (this.puzzle?.date === today) return this.puzzle;
    this.puzzle = await getPuzzle(today, this.data.settings.cacheBaseUrl, this.data.settings.apiBaseUrl, async (url) => {
      const response = await requestUrl({ url });
      return response.json as unknown;
    });
    if (this.data.game?.date !== today) this.data.game = newGame(today);
    await this.save();
    return this.puzzle;
  }

  async openGame() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    if (this.data.settings.dailyNotesEnabled) await this.updateDailyNote(false, true);
  }

  async save() {
    await this.saveData(this.data);
  }

  async finish(game: GameState) {
    if (!this.puzzle) return;
    this.data.game = game;
    this.data.stats = recordResult(this.data.stats, game, this.puzzle);
    await this.save();
    if (this.data.settings.dailyNotesEnabled) await this.updateDailyNote(false);
  }

  async resetToday() {
    const today = localDate();
    if (this.data.stats.history[today] && !await confirm(this.app, "Reset today's puzzle?", "This removes today's result from lifetime stats.")) return;
    const history = { ...this.data.stats.history };
    delete history[today];
    this.data.game = newGame(today);
    this.data.stats = rebuildStats(history);
    await this.save();
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => void (leaf.view as DailyFiveView).render());
    new Notice("Today's puzzle was reset.");
  }

  async updateDailyNote(offerCreate = true, autoCreate = false) {
    if (!this.data.settings.dailyNotesEnabled) return void new Notice("Daily Note integration is disabled.");
    let puzzle: Puzzle;
    try {
      puzzle = await this.ensurePuzzle();
    } catch (error) {
      if (offerCreate) new Notice(error instanceof Error ? error.message : "Today's puzzle is unavailable.");
      return;
    }
    const game = this.data.game ?? newGame(puzzle.date);
    const target = this.dailyNotePath();
    let file = this.app.vault.getAbstractFileByPath(target);
    if (!file && (autoCreate || offerCreate && await confirm(this.app, "Create Daily Note?", `Create ${target}?`))) {
      if (this.dailyNoteSettings()) {
        const today = (moment as unknown as () => Parameters<typeof createDailyNote>[0])();
        file = await createDailyNote(today) ?? null;
      } else {
        const folder = target.slice(0, target.lastIndexOf("/"));
        if (folder && !this.app.vault.getAbstractFileByPath(folder)) await this.app.vault.createFolder(folder);
        file = await this.app.vault.create(target, "");
      }
    }
    if (!(file instanceof TFile)) {
      if (offerCreate) new Notice("Daily Note was not found.");
      return;
    }
    await this.app.vault.process(file, (content) => replaceResultBlock(
      content,
      resultBlock(game, puzzle, this.data.stats, this.data.settings.dailyNoteDisplay)
    ));
    if (offerCreate) new Notice("Daily Five result updated.");
  }

  dailyNotePath() {
    const daily = this.dailyNoteSettings();
    const folder = daily?.folder ?? this.data.settings.dailyNoteFolder;
    const format = daily?.format ?? this.data.settings.dailyNoteDateFormat;
    const formatDate = moment as unknown as () => { format(pattern: string): string };
    return normalizePath(`${folder ? `${folder}/` : ""}${formatDate().format(format)}.md`);
  }

  dailyNoteSettings() {
    const app = this.app as App & {
      internalPlugins?: {
        getPluginById(id: string): {
          enabled: boolean;
          instance?: { options?: { folder?: string; format?: string; template?: string } };
        } | undefined;
      };
    };
    const daily = app.internalPlugins?.getPluginById("daily-notes");
    return daily?.enabled ? daily.instance?.options : undefined;
  }

  async exportStats() {
    const path = "Daily Five Stats.md";
    const content = statsMarkdown(this.data.stats);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) await this.app.vault.modify(existing, content);
    else await this.app.vault.create(path, content);
    new Notice(`Exported ${path}.`);
  }
}

class DailyFiveView extends ItemView {
  private animateDraftIndex?: number;
  constructor(leaf: WorkspaceLeaf, private plugin: DailyFivePlugin) { super(leaf); }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Daily Five"; }
  getIcon() { return "dice"; }
  async onOpen() {
    this.registerDomEvent(this.containerEl.ownerDocument, "keydown", (event) => {
      if (this.containerEl.isShown()) this.handleKey(event.key);
    });
    await this.render();
  }

  async render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("daily-five");
    root.toggleClass("daily-five--contrast", this.plugin.data.settings.highContrast);
    const header = root.createEl("header", { cls: "daily-five__header" });
    const topbar = header.createDiv({ cls: "daily-five__topbar" });
    topbar.createDiv({ cls: "daily-five__eyebrow", text: "Today’s word" });
    const statsButton = topbar.createEl("button", { cls: "daily-five__stats-button", text: "Stats" });
    statsButton.onclick = () => new StatsModal(this.app, this.plugin.data.stats).open();
    header.createEl("h1", { text: "Daily Five" });
    try {
      const puzzle = await this.plugin.ensurePuzzle();
      const game = this.plugin.data.game ?? newGame(puzzle.date);
      header.createDiv({ cls: "daily-five__meta", text: `No. ${puzzle.game} · ${puzzle.dayName} · ${puzzle.difficulty}/6 difficulty` });
      this.drawBoard(root, game);
      const message = root.createDiv({ cls: "daily-five__message", attr: { role: "status", "aria-live": "polite" } });
      if (game.status === "playing") message.setText(game.guesses.length ? `${6 - game.guesses.length} guesses left` : "Enter a five-letter word");
      else message.setText(game.status === "won" ? `Solved in ${game.guesses.length}/6 — ${puzzle.answer}` : `The word was ${puzzle.answer}`);
      if (game.status === "playing") this.drawKeyboard(root);
    } catch (error) {
      const empty = root.createDiv({ cls: "daily-five__empty" });
      empty.createEl("h2", { text: "Not ready yet" });
      empty.createEl("p", { text: error instanceof Error ? error.message : "Today's game isn't ready yet. Check back a little later." });
      empty.createEl("button", { text: "Check again", cls: "mod-cta" }).onclick = () => void this.render();
    }
  }

  drawBoard(root: HTMLElement, game: GameState) {
    const board = root.createDiv({ cls: "daily-five__board", attr: { "aria-label": "Guess board" } });
    for (let row = 0; row < 6; row++) {
      const guess = game.guesses[row];
      const draft = row === game.guesses.length ? game.draft : "";
      for (let column = 0; column < 5; column++) {
        const tile = board.createDiv({ cls: "daily-five__tile", text: guess?.word[column] ?? draft[column] ?? "" });
        if (row === game.guesses.length && game.status === "playing") tile.addClass("is-current");
        const state = guess?.score[column];
        if (state) {
          tile.addClass(`is-${state}`);
          if (row === game.guesses.length - 1) tile.addClass("is-revealing");
        }
        else if (draft[column]) {
          tile.addClass("is-filled");
          if (column === this.animateDraftIndex) tile.addClass("is-typing");
        }
      }
    }
    this.animateDraftIndex = undefined;
  }

  drawKeyboard(root: HTMLElement) {
    const keyStates = keyboardStates(this.plugin.data.game?.guesses ?? []);
    const keyboard = root.createDiv({ cls: "daily-five__keyboard", attr: { "aria-label": "On-screen keyboard" } });
    [["Q","W","E","R","T","Y","U","I","O","P"], ["A","S","D","F","G","H","J","K","L"], ["Enter","Z","X","C","V","B","N","M","Backspace"]].forEach((row) => {
      const line = keyboard.createDiv({ cls: "daily-five__keyboard-row" });
      row.forEach((key) => {
        const isAction = key === "Enter" || key === "Backspace";
        const button = line.createEl("button", {
          text: key === "Backspace" ? "⌫" : key,
          cls: `daily-five__key${isAction ? " daily-five__key--wide" : ""}`,
          attr: { "aria-label": key }
        });
        const state = keyStates.get(key);
        if (state) button.addClass(`is-${state}`);
        button.onclick = () => this.handleKey(key);
      });
    });
  }

  handleKey(key: string) {
    const game = this.plugin.data.game;
    const answer = this.plugin.puzzle?.answer;
    if (!game || !answer || game.status !== "playing") return;
    if (key === "Backspace") {
      game.draft = game.draft.slice(0, -1);
      this.animateDraftIndex = undefined;
    }
    else if (key === "Enter") {
      if (game.draft.length !== 5) return void new Notice("Enter five letters.");
      if (!isValidGuess(game.draft, answer)) {
        this.contentEl.addClass("is-rejected");
        this.containerEl.ownerDocument.defaultView?.setTimeout(() => this.contentEl.removeClass("is-rejected"), 360);
        return void new Notice("Not in the word list.");
      }
      const next = submitGuess(game, answer, game.draft);
      void this.plugin.finish(next).then(() => this.render());
      return;
    } else if (/^[a-z]$/i.test(key) && game.draft.length < 5) {
      game.draft += key.toUpperCase();
      this.animateDraftIndex = game.draft.length - 1;
    }
    void this.plugin.save().then(() => this.render());
  }
}

class StatsModal extends Modal {
  constructor(app: App, private stats: Stats) { super(app); }
  onOpen() {
    this.contentEl.createEl("h2", { text: "Lifetime stats" });
    const grid = this.contentEl.createDiv({ cls: "daily-five__stats" });
    [["Played", this.stats.gamesPlayed], ["Win %", winPercentage(this.stats)], ["Current streak", this.stats.currentStreak],
      ["Best streak", this.stats.bestStreak], ["Failures", this.stats.failures]].forEach(([label, value]) => {
      const item = grid.createDiv();
      item.createEl("strong", { text: `${value}` });
      item.appendText(`${label}`);
    });
    this.contentEl.createEl("h3", { text: "Guess distribution" });
    for (let guess = 1; guess <= 6; guess++) this.contentEl.createEl("p", { text: `${guess}: ${this.stats.distribution[guess]}` });
  }
}

class DailyFiveSettings extends PluginSettingTab {
  constructor(app: App, private plugin: DailyFivePlugin) { super(app, plugin); }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    this.text("Cache base URL", "Static cache checked before the upstream API.", "cacheBaseUrl");
    this.text("Upstream API base URL", "Used only when today's cache file is unavailable.", "apiBaseUrl");
    new Setting(containerEl).setName("Daily Notes").setHeading();
    new Setting(containerEl).setName("Daily Note integration")
      .setDesc("Keep today's game block updated in your Daily Note.")
      .addToggle((control) => control
      .setValue(this.plugin.data.settings.dailyNotesEnabled)
      .onChange((value) => this.set("dailyNotesEnabled", value)));
    new Setting(containerEl).setName("Block placement")
      .setDesc("Add {{daily-five}} to your Daily Note template where the game block should appear. The placeholder is used on first insertion; later updates stay in that position. Without it, the block is appended to the note.")
      .addButton((button) => button.setButtonText("Copy placeholder").onClick(async () => {
        try {
          const clipboard = this.containerEl.ownerDocument.defaultView?.navigator.clipboard;
          if (!clipboard) throw new Error("Clipboard unavailable");
          await clipboard.writeText(PLACEHOLDER);
          new Notice("Daily Five placeholder copied.");
        } catch {
          new Notice("Could not copy the placeholder.");
        }
      }));
    new Setting(containerEl).setName("Guess display")
      .setDesc("Choose how guesses appear in the Daily Note block.")
      .addDropdown((control) => control
        .addOption("squares", "Coloured squares")
        .addOption("words", "Guessed words")
        .addOption("both", "Words and squares")
        .setValue(this.plugin.data.settings.dailyNoteDisplay)
        .onChange(async (value) => {
          if (value !== "squares" && value !== "words" && value !== "both") return;
          await this.set("dailyNoteDisplay", value);
          await this.plugin.updateDailyNote(false);
        }));
    this.text("Fallback Daily Note folder", "Used when the Daily Notes core plugin is unavailable.", "dailyNoteFolder");
    this.text("Fallback date format", "Moment format used for the note filename.", "dailyNoteDateFormat");
    new Setting(containerEl).setName("High contrast mode").addToggle((control) => control
      .setValue(this.plugin.data.settings.highContrast)
      .onChange((value) => this.set("highContrast", value)));
    new Setting(containerEl).setName("Reset today's puzzle").setDesc("Removes today's board and result.")
      .addButton((button) => button.setButtonText("Reset").onClick(() => void this.plugin.resetToday()));
    new Setting(containerEl).setName("Reset all stats").setDesc("Permanently removes all game history.")
      .addButton((button) => {
        button.buttonEl.addClass("mod-warning");
        button.setButtonText("Reset all").onClick(async () => {
          if (!await confirm(this.app, "Reset all stats?", "This permanently removes all Daily Five history.")) return;
          this.plugin.data.stats = emptyStats();
          this.plugin.data.game = newGame(localDate());
          await this.plugin.save();
          new Notice("All Daily Five stats were reset.");
        });
      });
  }
  text(name: string, description: string, key: "cacheBaseUrl" | "apiBaseUrl" | "dailyNoteFolder" | "dailyNoteDateFormat") {
    new Setting(this.containerEl).setName(name).setDesc(description).addText((control) => control
      .setValue(this.plugin.data.settings[key]).onChange((value) => this.set(key, value.trim())));
  }
  async set<K extends keyof Settings>(key: K, value: Settings[K]) {
    this.plugin.data.settings[key] = value;
    await this.plugin.save();
  }
}

function rebuildStats(history: Stats["history"]): Stats {
  return Object.values(history).sort((a, b) => a.date.localeCompare(b.date)).reduce((stats, entry) => {
    const consecutive = stats.lastPlayedDate && entry.date > stats.lastPlayedDate && daysBetween(stats.lastPlayedDate, entry.date) === 1;
    const currentStreak = entry.won ? (consecutive ? stats.currentStreak + 1 : 1) : 0;
    return {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      gamesWon: stats.gamesWon + Number(entry.won),
      failures: stats.failures + Number(!entry.won),
      currentStreak,
      bestStreak: Math.max(stats.bestStreak, currentStreak),
      lastPlayedDate: entry.date,
      distribution: { ...stats.distribution, ...(entry.won && { [entry.guesses]: stats.distribution[entry.guesses] + 1 }) },
      history: { ...stats.history, [entry.date]: entry }
    };
  }, emptyStats());
}

function confirm(app: App, title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = new Modal(app);
    modal.titleEl.setText(title);
    modal.contentEl.createEl("p", { text: message });
    new Setting(modal.contentEl)
      .addButton((button) => button.setButtonText("Cancel").onClick(() => {
        modal.close();
        resolve(false);
      }))
      .addButton((button) => {
        button.buttonEl.addClass("mod-warning");
        button.setCta().setButtonText("Confirm").onClick(() => {
          modal.close();
          resolve(true);
        });
      });
    modal.onClose = () => resolve(false);
    modal.open();
  });
}

function statsMarkdown(stats: Stats) {
  const lines = Object.values(stats.history).sort((a, b) => b.date.localeCompare(a.date))
    .map((entry) => `| ${entry.date} | ${entry.won ? `${entry.guesses}/6` : "X/6"} | ${entry.difficulty}/6 |`);
  return `# Daily Five stats

- Games played: ${stats.gamesPlayed}
- Games won: ${stats.gamesWon}
- Win percentage: ${winPercentage(stats)}%
- Current streak: ${stats.currentStreak}
- Best streak: ${stats.bestStreak}
- Failures: ${stats.failures}

| Date | Result | Difficulty |
| --- | ---: | ---: |
${lines.join("\n")}
`;
}
