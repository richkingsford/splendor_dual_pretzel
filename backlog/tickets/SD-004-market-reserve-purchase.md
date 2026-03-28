# SD-004 - Build the card market, reserve flow, and purchase logic

- Priority: `P2`
- Status: `Done`
- Objective alignment: Make it possible to progress from collecting resources into buying cards and building an engine.

## Acceptance Criteria
- The app displays a usable card market with enough information for players to inspect costs, colors, bonuses, and point values.
- A player can reserve or purchase a card through the UI, and the resulting state updates immediately in both the shared market and the active player's tableau.
- Purchased cards affect future affordability or bonuses in the same turn flow the rest of the game state uses.

## Notes
- Implemented/confirmed in `app.js`:
  - Market cards render with title, bonus label, point value, and explicit cost pills.
  - Reserve action moves cards from shared market into the active player's reserved area.
  - Buy action supports both market cards and reserved cards (`BUY_RESERVED_CARD`), updating points, bonuses, and tokens immediately.
  - Affordability is computed from token + bonus discounts and reflected in enabled/disabled buy controls.
- UI depth added in `index.html`/`styles.css`:
  - Player cards now show reserved-card rows with a direct `Buy Reserved` control for active-player purchases.
- Verification:
  - `node scripts/check-foundation.js` (pass, 2026-03-19).
