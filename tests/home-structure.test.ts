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

  describe('hero fog background', () => {
    it('mounts a decorative fog layer wrapping a canvas', () => {
      const layer = html.match(/<div[^>]*data-fog-layer[^>]*>/)?.[0]
      expect(layer).toBeDefined()
      // The layer carries no information and must never be announced or
      // focusable — it exists only to be looked at.
      expect(layer).toContain('aria-hidden="true"')
      // Proximity, not containment: a canvas that ended up as a *sibling*
      // rather than a child would still satisfy a loose distance window, but
      // container.querySelector('canvas') in the component script would then
      // return null and the effect would never mount.
      expect(html).toMatch(/<div[^>]*data-fog-layer[^>]*>\s*<canvas/)
    })

    it('clips the fog to the hero and puts it behind the headline', () => {
      // Identified by the layer it wraps rather than by a character-distance
      // lookahead to "Hello!" — the nested Container/Reveal/h1 markup between
      // the two is long enough that any such window would be brittle.
      const hero = html.match(/<section[^>]*>(?=\s*<div[^>]*data-fog-layer)/)?.[0]
      expect(hero).toBeDefined()
      // overflow-hidden is what keeps the canvas inside the section, and
      // isolate is what makes the layer's negative z-index resolve against
      // the hero instead of against body — body::before and body::after
      // already occupy negative indices in that context.
      expect(hero).toContain('overflow-hidden')
      expect(hero).toContain('relative')
      expect(hero).toContain('isolate')
    })

    it('keeps the fog behind the headline rather than over it', () => {
      // The assertion that would actually catch the failure that matters. If
      // z-index: -1 were dropped, the opaque canvas would cover the h1 and
      // every other test here would still pass; global.css:25-33 records a
      // past bug in this exact stacking interaction. Astro inlines this
      // component's scoped rule into the page head, so dist/index.html has it.
      expect(html).toMatch(/\.fog-layer\[[^\]]+\][^}]*z-index:\s*-1/)
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

  describe('contact and footer', () => {
    it('offers LinkedIn and a mail link', () => {
      expect(html).toMatch(/Let(&#39;|&rsquo;|&apos;|'|’)s build something together/)
      expect(html).toContain('Contact me')
      expect(html).toContain('mailto:ficho@transfez.com')
      expect(html).not.toContain('Email me')
    })

    it('reduces the footer to a centred copyright', () => {
      expect(html).toContain('All rights reserved')
      // These two appear only in the old footer's social row, so their
      // absence is what proves the row is gone.
      expect(html).not.toContain('Read.cv')
      expect(html).not.toContain('Dribbble')
    })
  })

  describe('header', () => {
    it('is reduced to a wordmark and one CTA', () => {
      // The wordmark is inlined, not an <img>, so its currentColor fill can
      // follow --color-text-primary — as an <img> it stayed Figma's hardcoded
      // white and disappeared on the light case-study pages.
      //
      // Scoped to the header element rather than to a {0,400} window after the
      // opening tag. The window version proved brittle for the reason such
      // windows always are: it measured proximity, not containment, so simply
      // adding classes to the bar broke it while the markup was still correct.
      const header = html.match(/<header[\s\S]*?<\/header>/)?.[0]
      expect(header).toBeDefined()
      expect(header).toMatch(/<svg[^>]*viewBox="0 0 106 32"/)
      expect(header).toContain('fill="currentColor"')
      expect(html).not.toContain('src="/images/logo-ficho.svg"')
      expect(html).toContain('Contact Us')
      expect(html).not.toContain('href="/#work"')
      expect(html).not.toContain('href="/#about"')
      expect(html).not.toContain('href="/#contact"')
      expect(html).not.toContain('Get in touch')
    })

    it('does not stick, so it cannot scroll over the 88px headings', () => {
      expect(html).not.toMatch(/<header[^>]*class="[^"]*sticky/)
    })

    it('draws the wordmark and CTA inside a bordered pill, as Figma does', () => {
      // This is a regression guard, not a style preference. The pill was
      // dropped once already, together with the nav links, as though the two
      // were one decision — the links are genuinely absent from the design,
      // the pill is not. Losing it is invisible in the tests otherwise, and it
      // leaves the header with no surface of its own, so anything painted
      // behind it makes it read as a stray band.
      const bar = html.match(/<header[\s\S]{0,600}?<div[^>]*class="[^"]*h-\[72px\][^"]*"/)?.[0]
      expect(bar).toBeDefined()
      expect(bar).toContain('rounded-full')
      expect(bar).toContain('border-border-hover')
      // Token-driven, never a literal: this header also renders on the light
      // case-study pages, where BaseLayout remaps the colour tokens.
      expect(bar).toContain('var(--color-bg-elevated)')
      expect(bar).not.toMatch(/bg-\[(linear-gradient\()?#[0-9a-fA-F]{3,8}/)
    })
  })
})
