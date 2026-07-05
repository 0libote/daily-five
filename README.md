# Daily Five

A five-letter word puzzle inside Obsidian. There is one puzzle each day, six guesses, a touch keyboard, lifetime stats, and an optional result block for your Daily Note.

## Install

Until the plugin is available in Obsidian's community directory:

1. Download `main.js`, `manifest.json`, and `styles.css` from a release.
2. Put them in `<vault>/.obsidian/plugins/daily-five/`.
3. Reload Obsidian and enable **Daily Five** under Community plugins.

Open the game from its ribbon icon or run **Daily Five: Open today's puzzle**. The command palette also contains commands for Daily Notes, stats export, and resets.

## Daily Notes

Finish the puzzle, then choose **Daily Five: Insert or update today's result in daily note**. Daily Five uses the core Daily Notes folder and date format when available. Otherwise, configure the two fallback fields in settings.

Only content between `<!-- daily-five:start -->` and `<!-- daily-five:end -->` is replaced. If today's note is missing, Daily Five asks before creating it.

## Puzzle cache

The plugin requests `cache/YYYY-MM-DD.json` from this repository first. If today's file is missing or unavailable, it requests the [WordleHints.co.uk API](https://wordlehints.co.uk/). A daily GitHub Action updates `cache/index.json`, `cache/latest.json`, and the dated file. There is no source-mode switch: cache first, API fallback is always used.

## Privacy

Game progress, settings, and stats stay in your vault's local plugin data. Daily Five makes puzzle requests to GitHub raw content and, when needed, WordleHints.co.uk. It has no analytics and does not send vault content.

## Build

Requires Node.js 22 or later.

```sh
npm ci
npm run typecheck
npm test
npm run build
```

The build writes `main.js` in the repository root. Copy it with `manifest.json` and `styles.css` to test a manual installation.

## Attribution

Puzzle data is provided by [WordleHints.co.uk](https://wordlehints.co.uk/). Daily Five is independent software and is not affiliated with any newspaper or game publisher.
