/* Shared motion values (spec: docs/superpowers/specs/2026-11-12-site-motion-design.md,
   "Motion values"). Bravik-style: short, quiet entrances. Seconds unless noted. */

/** Ease-out, the curve Reveal.astro already uses. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const DURATION = {
  rise: 0.6,
  letters: 0.6,
  lines: 0.7,
  /** One grapheme of the load-time light-up (hero bio). */
  lightLetter: 0.3,
} as const

export const STAGGER = {
  /** Between elements that enter the viewport together. */
  items: 0.06,
  letters: 0.03,
  lines: 0.08,
} as const

/** Travel in px: chips and meta (sm), default (md), cards and images (lg). */
export const DISTANCE = { sm: 8, md: 24, lg: 60 } as const
export type Distance = keyof typeof DISTANCE

/** Whole duration of the hero bio light-up. */
export const LIGHT_LOAD_TOTAL = 1.2
export const LIGHT_START_OPACITY = 0.4

/** Fire when the element top reaches ~85% of the viewport. */
export const VIEW_MARGIN = '0px 0px -15% 0px'

/** Scroll window of the scrubbed quote: starts at 85% of the viewport, done by 50%. */
export const LIGHT_SCROLL_OFFSET = ['start 0.85', 'end 0.5'] as const
