# Deploy on Plesk (`writing.photographerondemand.in`)

This app runs as **Astro SSR** (`output: 'server'`) so new Strapi posts show up without a Netlify/Vercel redeploy. The Node process re-fetches Strapi about every `STRAPI_CACHE_TTL_MS` (default 60s).

## Why SSR on Plesk

| | SSG | SSR (this setup) |
|---|---|---|
| New Strapi post | Needs rebuild + redeploy | Appears after cache TTL |
| Plesk Node startup file | Not needed (static only) | Required (`app.js`) |
| Fits Plesk Node panel | Awkward | Native |

## 1. Upload the project

Upload / git-clone the repo into the domain folder, e.g.:

```text
/writing.photographerondemand.in/
  app.js
  package.json
  astro.config.mjs
  src/
  public/
  ...
```

## 2. Node.js panel settings

| Field | Value |
|---|---|
| Node.js | Enable (v18+ or your current 21.x is fine) |
| Application Root | `/writing.photographerondemand.in` (folder with `package.json`) |
| Application Startup File | `app.js` |
| Application Mode | `production` |
| Document Root | `/writing.photographerondemand.in/dist/client` *(after first build)* |

Plesk proxies dynamic routes to Node and can serve `/_astro/*` and public assets from `dist/client`.

If Document Root cannot be changed yet, leave it on the app root for the first build, then switch to `dist/client`.

## 3. Environment variables (Plesk)

In **Node.js → Custom environment variables → specify**, add:

```text
SITE=https://writing.photographerondemand.in
HOME_URL=https://podbharat.photographerondemand.in
STRAPI_URL=https://strapi.unovative.com
POD_API_URL=https://api.photographerondemand.in/
STRAPI_CACHE_TTL_MS=60000
NODE_ENV=production
```

- `SITE` — this blog’s public URL (canonical / OG)
- `HOME_URL` — where `/` redirects
- Do **not** commit real secrets; Plesk env overrides `.env` when set here

Then open **Run Node.js commands** and run:

```bash
npm install
npm run build
```

Click **Restart App**.

## 4. What `app.js` does

```js
// loads dist/server/entry.mjs (created by `npm run build`)
// listens on HOST/PORT that Plesk injects
```

If Plesk says `app.js` / startup file is missing, the file is not in Application Root, or you have not uploaded it.

If it says the entry is missing, you still need `npm run build` so `dist/server/entry.mjs` exists.

## 5. Verify

1. `https://writing.photographerondemand.in/` → redirects to `HOME_URL`
2. `https://writing.photographerondemand.in/blogs` → listing
3. Publish a new article in Strapi → wait ~1 minute → refresh `/blogs`

## 6. Updates after code changes

```bash
npm install
npm run build
```

Then **Restart App** in Plesk.

Content-only changes in Strapi do **not** need a rebuild (SSR + cache TTL).
