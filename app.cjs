/**
 * Plesk / Phusion Passenger startup (CommonJS).
 *
 * Passenger often loads the startup file with require().
 * With package.json "type": "module", app.js is ESM and that crashes
 * immediately → "Could not spawn process / exited prematurely".
 *
 * Use THIS file as Application Startup File in Plesk: app.cjs
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = __dirname;
const entry = path.join(root, 'dist', 'server', 'entry.mjs');

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

const server = http.createServer((req, res) => {
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
