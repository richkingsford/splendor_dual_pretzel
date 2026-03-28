const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const {
  normalizeScreenshots,
  expectedCount
} = require("./normalize-screenshot-output");

const root = path.resolve(__dirname, "..");
const screenshotRoot = path.join(root, "backlog", "product-manager", "screenshots");
const defaultBaseUrl = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:4317";
const viewport = { width: 390, height: 844 };
const waitBetweenStepsMs = 1200;
const serverReadyTimeoutMs = 15000;
const screenshotLabels = [
  "initial",
  "autoplay-started",
  "early-01",
  "early-02",
  "early-03",
  "midgame-01",
  "midgame-02",
  "midgame-03",
  "midgame-04",
  "late-01",
  "late-02",
  "late-03",
  "late-04",
  "autoplay-stopped",
  "final"
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeRunStamp() {
  const now = new Date();
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${y}${m}${d}-${hh}${mm}${ss}`;
}

function parseBaseUrl() {
  const arg = process.argv[2];
  if (!arg) {
    return defaultBaseUrl;
  }
  if (/^https?:\/\//i.test(arg)) {
    return arg;
  }
  return `http://${arg}`;
}

function ensureRunDirs(runDir) {
  const rawDir = path.join(runDir, "raw");
  fs.mkdirSync(rawDir, { recursive: true });
  return { rawDir };
}

function writeBlocker(runDir, title, details) {
  const blockerPath = path.join(runDir, "BLOCKER.md");
  const lines = [
    `# ${title}`,
    "",
    `- Timestamp: ${new Date().toISOString()}`,
    `- Base URL: ${parseBaseUrl()}`,
    "",
    "## Details",
    details
  ];
  fs.writeFileSync(blockerPath, `${lines.join("\n")}\n`, "utf8");
  return blockerPath;
}

function requestOnce(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode || 0);
    });
    req.on("error", reject);
    req.setTimeout(1200, () => req.destroy(new Error("timeout")));
  });
}

async function waitForServer(baseUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const statusCode = await requestOnce(baseUrl);
      if (statusCode >= 200 && statusCode < 500) {
        return;
      }
      lastError = new Error(`Unexpected status code ${statusCode}`);
    } catch (error) {
      lastError = error;
    }
    await wait(300);
  }

  throw new Error(`Server was not reachable at ${baseUrl} within ${timeoutMs}ms (${lastError ? lastError.message : "no response"}).`);
}

function spawnServerIfLocal(baseUrl) {
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch (error) {
    throw new Error(`Invalid base URL: ${baseUrl}`);
  }

  const isLocal = ["127.0.0.1", "localhost"].includes(parsed.hostname);
  if (!isLocal) {
    return { child: null, logs: [] };
  }

  const logs = [];
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => logs.push(String(chunk).trim()));
  child.stderr.on("data", (chunk) => logs.push(String(chunk).trim()));

  return { child, logs };
}

function stopServer(child) {
  if (!child || child.killed) {
    return;
  }
  child.kill();
}

function loadPlaywright() {
  try {
    return require("playwright");
  } catch (error) {
    throw new Error(
      "Playwright is not installed. Install it with `npm install --save-dev playwright` and run `npx playwright install chromium`."
    );
  }
}

async function captureSet(baseUrl, rawDir) {
  const playwright = loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 12000 });

    let step = 1;
    const captureStep = async (label) => {
      const name = `${String(step).padStart(2, "0")}-${label}.png`;
      await page.screenshot({ path: path.join(rawDir, name), fullPage: true });
      step += 1;
    };

    await captureStep(screenshotLabels[0]);
    await page.click("#start-spectator");
    await wait(500);
    await captureStep(screenshotLabels[1]);

    for (let i = 2; i < screenshotLabels.length - 2; i += 1) {
      await wait(waitBetweenStepsMs);
      await captureStep(screenshotLabels[i]);
    }

    await page.click("#stop-spectator");
    await wait(400);
    await captureStep(screenshotLabels[screenshotLabels.length - 2]);
    await captureStep(screenshotLabels[screenshotLabels.length - 1]);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function run() {
  const baseUrl = parseBaseUrl();
  const runStamp = makeRunStamp();
  const runDir = path.join(screenshotRoot, runStamp);
  const { rawDir } = ensureRunDirs(runDir);
  let child = null;
  let logs = [];
  let hadCaptureError = false;
  let captureErrorMessage = "";

  try {
    const serverRuntime = spawnServerIfLocal(baseUrl);
    child = serverRuntime.child;
    logs = serverRuntime.logs;
    await waitForServer(baseUrl, serverReadyTimeoutMs);
    await captureSet(baseUrl, rawDir);
  } catch (error) {
    hadCaptureError = true;
    captureErrorMessage = error.message || String(error);
    const logText = logs.length > 0 ? logs.join("\n") : "(no server logs captured)";
    writeBlocker(
      runDir,
      "Screenshot capture blocked",
      `${captureErrorMessage}\n\n## Server Logs\n${logText}`
    );
  } finally {
    stopServer(child);
  }

  const normalized = normalizeScreenshots(rawDir);
  const resultLines = [
    `Capture run: ${runDir}`,
    `Raw screenshots: ${fs.readdirSync(rawDir).length}`,
    `Normalized: ${normalized.copied}/${expectedCount} -> ${normalized.destination}`,
    `Failure marker: ${normalized.markerCreated ? "yes" : "no"}`
  ];

  if (hadCaptureError) {
    resultLines.push(`Capture blocker: ${captureErrorMessage}`);
    console.error(resultLines.join("\n"));
    process.exit(1);
  } else {
    console.log(resultLines.join("\n"));
  }
}

run().catch((error) => {
  console.error(`Unexpected screenshot capture failure: ${error.message || String(error)}`);
  process.exit(1);
});
