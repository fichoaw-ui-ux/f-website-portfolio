import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/** A 3- or 6-digit hex colour. These values are interpolated into a <style> block,
 *  so an unconstrained string could emit an invalid or malformed declaration. */
const hexColor = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be a hex colour like #1E4FCF')

// Both collections declare a `slug` field, and the glob loader's default
// generateId falls back to `data.slug` whenever it's present — which would
// collapse "id/quick-transfer" and a future "en/quick-transfer" entry to the
// same id and silently drop one of them. Force the id to track the file's
// path (relative to the collection root, extension stripped) instead, so
// locale-prefixed entries (id/..., en/...) get distinct ids that `localeEntries`
// (see src/lib/content.ts) can filter on.
const generateId = ({ entry }: { entry: string }) => entry.replace(/\.mdx?$/, '')

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/case-studies', generateId }),
  // cover/thumbnail go through astro:assets (resized + WebP) — the sources are
  // 7680×4800 PNGs that were served as-is (1.3 / 2.5 MB).
  schema: ({ image }) => z.object({
    title: z.string(),
    slug: z.string(),
    icon: z.string(),
    client: z.string(),
    role: z.string(),
    year: z.number().int(),
    duration: z.string(),
    tags: z.array(z.string()),
    cover: image(),
    coverAlt: z.string(),
    thumbnail: image(),
    thumbnailAlt: z.string(),
    summary: z.string(),
    overview: z.string(),
    team: z.array(z.string()).optional(),
    deliverables: z.array(z.string()),
    tools: z.array(z.string()),
    featured: z.boolean().default(false),
    order: z.number().int(),
    snapshot: z.array(z.object({
      label: z.string(),
      value: z.string(),
      pill: z.boolean().optional(),
    })).optional(),
    brandColor: hexColor.optional(),
    brandColorAlt: hexColor.optional(),
  }),
})

const explorations = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/explorations', generateId }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    year: z.number().int(),
    tags: z.array(z.string()),
    cover: z.string(),
    coverAlt: z.string(),
    images: z.array(z.object({ src: z.string(), alt: z.string() })),
    caption: z.string(),
    order: z.number().int().default(0),
    prototype: z.string().url().optional(),
    prototypeTitle: z.string().optional(),
    liveUrl: z.string().url().optional(),
  }),
})

export const collections = {
  'case-studies': caseStudies,
  'explorations': explorations,
}
