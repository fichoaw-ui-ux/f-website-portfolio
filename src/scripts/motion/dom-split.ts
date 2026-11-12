import { toGraphemes } from './split'

/* Text splitting for the reveal kinds. Splitting works on text nodes in place,
   so nested inline elements (the PartHeader number span, links, <strong>)
   keep their styling. The visible split spans are aria-hidden; a visually
   hidden copy of the original text keeps what screen readers read the same.
   `restore` unwraps the split spans back into plain text nodes after the
   entrance (it never rewrites innerHTML, so child elements such as the
   Experience accordion button keep their listeners), and later resizes
   reflow plain text. */

const SR_ONLY =
  'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0'
/* The mask clips the rising text; the padding keeps descenders inside it. */
const MASK = 'display:inline-block;overflow:clip;vertical-align:top;padding-bottom:0.12em;margin-bottom:-0.12em'

function textNodes(el: HTMLElement): Text[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if ((n.textContent ?? '').length > 0) nodes.push(n as Text)
  }
  return nodes
}

function addScreenReaderCopy(el: HTMLElement, text: string): void {
  const copy = document.createElement('span')
  copy.setAttribute('style', SR_ONLY)
  copy.dataset.motionSr = ''
  copy.textContent = text
  el.prepend(copy)
}

function span(text: string, style?: string): HTMLSpanElement {
  const s = document.createElement('span')
  if (style) s.setAttribute('style', style)
  s.textContent = text
  return s
}

/* Wraps every word in a clipping mask; returns the inner (moving) spans. */
export function splitWords(el: HTMLElement): HTMLElement[] {
  const text = (el.innerText || el.textContent || "").trim()
  const inner: HTMLElement[] = []
  for (const node of textNodes(el)) {
    const frag = document.createDocumentFragment()
    for (const part of (node.textContent ?? '').split(/(\s+)/)) {
      if (!part) continue
      if (/^\s+$/.test(part)) { frag.append(part); continue }
      const mask = span('', MASK)
      mask.setAttribute('aria-hidden', 'true')
      mask.dataset.motionSplit = ''
      const move = span(part, 'display:inline-block')
      mask.append(move)
      frag.append(mask)
      inner.push(move)
    }
    node.replaceWith(frag)
  }
  addScreenReaderCopy(el, text)
  return inner
}

/* Wraps every grapheme. `masked` puts each in a clipping mask (letters rise);
   otherwise each is a plain inline span (letters light up in place). Words
   stay unbroken in nowrap wrappers. Returns the animated spans. */
export function splitGraphemes(el: HTMLElement, masked: boolean): HTMLElement[] {
  const text = (el.innerText || el.textContent || "").trim()
  const out: HTMLElement[] = []
  for (const node of textNodes(el)) {
    const frag = document.createDocumentFragment()
    for (const part of (node.textContent ?? '').split(/(\s+)/)) {
      if (!part) continue
      if (/^\s+$/.test(part)) { frag.append(part); continue }
      const word = span('', masked ? 'display:inline-block;white-space:nowrap' : undefined)
      word.setAttribute('aria-hidden', 'true')
      word.dataset.motionSplit = ''
      for (const g of toGraphemes(part)) {
        if (masked) {
          const mask = span('', MASK)
          const move = span(g, 'display:inline-block')
          mask.append(move)
          word.append(mask)
          out.push(move)
        } else {
          const letter = span(g)
          word.append(letter)
          out.push(letter)
        }
      }
      frag.append(word)
    }
    node.replaceWith(frag)
  }
  addScreenReaderCopy(el, text)
  return out
}

export function restore(el: HTMLElement): void {
  el.querySelectorAll('[data-motion-sr]').forEach((n) => n.remove())
  el.querySelectorAll('[data-motion-split]').forEach((n) => n.replaceWith(n.textContent ?? ''))
  el.normalize()
}
