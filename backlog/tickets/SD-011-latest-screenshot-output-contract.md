# SD-011 - Normalize latest screenshot output contract

- Priority: `P1`
- Status: `Done`
- Objective alignment: Align screenshot artifacts with stakeholder expectations for a single latest folder and explicit failure signaling.

## Acceptance Criteria
- Screenshot artifacts can be normalized into a single `backlog/product-manager/screenshots/latest/` folder.
- The normalization flow targets a 15-screenshot set for the most recent run.
- If screenshot output is missing or incomplete, `FAILED TO GRAB ANY SCREENSHOTS.txt` is generated in `latest/`.

## Notes
- Completed on 2026-03-20.
- Added script: `scripts/normalize-screenshot-output.js`
  - Copies up to 15 images from a source folder into `backlog/product-manager/screenshots/latest/`.
  - Emits `FAILED TO GRAB ANY SCREENSHOTS.txt` when 15 images are not available.
- Added npm command: `npm run screenshots:normalize -- <source-folder>`.
- Updated screenshot guidance docs:
  - `backlog/product-manager/screenshots/README.md`
  - `README.md` automated checks section (new screenshot normalization command).
- Validation:
  - `node scripts/normalize-screenshot-output.js` (runs and creates deterministic output structure).

