import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE || 'https://podbharat.photographerondemand.in';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  integrations: [sitemap()],
  redirects: {
    '/': '/blogs',
    '/blog': '/blogs',
    '/blogs/page/1': '/blogs',
  },
});
