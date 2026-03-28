const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "index.html",
  "play.html",
  "spectator.html",
  "styles.css",
  "app.js",
  "server.js",
  "README.md",
  path.join("backlog", "board.md"),
  path.join("backlog", "triage", "latest.md")
];

const expectations = [
  {
    file: "index.html",
    checks: [
      "<title>Splendor Dual Pretzel - Start</title>",
      'href="play.html?new=1"',
      'href="play.html"',
      'href="spectator.html"'
    ]
  },
  {
    file: "play.html",
    checks: [
      "<title>Splendor Dual Pretzel</title>",
      'id="gem-grid"',
      'id="market-cards"',
      'id="player-1-slot"',
      'id="activity-feed"',
      'id="match-mode"',
      'href="spectator.html"',
      'data-page="main"'
    ]
  },
  {
    file: "spectator.html",
    checks: [
      "<title>Splendor Dual Pretzel - Computer vs Computer</title>",
      'id="start-spectator"',
      'data-page="spectator"'
    ]
  },
  {
    file: "app.js",
    checks: [
      "function render()",
      "function endTurn()",
      "function handleGemClick(index)",
      "Match ready.",
      "SAVE_STORAGE_KEY",
      "Restored saved match."
    ]
  },
  {
    file: "styles.css",
    checks: [
      ".dashboard",
      ".gem-grid",
      "@media (max-width: 720px)",
      "min-height: 44px",
      "-webkit-overflow-scrolling: touch"
    ]
  },
  {
    file: "README.md",
    checks: [
      "http://127.0.0.1:4317",
      "npm run check"
    ]
  }
];

let failures = 0;

for (const relativeFile of requiredFiles) {
  const fullPath = path.join(root, relativeFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`[missing] ${relativeFile}`);
    failures += 1;
  } else {
    console.log(`[ok] ${relativeFile}`);
  }
}

for (const expectation of expectations) {
  const fullPath = path.join(root, expectation.file);
  if (!fs.existsSync(fullPath)) {
    continue;
  }

  const content = fs.readFileSync(fullPath, "utf8");
  for (const snippet of expectation.checks) {
    if (!content.includes(snippet)) {
      console.error(`[missing-snippet] ${expectation.file} -> ${snippet}`);
      failures += 1;
    } else {
      console.log(`[ok-snippet] ${expectation.file} -> ${snippet}`);
    }
  }
}

if (failures > 0) {
  console.error(`Foundation check failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("Foundation check passed.");
