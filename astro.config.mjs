import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

const site = (process.env.SITE || 'https://podbharat.photographerondemand.in').replace(/\/$/, '');

export default defineConfig({
  site,
  output: 'server',
  adapter: node({
    // Middleware handler is wired in app.js for Phusion Passenger on Plesk.
    mode: 'middleware',
  }),
  trailingSlash: 'never',
  integrations: [sitemap()],
  redirects: {
    '/blog': '/blogs',
    '/blogs/page/1': '/blogs',
  },
});
