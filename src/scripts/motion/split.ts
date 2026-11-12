import { DURATION, LIGHT_LOAD_TOTAL, STAGGER } from './config'

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/** Graphemes of `text`, spaces included (so letters animate one by one). */
export function toGraphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment)
}

/* Groups word indices by line from their offsetTop values. Words are in
   reading order, so a new line starts when the top moves past `tolerance`
   from the current line's first word. */
export function groupByLine(tops: number[], tolerance = 2): number[][] {
  const lines: number[][] = []
  let lineTop = Number.NaN
  tops.forEach((top, i) => {
    if (lines.length === 0 || Math.abs(top - lineTop) > tolerance) {
      lines.push([i])
      lineTop = top
    } else {
      lines[lines.length - 1].push(i)
    }
  })
  return lines
}

/** Per-grapheme stagger so a light-up of `count` graphemes lasts LIGHT_LOAD_TOTAL. */
export function lightStagger(count: number): number {
  return count <= 1 ? 0 : (LIGHT_LOAD_TOTAL - DURATION.lightLetter) / (count - 1)
}

/** Longest letter cascade (s): long titles speed up instead of dragging on. */
export const LETTER_CASCADE_MAX = 1

/** Per-grapheme stagger for the `letters` rise, capped so the cascade stays ≤ LETTER_CASCADE_MAX. */
export function letterStagger(count: number): number {
  return count <= 1 ? STAGGER.letters : Math.min(STAGGER.letters, LETTER_CASCADE_MAX / (count - 1))
}

/** Longest stagger cascade (s) for elements that enter the viewport together. */
export const BATCH_CASCADE_MAX = 0.5

/** Per-element stagger for a batch of `count`, capped so the cascade stays ≤ BATCH_CASCADE_MAX. */
export function batchStagger(count: number): number {
  return count <= 1 ? STAGGER.items : Math.min(STAGGER.items, BATCH_CASCADE_MAX / (count - 1))
}
