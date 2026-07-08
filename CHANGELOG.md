# Changelog

Release notes for Daily Five.

## 0.2.4 - 2026-07-08

### Added

- Added a stronger Wordle-style animation pass with 3D tile flips, staged reveal timing, tile shine, typing pops, invalid-guess shake, correct-letter bounce, and keyboard feedback.

### Changed

- Reworked release automation so release files can be prepared from a tag, release branch, or manual dispatch without committing generated release files back to `main`.
- Release automation now uploads or re-uploads `main.js`, `manifest.json`, and `styles.css` directly to the matching GitHub Release assets.

## 0.2.3 - 2026-07-08

### Added

- Added a readable Markdown data backup note for the current puzzle, lifetime stats, game history, and restore data.
- Added settings for enabling or disabling the Markdown backup and choosing the backup note path.
- Added a command and settings button to manually rewrite the readable data backup.

### Changed

- Daily Five can restore from the Markdown backup note when plugin storage is missing.
- Documented the Markdown data backup in the README.

### Fixed

- Hardened the backup parser so invalid or non-object restore payloads are ignored safely.
- Fixed empty-history backup table formatting.
- Added restore coverage for Markdown backup data.

## 0.2.2 - 2026-07-08

### Added

- Added a richer Daily Note result block with clearer puzzle status, guessed rows, result details, and failed-game answer handling.
- Added automatic resync behaviour for the managed Daily Five block when today's Daily Note is created or modified.

### Changed

- Refined game feedback and responsive styling for the board and on-screen keyboard.
- Expanded tests for the improved Daily Note block.

## 0.2.1 - 2026-07-08

### Added

- Added local fallback puzzle generation so a playable daily puzzle is still available when remote providers are missing, late, or invalid.
- Added the 2026-07-08 puzzle cache entry and cache index updates.

### Changed

- Improved cache update automation and provider fallback order.
- Persisted the resolved puzzle so the chosen daily answer stays stable after fallback.
- Updated release workflow handling for tag and release-branch driven releases.

### Fixed

- Fixed provider lag causing the daily puzzle to become unavailable.
- Fixed fallback puzzle handling so the same day does not unexpectedly change answer once resolved.

## 0.2.0 - 2026-07-06

### Added

- Added the 2026-07-03 puzzle cache entry.
- Added test coverage for cache and provider behaviour.

### Changed

- Improved cache update script handling for cached puzzle files, latest puzzle metadata, and cache index data.
- Improved provider response normalisation before accepting a puzzle response.

## 0.1.9 - 2026-07-05

### Added

- Added a Daily Note guess display setting with options for coloured squares, guessed words, or both.
- Added word display in Daily Note result rows when using the default "Words and squares" mode.
- Added answer reveal inside the Daily Note block after a failed game.

### Changed

- Daily Five now updates today's note automatically after each accepted guess when Daily Note integration is enabled.
- Updated the README Daily Notes section to explain the automatic updates and display options.

## 0.1.8 - 2026-07-05

### Fixed

- Removed the Daily Five editor extension because it could conflict with Obsidian's editor behaviour.
- Removed direct CodeMirror development dependencies that were only needed by the editor decoration experiment.
- Kept the main game, Daily Note result block, placeholder support, and guess validation behaviour intact.

## 0.1.7 - 2026-07-05

### Added

- Added dictionary validation for guesses using a five-letter word list.
- Added a clear notice when a submitted guess is not in the word list.
- Added a copy button for the `{{daily-five}}` Daily Note placement placeholder.
- Added edit-mode styling for Daily Five result blocks in Daily Notes.

### Changed

- Expanded the game layout so the board and keyboard scale better on larger screens.
- Added typing, reveal, and rejected-guess feedback to make the game feel more responsive.
- Let the plugin create or update today's Daily Note result block automatically when Daily Note integration is enabled.

## 0.1.6 - 2026-07-05

### Added

- Added support for the `{{daily-five}}` placeholder in Daily Note templates.
- Added settings guidance explaining how to control where the Daily Five block is inserted.
- Added README documentation for Daily Note block placement.

### Changed

- Daily Note updates now keep an existing Daily Five block in place once inserted.
- If no placeholder is found, the result block still falls back to being appended to the note.

## 0.1.5 - 2026-07-05

### Added

- Added support for writing not-started and in-progress Daily Five states to the Daily Note result block.
- Added automatic Daily Note updating after finishing a puzzle.
- Added support for creating Daily Notes through Obsidian's Daily Notes integration when available.

### Changed

- Refined the game board and touch keyboard styling.
- Added letter-state colouring to the on-screen keyboard.
- Improved the Daily Five header, puzzle metadata, spacing, and responsive styling.

## 0.1.4 - 2026-07-05

### Fixed

- Switched to a supported Obsidian ribbon/view icon.
- Reworked warning/destructive button styling to better match the declared Obsidian app version.
- Adjusted settings rendering to avoid APIs that may not exist in the supported Obsidian range.

## 0.1.3 - 2026-07-05

### Changed

- Release metadata update only.
- No user-facing plugin changes in this release.

## 0.1.2 - 2026-07-05

### Fixed

- Addressed Obsidian plugin review compatibility findings.
- Replaced browser `window.confirm` prompts with Obsidian modal confirmations.
- Improved opening/focusing the Daily Five view from the ribbon or command palette.
- Made keyboard event handling safer by binding to the view document.
- Removed an unused development dependency.

## 0.1.1 - 2026-07-05

### Changed

- Improved the release publishing workflow so version metadata can be updated from release tags.
- Cleaned up an unreleased version entry from release metadata.
- No user-facing plugin changes in this release.

## 0.1.0 - 2026-07-05

### Added

- Initial Daily Five plugin release.
- Added a five-letter daily word puzzle inside Obsidian.
- Added six-guess gameplay with board scoring for correct, present, and absent letters.
- Added an on-screen touch keyboard and hardware keyboard input.
- Added local vault storage for today's game progress, settings, and lifetime stats.
- Added lifetime stats, win percentage, streak tracking, guess distribution, and stats export to Markdown.
- Added optional Daily Note result insertion using a managed Daily Five block.
- Added puzzle loading from the repository cache with fallback to the WordleHints.co.uk API.
- Added settings for cache/API URLs, Daily Note integration, fallback Daily Note path settings, and high contrast mode.
- Added build, typecheck, test, cache, and release automation.
