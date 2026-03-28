const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist");
const filesToCopy = ["index.html", "play.html", "spectator.html", "app.js", "styles.css"];

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyFiles() {
  filesToCopy.forEach((file) => {
    const src = path.join(root, file);
    const dest = path.join(outDir, file);
    fs.copyFileSync(src, dest);
  });
}

function writeNoJekyll() {
  fs.writeFileSync(path.join(outDir, ".nojekyll"), "", "utf8");
}

function run() {
  cleanDir(outDir);
  copyFiles();
  writeNoJekyll();
  console.log(`Static site build complete: ${outDir}`);
}

run();
