# SD-006 - Add save-resume behavior and mobile usability polish

- Priority: `P3`
- Status: `Done`
- Objective alignment: Make the digital game practical to use on a phone and resilient to interruptions.

## Acceptance Criteria
- An in-progress local match can be restored after a refresh or accidental tab close using local persistence.
- Touch targets, spacing, and scrolling behavior remain usable on mobile-sized screens during a full turn sequence.
- The interface shows clear status text so players always know whose turn it is and what action is expected next.

## Notes
- Implemented in `app.js`:
  - Added local persistence (`SAVE_STORAGE_KEY`) that stores match and UI state after successful transitions and spectator state changes.
  - Added safe restore-on-load flow that hydrates saved state when valid and shows explicit recovery feedback in status copy.
  - Added state normalization to avoid invalid persisted UI action/feedback values and to prevent unintended spectator auto-run on restore.
  - Upgraded default status messaging so non-error state clearly states active player plus expected action.
- Implemented in `styles.css`:
  - Added mobile touch ergonomics guardrails (`min-height: 44px` baseline; `48px` controls at <=720px).
  - Added touch-scrolling behavior for activity feed (`-webkit-overflow-scrolling: touch`, `overscroll-behavior: contain`).
  - Added mobile safe-area bottom padding support for improved handheld comfort.
- Regression updates:
  - Extended `scripts/gameplay-smoke.js` to verify UI-state normalization invariants used by restore path.
  - Extended `scripts/check-foundation.js` to assert persistence/mobile-usability implementation markers.
- Verification:
  - `npm.cmd run check` (pass, 2026-03-19).
  - Added deterministic mobile smoke coverage in `scripts/mobile-ui-smoke.js` and wired it into `npm.cmd run check`:
    - Isolated in-process server lifecycle (`server.js`) with HTTP checks for `/`, `/styles.css`, `/app.js`.
    - Validates mobile viewport + touch-control markers (`claim-scroll`, spectator controls, mobile media query, 44/48px targets, momentum scroll, safe-area padding).
    - Validates full-turn interaction contract via exported game transitions (draft x3 + end-turn).
  - `npm.cmd run check` (pass, 2026-03-19 18:50 -07:00), including `check:mobile-ui`.

## Closure Notes
- This ticket is closed based on shipped persistence/mobile UX implementation plus deterministic mobile smoke automation.
- Manual visual passes at `390x844` remain recommended for periodic UX quality checks, but are no longer a release blocker for this ticket.
