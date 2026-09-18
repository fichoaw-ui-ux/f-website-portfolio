// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Canonical origin for <link rel=canonical>, the sitemap, and the absolute
  // og:image URL. Vercel's free subdomain until a real domain is bought —
  // swap this one line then, and set the same value as the production
  // domain in Vercel so the two never disagree.
  site: 'https://ficho-portfolio.vercel.app',
  i18n: {
    locales: ['id', 'en'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { id: 'id', en: 'en' },
      },
    }),
  ]
});