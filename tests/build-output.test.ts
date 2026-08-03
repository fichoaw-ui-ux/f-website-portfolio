import { describe, it, expect, beforeAll } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = join(process.cwd(), 'dist')

function rethrowIfMissingDist(err: unknown): never {
  if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
    throw new Error('dist/ not found — run `npm run build` before this test')
  }
  throw err
}

async function readHomeHtml(): Promise<string> {
  return readFile(join(DIST, 'index.html'), 'utf8').catch(rethrowIfMissingDist)
}

async function readAllCss(): Promise<string> {
  const assetsDir = join(DIST, '_astro')
  const files = await readdir(assetsDir).catch(rethrowIfMissingDist)
  const cssFiles = files.filter(f => f.endsWith('.css'))
  const contents = await Promise.all(
    cssFiles.map(f => readFile(join(assetsDir, f), 'utf8'))
  )
  return contents.join('\n')
}

describe('built home page', () => {
  let html: string
  let css: string

  beforeAll(async () => {
    html = await readHomeHtml()
    css = await readAllCss()
  })

  it('requests no external fonts', () => {
    expect(html).not.toContain('fontshare.com')
    expect(html).not.toContain('fonts.googleapis.com')
    expect(html).not.toContain('fonts.gstatic.com')
  })

  it('references Aileron and no other typeface', () => {
    expect(css).toContain('Aileron')
    expect(css).not.toContain('Plus Jakarta Sans')
    expect(html).not.toContain('Plus Jakarta Sans')
    expect(html).not.toContain('Satoshi')
    expect(css).not.toContain('Micro 5')
    expect(css).not.toContain('JetBrains')
  })

  it('defines no hued accent tokens', () => {
    // The old blue and red accents must not survive in the shared stylesheet.
    // Case-insensitive on purpose: the minifier lowercases hex *values*
    // (--color-accent:#1e4fcf), while hexes baked into Tailwind arbitrary-value
    // class names keep their authored case. A case-sensitive check silently
    // misses the token path, which is the main thing this guard protects.
    expect(css).not.toMatch(/#1E4FCF/i)
    expect(css).not.toMatch(/#DC2626/i)
  })

  it('uses the Figma palette', () => {
    expect(css).toMatch(/--color-bg-primary:\s*#0b0b0b/i)
    expect(css).toMatch(/--color-text-primary:\s*#fff/i)
    expect(css).toMatch(/--color-text-secondary:\s*#bbbbc0/i)
    expect(css).toMatch(/--color-text-tertiary:\s*#909098/i)
  })

  it('drops the sub-AA grey that --color-text-tertiary used to hold', () => {
    // #525252 was 2.4:1 on the page background. The token name survives but
    // now points at #909098 (6.2:1), so guard the value, not the name.
    expect(css).not.toMatch(/#525252/i)
    expect(css).not.toMatch(/#A1A1A1/i)
  })

  it('forces Reveal to its end state under reduced motion', () => {
    // Reveal fades in via the Web Animations API, which the blanket
    // transition/animation collapse cannot reach — and its elements start at
    // inline opacity:0. Without this rule, a reduced-motion user still gets
    // the animation, and anyone whose script does not reveal them gets a
    // blank page.
    expect(css).toMatch(/prefers-reduced-motion[\s\S]{0,600}\.reveal\s*\{[^}]*opacity:\s*1/)
  })

  it('ships no HTML comments', () => {
    // Astro strips `{/* ... */}` but passes `<!-- ... -->` straight through to
    // the browser. Design rationale written for the next maintainer belongs in
    // the source, not in the response — use the JSX form in .astro templates.
    expect(html).not.toContain('<!--')
  })

  it('leaks no literal "undefined" into the markup', () => {
    // `astro build` transpiles frontmatter with esbuild, which strips types
    // without checking them. Reading a field that no longer exists on
    // `site` is therefore not a build error — it renders the string
    // "undefined" into the page, or nothing at all, and the build stays
    // green. Nothing else in this suite would notice. This is the guard.
    expect(html).not.toContain('undefined')
  })
})
