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
    it('greets by name in a single h1', () => {
      const h1s = html.match(/<h1\b/g) ?? []
      expect(h1s).toHaveLength(1)
      expect(html).toContain('Halo!')
      expect(html).toContain('Saya Ficho.')
      expect(html).toContain('product designer')
    })

    it('drops the availability badge, CTAs, and scroll hint', () => {
      expect(html).not.toContain('Available for work')
      expect(html).not.toContain('See projects')
      expect(html).not.toContain('Scroll down')
    })

    it('shows the avatar as decorative, since the h1 already names him', () => {
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

  describe('about', () => {
    it('runs the bio as two paragraphs and drops the section badge pattern', () => {
      expect(html).toContain('Profil')
      // Proves site.bio renders as two separate <p> tags, not one joined blob.
      expect(html).toMatch(/\(KYC (&|&amp;) KYB\)\.<\/p><p>Berlatar belakang Sistem Informasi/)
    })

    it('shows the real portrait, described rather than decorative', () => {
      expect(html).toMatch(/<img[^>]+ficho-portrait\.png[^>]+alt="Potret Ficho"/)
    })

    it('keeps the skills and tools groups labelled', () => {
      expect(html).toContain('SKILL')
      expect(html).toContain('TOOLS')
      expect(html).toContain('Mixpanel')
      expect(html).not.toContain('Framer')
    })
  })

  describe('experience', () => {
    it('lists company and role per entry', () => {
      expect(html).toContain('Pengalaman Kerja')
      expect(html).toMatch(/Transfez (&#38;|&amp;|&) Jack/)
      expect(html).toContain('Desainer Grafis')
    })

    it('renders every responsibility as a bulleted list item', () => {
      // Same content shape as the English version, just translated — the
      // item/label count is language-independent.
      const bullets = html.match(/aria-hidden="true">&bull;/g) ?? []
      expect(bullets).toHaveLength(14)
      expect(html).toMatch(/<li[^>]*>\s*<span[^>]*aria-hidden/)
      expect(html).toContain('Tanggung Jawab Umum')
      expect(html).toContain('<mark')
      expect(html).not.toContain('**')
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
      expect(html).toContain('href="/id/#about"')
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
      expect(header).toContain('var(--color-bg-primary)')

      const bar = html.match(/<header[\s\S]*?<div[^>]*class="[^"]*h-\[72px\][^"]*"/)?.[0]
      expect(bar).toContain('var(--color-bg-elevated)')
    })

    it('draws the wordmark and CTA inside a bordered pill, as Figma does', () => {
      const bar = html.match(/<header[\s\S]{0,600}?<div[^>]*class="[^"]*h-\[72px\][^"]*"/)?.[0]
      expect(bar).toBeDefined()
      expect(bar).toContain('rounded-full')
      expect(bar).toContain('stroke-gradient')
      expect(bar).toContain('var(--color-bg-elevated)')
      expect(bar).not.toMatch(/bg-\[(linear-gradient\()?#[0-9a-fA-F]{3,8}/)
    })
  })
})
