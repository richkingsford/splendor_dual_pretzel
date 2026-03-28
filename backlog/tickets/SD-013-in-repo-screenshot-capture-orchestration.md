# SD-013 - Add in-repo screenshot capture orchestration

- Priority: `P1`
- Status: `Done`
- Objective alignment: Reduce delivery risk around PM screenshot evidence by adding a project-owned capture flow instead of relying only on external runner behavior.

## Acceptance Criteria
- A new repo command can attempt screenshot capture against the running app and save raw artifacts in a timestamped run folder.
- Capture attempts run at mobile viewport (`390x844`) and include spectator progression stages suitable for PM review.
- The capture flow integrates with existing normalization so `backlog/product-manager/screenshots/latest/` is updated automatically.
- If capture fails, a deterministic blocker artifact is written with actionable details while normalization still emits the existing latest-folder failure signaling.

## Notes
- Completed on 2026-03-20.
- Added script: `scripts/capture-screenshots.js`
  - Starts local `server.js` when using localhost base URL and waits for readiness.
  - Drives Playwright capture flow for 15 stage-labeled screenshots (`initial`, `autoplay-started`, `early`, `midgame`, `late`, `autoplay-stopped`, `final`) at `390x844`.
  - Writes run artifacts to `backlog/product-manager/screenshots/<timestamp>/raw`.
  - On capture failure, writes `BLOCKER.md` in the run folder and still normalizes any available artifacts.
- Updated `scripts/normalize-screenshot-output.js` to export its normalization API for reuse by capture orchestration.
- Added npm script: `npm run screenshots:capture`.
- Updated docs:
  - `README.md`
  - `backlog/product-manager/screenshots/README.md`

## Verification
- `npm.cmd run check` (pass, 2026-03-20).
- `npm.cmd run screenshots:normalize -- backlog/product-manager/screenshots/20260319-190133` (pass, 2026-03-20).
- `node scripts/capture-screenshots.js` may require Playwright/browser installation and environment-local browser networking; failures produce `BLOCKER.md` plus normalized latest failure marker semantics by design.
