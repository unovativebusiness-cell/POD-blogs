/**
 * Plesk / Phusion Passenger startup (CommonJS).
 *
 * Passenger often loads the startup file with require().
 * With package.json "type": "module", app.js is ESM and that crashes
 * immediately → "Could not spawn process / exited prematurely".
 *
 * Use THIS file as Application Startup File in Plesk: app.cjs
 *
 * Middleware mode does not serve dist/client — without this static layer,
 * /_astro/*.css and /icons/* 404 and the logo looks broken.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = __dirname;
const clientDir = path.join(root, 'dist', 'client');
const entry = path.join(root, 'dist', 'server', 'entry.mjs');

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

if (!fs.existsSync(entry)) {
  console.error(`[pod-blogs] Missing ${entry}`);
  console.error('[pod-blogs] Run: npm install && npm run build');
  throw new Error(`Missing Astro server entry: ${entry}`);
}

const handlerPromise = import(pathToFileURL(entry).href).then((mod) => {
  if (typeof mod.handler !== 'function') {
    throw new Error('[pod-blogs] Astro middleware handler missing from dist/server/entry.mjs');
  }
  console.log('[pod-blogs] Astro handler loaded');
  return mod.handler;
});

function safeClientPath(urlPath) {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0].split('#')[0]);
  const relative = decoded.replace(/^\/+/, '');
  const resolved = path.normalize(path.join(clientDir, relative));
  if (!resolved.startsWith(clientDir + path.sep) && resolved !== clientDir) return null;
  return resolved;
}

function tryServeStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const filePath = safeClientPath(req.url || '/');
  if (!filePath) return false;

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;

  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Content-Length', String(stat.size));
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  if (req.method === 'HEAD') {
    res.end();
    return true;
  }
  fs.createReadStream(filePath).pipe(res);
  return true;
}

const server = http.createServer((req, res) => {
  try {
    if (tryServeStatic(req, res)) return;
  } catch (error) {
    console.error('[pod-blogs] static serve failed', error);
  }

  handlerPromise
    .then((handler) => handler(req, res))
    .catch((error) => {
      console.error('[pod-blogs] request failed', error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }
      res.end('Internal Server Error');
    });
});

if (typeof PhusionPassenger !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
  server.listen('passenger');
  console.log('[pod-blogs] listening via Phusion Passenger');
} else {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  server.listen(port, host, () => {
    console.log(`[pod-blogs] listening on http://${host}:${port}`);
  });
}
