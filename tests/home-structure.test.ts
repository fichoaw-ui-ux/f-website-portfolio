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
      expect(html).toContain('Saya Ficho, product designer')
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

  describe('hero fog background', () => {
    it('mounts a decorative fog layer wrapping a canvas', () => {
      const layer = html.match(/<div[^>]*data-fog-layer[^>]*>/)?.[0]
      expect(layer).toBeDefined()
      expect(layer).toContain('aria-hidden="true"')
      expect(html).toMatch(/<div[^>]*data-fog-layer[^>]*>\s*<canvas/)
    })

    it('clips the fog to the hero and puts it behind the headline', () => {
      const hero = html.match(/<section[^>]*>(?=\s*<div[^>]*data-fog-layer)/)?.[0]
      expect(hero).toBeDefined()
      expect(hero).toContain('overflow-hidden')
      expect(hero).toContain('relative')
      expect(hero).toContain('isolate')
    })

    it('keeps the fog behind the headline rather than over it', () => {
      expect(html).toMatch(/\.fog-layer\[[^\]]+\][^}]*z-index:\s*-1/)
    })
  })

  describe('selected works', () => {
    it('uses the Indonesian heading and sub-copy', () => {
      expect(html).toContain('Karya pilihanku')
      expect(html).toContain('mata yang detail')
      expect(html).not.toContain('My selected works')
    })

    it('labels each card with a Lihat Detail pill', () => {
      expect(html).toContain('Lihat Detail')
      expect(html).not.toContain('View Details')
    })
  })

  describe('about', () => {
    it('runs the bio as one paragraph and drops the section badge pattern', () => {
      expect(html).toContain('Profil')
      // Proves site.bio was joined into a single <p>: with two paragraphs a
      // closing and opening tag would sit between these two sentences.
      expect(html).toContain('compliance flows. Background Sistem Informasi')
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
      expect(html).toContain('Great Giant Foods')
      expect(html).toContain('Corporate Communication')
    })

    it('renders every responsibility as a bulleted list item', () => {
      // Same content shape as the English version, just translated — the
      // item/label count is language-independent.
      const bullets = html.match(/aria-hidden="true">&bull;/g) ?? []
      expect(bullets).toHaveLength(16)
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
      expect(html).toContain('Yuk, bikin sesuatu bareng')
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
      expect(html).toContain('href="/#work"')
      expect(html).toContain('href="/#about"')
      expect(html).toContain('href="/#experience"')
      expect(html).toContain('href="/#explorations"')
      expect(html).not.toContain('Get in touch')
    })

    it('offers the ID/EN language switcher', () => {
      expect(html).toMatch(/>ID<\/a>/)
      expect(html).toMatch(/>EN<\/a>/)
      expect(html).toMatch(/href="\/en\/?"/)
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
