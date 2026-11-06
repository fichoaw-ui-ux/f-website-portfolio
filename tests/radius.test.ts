import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/* Corner radius stays consistent only if redesigned code names what a corner
   is, not how big it is (tokens.css → "Semantic radii"). Allowed:
   - rounded-(--radius-container) / rounded-(--radius-pill), any variant prefix
   - rounded-none
   - a nested box: rounded-[calc(var(--radius-container)-<gap>)]
   - in CSS: border-radius: var(--radius-container | --radius-pill)
   Anything else (rounded-lg, rounded-full, rounded-(--radius-24),
   rounded-[16px], border-radius: 12px …) fails here. */

const ROOT = join(__dirname, '..')
const dir = (d: string, ext: RegExp) =>
  readdirSync(join(ROOT, d), { recursive: true, encoding: 'utf8' })
    .filter((f) => ext.test(f))
    .map((f) => join(d, f))

const files = [
  ...dir('src/components/home', /\.astro$/),
  ...dir('src/components/case-study', /\.astro$/),
  ...dir('src/content/case-studies', /\.mdx$/),
  'src/components/layout/HeaderActions.astro',
  'src/components/layout/LanguageSwitch.astro',
  'src/components/layout/FooterRedesign.astro',
  'src/components/layout/ContentBand.astro',
  'src/layouts/CaseStudyLayout.astro',
]

const ALLOWED_CLASS = /^rounded-(?:none|\(--radius-(?:container|pill)\)|\[calc\(var\(--radius-container\)-[\d.]+px\)\])$/
const ALLOWED_CSS = /^var\(--radius-(?:container|pill)\)$/

describe('corner radius', () => {
  it.each(files)('%s uses only the semantic radius tokens', (file) => {
    const src = readFileSync(join(ROOT, file), 'utf8')
    const classes = [...src.matchAll(/(?:^|[\s"'`:])(rounded(?:-[^\s"'`]*)?)(?=[\s"'`]|$)/gm)]
      .map((m) => m[1])
      // Drop variant prefixes (desktop:, before:, group-hover: …) — the match
      // starts after the last ':' already; a bare "rounded" is a word in prose.
      .filter((c) => c !== 'rounded')
    const css = [...src.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim())

    expect(classes.filter((c) => !ALLOWED_CLASS.test(c))).toEqual([])
    expect(css.filter((v) => !ALLOWED_CSS.test(v))).toEqual([])
  })
})
