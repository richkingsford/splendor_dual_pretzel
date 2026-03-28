# Collaboration Loop

The three automations should collaborate through the local backlog artifacts instead of acting independently.

## Product Manager
- Reads the human feedback file, backlog, latest triage summary, and the newest Developer and Tester outputs.
- Re-ranks the backlog when priorities change.
- Produces the human-facing status summary and screenshot set.

## Developer
- Reads the Product Manager summary and backlog before implementing work.
- Focuses on the highest-value open ticket that is realistically actionable.
- Writes down what changed, what remains risky, and what Tester should verify next.

## Tester
- Reads the Product Manager summary and the latest Developer report before validating.
- Runs the safest available checks first, especially `npm run check`, then any UI smoke pass that is possible.
- Reports regressions, gaps, or confidence back into the local activity logs and reports for the next Product Manager and Developer runs.

## Shared Rule
- Every automation should leave the repository easier for the next one to pick up by updating the relevant local backlog, report, and activity-log files.
