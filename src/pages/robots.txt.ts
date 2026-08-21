import type { APIRoute } from 'astro'

/* Generated rather than dropped into public/ so the Sitemap line can be
   derived from `site` in astro.config.mjs. A static public/robots.txt would
   hardcode the origin a second time, and the copy that goes stale is always
   the one nothing builds against. */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).toString()
  return new Response(
    ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}
