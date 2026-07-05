import { Notice, Plugin } from "obsidian";

export default class DailyFivePlugin extends Plugin {
  async onload(): Promise<void> {
    this.addRibbonIcon("dice-5", "Open Daily Five", () => {
      new Notice("Daily Five is not yet playable.");
    });
  }
}

