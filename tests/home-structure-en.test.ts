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
    it('names him in a single h1, with handle, English bio and socials', () => {
      const h1s = html.match(/<h1\b/g) ?? []
      expect(h1s).toHaveLength(1)
      expect(html).toMatch(/<h1[^>]*>\s*Ficho Aji Wibowo\s*<\/h1>/)
      expect(html).toContain('@fichoaw')
      expect(html).toContain('Product Designer with 4+ years of experience')
      for (const label of ['WhatsApp', 'LinkedIn', 'Email']) {
        expect(html).toContain(`aria-label="${label}"`)
      }
    })

    it('drops the availability badge, CTAs, and scroll hint', () => {
      expect(html).not.toContain('Available for work')
      expect(html).not.toContain('See projects')
      expect(html).not.toContain('Scroll down')
    })

    it('shows the avatar as decorative, since the h1 already names him', () => {
      // Redesign hero portrait (src/assets/hero/portrait.png, optimised by
      // astro:assets). `alt=""` because the h1 right after it is his name.
      const img = html.match(/<img[^>]+\/_astro\/portrait\.[^>]+>/)?.[0]
      expect(img).toBeDefined()
      // Astro minifies alt="" to a bare `alt`; both mean an empty alternative.
      expect(img).toMatch(/\salt(="")?[\s>]/)
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

    it('sits faintly under #252525 on the redesigned home page only', async () => {
      // Ficho: keep the storm video, faint behind the redesign's #252525.
      expect(html).toMatch(/<html[^>]*data-redesign/)
      const hrefs = [...html.matchAll(/<link[^>]+href="(\/_astro\/[^"]+\.css)"/g)].map((m) => m[1])
      const css = (await Promise.all(hrefs.map((h) => readFile(join(DIST, h), 'utf8')))).join('\n')
      expect(css).toMatch(/\[data-redesign\]\{[^}]*--bg-video-scrim:var\(--color-neutral-900\)/)
      expect(css).toMatch(/\[data-redesign\]\{[^}]*--bg-video-scrim-opacity:\s*\.88/)
      // Sections are see-through so the footage shows; the hero's white band stays.
      const experience = html.match(/<section[^>]*id="experience"[^>]*>/)?.[0] ?? ''
      expect(experience).not.toContain('bg-neutral-900')
      // Case studies are redesigned too; legacy pages (explorations) keep the legacy scrim.
      const caseStudy = await readFile(join(DIST, 'work', 'quick-transfer', 'index.html'), 'utf8')
      expect(caseStudy).toMatch(/<html[^>]*data-redesign/)
      const legacy = await readFile(join(DIST, 'explorations', 'exploration-01', 'index.html'), 'utf8')
      expect(legacy).not.toMatch(/<html[^>]*data-redesign/)
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
      // Glass surfaces sit over the footage: the tint is what keeps text
      // readable and covers content scrolling beneath, so blur alone is not
      // enough. Both must ship in the utility.
      const glass = css.match(/\.glass\{[^}]*\}/)?.[0]
      expect(glass).toBeDefined()
      expect(glass).toContain('var(--color-glass)')
      expect(glass).toMatch(/backdrop-filter:\s*blur\(/)
    })
  })

  describe('selected works', () => {
    it('uses the Figma heading, with no sub-copy', () => {
      expect(html).toContain('My selected works')
      expect(html).not.toContain('With my keen eye for detail')
      expect(html).not.toContain('Recent projects')
      expect(html).not.toContain('Selected work</')
    })

    it('labels each card with its tags and a View Details pill', () => {
      expect(html).toContain('View Details')
      expect(html).not.toContain('View case study')
    })

    it('lists the featured case studies as a plain list linking to each study', () => {
      const section = html.match(/<section[^>]*id="work"[\s\S]*?<\/section>/)?.[0] ?? ''
      const links = [...section.matchAll(/<a[^>]*href="(\/work\/[^"]+)"/g)].map(m => m[1])
      expect(links).toEqual(['/work/quick-transfer/', '/work/voucher-points-banner/'])
      // The pill's accessible name says which study it opens.
      expect(section).toContain('<span class="sr-only">: Quick Transfer: Boosting Portal Payments</span>')
      // Ficho: industry/platform tags only, as in the design.
      expect(section).toContain('Fintech B2B')
      expect(section).not.toMatch(/>\s*Product Design\s*</)
      // The legacy sticky-stack effect is gone.
      expect(html).not.toContain('stack-card')
    })
  })

  describe('skills and tools', () => {
    it('lists the mobile Figma chips under Skills and Tools headings', () => {
      const section = html.match(/<section[^>]*id="skills"[\s\S]*?<\/section>/)?.[0] ?? ''
      expect(section).toMatch(/<h2[^>]*>\s*Skills\s*<\/h2>/)
      expect(section).toMatch(/<h2[^>]*>\s*Tools\s*<\/h2>/)
      // 9 skills + 10 tools, in the mobile frame's order (Ficho's pick).
      const chips = [...section.matchAll(/<li[^>]*data-chip[^>]*>\s*([^<]+?)\s*<\/li>/g)].map(m => m[1])
      expect(chips).toHaveLength(19)
      expect(chips.slice(0, 9).at(-1)).toBe('Information Architecture')
      expect(chips).toContain('Claude')
      expect(chips).not.toContain('Mixpanel')
      expect(chips).not.toContain('Claude Code')
    })

    it('drops the old About section (bio and portrait moved to the hero)', () => {
      expect(html).not.toContain('About me')
      expect(html).not.toContain('ficho-portrait.png')
    })
  })

  describe('experience', () => {
    it('lists the two jobs from the redesign with role and period', () => {
      // Regex for the heading: Astro passes literal text through unescaped but
      // escapes {expression} output, so the apostrophe may arrive as an entity.
      expect(html).toMatch(/Where I(&#39;|&rsquo;|&apos;|'|’)ve worked/)
      for (const text of ['Transfez', 'Jack Finance', 'Associate UI/UX Designer',
        'October 2025 - Now', 'October 2022 - September 2025']) {
        expect(html).toContain(text)
      }
      // Ficho: follow the design — the intern role and the general
      // responsibilities stay in site.ts (experienceArchive) but are not shown.
      expect(html).not.toContain('Graphic Designer')
      expect(html).not.toContain('General Responsibilities')
    })

    it('renders the bullets inside accordion panels, top job open', () => {
      const section = html.match(/<section[^>]*id="experience"[\s\S]*?<\/section>/)?.[0] ?? ''
      const buttons = section.match(/<button[^>]*data-accordion-button[^>]*>/g) ?? []
      expect(buttons).toHaveLength(2)
      expect(buttons[0]).toContain('aria-expanded="true"')
      expect(buttons[1]).toContain('aria-expanded="false"')
      const panels = section.match(/<div[^>]*data-accordion-panel[^>]*>/g) ?? []
      expect(panels).toHaveLength(2)
      expect(panels[1]).toMatch(/\sinert/)
      // 2 Transfez + 5 Jack Finance bullets, each drawn as a decorative dot.
      const dots = section.match(/<li[^>]*>\s*<span[^>]*before:rounded-full[^>]*aria-hidden="true"/g) ?? []
      expect(dots).toHaveLength(7)
      // **bold** in site.ts arrives as <strong>, never as literal asterisks.
      expect(section).toContain('<strong')
      expect(section).not.toContain('**')
    })

    it('makes the company + role header one click target, bullets outside it', () => {
      const section = html.match(/<section[^>]*id="experience"[\s\S]*?<\/section>/)?.[0] ?? ''
      const headers = section.match(/<div[^>]*data-accordion-header[\s\S]*?data-figma="experience\/[a-z-]+\/role"[\s\S]*?<\/p>/g) ?? []
      expect(headers).toHaveLength(2)
      for (const h of headers) {
        expect(h).toContain('cursor-pointer')
        expect(h).toContain('data-accordion-button')
        expect(h).not.toContain('data-accordion-panel')
      }
    })

    it('drops the Currently badge', () => {
      // `>Currently<` targets the badge's own text node. A bare 'Currently'
      // would also match site.bio[1] — "Currently exploring the intersection
      // of design systems and motion" — which the About section renders.
      expect(html).not.toContain('>Currently<')
    })
  })

  describe('explorations', () => {
    it('shows covers in black & white, colour on card hover, with stacked pills', () => {
      const covers = html.match(/<img[^>]+\/_astro\/(exp-0|cover\.)[^>]*>/g) ?? []
      expect(covers.length).toBe(9) // 7 explorations + 2 case studies
      covers.forEach(img => {
        expect(img).toContain('grayscale')
        expect(img).toContain('group-hover:grayscale-0')
      })
      // See Prototype / Visit Live Site stack vertically on every card.
      const pillRows = html.match(/<div class="absolute inset-x-\(--space-16\)[^"]*"/g) ?? []
      expect(pillRows).toHaveLength(7)
      pillRows.forEach(row => {
        expect(row).toContain('grid-cols-1')
        expect(row).not.toContain('grid-cols-2')
      })
    })

    it('has the redesign heading and no per-card captions', () => {
      // The redesign brings the "Explorations" heading back (Figma 8:334).
      expect(html).toMatch(/<h2[^>]*>Explorations<\/h2>/)
      expect(html).not.toContain('Visual experiments')
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
      const covers = html.match(/<img[^>]+\/_astro\/exp-0[^>]*>/g) ?? []
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

    it('lists Email, WhatsApp and LinkedIn as one link per row', () => {
      const section = html.match(/<section[^>]*id="contact"[\s\S]*?<\/section>/)?.[0] ?? ''
      const rows = [...section.matchAll(/<a[^>]*href="([^"]+)"[^>]*data-figma="contact\/([a-z]+)"/g)]
        .map(m => `${m[2]} ${m[1]}`)
      expect(rows).toEqual([
        'email mailto:fichoajiwibowo@gmail.com',
        'whatsapp https://wa.me/6282111183273',
        'linkedin https://linkedin.com/in/fichoajiwibowo',
      ])
      expect(section).toContain('+62 821 1118 3273')
      // Figma's "LinkedInd" is a typo.
      expect(section).not.toContain('LinkedInd')
    })

    it('uses the redesign footer on the home page', () => {
      expect(html).toMatch(/<footer[^>]*data-figma="footer"/)
    })

    it('reduces the footer to a centred copyright', () => {
      expect(html).toContain('All rights reserved')
      // These two appear only in the old footer's social row, so their
      // absence is what proves the row is gone.
      expect(html).not.toContain('Read.cv')
      expect(html).not.toContain('Dribbble')
    })
  })

  // The legacy header left the home page with the redesign (the compact header
  // replaced it) but still serves the case study and exploration pages. The
  // exploration page is dark like the old home, so these checks still apply.
  describe('legacy header (exploration page)', () => {
    let legacyPage: string

    beforeAll(async () => {
      legacyPage = await readFile(join(DIST, 'explorations', 'exploration-01', 'index.html'), 'utf8')
    })

    it('carries the section nav, the wordmark, and one CTA', () => {
      // The wordmark is inlined, not an <img>, so its currentColor fill can
      // follow --color-text-primary — as an <img> it stayed Figma's hardcoded
      // white and disappeared on the light case-study pages.
      //
      // Scoped to the header element rather than to a {0,400} window after the
      // opening tag. The window version proved brittle for the reason such
      // windows always are: it measured proximity, not containment, so simply
      // adding classes to the bar broke it while the markup was still correct.
      const header = legacyPage.match(/<header[\s\S]*?<\/header>/)?.[0]
      expect(header).toBeDefined()
      expect(header).toMatch(/<svg[^>]*viewBox="0 0 106 32"/)
      expect(header).toContain('fill="currentColor"')
      expect(legacyPage).not.toContain('src="/images/logo-ficho.svg"')
      expect(legacyPage).toContain('Contact Me')
      // The section nav is back — it was dropped along with the pill when the
      // header was first reduced, and that pairing was the mistake documented
      // in Header.astro. Every site.nav entry must render; a nav that silently
      // lost one is invisible otherwise. There is no /#contact entry: the CTA
      // is a mailto, not an anchor to a section.
      //
      // English is the default locale (no URL prefix), so these stay bare.
      expect(legacyPage).toContain('href="/#work"')
      expect(legacyPage).toContain('href="/#skills"')
      expect(legacyPage).toContain('href="/#experience"')
      expect(legacyPage).toContain('href="/#explorations"')
      expect(legacyPage).not.toContain('Get in touch')
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
      const header = legacyPage.match(/<header[^>]*>/)?.[0]
      expect(header).toBeDefined()
      expect(header).toContain('sticky')
      // Without a stacking order it would stick and still be painted under the
      // content it is supposed to cover.
      expect(header).toContain('z-40')
      // No scrim over the pt-8 gap on the dark home page: the background video
      // shows through there, and the page-colour fade read as a black band.
      // Light case-study pages keep it (Header's `scrim` prop).
      expect(header).not.toContain('var(--color-bg-primary)')

      const bar = legacyPage.match(/<header[\s\S]*?<div[^>]*class="[^"]*h-\[72px\][^"]*"/)?.[0]
      // Over the video the pill is tinted glass (the `glass` utility, whose
      // tint and blur are asserted in the background video block).
      expect(bar).toMatch(/class="[^"]*\bglass\b/)
    })

    it('draws the wordmark and CTA inside a bordered pill, as Figma does', () => {
      // This is a regression guard, not a style preference. The pill was
      // dropped once already, together with the nav links, as though the two
      // were one decision — the links are genuinely absent from the design,
      // the pill is not. Losing it is invisible in the tests otherwise, and it
      // leaves the header with no surface of its own, so anything painted
      // behind it makes it read as a stray band.
      const bar = legacyPage.match(/<header[\s\S]{0,600}?<div[^>]*class="[^"]*h-\[72px\][^"]*"/)?.[0]
      expect(bar).toBeDefined()
      expect(bar).toContain('rounded-full')
      // Dark pages sit over the background video, so the pill is glass with
      // a token-driven fill and edge (tokens.css), never a literal colour.
      expect(bar).toMatch(/class="[^"]*\bglass\b/)
      expect(bar).not.toMatch(/bg-\[(linear-gradient\()?#[0-9a-fA-F]{3,8}/)
    })
  })

  describe('compact header', () => {
    it('replaces the legacy header on the home page and starts hidden', () => {
      expect(html).not.toMatch(/<header\b/)
      const header = html.match(/<div[^>]*data-compact-header[^>]*>/)?.[0]
      expect(header).toBeDefined()
      // Hidden and unreachable until the tab bar sticks under it.
      expect(header).toContain('aria-hidden="true"')
      expect(header).toMatch(/\sinert/)
      // The attribute itself, not the `data-shown:` class variant.
      expect(header).not.toMatch(/\sdata-shown[\s=>]/)
    })

    it('shows the short name, handle and a Contact link to the section', () => {
      const block = html.match(/<div[^>]*data-compact-header[\s\S]*?data-figma="compact-header\/contact"[\s\S]*?<\/a>/)?.[0] ?? ''
      expect(block).toContain('Ficho Aji W')
      expect(block).toContain('@fichoaw')
      expect(block).toMatch(/href="#contact"[\s\S]*Contact/)
    })

    it('offers the ID/EN switch in the hero and the compact header, EN current', () => {
      const switches = html.match(/<nav[^>]*data-figma="language-switch"[\s\S]*?<\/nav>/g) ?? []
      expect(switches).toHaveLength(2)
      for (const sw of switches) {
        expect(sw).toContain('aria-label="Language"')
        expect(sw).toMatch(/<a[^>]*href="\/id\/"[^>]*>ID<\/a>/)
        expect(sw).toMatch(/<a[^>]*href="\/"[^>]*aria-current="true"[^>]*>EN<\/a>/)
        expect(sw).not.toMatch(/<a[^>]*href="\/id\/"[^>]*aria-current/)
      }
      // Mobile: an envelope icon link to Contact beside the switch.
      expect(html).toMatch(/<a[^>]*href="#contact"[^>]*aria-label="Contact"[^>]*data-figma="compact-header\/contact-icon"/)
    })

    it('puts a Contact button beside the switch in the hero too', () => {
      const hero = html.match(/<section[^>]*data-figma="hero"[\s\S]*?<\/section>/)?.[0] ?? ''
      expect(hero).toMatch(/data-figma="hero\/actions"/)
      expect(hero).toMatch(/<a[^>]*href="#contact"[^>]*data-figma="hero\/contact"/)
      expect(hero).toMatch(/<a[^>]*href="#contact"[^>]*aria-label="Contact"[^>]*data-figma="hero\/contact-icon"/)
    })

    it('keeps the tab bar sticky right under it', () => {
      const bar = html.match(/<nav[^>]*data-tab-bar[^>]*>/)?.[0] ?? ''
      expect(bar).toContain('sticky')
      expect(bar).toContain('top-[80px]')
      expect(bar).toContain('desktop:top-[84px]')
    })
  })
})

describe('tab bar', () => {
  let html: string

  beforeAll(async () => {
    html = await readHomeHtml()
  })

  it('is a labelled nav right after the hero, with four tabs in Figma order', () => {
    const nav = html.match(/<nav[^>]*data-tab-bar[^>]*>[\s\S]*?<\/nav>/)?.[0]
    expect(nav).toBeDefined()
    expect(nav).toContain('aria-label="Section navigation"')
    const targets = [...nav!.matchAll(/data-tab="([^"]+)"/g)].map(m => m[1])
    expect(targets).toEqual(['experience', 'skills', 'work', 'explorations'])
    for (const label of ['Experience', 'Skills &amp; Tools', 'Study Case', 'Exploration']) {
      expect(nav).toContain(label)
    }
    // The hero section closes immediately before the tab bar opens.
    expect(html).toMatch(/<\/section>\s*<nav[^>]*data-tab-bar/)
  })

  it('points every tab at a section that exists on the page', () => {
    for (const id of ['experience', 'skills', 'work', 'explorations']) {
      expect(html).toContain(`href="#${id}"`)
      expect(html).toMatch(new RegExp(`<section[^>]*id="${id}"`))
    }
  })

  it('marks only the first tab current on load', () => {
    const current = html.match(/<a[^>]*data-tab="[^"]+"[^>]*aria-current="true"[^>]*>/g) ?? []
    expect(current).toHaveLength(1)
    expect(current[0]).toContain('data-tab="experience"')
  })
})
