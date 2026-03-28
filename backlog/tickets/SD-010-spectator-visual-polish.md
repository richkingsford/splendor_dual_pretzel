# SD-010 - Improve spectator readability and player play-space visuals

- Priority: `P1`
- Status: `Done`
- Objective alignment: Make spectator runs easier to review by improving in-game visual clarity for tokens, cards, and activity context.

## Acceptance Criteria
- Player token inventory is represented as circular gem visuals instead of plain numeric text pills.
- Each player panel clearly shows a more visual play space for both token stacks and purchased-card progression.
- The activity log area is positioned at the bottom of the page layout so gameplay controls and board content remain primary.

## Notes
- Completed on 2026-03-20.
- Implemented in `app.js`:
  - Reworked player panel rendering to include visual token stacks (gem markers + counts).
  - Added purchased-card mini-card stack rendering in each player's play space.
- Implemented in `index.html`/`styles.css`:
  - Moved activity feed out of action panel into a dedicated bottom dock panel.
  - Updated gem/token visuals to circular gem-like presentation and added play-space styling blocks.
- Verification:
  - `npm.cmd run check` (pass, 2026-03-20).

