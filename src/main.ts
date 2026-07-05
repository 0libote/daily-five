import {
  ItemView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import { resolveAnswer, type AnswerSettings } from "./answer";
import { scoreGuess, type GameState } from "./game";

const VIEW_TYPE = "daily-five-view";

interface StoredGame extends GameState {
  answer: string;
}

interface DailyFiveData {
  settings: AnswerSettings & {
    dailyNotes: boolean;
    dailyNotesFolder: string;
  };
  games: Record<string, StoredGame>;
}

const DEFAULT_DATA: DailyFiveData = {
  settings: {
    cacheUrl:
      "https://raw.githubusercontent.com/0libote/daily-five/main/answers.json",
    enableApi: false,
    apiUrl: "",
    dailyNotes: false,
    dailyNotesFolder: "",
  },
  games: {},
};

function today(): string {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default class DailyFivePlugin extends Plugin {
  data: DailyFiveData = structuredClone(DEFAULT_DATA);

  async onload(): Promise<void> {
    const saved = (await this.loadData()) as Partial<DailyFiveData> | null;
    this.data = {
      settings: { ...DEFAULT_DATA.settings, ...saved?.settings },
      games: saved?.games ?? {},
    };

    this.registerView(VIEW_TYPE, (leaf) => new DailyFiveView(leaf, this));
    this.addRibbonIcon("dice-5", "Open Daily Five", () => void this.openView());
    this.addCommand({
      id: "open-daily-five",
      name: "Open game",
      callback: () => void this.openView(),
    });
    this.addSettingTab(new DailyFiveSettings(this.app, this));
  }

  async openView(): Promise<void> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }

  async getGame(): Promise<StoredGame> {
    const date = today();
    const existing = this.data.games[date];
    if (existing) return existing;
    const answer = await resolveAnswer(date, this.data.settings);
    const game: StoredGame = {
      date,
      answer,
      guesses: [],
      completed: false,
      won: false,
    };
    this.data.games[date] = game;
    await this.saveData(this.data);
    return game;
  }

  async finish(game: StoredGame): Promise<void> {
    await this.saveData(this.data);
    if (!this.data.settings.dailyNotes) return;
    const path = [
      this.data.settings.dailyNotesFolder.replace(/^\/|\/$/g, ""),
      `${game.date}.md`,
    ]
      .filter(Boolean)
      .join("/");
    const note = this.app.vault.getAbstractFileByPath(path);
    if (!(note instanceof TFile)) return;
    const result = game.won ? `${game.guesses.length}/6` : "X/6";
    await this.app.vault.append(note, `\nDaily Five: ${result}\n`);
  }
}

class DailyFiveView extends ItemView {
  constructor(
    leaf: WorkspaceLeaf,
    private plugin: DailyFivePlugin,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Daily Five";
  }

  getIcon(): string {
    return "dice-5";
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  private async render(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("daily-five");
    root.createEl("h2", { text: "Daily Five" });

    let game: StoredGame;
    try {
      game = await this.plugin.getGame();
    } catch (error) {
      root.createEl("p", {
        text: error instanceof Error ? error.message : "Unable to load today’s game.",
      });
      return;
    }

    const board = root.createDiv({ cls: "daily-five-board" });
    game.guesses.forEach((guess) => {
      const row = board.createDiv({ cls: "daily-five-row" });
      scoreGuess(guess, game.answer).forEach((result, index) => {
        row.createSpan({
          cls: `daily-five-tile daily-five-${result}`,
          text: guess[index],
          attr: { "aria-label": `${guess[index]}: ${result}` },
        });
      });
    });

    if (game.completed) {
      root.createEl("p", {
        text: game.won
          ? `Solved in ${game.guesses.length}/6.`
          : `Today’s answer was ${game.answer}.`,
      });
      this.renderStats(root);
      return;
    }

    const form = root.createEl("form", { cls: "daily-five-form" });
    const input = form.createEl("input", {
      type: "text",
      attr: {
        "aria-label": "Five-letter guess",
        maxlength: "5",
        minlength: "5",
        pattern: "[A-Za-z]{5}",
        autocomplete: "off",
        autocapitalize: "characters",
        required: "true",
      },
    });
    form.createEl("button", { text: "Guess", type: "submit" });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const guess = input.value.toUpperCase();
      if (!/^[A-Z]{5}$/.test(guess)) {
        new Notice("Enter exactly five letters.");
        return;
      }
      game.guesses.push(guess);
      game.won = guess === game.answer;
      game.completed = game.won || game.guesses.length === 6;
      void this.plugin.finish(game).then(() => this.render());
    });
    input.focus();
  }

  private renderStats(root: HTMLElement): void {
    const games = Object.values(this.plugin.data.games).filter(
      (game) => game.completed,
    );
    const wins = games.filter((game) => game.won).length;
    root.createEl("p", {
      text: `Played ${games.length} · Won ${wins} · ${
        games.length ? Math.round((wins / games.length) * 100) : 0
      }%`,
    });
  }
}

class DailyFiveSettings extends PluginSettingTab {
  constructor(
    app: DailyFivePlugin["app"],
    private plugin: DailyFivePlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    this.containerEl.createEl("h2", { text: "Daily Five" });

    new Setting(this.containerEl)
      .setName("Answer cache URL")
      .setDesc("Public JSON cache URL. Use {date} for a date placeholder.")
      .addText((text) =>
        text
          .setValue(this.plugin.data.settings.cacheUrl)
          .onChange((value) => this.saveSetting("cacheUrl", value.trim())),
      );
    new Setting(this.containerEl)
      .setName("Use WordleHints API")
      .setDesc("Fall back to the configured API only when the cache has no answer.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.data.settings.enableApi)
          .onChange((value) => this.saveSetting("enableApi", value)),
      );
    new Setting(this.containerEl)
      .setName("WordleHints API URL")
      .setDesc("Endpoint returning a dated five-letter answer as JSON.")
      .addText((text) =>
        text
          .setValue(this.plugin.data.settings.apiUrl)
          .onChange((value) => this.saveSetting("apiUrl", value.trim())),
      );
    new Setting(this.containerEl)
      .setName("Daily Note integration")
      .setDesc("Append the result when the matching daily note already exists.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.data.settings.dailyNotes)
          .onChange((value) => this.saveSetting("dailyNotes", value)),
      );
    new Setting(this.containerEl)
      .setName("Daily Notes folder")
      .setDesc("Vault-relative folder containing YYYY-MM-DD.md notes.")
      .addText((text) =>
        text
          .setValue(this.plugin.data.settings.dailyNotesFolder)
          .onChange((value) =>
            this.saveSetting("dailyNotesFolder", value.trim()),
          ),
      );
  }

  private saveSetting<K extends keyof DailyFiveData["settings"]>(
    key: K,
    value: DailyFiveData["settings"][K],
  ): void {
    this.plugin.data.settings[key] = value;
    void this.plugin.saveData(this.plugin.data);
  }
}
