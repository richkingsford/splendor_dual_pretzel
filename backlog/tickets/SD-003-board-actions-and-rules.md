# SD-003 - Implement board actions and legal resource-taking rules

- Priority: `P1`
- Status: `Done`
- Objective alignment: Translate the tabletop turn options into reliable digital interactions.

## Acceptance Criteria
- The central play area renders the resources and shared board information needed for a player to choose a turn action.
- The app enforces the legal resource-taking and board interaction rules chosen for this digital adaptation, including blocking invalid actions before state is committed.
- When an illegal move is attempted, the player receives clear feedback and the current match state remains unchanged.

## Notes
- Completed on 2026-03-10.
- Added legal draft validation before commit: draft action required, spent lanes blocked, maximum three picks, and no duplicate gem colors in a turn.
- Illegal moves now return immediate feedback in status text while preserving prior match state.
- Reserve, buy, and claim-scroll interactions are now gated by selected action mode.
- Buy flow validates affordability based on token + bonus math before mutating player state.
