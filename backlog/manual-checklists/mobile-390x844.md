# Manual Mobile QA Checklist (390x844)

Use this quick pass after notable UI/gameplay changes, especially updates to layout, controls, status copy, spectator flow, or save/restore behavior.

## Setup
1. Start the app with `npm start` (or `node server.js`).
2. Open `http://127.0.0.1:4317`.
3. In browser devtools, emulate a mobile viewport at `390x844`.
4. Ensure network/CPU throttling are disabled for baseline validation.

## Checklist
1. Verify primary controls are easy to tap (no repeated mistaps needed).
Expected: action buttons feel comfortably tappable; no clipped labels.

2. Draft three gems and commit the action.
Expected: selected gems are clear before commit; commit succeeds and feedback is clear.

3. End turn and confirm active-player guidance updates.
Expected: status text clearly names whose turn it is and what to do next.

4. Reserve one market card.
Expected: card moves into reserved area and market updates without overlap or layout break.

5. Attempt one clearly invalid action (for example, buying without enough resources).
Expected: the app blocks the action and shows clear feedback without corrupting state.

6. Scroll the activity feed by touch.
Expected: scrolling is smooth and contained; surrounding layout does not jitter.

7. Start spectator mode and observe 3-5 automated actions.
Expected: pacing is readable, entries appear in activity log, and board state updates visibly.

8. Stop spectator mode.
Expected: autoplay stops immediately and manual controls remain usable.

9. Play part of a turn, then refresh the page.
Expected: match state restores correctly; spectator does not auto-resume unexpectedly.

10. Complete one full turn after restore.
Expected: gameplay remains stable and status guidance still matches current turn/action.

## Capture
- Record pass/fail with date and commit/revision context in the tester report.
- Note any touch-comfort/readability concerns even if functional checks pass.