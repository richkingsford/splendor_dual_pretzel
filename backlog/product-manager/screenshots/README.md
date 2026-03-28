# Product Manager Screenshots

Store only the latest regression screenshot set in `backlog/product-manager/screenshots/latest/`.

Contract:
- Keep exactly 15 screenshots from the most recent run whenever capture succeeds.
- If capture returns no screenshots (or fewer than 15), include `FAILED TO GRAB ANY SCREENSHOTS.txt` in `latest/`.
- Prefer source screenshot names that indicate game progression (examples: `initial`, `autoplay-started`, `midgame`, `late`, `autoplay-stopped`) so normalization can preserve stage variety.
- `SCREENSHOT_SELECTION.md` in `latest/` records the selected files and stage distribution for review.
- Use `npm run screenshots:normalize -- <source-folder>` to normalize captures into this contract with deterministic stage-aware sampling.
- Use `npm run screenshots:capture` to run an in-repo capture attempt (Playwright + local server orchestration), write raw artifacts to a timestamped folder, and always normalize output to `latest/`.
- If capture itself is blocked (for example, Playwright/browser install or local navigation issues), the run writes `BLOCKER.md` in that timestamped folder and normalization still emits explicit latest-folder failure markers.
