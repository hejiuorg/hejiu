import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sites = [
  ['beverages', 4401, 'site-repositories/site-alcoholic-beverages/apps/main/dist'],
  ['guide', 4402, 'site-repositories/site-alcohol-guide/apps/site/dist'],
  ['culture', 4403, 'site-repositories/site-alcohol-culture/apps/site/dist'],
  ['atlas', 4404, 'site-repositories/site-alcohol-atlas/apps/site/dist'],
];

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm',
  '.pagefind': 'application/octet-stream',
  '.pf_meta': 'application/octet-stream',
  '.pf_filter': 'application/octet-stream',
  '.pf_index': 'application/octet-stream',
  '.pf_fragment': 'application/octet-stream',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

for (const [key, port, relative] of sites) {
  const base = path.join(root, relative);
  const server = http.createServer((req, res) => {
    try {
      if (!fs.existsSync(base)) {
        send(res, 500, `Build not found for ${key}: ${base}`);
        return;
      }
      const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.includes('\0')) {
        send(res, 400, 'Bad request');
        return;
      }
      const safePath = path.normalize(pathname).replace(/^([/\\])+/, '');
      let file = path.join(base, safePath);
      if (!file.startsWith(base)) {
        send(res, 403, 'Forbidden');
        return;
      }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        if (!pathname.endsWith('/')) {
          res.writeHead(301, { Location: `${pathname}/${url.search}` });
          res.end();
          return;
        }
        file = path.join(file, 'index.html');
      } else if (!path.extname(file) && fs.existsSync(path.join(file, 'index.html'))) {
        res.writeHead(301, { Location: `${pathname}/${url.search}` });
        res.end();
        return;
      }
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        const notFound = path.join(base, '404.html');
        send(res, 404, fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found', mime['.html']);
        return;
      }
      const ext = path.extname(file).toLowerCase();
      send(res, 200, fs.readFileSync(file), mime[ext] ?? 'application/octet-stream');
    } catch (error) {
      send(res, 500, `Server error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`${key.padEnd(10)} http://127.0.0.1:${port}/  (${path.relative(root, base)})`);
  });
}
