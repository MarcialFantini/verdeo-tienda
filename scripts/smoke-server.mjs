// Tiny static server for smoke-testing dist/ output.
// Serves only files that exist, no SPA fallback.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.env.SMOKE_ROOT ?? path.resolve(process.cwd(), "dist"));
const PORT = Number(process.env.PORT ?? 4399);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function resolvePath(reqPath) {
  let p = decodeURIComponent(reqPath.split("?")[0]);
  if (p === "/") p = "/index.html";
  const candidate = path.join(ROOT, p);
  // Avoid path traversal
  if (!candidate.startsWith(ROOT)) return null;
  return candidate;
}

const server = http.createServer((req, res) => {
  const file = resolvePath(req.url ?? "/");
  if (!file) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      // try index.html for directory-less paths
      const asDir = path.join(file, "index.html");
      fs.stat(asDir, (e2, s2) => {
        if (e2 || !s2.isFile()) {
          res.writeHead(404);
          res.end("not found: " + req.url);
          return;
        }
        const ext = path.extname(asDir);
        res.writeHead(200, { "content-type": types[ext] ?? "application/octet-stream" });
        fs.createReadStream(asDir).pipe(res);
      });
      return;
    }
    const ext = path.extname(file);
    res.writeHead(200, { "content-type": types[ext] ?? "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`static server on http://127.0.0.1:${PORT} root=${ROOT}`);
});
