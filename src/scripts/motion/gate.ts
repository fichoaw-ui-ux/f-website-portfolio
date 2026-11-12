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
