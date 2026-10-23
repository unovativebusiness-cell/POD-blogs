/**
 * Plesk Node.js startup file.
 * Plesk sets PORT (and sometimes HOST). Astro's standalone entry reads both.
 */
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';

process.env.HOST ??= '127.0.0.1';
process.env.PORT ??= '3000';

const entry = path.resolve('dist/server/entry.mjs');

if (!existsSync(entry)) {
  console.error(
    `[pod-blogs] Missing ${entry}. In Plesk: run "npm install" then "npm run build", then Restart App.`,
  );
  process.exit(1);
}

await import(pathToFileURL(entry).href);
