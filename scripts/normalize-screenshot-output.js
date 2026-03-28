const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const defaultScreenshotRoot = path.join(root, "backlog", "product-manager", "screenshots");
const latestDir = path.join(defaultScreenshotRoot, "latest");
const expectedCount = 15;
const failureMarkerName = "FAILED TO GRAB ANY SCREENSHOTS.txt";
const selectionManifestName = "SCREENSHOT_SELECTION.md";
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const stageMatchers = [
  { key: "initial", regex: /(initial|opening|setup|pregame)/i },
  { key: "autoplay-start", regex: /(autoplay[-_ ]?started?|auto[-_ ]?started?)/i },
  { key: "early", regex: /(early)/i },
  { key: "midgame", regex: /(midgame|mid[-_ ]?game|mid)/i },
  { key: "late", regex: /(later|late|endgame|final)/i },
  { key: "autoplay-stop", regex: /(autoplay[-_ ]?stopped?|auto[-_ ]?stopped?|finished|complete)/i }
];

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function clearDirectory(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

function listImageFiles(directory) {
  if (!directory || !fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(directory, entry.name))
    .filter((fullPath) => imageExtensions.has(path.extname(fullPath).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

function classifyStage(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  for (const matcher of stageMatchers) {
    if (matcher.regex.test(baseName)) {
      return matcher.key;
    }
  }
  return "uncategorized";
}

function evenlySample(files, targetCount) {
  if (files.length <= targetCount) {
    return [...files];
  }

  const indices = [];
  const seen = new Set();
  const step = (files.length - 1) / (targetCount - 1);

  for (let i = 0; i < targetCount; i += 1) {
    const index = Math.round(i * step);
    if (!seen.has(index)) {
      indices.push(index);
      seen.add(index);
    }
  }

  if (indices.length < targetCount) {
    for (let i = 0; i < files.length && indices.length < targetCount; i += 1) {
      if (!seen.has(i)) {
        indices.push(i);
        seen.add(i);
      }
    }
  }

  return indices.sort((a, b) => a - b).map((index) => files[index]);
}

function selectStageAware(images) {
  if (images.length <= expectedCount) {
    return images.map((fullPath) => ({ fullPath, stage: classifyStage(fullPath) }));
  }

  const buckets = new Map();
  for (const imagePath of images) {
    const stage = classifyStage(imagePath);
    if (!buckets.has(stage)) {
      buckets.set(stage, []);
    }
    buckets.get(stage).push(imagePath);
  }

  const selected = [];
  const selectedSet = new Set();
  const preferredStages = stageMatchers.map((matcher) => matcher.key).filter((stage) => buckets.has(stage));

  for (const stage of preferredStages) {
    if (selected.length >= expectedCount) {
      break;
    }
    const first = buckets.get(stage)[0];
    if (first && !selectedSet.has(first)) {
      selected.push({ fullPath: first, stage });
      selectedSet.add(first);
    }
  }

  const leftovers = images.filter((imagePath) => !selectedSet.has(imagePath));
  const remainingSlots = expectedCount - selected.length;
  const sampledLeftovers = evenlySample(leftovers, remainingSlots);
  for (const imagePath of sampledLeftovers) {
    selected.push({ fullPath: imagePath, stage: classifyStage(imagePath) });
  }

  return selected.slice(0, expectedCount);
}

function writeSelectionManifest(selected, sourceDir, outputDir) {
  const stageCounts = new Map();
  for (const entry of selected) {
    stageCounts.set(entry.stage, (stageCounts.get(entry.stage) || 0) + 1);
  }

  const lines = [
    "# Latest Screenshot Selection",
    "",
    `- Source: \`${sourceDir || "(none provided)"}\``,
    `- Selected: ${selected.length}/${expectedCount}`,
    "- Stage distribution:"
  ];

  for (const [stage, count] of stageCounts.entries()) {
    lines.push(`  - ${stage}: ${count}`);
  }

  lines.push("", "## Files");
  for (const [index, entry] of selected.entries()) {
    lines.push(`${String(index + 1).padStart(2, "0")}. \`${path.basename(entry.fullPath)}\` (${entry.stage})`);
  }

  fs.writeFileSync(path.join(outputDir, selectionManifestName), `${lines.join("\n")}\n`, "utf8");
}

function writeFailureMarker(message, outputDir) {
  const markerPath = path.join(outputDir, failureMarkerName);
  fs.writeFileSync(markerPath, `${message}\n`, "utf8");
}

function normalizeScreenshots(sourceDir, options = {}) {
  const screenshotRoot = options.screenshotRoot || defaultScreenshotRoot;
  const outputDir = options.latestDir || path.join(screenshotRoot, "latest");

  ensureDir(screenshotRoot);
  ensureDir(outputDir);
  clearDirectory(outputDir);

  const images = listImageFiles(sourceDir);
  const selected = selectStageAware(images);

  for (const [index, entry] of selected.entries()) {
    const destination = path.join(
      outputDir,
      `${String(index + 1).padStart(2, "0")}${path.extname(entry.fullPath).toLowerCase()}`
    );
    fs.copyFileSync(entry.fullPath, destination);
  }
  writeSelectionManifest(selected, sourceDir, outputDir);

  if (selected.length < expectedCount) {
    const missing = expectedCount - selected.length;
    writeFailureMarker(
      selected.length === 0
        ? "FAILED TO GRAB ANY SCREENSHOTS: no source images were available."
        : `FAILED TO GRAB ANY SCREENSHOTS: expected ${expectedCount}, found ${selected.length} (missing ${missing}).`,
      outputDir
    );
  }

  return {
    copied: selected.length,
    expected: expectedCount,
    destination: outputDir,
    markerCreated: selected.length < expectedCount,
    manifestCreated: true
  };
}

function run() {
  const sourceArg = process.argv[2];
  const sourceDir = sourceArg ? path.resolve(root, sourceArg) : null;
  const result = normalizeScreenshots(sourceDir);
  console.log(
    `Normalized screenshot output to ${result.destination}. Copied ${result.copied}/${result.expected}. Marker: ${
      result.markerCreated ? "yes" : "no"
    }. Manifest: ${result.manifestCreated ? "yes" : "no"}.`
  );
}

if (require.main === module) {
  run();
}

module.exports = {
  normalizeScreenshots,
  expectedCount,
  latestDir,
  failureMarkerName,
  selectionManifestName
};
