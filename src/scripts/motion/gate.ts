export type MotionEnv = {
  reducedMotion: boolean
  /** The page was reached through the language switch (html[data-lang-switch]). */
  langSwitch: boolean
  /** The element is in the viewport at init. */
  onScreen: boolean
}

/* Whether an element may get a hidden start state. Under reduced motion
   nothing animates; after a language switch, what is already on screen was
   on screen a moment ago in the other language, so it stays as is. */
export function shouldAnimate({ reducedMotion, langSwitch, onScreen }: MotionEnv): boolean {
  if (reducedMotion) return false
  return !(langSwitch && onScreen)
}

export const KINDS = ['rise', 'lines', 'letters', 'light-load', 'light-scroll'] as const
export type Kind = (typeof KINDS)[number]

/** Only known kinds get a start state, so a typo in data-motion never hides an element. */
export function isKind(value: string | undefined): value is Kind {
  return (KINDS as readonly string[]).includes(value ?? '')
}

/** Resolves when `p` settles or after `ms`, whichever comes first (e.g. stalled web fonts). */
export function withTimeout(p: Promise<unknown>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms)
    p.then(() => { clearTimeout(t); resolve() }, () => { clearTimeout(t); resolve() })
  })
}
