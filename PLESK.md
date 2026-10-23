# Deploy on Plesk (`writing.photographerondemand.in`)

This app runs as **Astro SSR** (`output: 'server'`) so new Strapi posts show up without a Netlify/Vercel redeploy. The Node process re-fetches Strapi about every `STRAPI_CACHE_TTL_MS` (default 60s).

## Why SSR on Plesk

| | SSG | SSR (this setup) |
|---|---|---|
| New Strapi post | Needs rebuild + redeploy | Appears after cache TTL |
| Plesk Node startup file | Not needed (static only) | Required (`app.cjs`) |
| Fits Plesk Node panel | Awkward | Native |

## 1. Upload the project

Upload / git-clone the repo into the domain folder, e.g.:

```text
/writing.photographerondemand.in/
  app.cjs
  package.json
  astro.config.mjs
  src/
  public/
  ...
```

## 2. Node.js panel settings

| Field | Value |
|---|---|
| Node.js | Enable **20.x LTS** or **22.x** (not 21.x — Astro rejects Node 21) |
| Application Root | `/writing.photographerondemand.in` (folder with `package.json`) |
| Application Startup File | **`app.cjs`** (not `app.js`) |
| Application Mode | `production` |
| Document Root | `/writing.photographerondemand.in/dist/client` *(after first build)* |

Use **`app.cjs`**. With `"type": "module"`, Passenger’s `require(app.js)` crashes and logs: *Could not spawn process… exited prematurely*.

If Document Root cannot be changed yet, leave it on the app root for the first build, then switch to `dist/client`.

## 3. Environment variables (Plesk)

In **Node.js → Custom environment variables → specify**, add:

```text
SITE=https://podbharat.photographerondemand.in
HOME_URL=https://podbharat.photographerondemand.in/blogs
STRAPI_URL=https://strapi.unovative.com
POD_API_URL=https://api.photographerondemand.in/
STRAPI_CACHE_TTL_MS=60000
NODE_ENV=production
```

- `SITE` — public origin for canonical / OG URLs
- `HOME_URL` — where `/` redirects (blogs listing)
- Do **not** commit real secrets; Plesk env overrides `.env` when set here

Then open **Run Node.js commands** and run:

```bash
npm install
npm run build
```

Click **Restart App**.

## 4. What `app.cjs` does

```js
// CommonJS wrapper for Passenger (require-safe)
// serves dist/client static files (/_astro/*, /icons/*, favicon)
// then hands SSR to dist/server/entry.mjs
// listens on Passenger socket (or PORT locally)
```

Upload `app.cjs`, set Startup File to `app.cjs`. Without the static layer, CSS/icons 404 and the logo looks broken.

If it says the entry is missing, run `npm run build` so `dist/server/entry.mjs` exists.

## 5. Verify

1. `/` → redirects to `https://podbharat.photographerondemand.in/blogs`
2. `/blogs` → listing
3. Publish a new article in Strapi → wait ~1 minute → refresh `/blogs`

## 6. Updates after code changes

```bash
npm install
npm run build
```

Then **Restart App** in Plesk.

Content-only changes in Strapi do **not** need a rebuild (SSR + cache TTL).
