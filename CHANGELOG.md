# Changelog

Release notes for Daily Five.

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
