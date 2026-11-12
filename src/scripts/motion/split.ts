import { DURATION, LIGHT_LOAD_TOTAL } from './config'

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
