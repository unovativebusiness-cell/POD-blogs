/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly STRAPI_URL?: string;
  readonly POD_API_URL?: string;
  readonly SITE?: string;
  readonly HOME_URL?: string;
  readonly STRAPI_CACHE_TTL_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
