// Gobble Dash — local play-test server.
//
// Serves game/ as static files on http://127.0.0.1:<port>/ so the game can be
// played in a desktop browser and screenshotted. Standard library only, no
// dependencies. Usage:
//
//   node serve.ts [port]        (default port 8080)
//   PORT=9000 node serve.ts
//
// The served directory is always game/ next to this file, never the whole
// repository, and any path that climbs out of game/ is refused.

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const GAME_DIR = join(dirname(fileURLToPath(import.meta.url)), 'game');
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
};

function safePath(urlPath: string): string | null {
  const cleaned = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const resolved = resolve(GAME_DIR, '.' + sep + cleaned);
  if (resolved !== GAME_DIR && !resolved.startsWith(GAME_DIR + sep)) return null;
  return resolved;
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  let path = safePath(url.pathname);
  if (path === null) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('forbidden');
    return;
  }
  if (existsSync(path) && statSync(path).isDirectory()) {
    path = join(path, 'index.html');
  }
  if (!existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  const type = MIME[extname(path).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(readFileSync(path));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Gobble Dash at http://127.0.0.1:${PORT}/ (serving ${GAME_DIR})`);
});
