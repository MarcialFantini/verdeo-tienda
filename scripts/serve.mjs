// Minimal static server for dist/ (used by the poster and smoke scripts). No dependencies.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('../dist/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json',
  '.txt': 'text/plain', '.xml': 'application/xml',
};

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^[/\\]+/, '');
  const candidates = [join(ROOT, clean), join(ROOT, clean, 'index.html'), join(ROOT, `${clean}.html`)];
  for (const file of candidates) {
    try {
      const s = await stat(file);
      if (s.isFile()) return file;
    } catch {
      /* next */
    }
  }
  return null;
}

export function startServer(port = 4611) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const file = await resolveFile(url.pathname);
    if (!file) {
      const notFound = await resolveFile('/404.html');
      res.writeHead(404, { 'content-type': TYPES['.html'] });
      res.end(notFound ? await readFile(notFound) : 'Not found');
      return;
    }
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    const cache = file.includes('_astro') ? 'public, max-age=31536000, immutable' : 'no-cache';
    let body = await readFile(file);
    const headers = { 'content-type': type, 'cache-control': cache };
    // Compress text like the production host does.
    const accept = String(req.headers['accept-encoding'] ?? '');
    if (/text|javascript|json|svg|xml/.test(type)) {
      if (accept.includes('br')) {
        body = brotliCompressSync(body);
        headers['content-encoding'] = 'br';
      } else if (accept.includes('gzip')) {
        body = gzipSync(body);
        headers['content-encoding'] = 'gzip';
      }
    }
    res.writeHead(200, headers);
    res.end(body);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => resolve(server));
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT ?? 4611);
  await startServer(port);
  console.log(`dist/ served at http://localhost:${port}`);
}
