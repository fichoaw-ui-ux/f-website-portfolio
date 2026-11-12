import { describe, it, expect, vi } from 'vitest'
import { DURATION, STAGGER, DISTANCE, EASE } from '../src/scripts/motion/config'
import { shouldAnimate, isKind, withTimeout } from '../src/scripts/motion/gate'
import { toGraphemes, groupByLine, lightStagger, letterStagger, batchStagger } from '../src/scripts/motion/split'

/* Motion core (spec: docs/superpowers/specs/2026-11-12-site-motion-design.md).
   The gate decides whether an element gets a hidden start state at all; the
   helpers decide how text is split and how long the hero bio light-up runs. */

describe('shouldAnimate', () => {
  it('skips everything under reduced motion', () => {
    expect(shouldAnimate({ reducedMotion: true, langSwitch: false, onScreen: false })).toBe(false)
  })
  it('leaves on-screen content as is after a language switch', () => {
    expect(shouldAnimate({ reducedMotion: false, langSwitch: true, onScreen: true })).toBe(false)
  })
  it('still animates off-screen content after a language switch', () => {
    expect(shouldAnimate({ reducedMotion: false, langSwitch: true, onScreen: false })).toBe(true)
  })
  it('animates on a normal visit', () => {
    expect(shouldAnimate({ reducedMotion: false, langSwitch: false, onScreen: true })).toBe(true)
  })
})

describe('toGraphemes', () => {
  it('splits text into graphemes, keeping spaces', () => {
    expect(toGraphemes('Ficho Aji')).toEqual(['F', 'i', 'c', 'h', 'o', ' ', 'A', 'j', 'i'])
  })
  it('returns nothing for empty text', () => {
    expect(toGraphemes('')).toEqual([])
  })
})

describe('groupByLine', () => {
  it('groups word indices that share a line, within 2px', () => {
    expect(groupByLine([0, 0, 1, 31, 30, 62])).toEqual([[0, 1, 2], [3, 4], [5]])
  })
})

describe('lightStagger', () => {
  it('needs no stagger for a single letter', () => {
    expect(lightStagger(1)).toBe(0)
  })
  it.each([10, 120, 400])('keeps the whole light-up of %i letters within 1–1.5s', (n) => {
    const total = DURATION.lightLetter + lightStagger(n) * (n - 1)
    expect(total).toBeGreaterThanOrEqual(1)
    expect(total).toBeLessThanOrEqual(1.5)
  })
})

describe('letterStagger', () => {
  it('uses the standard letter stagger for short text', () => {
    expect(letterStagger(16)).toBe(STAGGER.letters)
  })
  it('caps the cascade of a long title at about 1s', () => {
    expect(letterStagger(70) * 69).toBeLessThanOrEqual(1)
  })
})

describe('isKind', () => {
  it('accepts the five motion kinds', () => {
    for (const k of ['rise', 'lines', 'letters', 'light-load', 'light-scroll']) expect(isKind(k)).toBe(true)
  })
  it('rejects anything else, so a typo never hides an element', () => {
    expect(isKind('fade')).toBe(false)
    expect(isKind(undefined)).toBe(false)
  })
})

describe('withTimeout', () => {
  it('stops waiting for a promise that never settles (stalled web fonts)', async () => {
    vi.useFakeTimers()
    let done = false
    const p = withTimeout(new Promise(() => {}), 1000).then(() => { done = true })
    await vi.advanceTimersByTimeAsync(1000)
    await p
    expect(done).toBe(true)
    vi.useRealTimers()
  })
})

describe('batchStagger', () => {
  it('uses the standard item stagger for a few elements', () => {
    expect(batchStagger(4)).toBe(STAGGER.items)
  })
  it('caps the cascade of a large batch at 0.5s', () => {
    expect(batchStagger(23) * 22).toBeLessThanOrEqual(0.5)
  })
})

describe('motion constants stay within the spec', () => {
  it('entrances last 0.4–0.7s', () => {
    for (const d of [DURATION.rise, DURATION.letters, DURATION.lines]) {
      expect(d).toBeGreaterThanOrEqual(0.4)
      expect(d).toBeLessThanOrEqual(0.7)
    }
  })
  it('staggers are 0.03–0.08s', () => {
    for (const s of Object.values(STAGGER)) {
      expect(s).toBeGreaterThanOrEqual(0.03)
      expect(s).toBeLessThanOrEqual(0.08)
    }
  })
  it('travel runs from 8px to 60px', () => {
    expect(DISTANCE.sm).toBe(8)
    expect(DISTANCE.lg).toBe(60)
  })
  it('uses the existing Reveal ease', () => {
    expect(EASE).toEqual([0.22, 1, 0.36, 1])
  })
})
