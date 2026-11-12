import Lenis from 'lenis'

/* Desktop smooth scroll (spec: docs/superpowers/specs/2026-11-12-site-motion-design.md).
   Only for fine pointers (mouse, trackpad); touch keeps native scrolling, and
   reduced motion turns it off. Same-page anchor links (the home and case
   study tab bars) go through Lenis and land where they did before. Lenis
   already honours the target's scroll-margin-top (--sticky-offset under the
   sticky header and tab bar), so no extra offset is passed. */
export function initSmoothScroll(): Lenis | null {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = window.matchMedia('(pointer: fine)').matches
  if (reducedMotion || !finePointer) return null

  const lenis = new Lenis({ autoRaf: true })

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]')
    if (!link) return
    const id = decodeURIComponent(link.getAttribute('href')!.slice(1))
    const target = id ? document.getElementById(id) : null
    if (!target) return
    event.preventDefault()
    lenis.scrollTo(target)
    history.pushState(null, '', `#${id}`)
  })

  return lenis
}
