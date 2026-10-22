import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = (process.env.SITE || 'https://podbharat.photographerondemand.in').replace(/\/$/, '');

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  integrations: [sitemap()],
  redirects: {
    '/': site,
    '/blog': '/blogs',
    '/blogs/page/1': '/blogs',
  },
});
