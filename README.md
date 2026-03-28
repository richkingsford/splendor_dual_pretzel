# splendor_dual_pretzel

A mobile-friendly web-based digital version of the game Splendor Dual.

## Current Foundation

This repository now includes a lightweight mobile-friendly app scaffold with:
- a responsive shared board shell
- starter player panels and a market preview
- simple turn, draft, reserve, buy, and scroll interactions for early product iteration
- a main game flow focused on `Human vs Human` or `Human vs Computer` on one shared device
- a dedicated `spectator.html` subpage for `Computer vs Computer` autoplay controls
- automatic local save/restore of in-progress matches across page refreshes
- a no-dependency local server so the app can run immediately
- a basic local verification script so the Tester automation has a standard health check

## Run Locally

1. Double-click `run-splendor.cmd` for a one-click launch.
2. Or run `node server.js` or `npm start` from this folder.
3. Open `http://127.0.0.1:4317` in your browser for the start page.
4. Game board lives at `http://127.0.0.1:4317/play.html`.
5. Optional: open `http://127.0.0.1:4317/spectator.html` for computer-vs-computer autoplay.
6. Run `npm run check` for structural + gameplay smoke checks.

## Deploy To Netlify

1. Build deploy assets with `npm run build:site` (outputs `dist/`).
2. Deploy with `npm run deploy:netlify`.
3. If needed, login first with `npx netlify-cli login` or set `NETLIFY_AUTH_TOKEN`.

## Automated Checks

- `npm run check:foundation` validates required files and key scaffold snippets.
- `npm run check:gameplay` runs no-dependency gameplay smoke checks for reserve, draft/end-turn, endgame detection, and reset/rematch state.
- `npm run check:mobile-ui` runs deterministic mobile-focused smoke checks (isolated server lifecycle + mobile asset markers + full-turn interaction contract) without browser-profile dependencies.
- `npm run check:screenshot-normalization` runs a deterministic fixture-based assertion for the 15/15 screenshot normalization path (no failure marker + manifest coverage).
- `npm run screenshots:capture` attempts a local Playwright capture run (390x844, spectator progression) into `backlog/product-manager/screenshots/<timestamp>/raw` and then normalizes into `.../latest` with blocker reporting when capture cannot run.
- `npm run screenshots:normalize -- <source-folder>` normalizes screenshot artifacts into `backlog/product-manager/screenshots/latest` with stage-aware deterministic selection, a 15-image target, a `SCREENSHOT_SELECTION.md` manifest, and a failure marker file when the set is missing or incomplete.
- `npm run check` runs all checks in sequence.

## Remaining Manual Coverage

- Browser-level mobile interaction should be spot-checked periodically in-browser at `390x844` using [`backlog/manual-checklists/mobile-390x844.md`](backlog/manual-checklists/mobile-390x844.md).
- Spectator pacing/readability and UI copy quality are still best validated visually.
- Local persistence should be spot-checked manually by playing part of a turn, refreshing, and confirming state recovery.

## Purpose of This Prototype

The current goal is to satisfy the first backlog milestone so Product Manager, Developer, and Tester automations can work against a real interface instead of an empty repository.

