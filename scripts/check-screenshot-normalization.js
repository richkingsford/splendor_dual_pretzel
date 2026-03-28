const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  normalizeScreenshots,
  expectedCount,
  failureMarkerName,
  selectionManifestName
} = require("./normalize-screenshot-output");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function writeFixtureImages(sourceDir) {
  const labels = [
    "01-initial",
    "02-autoplay-started",
    "03-early-01",
    "04-early-02",
    "05-early-03",
    "06-midgame-01",
    "07-midgame-02",
    "08-midgame-03",
    "09-midgame-04",
    "10-midgame-05",
    "11-late-01",
    "12-late-02",
    "13-late-03",
    "14-late-04",
    "15-autoplay-stopped",
    "16-final",
    "17-midgame-06",
    "18-late-05"
  ];

  for (const label of labels) {
    fs.writeFileSync(path.join(sourceDir, `${label}.png`), `${label}\n`, "utf8");
  }
}

function run() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "splendor-normalize-check-"));
  const sourceDir = path.join(tempRoot, "source");
  const outputDir = path.join(tempRoot, "latest");
  fs.mkdirSync(sourceDir, { recursive: true });

  try {
    writeFixtureImages(sourceDir);

    const result = normalizeScreenshots(sourceDir, {
      screenshotRoot: tempRoot,
      latestDir: outputDir
    });

    assert(result.copied === expectedCount, `Expected ${expectedCount} copied screenshots, found ${result.copied}.`);
    assert(result.markerCreated === false, "Did not expect failure marker for 15/15 normalization.");
    assert(result.destination === outputDir, "Expected destination to match isolated output directory.");

    const copied = fs
      .readdirSync(outputDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".png")
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
    assert(copied.length === expectedCount, `Expected ${expectedCount} image files in output, found ${copied.length}.`);
    assert(copied[0] === "01.png", "Expected normalized numbering to start at 01.png.");
    assert(copied[copied.length - 1] === "15.png", "Expected normalized numbering to end at 15.png.");

    const markerPath = path.join(outputDir, failureMarkerName);
    assert(!fs.existsSync(markerPath), "Failure marker should not exist for complete 15/15 output.");

    const manifestPath = path.join(outputDir, selectionManifestName);
    assert(fs.existsSync(manifestPath), "Selection manifest should be written.");
    const manifest = fs.readFileSync(manifestPath, "utf8");
    assert(manifest.includes("- Selected: 15/15"), "Manifest should report 15/15 selection.");
    assert(manifest.includes("autoplay-start"), "Manifest should include autoplay-start stage coverage.");
    assert(manifest.includes("midgame"), "Manifest should include midgame stage coverage.");
    assert(manifest.includes("autoplay-stop"), "Manifest should include autoplay-stop stage coverage.");

    console.log("Screenshot normalization fixture check passed (15/15, no marker, manifest present).");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

run();
