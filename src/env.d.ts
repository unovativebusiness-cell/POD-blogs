/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly STRAPI_URL?: string;
  readonly POD_API_URL?: string;
  readonly SITE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
