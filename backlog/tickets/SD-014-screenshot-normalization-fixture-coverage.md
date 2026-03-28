# SD-014 - Add deterministic fixture coverage for 15/15 screenshot normalization

- Priority: `P1`
- Status: `Done`
- Objective alignment: Close the remaining SD-012 validation gap by automatically asserting the full-capacity normalization path (15/15 selected with no failure marker).

## Acceptance Criteria
- A deterministic automated check covers screenshot normalization with at least 15 source images.
- The check asserts `15/15` copied output and confirms `FAILED TO GRAB ANY SCREENSHOTS.txt` is not created.
- The check verifies `SCREENSHOT_SELECTION.md` is generated and contains stage-coverage signals.
- The check runs in the standard developer/tester command flow (`npm run check`) without Playwright/browser dependencies.

## Notes
- Completed on 2026-03-27.
- Added script: `scripts/check-screenshot-normalization.js`
  - Builds an isolated temporary fixture source with 18 stage-labeled pseudo-images.
  - Executes normalization into an isolated output directory.
  - Asserts 15 normalized files (`01.png`..`15.png`), no failure marker, and manifest stage coverage.
- Updated `scripts/normalize-screenshot-output.js` to support optional output-path overrides so fixture checks do not mutate repository screenshot artifacts.
- Added npm command: `npm run check:screenshot-normalization`.
- Updated `npm run check` to include screenshot normalization fixture coverage.
- Updated docs: `README.md` automated checks section.

## Verification
- `npm.cmd run check:screenshot-normalization` (pass, 2026-03-27).
- `npm.cmd run check` (pass, 2026-03-27).
