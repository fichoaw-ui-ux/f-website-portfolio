import { describe, it, expect, beforeAll } from 'vitest'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/* Motion markup (spec: docs/superpowers/specs/2026-11-12-site-motion-design.md).
   Components only mark elements with data-motion; the runtime sets every
   start state. These tests read the built pages, so they run after
   `npm run build` (npm test does both). */

const DIST = join(process.cwd(), 'dist')
const page = (p: string) => readFile(join(DIST, p), 'utf8')

const attrs = (html: string, re: RegExp) => [...html.matchAll(re)].map((m) => m[0])
const section = (html: string, id: string) =>
  html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`))?.[0] ?? ''
const tagsWith = (html: string, kind: string) =>
  attrs(html, new RegExp(`<[a-z0-9]+[^>]*data-motion="${kind}"[^>]*>`, 'g'))

describe.each(['index.html', 'id/index.html'])('home motion markup (%s)', (file) => {
  let html = ''
  beforeAll(async () => { html = await page(file) })

  it('reveals every section heading line by line', () => {
    for (const id of ['experience', 'skills', 'work', 'explorations', 'contact']) {
      const h2s = attrs(section(html, id), /<h2[^>]*>/g)
      expect(h2s.length, id).toBeGreaterThan(0)
      for (const h of h2s) expect(h, id).toContain('data-motion="lines"')
    }
  })

  it('reveals each Experience company name line by line', () => {
    const exp = section(html, 'experience')
    const h3s = attrs(exp, /<h3[^>]*>/g)
    expect(h3s.length).toBeGreaterThan(0)
    for (const h of h3s) expect(h).toContain('data-motion="lines"')
  })

  it('raises every Skills and Tools chip a small distance', () => {
    for (const key of ['skills', 'tools']) {
      const list = html.match(new RegExp(`data-figma="skills-tools/${key}/chips"[\\s\\S]*?</ul>`))?.[0] ?? ''
      const chips = attrs(list, /<li[^>]*>/g)
      expect(chips).toHaveLength(key === 'skills' ? 9 : 12)
      for (const c of chips) {
        expect(c).toContain('data-motion="rise"')
        expect(c).toContain('data-motion-distance="sm"')
      }
    }
  })

  it('raises every Study Case card the long distance', () => {
    const cards = attrs(html, /<article[^>]*data-figma="study-case\/[^"]*"[^>]*>/g)
    expect(cards).toHaveLength(3)
    for (const c of cards) {
      expect(c).toContain('data-motion="rise"')
      expect(c).toContain('data-motion-distance="lg"')
    }
  })

  it('raises the footer', () => {
    expect(html).toMatch(/<footer[^>]*data-motion="rise"[^>]*data-figma="footer"|<footer[^>]*data-figma="footer"[^>]*data-motion="rise"/)
  })

  it('hides nothing in the markup itself', () => {
    for (const kind of ['rise', 'lines', 'letters', 'light-load', 'light-scroll']) {
      for (const tag of tagsWith(html, kind)) expect(tag).not.toMatch(/style="[^"]*opacity/)
    }
  })
})

describe('Skills & Tools source', () => {
  it('relies on the shared runtime instead of its own script', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/home/SkillsTools.astro'), 'utf8')
    expect(src).not.toContain('data-chip-list')
    expect(src).not.toContain('<script')
  })
})
