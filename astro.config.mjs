import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

const site = (process.env.SITE || 'https://writing.photographerondemand.in').replace(/\/$/, '');
const homeUrl = (process.env.HOME_URL || process.env.SITE || site).replace(/\/$/, '');

export default defineConfig({
  site,
  output: 'server',
  adapter: node({
    // Plesk Passenger expects an exported handler, not a process that calls listen().
    mode: 'middleware',
  }),
  trailingSlash: 'never',
  integrations: [sitemap()],
  redirects: {
    '/': homeUrl,
    '/blog': '/blogs',
    '/blogs/page/1': '/blogs',
  },
});
