# Site Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Bravik-style scroll entrances, text reveals and desktop smooth scroll to the home page and every case study page.

**Architecture:** Components only mark elements with `data-motion="<kind>"`. One runtime module, loaded once from `BaseLayout.astro`, finds those elements and animates them with `motion`. Elements that enter the viewport in the same observer callback are staggered in DOM order, which gives grids, chips, metrics and snapshot rows their stagger without per-component code. Smooth scroll is a separate module built on Lenis. All start states are set by script, so content is visible without JS and under reduced motion.

**Tech Stack:** Astro 7, Tailwind CSS 4, `motion` 12.42 (`animate`, `scroll`), `lenis` (new), Vitest 4 (node environment).

**Spec:** `docs/superpowers/specs/2026-11-12-site-motion-design.md`

## Before starting

Commit the pending Skills & Tools work first (removal of "UX Writing (EN/ID)" in `src/content/site.ts`, chip entrance + hover in `SkillsTools.astro`), so Task 3's rewrite of the chip script has a clean base.

## Global Constraints

- Build on `motion`; do not add GSAP or SplitText. `lenis` is the only new dependency.
- Animate only `opacity` and `transform`/`translate`/`scale`.
- Entrances 0.4–0.7s, ease `[0.22, 1, 0.36, 1]`, stagger 0.03–0.08s; travel 8px (small items) up to 60px (cards, images); trigger when the element top reaches ~85% of the viewport; one-shot, except `light-scroll`.
- Hover zoom ≤ 1.05. Existing hovers (Study Case, Exploration, NextProject, case study cover: grayscale → colour, `scale-[1.02]`, 500ms) stay unchanged.
- Hero bio lights up on load over about 1–1.5s, not tied to scroll (Ficho's choice).
- Under `prefers-reduced-motion: reduce`: no start states, no animation, no Lenis.
- Landing from a language switch (`html[data-lang-switch]`): elements already on screen show in their end state.
- No hidden-by-default HTML except the existing `Reveal.astro` (cover image), whose safety rules stay.
- Split text keeps the original text for screen readers (`aria-label` on the element, split spans `aria-hidden="true"`), and is restored to the original markup after its entrance.
- No colour, shadow, radius or layout changes (CLAUDE.md). The Skills chip hover glow is Ficho's documented exception.
- Smooth scroll: site-wide from `BaseLayout.astro`, fine pointers only (`(pointer: fine)`); tab-bar anchor jumps land at the same `--sticky-offset` as today.
- Spacing/colour classes follow CLAUDE.md (tokens or exact arbitrary values; no default Tailwind scale).

## Review Focus

1. Reduced motion: every element visible at full opacity, no transforms, native scroll. → Task 1 gate test; Task 5 browser check.
2. JavaScript off or failing: no element hidden by markup. → Task 3 and 4 build-output tests (no `opacity:0` in `data-motion` markup).
3. Language-switch landing: on-screen content does not replay its entrance. → Task 1 gate test.
4. Tab-bar jump with Lenis on: section top lands at `--sticky-offset` (±2px), as without Lenis. → Task 5 browser check.
5. Window resize mid-page after headings were split: no stale line breaks or clipped text. → Task 2 restores original markup after the entrance; Task 2 browser check resizes after the entrance.

---

### Task 1: Motion constants, gate and split helpers (pure)

**Files:**
- Create: `src/scripts/motion/config.ts`, `src/scripts/motion/gate.ts`, `src/scripts/motion/split.ts`
- Test: `tests/motion-core.test.ts`
- Commit with these: the spec `docs/superpowers/specs/2026-11-12-site-motion-design.md` and this plan.

**Interfaces:**
- Produces:
  - `config.ts`: `EASE: [0.22, 1, 0.36, 1]`; `DURATION = { rise: 0.6, letters: 0.6, lines: 0.7, lightLetter: 0.3 }`; `STAGGER = { items: 0.06, letters: 0.03, lines: 0.08 }`; `DISTANCE = { sm: 8, md: 24, lg: 60 }` (px); `LIGHT_LOAD_TOTAL = 1.2` (s); `LIGHT_START_OPACITY = 0.4`; `VIEW_MARGIN = '0px 0px -15% 0px'`; `LIGHT_SCROLL_OFFSET = ['start 0.85', 'end 0.5']`.
  - `gate.ts`: `type MotionEnv = { reducedMotion: boolean; langSwitch: boolean; onScreen: boolean }`; `shouldAnimate(env: MotionEnv): boolean`.
  - `split.ts`: `toGraphemes(text: string): string[]`; `groupByLine(tops: number[], tolerance?: number): number[][]` (indices grouped by equal `offsetTop`, default tolerance 2px); `lightStagger(count: number): number` (per-letter stagger so the whole light-up lasts `LIGHT_LOAD_TOTAL`).

- [ ] **Step 1: Write the failing tests** in `tests/motion-core.test.ts`:
  - `shouldAnimate`: `{reducedMotion:true, langSwitch:false, onScreen:false}` → false; `{false, true, true}` → false; `{false, true, false}` → true; `{false, false, true}` → true.
  - `toGraphemes('Ficho Aji')` → `['F','i','c','h','o',' ','A','j','i']`; `toGraphemes('')` → `[]`.
  - `groupByLine([0, 0, 1, 31, 30, 62])` → `[[0,1,2],[3,4],[5]]`.
  - `lightStagger(1)` → `0`; for `n` in `[10, 120, 400]`: `DURATION.lightLetter + lightStagger(n) * (n - 1)` is within `[1.0, 1.5]`.
  - Spec bounds: every `DURATION.rise|letters|lines` in `[0.4, 0.7]`; every `STAGGER` value in `[0.03, 0.08]`; `DISTANCE.sm === 8`, `DISTANCE.lg === 60`; `EASE` equals `[0.22, 1, 0.36, 1]`.
- [ ] **Step 2: Run** `npx vitest run tests/motion-core.test.ts` — expected FAIL (modules not found).
- [ ] **Step 3: Implement** the three modules. `toGraphemes` uses `Intl.Segmenter` (grapheme granularity). `lightStagger(n) = n <= 1 ? 0 : (LIGHT_LOAD_TOTAL - DURATION.lightLetter) / (n - 1)`.
- [ ] **Step 4: Run** `npx vitest run tests/motion-core.test.ts` — expected PASS.
- [ ] **Step 5: Commit** `feat(motion): add motion constants, gate and split helpers` (include spec and plan).

### Task 2: Motion runtime, wired into BaseLayout

**Files:**
- Create: `src/scripts/motion/index.ts`, `src/scripts/motion/dom-split.ts`
- Modify: `src/layouts/BaseLayout.astro` (one module `<script>` calling `initMotion()`)
- Modify: `src/components/home/Hero.astro` (first markup, to verify the runtime): `h1` → `data-motion="letters" data-motion-trigger="load"`; handle `<p>`, `hero/meta` `<li>`s, `hero/socials` `<li>`s → `data-motion="rise" data-motion-distance="sm" data-motion-trigger="load"`; `hero/bio` → `data-motion="light-load"`.

**Interfaces:**
- Consumes: everything from Task 1.
- Produces — the attribute vocabulary every later task uses:
  - `data-motion="rise"`: opacity 0 → 1 and `translateY(d)` → 0 over `DURATION.rise`. `data-motion-distance="sm|md|lg"` picks `DISTANCE` (default `md`).
  - `data-motion="lines"`: words wrapped in `overflow: clip` inline-block masks; each word's inner span rises from `translateY(100%)` with opacity 0 → 1; words on the same line (via `groupByLine` on `offsetTop`) share a delay of `lineIndex * STAGGER.lines`. Works across nested inline elements (e.g. the PartHeader number `<span>`) by splitting text nodes in place.
  - `data-motion="letters"`: like `lines`, but each grapheme rises, staggered by `STAGGER.letters`; words stay unbroken (`white-space: nowrap` word wrappers).
  - `data-motion="light-load"`: graphemes start at `LIGHT_START_OPACITY` and go to 1, `DURATION.lightLetter` each, `lightStagger(count)` apart, starting on load.
  - `data-motion="light-scroll"`: same start state; opacity driven by `scroll()` over `LIGHT_SCROLL_OFFSET` with the element as target; never one-shot.
  - `data-motion-trigger="load"`: run on `DOMContentLoaded` (after `document.fonts.ready` for split kinds) instead of on view, staggered in DOM order.
  - `data-motion-delay="<ms>"`: extra delay.
  - Batching: one `IntersectionObserver` (`rootMargin: VIEW_MARGIN`); entries intersecting in the same callback animate in DOM order, each `STAGGER.items` after the previous; each element is unobserved after it starts.
  - `dom-split.ts`: `splitWords(el: HTMLElement): HTMLElement[]`, `splitGraphemes(el: HTMLElement): HTMLElement[]`, `restore(el: HTMLElement, html: string, label: string | null): void`. Split elements get `aria-label` = original `textContent` (trimmed); wrappers get `aria-hidden="true"`; after the entrance finishes, `restore` puts back the original `innerHTML` and previous `aria-label`.
  - Split kinds split lazily, at the moment their entrance starts (never at init), so the line grouping matches the current width and fonts; `restore` after the entrance means later resizes reflow normal text.
  - `initMotion(): void` — exported from `index.ts`; for each `[data-motion]`, call `shouldAnimate({ reducedMotion, langSwitch, onScreen })` before setting any start state; if false, leave it untouched.

- [ ] **Step 1: Build check** `npm run build` — passes before changes.
- [ ] **Step 2: Implement** `dom-split.ts` and `index.ts` per the interface above; add the `<script>import { initMotion } from '../scripts/motion'; initMotion()</script>` to `BaseLayout.astro`; add the Hero attributes.
- [ ] **Step 3: Run** `npm test` — expected PASS (existing suites + Task 1).
- [ ] **Step 4: Browser check** (dev server, Browser pane visible; take screenshots so frames render): load `/` at 1440×900 → name letters rise, handle/meta/socials follow, bio lights up and ends at opacity 1 within ~1.5s. `read_page` on the `h1` shows the full name as its accessible name. Then resize to 402×874 → hero text wraps normally (markup restored, no leftover mask spans: `document.querySelectorAll('[data-motion] [aria-hidden]').length === 0` after 2s).
- [ ] **Step 5: Commit** `feat(motion): add motion runtime and hero entrance`.

### Task 3: Home page markup

**Files:**
- Modify: `src/components/home/Experience.astro`, `SkillsTools.astro`, `StudyCase.astro`, `Explorations.astro`, `Contact.astro`, `src/components/layout/FooterRedesign.astro`
- Test: `tests/motion-markup.test.ts` (home part)

**Interfaces:**
- Consumes: Task 2 attribute vocabulary.
- Placement:
  - Section `h2` headings (Experience, Skills, Tools, "My selected works", Exploration, Contact): `data-motion="lines"`.
  - Experience: each company name `h3` → `lines`; the rest of each entry (role rows and bullets, not the `h3`) → `rise`.
  - SkillsTools: each chip `li` → `rise` `sm`. Delete the component's own `<script>` and `data-chip-list` / `data-chip` logic; keep the hover classes (lift + glow, `motion-safe:desktop:hover:…`).
  - StudyCase and Explorations: each card (`article` / card `li`) → `rise` `lg`. Hovers unchanged.
  - Contact: each contact row `li` → `rise` `sm`; any intro paragraph → `rise`.
  - FooterRedesign: root `footer` → `rise` `sm`.

- [ ] **Step 1: Write the failing test** `home has motion markup`: parse `dist/index.html` and `dist/id/index.html`; assert counts: `data-motion="lines"` ≥ 6 + number of Experience companies; `data-motion="rise"` on every chip in `[data-figma="skills-tools/skills/chips"]` and `.../tools/chips` (9 and 12); every Study Case `article[data-figma^="study-case/"]` has `data-motion="rise"` and `data-motion-distance="lg"`; footer `[data-figma="footer"]` has `data-motion="rise"`; and no element with `data-motion` has an inline `style` containing `opacity`. Also `SkillsTools.astro` source no longer contains `data-chip-list`.
- [ ] **Step 2: Run** `npm test` — expected FAIL on the new test.
- [ ] **Step 3: Add the attributes** listed above.
- [ ] **Step 4: Run** `npm test` — expected PASS.
- [ ] **Step 5: Browser check** at 1440 and 402: scroll the whole home page; every section enters once, chips and cards stagger, hovers on chips/Study Case/Exploration unchanged, nothing stays transparent after reaching the bottom.
- [ ] **Step 6: Commit** `feat(motion): animate home page sections`.

### Task 4: Case study markup

**Files:**
- Modify: `src/layouts/CaseStudyLayout.astro`, `src/components/case-study/PartHeader.astro`, `Section.astro`, `ImageFull.astro`, `FigmaEmbed.astro`, `Metrics.astro`, `Quote.astro`, `ProjectSnapshot.astro`, `NextProject.astro`
- Test: `tests/motion-markup.test.ts` (case study part)

**Interfaces:**
- Consumes: Task 2 vocabulary.
- Placement:
  - `CaseStudyLayout`: remove the first `<Reveal>` (title block); `h1` → `letters` + `data-motion-trigger="load"`; summary `p` → `rise` + `trigger="load"`. The cover keeps its `<Reveal delay={100}>`.
  - `PartHeader` `h2` → `lines`. `Section` title heading → `lines`; `Section` body wrapper → `rise`.
  - `ImageFull` and `FigmaEmbed` root `figure` → `rise` `lg` (inside `ImageGrid` the batch stagger handles the order; `ImageGrid` itself gets nothing).
  - `Metrics`: each metric card → `rise`. `ProjectSnapshot`: each row → `rise` `sm`.
  - `Quote` `blockquote` → `light-scroll`.
  - `NextProject` heading → `lines`; card `article` → `rise` `lg`.

- [ ] **Step 1: Write the failing test** `case study has motion markup` for `dist/work/quick-transfer/index.html` and `dist/id/work/quick-transfer/index.html`: `h1` has `data-motion="letters"`; every `[data-part-header] h2` has `lines`; every `figure` that is not the cover has `rise`; every `blockquote` has `light-scroll`; every element inside `[data-figma="case-study/snapshot"]` row has `rise`; the title block is no longer inside `.reveal`; and no `data-motion` element has inline `opacity`.
- [ ] **Step 2: Run** `npm test` — expected FAIL.
- [ ] **Step 3: Add the attributes** listed above.
- [ ] **Step 4: Run** `npm test` — expected PASS.
- [ ] **Step 5: Browser check** on `/work/quick-transfer/` and `/id/work/voucher-points-banner/` at 1440 and 402: title letters rise on load, parts and sections enter on scroll, image grids stagger, the quote lights up while scrolling and reverses when scrolling back, NextProject card enters, case study tab bar still works.
- [ ] **Step 6: Commit** `feat(motion): animate case study pages`.

### Task 5: Smooth scroll

**Files:**
- Modify: `package.json` / lockfile (`npm install lenis`)
- Create: `src/scripts/motion/smooth-scroll.ts`
- Modify: `src/layouts/BaseLayout.astro` (call `initSmoothScroll()` from the same module script), `src/styles/global.css` (Lenis CSS)

**Interfaces:**
- Consumes: `shouldAnimate` is not used here; the gate is `matchMedia('(pointer: fine)').matches && !reducedMotion`.
- Produces: `initSmoothScroll(): Lenis | null` in `smooth-scroll.ts`.
- Behaviour:
  - Lenis with `autoRaf: true`, default `lerp`, touch untouched.
  - Same-page anchor clicks (`a[href^="#"]`, including the home and case study tab bars) go through `lenis.scrollTo(target, { offset: -stickyOffset })`, where `stickyOffset` is the computed `--sticky-offset` in px; update `location.hash` without a jump.
  - While Lenis is active, the global `scroll-behavior: smooth` must not fight it: add Lenis's recommended CSS (`html.lenis, html.lenis body { height: auto }`, `.lenis-smooth { scroll-behavior: auto !important }`, `.lenis-stopped { overflow: hidden }`) to `global.css`.
  - The language-switch restore in `BaseLayout.astro` runs before Lenis starts; Lenis must start from the restored position.

- [ ] **Step 1: Write the failing test** in `tests/motion-markup.test.ts`: `package.json` dependencies include `lenis`; built CSS contains `.lenis-smooth`.
- [ ] **Step 2: Run** `npm test` — expected FAIL.
- [ ] **Step 3: Implement** `smooth-scroll.ts`, the CSS and the BaseLayout call.
- [ ] **Step 4: Run** `npm test` — expected PASS.
- [ ] **Step 5: Browser check** (1440×900, pane visible): `document.documentElement.classList.contains('lenis')` is true; click each home tab (Experience, Skills & Tools, Study Case, Exploration) and each case study part tab → after settling, the target's `getBoundingClientRect().top` equals the computed `--sticky-offset` ±2px, and the active tab updates. Switch EN → ID mid-page → lands on the same section. At 402×874 (mobile emulation, touch): `lenis` class absent or Lenis not smoothing touch.
- [ ] **Step 6: Reduced-motion check:** the module script runs before the console is reachable, so on a loaded page stub `window.matchMedia` so `(prefers-reduced-motion: reduce)` matches, call `initSmoothScroll()` and `initMotion()` again on newly added test elements, and confirm `initSmoothScroll()` returns `null` and that after `initMotion()` every `[data-motion]` element has computed opacity 1 and no inline transform. The gate itself is covered by Task 1's unit test.
- [ ] **Step 7: Commit** `feat(motion): add desktop smooth scroll with Lenis`.
