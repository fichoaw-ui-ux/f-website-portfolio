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
      expect(html).toMatch(/I(&#39;|&rsquo;|&apos;|'|’)m Ficho\./)
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

  describe('background video', () => {
    it('mounts a decorative, muted, inline looping video', () => {
      const layer = html.match(/<div[^>]*class="bg-video[^"]*"[^>]*>/)?.[0]
      expect(layer).toBeDefined()
      expect(layer).toContain('aria-hidden="true"')
      // muted + playsinline are what let iOS Safari autoplay it at all.
      const video = html.match(/<div[^>]*class="bg-video[^>]*>\s*(<video[^>]*>)/)?.[1]
      expect(video).toBeDefined()
      for (const attr of ['autoplay', 'muted', 'loop', 'playsinline', 'poster=']) {
        expect(video).toContain(attr)
      }
    })

    it('offers HEVC first with an H.264 fallback', () => {
      expect(html).toMatch(/bg-storm-light-hevc\.mp4[^>]*hvc1[\s\S]*?bg-storm-light\.mp4/)
    })

    it('sits under the body texture layers, not over the content', async () => {
      // body::before is -2 and the grain is -1; the footage must stay below
      // both, and a non-negative value would paint it over the headline.
      // BaseLayout's scoped styles ship as a linked stylesheet, not inline.
      const hrefs = [...html.matchAll(/<link[^>]+href="(\/_astro\/[^"]+\.css)"/g)].map((m) => m[1])
      const css = (await Promise.all(hrefs.map((h) => readFile(join(DIST, h), 'utf8')))).join('\n')
      expect(css).toMatch(/\.bg-video\[[^\]]+\]\{[^}]*z-index:\s*-3/)
    })
  })

  describe('selected works', () => {
    it('uses the Figma heading, with no sub-copy', () => {
      expect(html).toContain('My selected works')
      expect(html).not.toContain('With my keen eye for detail')
      expect(html).not.toContain('Recent projects')
      expect(html).not.toContain('Selected work</')
    })

    it('labels each card with its upper-cased tags and a View Details pill', () => {
      expect(html).toContain('View Details')
      expect(html).not.toContain('View case study')
    })
  })

  describe('about', () => {
    it('runs the bio as two paragraphs and drops the section badge pattern', () => {
      expect(html).toContain('About me')
      expect(html).not.toContain('Designer with a bias for shipping')
      // Proves site.bio renders as two separate <p> tags, not one joined blob.
      expect(html).toMatch(/\(KYC (&|&amp;) KYB\)\.<\/p><p>Background in Information Systems/)
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
      expect(html).toContain('Graphic Designer')
    })

    it('renders every responsibility as a bulleted list item', () => {
      // This is the assertion that actually distinguishes the new layout. The
      // company names above were already in the markup once site.ts changed,
      // so they pass either way; only the nested bullet lists are new. The old
      // component rendered a single {e.description}, which no longer exists.
      //
      // 14 = the 11 responsibility items across the two roles, plus the
      // three section labels the current role groups them under, each of which
      // draws its own (larger) glyph. Counting the glyph rather than the copy
      // keeps this from re-breaking every time a bullet is reworded.
      const bullets = html.match(/aria-hidden="true">&bull;/g) ?? []
      expect(bullets).toHaveLength(14)
      expect(html).toMatch(/<li[^>]*>\s*<span[^>]*aria-hidden/)
      // The labels are what make the current role's two-level nesting legible;
      // without them the nine items under it read as one flat run.
      expect(html).toContain('General Responsibilities')
      // **bold** in site.ts must arrive as a <mark>, not as literal asterisks —
      // Experience.astro is the only component that interprets that syntax.
      expect(html).toContain('<mark')
      expect(html).not.toContain('**')
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

    it('keeps every card reachable through one labelled action', () => {
      // The cards no longer link to a detail page. Every exploration now
      // carries a prototype, so the stretched primary action is the <button>
      // that opens the modal — hence zero /explorations/ hrefs on the home
      // page, which is correct rather than a regression. The detail pages
      // still build and are still reachable directly.
      const actions = html.match(/aria-label="Open [^"]+"/g) ?? []
      expect(actions).toHaveLength(7)
      expect(html.match(/data-proto-src="/g) ?? []).toHaveLength(7)
      // Title and year are gone from the card, so the aria-label above and the
      // cover alt are its only accessible names. A cover that shipped with an
      // empty alt would leave the card described by the label alone.
      const covers = html.match(/<img[^>]+\/images\/explorations\/[^>]*>/g) ?? []
      expect(covers).toHaveLength(7)
      covers.forEach(img => expect(img).toMatch(/alt="[^"]+"/))
    })
  })

  describe('contact and footer', () => {
    it('offers LinkedIn, WhatsApp and a mail link', () => {
      expect(html).toMatch(/Let(&#39;|&rsquo;|&apos;|'|’)s build something together/)
      // The address is spelled out in the copy as a mailto, and the two
      // socials sit below it as ghost buttons — there is no longer a single
      // "Contact me" button in this section.
      expect(html).toContain('mailto:fichoajiwibowo@gmail.com')
      expect(html).toContain('>LinkedIn<')
      expect(html).toContain('>WhatsApp<')
      expect(html).not.toContain('Email me')
      // The old work address must not survive anywhere in the markup.
      expect(html).not.toContain('ficho@transfez.com')
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
    it('carries the section nav, the wordmark, and one CTA', () => {
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
      expect(html).toContain('Contact Me')
      // The section nav is back — it was dropped along with the pill when the
      // header was first reduced, and that pairing was the mistake documented
      // in Header.astro. Every site.nav entry must render; a nav that silently
      // lost one is invisible otherwise. There is no /#contact entry: the CTA
      // is a mailto, not an anchor to a section.
      //
      // English is the default locale (no URL prefix), so these stay bare.
      expect(html).toContain('href="/#work"')
      expect(html).toContain('href="/#about"')
      expect(html).toContain('href="/#experience"')
      expect(html).toContain('href="/#explorations"')
      expect(html).not.toContain('Get in touch')
    })

    it('sticks — which is only safe while the bar stays opaque', () => {
      // The inverse of this test used to exist, asserting the header did NOT
      // stick. That was right at the time and is deliberately flipped now: the
      // reason given was "a sticky header *without a background* scrolls
      // transparently over the content", and the pill supplies the background.
      //
      // Both halves are asserted together on purpose. Sticky alone, or an
      // opaque bar alone, is fine; sticky *without* the bar is the specific
      // combination that put 88px headings underneath the wordmark. Splitting
      // them into two tests would let that pair regress with both still green.
      const header = html.match(/<header[^>]*>/)?.[0]
      expect(header).toBeDefined()
      expect(header).toContain('sticky')
      // Without a stacking order it would stick and still be painted under the
      // content it is supposed to cover.
      expect(header).toContain('z-40')
      // The scrim over the pt-8 gap above the pill. Without it, content scrolls
      // up through that band — the pill covers only its own 72px.
      expect(header).toContain('var(--color-bg-primary)')

      const bar = html.match(/<header[\s\S]*?<div[^>]*class="[^"]*h-\[72px\][^"]*"/)?.[0]
      expect(bar).toContain('var(--color-bg-elevated)')
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
      // The border is the .stroke-gradient utility (1px transparent border with
      // the card stroke painted to border-box), not a flat border-* class. That
      // swap was deliberate: it reproduces Figma's #828287 -> #55555A gradient
      // stroke, which the flat token only approximated.
      expect(bar).toContain('stroke-gradient')
      // Token-driven, never a literal: this header also renders on the light
      // case-study pages, where BaseLayout remaps the colour tokens.
      expect(bar).toContain('var(--color-bg-elevated)')
      expect(bar).not.toMatch(/bg-\[(linear-gradient\()?#[0-9a-fA-F]{3,8}/)
    })
  })
})
