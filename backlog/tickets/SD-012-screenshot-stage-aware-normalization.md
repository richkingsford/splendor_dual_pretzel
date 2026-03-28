# SD-012 - Make screenshot normalization stage-aware with a selection manifest

- Priority: `P1`
- Status: `Done`
- Objective alignment: Ensure latest screenshot output better represents multiple gameplay phases so PM can quickly review computer-vs-computer progression.

## Acceptance Criteria
- Normalization still targets `backlog/product-manager/screenshots/latest/` with up to 15 screenshots.
- Selection favors stage variety (initial/start/mid/late/autoplay-stop) when filename hints exist, rather than only taking the first 15 sorted images.
- Normalization writes a deterministic `SCREENSHOT_SELECTION.md` manifest describing selected files and stage distribution.
- Existing failure-marker behavior remains intact when fewer than 15 screenshots are available.

## Notes
- Completed on 2026-03-20.
- Updated `scripts/normalize-screenshot-output.js`:
  - Added stage classification heuristics from screenshot filenames.
  - Added deterministic sampling so large screenshot sets represent the timeline instead of front-loading earliest images.
  - Added `SCREENSHOT_SELECTION.md` output in `backlog/product-manager/screenshots/latest/`.
- Updated docs:
  - `backlog/product-manager/screenshots/README.md`
  - `README.md`
- Verification:
  - `npm.cmd run check` (pass, 2026-03-20).
  - `npm.cmd run screenshots:normalize -- backlog/product-manager/screenshots/20260319-190133` (pass; manifest + expected failure marker with 5/15 screenshots).
