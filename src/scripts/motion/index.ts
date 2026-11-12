import { animate, scroll, stagger } from 'motion'
import {
  DISTANCE, DURATION, EASE, LIGHT_SCROLL_OFFSET, LIGHT_START_OPACITY, STAGGER, VIEW_MARGIN,
  type Distance,
} from './config'
import { shouldAnimate } from './gate'
import { groupByLine, lightStagger } from './split'
import { restore, splitGraphemes, splitWords } from './dom-split'

/* Entrance runtime (spec: docs/superpowers/specs/2026-11-12-site-motion-design.md).
   Components mark elements with data-motion="<kind>":
     rise          fade in while rising data-motion-distance (sm | md | lg)
     lines         words rise out of masks, one line after another
     letters       letters rise out of masks, one after another
     light-load    letters light up from 0.4 to 1 once the page has loaded
     light-scroll  letters light up from 0.4 to 1 with scroll (reverses)
   data-motion-trigger="load" plays on load instead of on view;
   data-motion-delay="<ms>" adds a delay.
   Start states are set here only, after the gate, so the HTML shows
   everything without JS and under reduced motion. Elements that enter the
   viewport together play in DOM order, STAGGER.items apart. */

type Kind = 'rise' | 'lines' | 'letters' | 'light-load' | 'light-scroll'

const fontsReady = (): Promise<unknown> => document.fonts?.ready ?? Promise.resolve()

function distance(el: HTMLElement): number {
  const d = el.dataset.motionDistance as Distance | undefined
  return DISTANCE[d && d in DISTANCE ? d : 'md']
}

function ownDelay(el: HTMLElement): number {
  return Number(el.dataset.motionDelay ?? 0) / 1000
}

function prepare(el: HTMLElement, kind: Kind): void {
  if (kind === 'rise') {
    el.style.opacity = '0'
    el.style.transform = `translateY(${distance(el)}px)`
  } else if (kind === 'light-load') {
    el.style.opacity = String(LIGHT_START_OPACITY)
  } else {
    el.style.opacity = '0'
  }
}

function clear(el: HTMLElement): void {
  el.style.removeProperty('opacity')
  el.style.removeProperty('transform')
}

async function play(el: HTMLElement, kind: Kind, delay: number): Promise<void> {
  if (kind === 'rise') {
    // Plain Web Animation with fill "backwards": it holds the start state
    // through the delay, so the inline start state can go now, and nothing
    // is left inline when it ends (motion's animate() commits end values
    // inline, which would pin opacity/transform on the element).
    el.animate(
      { opacity: [0, 1], transform: [`translateY(${distance(el)}px)`, 'translateY(0px)'] },
      { duration: DURATION.rise * 1000, delay: delay * 1000, easing: `cubic-bezier(${EASE.join(',')})`, fill: 'backwards' },
    )
    clear(el)
    return
  }

  await fontsReady()
  const html = el.innerHTML

  if (kind === 'lines') {
    const words = splitWords(el)
    const lines = groupByLine(words.map((w) => (w.parentElement as HTMLElement).offsetTop))
    words.forEach((w) => { w.style.opacity = '0'; w.style.transform = 'translateY(100%)' })
    clear(el)
    await Promise.all(lines.map((line, i) => animate(
      line.map((n) => words[n]),
      { opacity: [0, 1], transform: ['translateY(100%)', 'translateY(0%)'] },
      { duration: DURATION.lines, delay: delay + i * STAGGER.lines, ease: EASE },
    )))
  } else if (kind === 'letters') {
    const letters = splitGraphemes(el, true)
    letters.forEach((l) => { l.style.opacity = '0'; l.style.transform = 'translateY(100%)' })
    clear(el)
    await animate(
      letters,
      { opacity: [0, 1], transform: ['translateY(100%)', 'translateY(0%)'] },
      { duration: DURATION.letters, delay: stagger(STAGGER.letters, { startDelay: delay }), ease: EASE },
    )
  } else if (kind === 'light-load') {
    const letters = splitGraphemes(el, false)
    letters.forEach((l) => { l.style.opacity = String(LIGHT_START_OPACITY) })
    clear(el)
    await animate(
      letters,
      { opacity: [LIGHT_START_OPACITY, 1] },
      { duration: DURATION.lightLetter, delay: stagger(lightStagger(letters.length), { startDelay: delay }), ease: 'linear' },
    )
  }
  restore(el, html)
}

/* Scrubbed light-up: never one-shot and never restored, since it reverses
   with scroll. Split once fonts are in; text flows normally (inline spans). */
async function setupLightScroll(el: HTMLElement): Promise<void> {
  el.style.opacity = String(LIGHT_START_OPACITY)
  await fontsReady()
  const letters = splitGraphemes(el, false)
  letters.forEach((l) => { l.style.opacity = String(LIGHT_START_OPACITY) })
  clear(el)
  const animation = animate(
    letters,
    { opacity: [LIGHT_START_OPACITY, 1] },
    { duration: DURATION.lightLetter, delay: stagger(lightStagger(letters.length)), ease: 'linear' },
  )
  scroll(animation, { target: el, offset: [...LIGHT_SCROLL_OFFSET] })
}

function byDocumentOrder(a: Element, b: Element): number {
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
}

export function initMotion(): void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const langSwitch = document.documentElement.hasAttribute('data-lang-switch')
  const onLoad: HTMLElement[] = []
  const onView: HTMLElement[] = []

  for (const el of document.querySelectorAll<HTMLElement>('[data-motion]')) {
    const kind = el.dataset.motion as Kind
    const r = el.getBoundingClientRect()
    const onScreen = r.bottom > 0 && r.top < window.innerHeight
    if (!shouldAnimate({ reducedMotion, langSwitch, onScreen })) continue
    if (kind === 'light-scroll') { void setupLightScroll(el); continue }
    prepare(el, kind)
    if (el.dataset.motionTrigger === 'load' || kind === 'light-load') onLoad.push(el)
    else onView.push(el)
  }

  onLoad.forEach((el, i) => {
    void play(el, el.dataset.motion as Kind, i * STAGGER.items + ownDelay(el))
  })

  if (onView.length === 0) return
  const observer = new IntersectionObserver((entries) => {
    const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement)
    entering.sort(byDocumentOrder).forEach((el, i) => {
      observer.unobserve(el)
      void play(el, el.dataset.motion as Kind, i * STAGGER.items + ownDelay(el))
    })
  }, { rootMargin: VIEW_MARGIN })
  onView.forEach((el) => observer.observe(el))
}
