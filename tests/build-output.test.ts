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

  it('references no typeface other than Plus Jakarta Sans', () => {
    expect(html).not.toContain('Satoshi')
    expect(html).not.toContain('Micro 5')
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
})
