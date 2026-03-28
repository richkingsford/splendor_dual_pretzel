const assert = require("assert");
const http = require("http");

const game = require("../app.js");

function expect(condition, message) {
  assert.ok(condition, message);
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve({ status: response.statusCode, body });
      });
    });
    request.on("error", reject);
  });
}

function startServer(port) {
  return new Promise((resolve, reject) => {
    const originalCreateServer = http.createServer;
    let capturedServer = null;

    http.createServer = (...args) => {
      capturedServer = originalCreateServer(...args);
      return capturedServer;
    };

    process.env.PORT = String(port);
    try {
      require("../server.js");
    } catch (error) {
      http.createServer = originalCreateServer;
      reject(error);
      return;
    } finally {
      delete process.env.PORT;
      http.createServer = originalCreateServer;
    }

    if (!capturedServer) {
      reject(new Error("Could not capture server instance from server.js."));
      return;
    }

    if (capturedServer.listening) {
      resolve(capturedServer);
      return;
    }

    capturedServer.once("listening", () => resolve(capturedServer));
    capturedServer.once("error", (error) => reject(error));
  });
}

async function verifyRuntimeAssets() {
  const port = 43170;
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = await startServer(port);

  try {
    const root = await fetchText(`${baseUrl}/`);
    expect(root.status === 200, "GET / should return 200.");
    expect(root.body.includes('name="viewport" content="width=device-width, initial-scale=1.0"'), "root should include mobile viewport meta.");
    expect(root.body.includes('href="play.html?new=1"'), "root should include a start-new-game CTA.");
    expect(root.body.includes('href="play.html"'), "root should include continue CTA.");
    expect(root.body.includes('href="spectator.html"'), "root should link to spectator subpage.");

    const play = await fetchText(`${baseUrl}/play.html`);
    expect(play.status === 200, "GET /play.html should return 200.");
    expect(play.body.includes('id="claim-scroll"'), "play page should include tap-based claim scroll control.");
    expect(play.body.includes('id="match-mode"'), "play page should include match mode selector.");

    const spectator = await fetchText(`${baseUrl}/spectator.html`);
    expect(spectator.status === 200, "GET /spectator.html should return 200.");
    expect(spectator.body.includes('id="start-spectator"'), "spectator page should include autoplay controls.");

    const styles = await fetchText(`${baseUrl}/styles.css`);
    expect(styles.status === 200, "GET /styles.css should return 200.");
    expect(styles.body.includes("@media (max-width: 720px)"), "styles should include mobile media query.");
    expect(styles.body.includes("min-height: 44px"), "styles should enforce baseline touch target size.");
    expect(styles.body.includes("min-height: 48px"), "styles should increase control touch targets on mobile.");
    expect(styles.body.includes("-webkit-overflow-scrolling: touch"), "styles should include momentum touch scrolling.");
    expect(styles.body.includes("env(safe-area-inset-bottom"), "styles should include safe-area bottom padding.");

    const app = await fetchText(`${baseUrl}/app.js`);
    expect(app.status === 200, "GET /app.js should return 200.");
    expect(app.body.includes("SAVE_STORAGE_KEY"), "app should include local save-restore key.");
    expect(app.body.includes("turnGuidance"), "app should include clear action guidance status copy.");
  } finally {
    await new Promise((resolve) => server.close(() => resolve()));
  }
}

function verifyTurnSequenceContracts() {
  game.resetMatch();
  game.setAction("draft");
  game.dispatch({ type: "TAKE_GEM", payload: { index: 0 } });
  game.dispatch({ type: "TAKE_GEM", payload: { index: 1 } });
  game.dispatch({ type: "TAKE_GEM", payload: { index: 2 } });
  game.endTurn();
  const snapshot = game.getStateSnapshot();
  expect(snapshot.match.activePlayer === 1, "end turn should rotate active player.");
  expect(snapshot.match.draftSelection.length === 0, "end turn should clear draft picks.");
  expect(snapshot.ui.action === "draft", "end turn should reset action to draft.");
}

async function run() {
  verifyTurnSequenceContracts();
  await verifyRuntimeAssets();
  console.log("Mobile UI smoke checks passed.");
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
