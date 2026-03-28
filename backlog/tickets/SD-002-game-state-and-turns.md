# SD-002 - Model match state and turn sequencing for two players

- Priority: `P1`
- Status: `Done`
- Objective alignment: Build the game engine spine required for a playable digital match.

## Acceptance Criteria
- The codebase can create a fresh two-player match state with all game data needed to begin play.
- Turn ownership, player resources, cards, and other shared game state update through a deterministic state transition flow rather than ad hoc UI-only mutations.
- A completed turn cleanly advances play to the next player, and a new game can be started without reloading the page.

## Notes
- Completed on 2026-03-10.
- Replaced ad hoc UI-only mutations with a deterministic transition flow in `app.js` using a central `dispatch` + `applyTransition` pattern.
- Added explicit match initialization (`createInitialMatch`) with full two-player state, board, market, draft selection, scroll owner, and activity log.
- Turn advancement is now modeled through an `END_TURN` transition that rotates active player and increments turn count on round wrap.
- New match reset is handled through `RESET_MATCH` without page reload and restores clean state.
