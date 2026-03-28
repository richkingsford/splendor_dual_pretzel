# SD-005 - Deliver endgame checks, winner presentation, and rematch flow

- Priority: `P2`
- Status: `Done`
- Objective alignment: Turn the prototype into a full match that can be won, reviewed, and replayed.

## Acceptance Criteria
- After each turn, the app evaluates the chosen victory conditions and can detect when the match has ended.
- When a game ends, the UI clearly presents the winner and the reason the game concluded.
- Players can start a clean rematch or new game from the end-of-game state without stale data carrying over.

## Notes
- Implemented in `app.js`:
  - Added endgame evaluation after `END_TURN` with explicit prototype victory conditions:
    - first player at or above `6` points, tie-broken by scrolls then bonuses;
    - or market exhaustion when no reserved cards remain.
  - Added `match.gameOver` state, winner/reason capture, and action gating that prevents additional gameplay actions after completion.
  - Added spectator-stop safeguard when a match ends.
- Implemented in `index.html`/`styles.css`:
  - Added rematch control (`Rematch`) next to New Match.
  - Added result status pills/copy (`In Progress` vs `Match Complete`) with winner/reason messaging in the hero status area.
  - Added disabled-button treatment to communicate locked controls after completion.
- Reset/rematch behavior:
  - `Rematch` and `New Match` both reset the match cleanly, including clearing winner state and restarting turn/board/player progress.
- Verification:
  - `node scripts/gameplay-smoke.js` (pass, 2026-03-19).
  - `node scripts/check-foundation.js` (pass, 2026-03-19).
