const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 4317);
const root = __dirname;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer((request, response) => {
  const urlPath = request.url === "/" ? "/index.html" : request.url.split("?")[0];
  const safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^([.][.][/\\])+/, "");
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, fileBuffer) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    response.end(fileBuffer);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Splendor Dual scaffold ready at http://127.0.0.1:${port}`);
});
