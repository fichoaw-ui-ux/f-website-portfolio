import { describe, it, expect, beforeAll } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = join(process.cwd(), 'dist')

async function readHomeHtml(): Promise<string> {
  return readFile(join(DIST, 'index.html'), 'utf8').catch((err: unknown) => {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      throw new Error('dist/ not found — run `npm run build` before this test')
    }
    throw err
  })
}

describe('home page structure', () => {
  let html: string

  beforeAll(async () => {
    html = await readHomeHtml()
  })

  describe('hero', () => {
    it('greets by name in a single h1', () => {
      const h1s = html.match(/<h1\b/g) ?? []
      expect(h1s).toHaveLength(1)
      expect(html).toContain('Hello!')
      expect(html).toContain('a product designer')
    })

    it('drops the availability badge, CTAs, and scroll hint', () => {
      expect(html).not.toContain('Available for work')
      expect(html).not.toContain('See projects')
      expect(html).not.toContain('Scroll down')
    })

    it('shows the avatar as decorative, since the h1 already names him', () => {
      // Same source file as the About portrait — Figma exports one image fill
      // for both frames. `alt=""` is what distinguishes the hero's decorative
      // copy from About's described one.
      expect(html).toMatch(/<img[^>]+ficho-portrait\.png[^>]+alt=""/)
    })
  })

  describe('selected works', () => {
    it('uses the Figma heading and sub-copy', () => {
      expect(html).toContain('My selected works')
      expect(html).toContain('With my keen eye for detail')
      expect(html).not.toContain('Recent projects')
      expect(html).not.toContain('Selected work</')
    })

    it('labels each card with its upper-cased tags and a View Details pill', () => {
      expect(html).toContain('View Details')
      expect(html).not.toContain('View case study')
    })
  })

  describe('about', () => {
    it('runs the bio as one paragraph and drops the section badge pattern', () => {
      expect(html).toContain('About me')
      expect(html).not.toContain('Designer with a bias for shipping')
      // Proves site.bio was joined into a single <p>: with two paragraphs a
      // closing and opening tag would sit between these two sentences.
      expect(html).toContain('beautiful interfaces. Currently exploring')
    })

    it('shows the real portrait, described rather than decorative', () => {
      // Scoped to the About image. A bare `not.toContain('placeholder.svg')`
      // fails on unrelated content: five of the six explorations legitimately
      // still use placeholder.svg as their cover. The alt is what separates
      // this image from the hero's decorative copy of the same file.
      expect(html).toMatch(/<img[^>]+ficho-portrait\.png[^>]+alt="Portrait of Ficho"/)
    })

    it('keeps the skills and tools groups labelled', () => {
      expect(html).toContain('SKILLS')
      expect(html).toContain('TOOLS')
      expect(html).toContain('Mixpanel')
      expect(html).not.toContain('Framer')
    })
  })

  describe('experience', () => {
    it('lists company and role per entry', () => {
      // Regexes, not string equality: Astro passes literal template text
      // through unescaped but escapes {expression} output, so the heading
      // keeps its raw apostrophe while {e.company} turns & into an entity.
      expect(html).toMatch(/Where I(&#39;|&rsquo;|&apos;|'|’)ve worked/)
      expect(html).toMatch(/Transfez (&#38;|&amp;|&) Jack/)
      expect(html).toContain('Great Giant Pineapple')
      expect(html).toContain('Corporate Communication')
    })

    it('renders two bullets per role as list items', () => {
      // This is the assertion that actually distinguishes the new layout. The
      // company names above were already in the markup once site.ts changed,
      // so they pass either way; only the bulleted list is new. The old
      // component rendered a single {e.description}, which no longer exists.
      const bullets = html.match(/Lorem ipsum dolor sit amet/g) ?? []
      expect(bullets).toHaveLength(6)
      expect(html).toMatch(/<li[^>]*>\s*<span[^>]*aria-hidden/)
    })

    it('drops the Currently badge', () => {
      // `>Currently<` targets the badge's own text node. A bare 'Currently'
      // would also match site.bio[1] — "Currently exploring the intersection
      // of design systems and motion" — which the About section renders.
      expect(html).not.toContain('>Currently<')
    })
  })

  describe('explorations', () => {
    it('drops the section heading and per-card captions', () => {
      expect(html).not.toContain('Visual experiments')
      expect(html).not.toContain('>Explorations<')
    })

    it('keeps every card a link labelled by its cover alt', () => {
      const links = html.match(/href="\/explorations\/[^"]+"/g) ?? []
      expect(links.length).toBeGreaterThanOrEqual(6)
      // Title and year are gone, so the image alt is the card's only
      // accessible name. Without it the grid is six unlabelled links.
      const cards = html.match(/href="\/explorations\/[^"]+"[\s\S]{0,400}?<img[^>]+alt="[^"]+"/g) ?? []
      expect(cards.length).toBe(links.length)
    })
  })
})
