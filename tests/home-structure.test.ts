import { describe, it, expect, beforeAll } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = join(process.cwd(), 'dist')

async function readHomeHtml(): Promise<string> {
  return readFile(join(DIST, 'id', 'index.html'), 'utf8').catch((err: unknown) => {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      throw new Error('dist/ not found — run `npm run build` before this test')
    }
    throw err
  })
}

describe('home page structure (id)', () => {
  let html: string

  beforeAll(async () => {
    html = await readHomeHtml()
  })

  describe('hero', () => {
    it('names him in a single h1, with handle, Indonesian bio and socials', () => {
      const h1s = html.match(/<h1\b/g) ?? []
      expect(h1s).toHaveLength(1)
      expect(html).toMatch(/<h1[^>]*>\s*Ficho Aji Wibowo\s*<\/h1>/)
      expect(html).toContain('@fichoaw')
      expect(html).toContain('Product Designer dengan 4+ tahun pengalaman')
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
    it('uses the Indonesian heading, with no sub-copy', () => {
      expect(html).toContain('Studi Kasus')
      expect(html).not.toContain('mata yang detail')
      expect(html).not.toContain('My selected works')
    })

    it('labels each card with a Lihat Detail pill', () => {
      expect(html).toContain('Lihat Detail')
      expect(html).not.toContain('View Details')
    })
  })

  describe('skills and tools', () => {
    it('lists the mobile Figma chips under Skill and Tools headings', () => {
      const section = html.match(/<section[^>]*id="skills"[\s\S]*?<\/section>/)?.[0] ?? ''
      expect(section).toMatch(/<h2[^>]*>\s*Skill\s*<\/h2>/)
      expect(section).toMatch(/<h2[^>]*>\s*Tools\s*<\/h2>/)
      const chips = section.match(/<li[^>]*data-chip/g) ?? []
      expect(chips).toHaveLength(19)
    })

    it('drops the old About section', () => {
      expect(html).not.toContain('>Profil<')
      expect(html).not.toContain('ficho-portrait.png')
    })
  })

  describe('experience', () => {
    it('lists the two jobs from the redesign with role and period', () => {
      expect(html).toContain('Pengalaman Kerja')
      for (const text of ['Transfez', 'Jack Finance', 'Associate UI/UX Designer',
        'Oktober 2025 - Sekarang', 'Oktober 2022 - September 2025']) {
        expect(html).toContain(text)
      }
      expect(html).not.toContain('Desainer Grafis')
      expect(html).not.toContain('Tanggung Jawab Umum')
    })

    it('renders the bullets inside accordion panels, top job open', () => {
      const section = html.match(/<section[^>]*id="experience"[\s\S]*?<\/section>/)?.[0] ?? ''
      const buttons = section.match(/<button[^>]*data-accordion-button[^>]*>/g) ?? []
      expect(buttons).toHaveLength(2)
      expect(buttons[0]).toContain('aria-expanded="true"')
      expect(buttons[1]).toContain('aria-expanded="false"')
      const dots = section.match(/<li[^>]*>\s*<span[^>]*before:rounded-full[^>]*aria-hidden="true"/g) ?? []
      expect(dots).toHaveLength(7)
      expect(section).toContain('<strong')
      expect(section).not.toContain('**')
    })

    it('drops the Currently badge', () => {
      expect(html).not.toContain('>Currently<')
      expect(html).not.toContain('>Sekarang<')
    })
  })

  describe('explorations', () => {
    it('drops the section heading and per-card captions', () => {
      expect(html).not.toContain('Visual experiments')
      expect(html).not.toContain('>Explorations<')
    })

    it('keeps every card reachable through one labelled action', () => {
      const actions = html.match(/aria-label="Buka [^"]+"/g) ?? []
      expect(actions).toHaveLength(7)
      expect(html.match(/data-proto-src="/g) ?? []).toHaveLength(7)
      const covers = html.match(/<img[^>]+\/images\/explorations\/[^>]*>/g) ?? []
      expect(covers).toHaveLength(7)
      covers.forEach(img => expect(img).toMatch(/alt="[^"]+"/))
    })
  })

  describe('contact and footer', () => {
    it('offers LinkedIn, WhatsApp and a mail link', () => {
      expect(html).toContain('Terbuka untuk peluang kerja dan freelance')
      expect(html).toContain('mailto:fichoajiwibowo@gmail.com')
      expect(html).toContain('>LinkedIn<')
      expect(html).toContain('>WhatsApp<')
      expect(html).not.toContain('ficho@transfez.com')
    })

    it('reduces the footer to a centred copyright', () => {
      expect(html).toContain('Hak cipta dilindungi.')
      expect(html).not.toContain('Read.cv')
      expect(html).not.toContain('Dribbble')
    })
  })

  describe('header', () => {
    it('carries the section nav, the wordmark, and one CTA', () => {
      const header = html.match(/<header[\s\S]*?<\/header>/)?.[0]
      expect(header).toBeDefined()
      expect(header).toMatch(/<svg[^>]*viewBox="0 0 106 32"/)
      expect(header).toContain('fill="currentColor"')
      expect(html).not.toContain('src="/images/logo-ficho.svg"')
      expect(html).toContain('Hubungi Saya')
      expect(html).toContain('href="/id/#work"')
      expect(html).toContain('href="/id/#skills"')
      expect(html).toContain('href="/id/#experience"')
      expect(html).toContain('href="/id/#explorations"')
      expect(html).not.toContain('Get in touch')
    })

    it('offers the ID/EN language switcher', () => {
      expect(html).toMatch(/>ID<\/a>/)
      expect(html).toMatch(/>EN<\/a>/)
      expect(html).toMatch(/href="\/"/)
    })

    it('sticks — which is only safe while the bar stays opaque', () => {
      const header = html.match(/<header[^>]*>/)?.[0]
      expect(header).toBeDefined()
      expect(header).toContain('sticky')
      expect(header).toContain('z-40')
      expect(header).not.toContain('var(--color-bg-primary)')

      const bar = html.match(/<header[\s\S]*?<div[^>]*class="[^"]*h-\[72px\][^"]*"/)?.[0]
      // Over the video the pill is tinted glass (the `glass` utility, whose
      // tint and blur are asserted in the background video block).
      expect(bar).toMatch(/class="[^"]*\bglass\b/)
    })

    it('draws the wordmark and CTA inside a bordered pill, as Figma does', () => {
      const bar = html.match(/<header[\s\S]{0,600}?<div[^>]*class="[^"]*h-\[72px\][^"]*"/)?.[0]
      expect(bar).toBeDefined()
      expect(bar).toContain('rounded-full')
      // Dark pages sit over the background video, so the pill is glass with
      // a token-driven fill and edge (tokens.css), never a literal colour.
      expect(bar).toMatch(/class="[^"]*\bglass\b/)
      expect(bar).not.toMatch(/bg-\[(linear-gradient\()?#[0-9a-fA-F]{3,8}/)
    })
  })
})
