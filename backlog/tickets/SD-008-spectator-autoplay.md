# SD-008 - Add spectator autoplay for two computer players

- Priority: `P1`
- Status: `Done`
- Objective alignment: Give users a compelling way to watch the digital version in motion and understand the game flow without taking manual turns.

## Acceptance Criteria
- The user can start a spectator mode that launches a match between two computer-controlled players.
- The game waits about 1 second between visible actions so the user can follow what just happened.
- A visible activity log records each action with the acting player, the action taken, and the result.
- The board state updates after each automated action without requiring a page reload.
- The user can stop or restart the spectator sequence from the interface.

## Notes
- This feature depends on enough real game-state logic existing for the computer players to choose only legal actions.
- The spectator log should be readable on mobile as well as desktop.
- Implemented in `app.js`:
  - Added spectator controls with `Start`, `Stop`, and `Restart` flows.
  - Added deterministic autoplay loop using ~1s cadence (`SPECTATOR_DELAY_MS = 1000`) and legal-action selection.
  - Spectator actions route through existing state transitions with UI-gate bypass metadata to preserve legality checks.
  - Activity feed now records spectator actions with `[AUTO] <player>` labels, action, and result context.
- Implemented in `index.html`/`styles.css`:
  - Added spectator status card and controls to the action panel.
  - Added mobile-friendly layout support for spectator controls and log readability.
- Verification:
  - `node scripts/check-foundation.js` (pass, 2026-03-19).
