# Daily Five

A five-letter word puzzle inside Obsidian. There is one puzzle each day, six guesses, a touch keyboard, lifetime stats, and an optional result block for your Daily Note.

## Install

Until the plugin is available in Obsidian's community directory:

1. Download `main.js`, `manifest.json`, and `styles.css` from a release.
2. Put them in `<vault>/.obsidian/plugins/daily-five/`.
3. Reload Obsidian and enable **Daily Five** under Community plugins.

Open the game from its ribbon icon or run **Daily Five: Open today's puzzle**. The command palette also contains commands for Daily Notes, stats export, and resets.

## Daily Notes

Daily Five updates today's note automatically after each accepted guess. It uses the core Daily Notes folder and date format when available; otherwise, configure the two fallback fields in settings. You can show coloured squares, guessed words, or both. Failed games include the answer.

Put `{{daily-five}}` in your Daily Note template where the game block should appear. If the placeholder is absent, the block is appended to the note.

Only content between `<!-- daily-five:start -->` and `<!-- daily-five:end -->` is replaced. If today's note is missing, Daily Five asks before creating it.

## Data backup note

Daily Five also writes a readable markdown backup note to `Daily Five Data.md` by default. The note contains current puzzle status, lifetime stats, history, and a hidden restore block with the plugin data as JSON.

If Obsidian plugin storage is lost, Daily Five can restore from this markdown note on load. You can change the backup note path in settings or run **Daily Five: Write readable data backup note** from the command palette.

## Puzzle cache

The plugin requests `cache/YYYY-MM-DD.json` from this repository first. If today's file is missing or unavailable, it requests `cache/latest.json`, then the configured upstream API.

The cache updater only writes authoritative answers. It tries the NYT dated Wordle endpoint first, then WordleHints.co.uk. If neither source has today's valid puzzle, the workflow leaves the cache unchanged and tries again on the next scheduled run.

There is no deterministic answer fallback. If every remote source is missing, stale, or invalid, Daily Five shows a "not ready yet" message instead of inventing a puzzle.

## Privacy

Game progress, settings, and stats stay in your vault's local plugin data and markdown backup note. Daily Five makes puzzle requests to GitHub raw content and, when needed, the configured upstream puzzle API. It has no analytics and does not send vault content.

## Release notes

See [CHANGELOG.md](CHANGELOG.md) for version-by-version release notes.

## Build

Requires Bun 1.3.14 or newer.

```sh
bun ci
bun run typecheck
bun run test
bun run build
```

The build writes `main.js` in the repository root. Copy it with `manifest.json` and `styles.css` to test a manual installation.

## Attribution

Puzzle data is provided by the NYT Wordle endpoint and [WordleHints.co.uk](https://wordlehints.co.uk/). Daily Five is independent software and is not affiliated with any newspaper or game publisher.
