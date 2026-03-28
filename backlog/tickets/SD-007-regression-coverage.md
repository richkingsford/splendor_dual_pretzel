# SD-007 - Add regression coverage and gameplay smoke checks

- Priority: `P3`
- Status: `Done`
- Objective alignment: Keep the playable experience stable as the project grows.

## Acceptance Criteria
- Automated checks cover core game-state transitions such as starting a match, completing representative turn actions, and detecting an endgame condition.
- At least one smoke path exercises the player-facing flow needed to begin a match and complete a basic interaction without manual patching.
- The repository documents how to run the available checks locally and notes any remaining manual verification gaps.

## Notes
- Implemented lightweight gameplay regression smoke checks in `scripts/gameplay-smoke.js`:
  - verifies new match baseline state,
  - exercises reserve transition and state updates,
  - exercises draft + end-turn turn-passing behavior,
  - forces and verifies endgame detection at turn end,
  - verifies reset/rematch clears endgame state.
- Updated `package.json` scripts:
  - added `check:foundation`,
  - added `check:gameplay`,
  - set `check` to run both checks in sequence.
- Updated `README.md` with explicit automated-check commands and remaining manual verification gaps.
- Verification:
  - `node scripts/gameplay-smoke.js` (pass, 2026-03-19).
  - `npm.cmd run check` (pass, 2026-03-19).
