/**
 * Plesk / Phusion Passenger startup file.
 * Passenger imports this module and uses the default export as the request handler.
 * Do NOT call listen() here — Passenger owns the HTTP server.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const entry = path.resolve(process.cwd(), 'dist/server/entry.mjs');

if (!existsSync(entry)) {
  console.error(
    `[pod-blogs] Missing ${entry}. Run: npm install && npm run build, then Restart App.`,
  );
  throw new Error(`Missing Astro server entry: ${entry}`);
}

const { handler } = await import(pathToFileURL(entry).href);

if (typeof handler !== 'function') {
  throw new Error('[pod-blogs] Astro middleware handler was not exported from dist/server/entry.mjs');
}

export default handler;
