# Site motion (home + case studies)

## Why

Ficho finds the portfolio "very plain" (*polos banget*) everywhere, including
while scrolling. The reference is [Bravik](https://bravik.webflow.io/), whose
interactions Ficho described in an earlier session as "simple and not over the
top" (*simple dan tidak berlebihan*). Ficho wants all six Bravik effects listed
below, on the home page and on every case study page, so the site feels
interactive.

## Goals

- Every section of the home page and of the case study pages has a scroll
  entrance, in Bravik's restrained style.
- Smooth scroll on desktop.
- Motion is consistent: one set of durations, easings and distances, reused.

## Non-goals

- No new layout, colour, type or content changes. Motion only.
- No page transitions between routes (the language-switch cross-fade stays as
  it is).
- No cursor effects, parallax backgrounds, or 3D.

## Anti-goals (a failure even if it works)

- Motion that feels flashy or slow: long durations, big travel, bouncy easing.
  Bravik's moves are short and quiet; ours should be too.
- Content that stays invisible when JavaScript fails, the tab is in the
  background, or the user prefers reduced motion.
- Scroll that feels laggy or breaks the tab bar's jump-to-section.
- Layout shift: animated elements must hold their final size from the first
  paint.

## The six effects (Bravik, as measured on 2026-11-12)

Bravik uses GSAP + SplitText + ScrollTrigger + Lenis 1.0.23. Measured
behaviour:

1. **Smooth scroll** (Lenis).
2. **Hero title, per letter:** each letter sits in a clipped mask and slides up
   into place, staggered.
3. **Section headings, per line:** each line sits in a clipped mask, starts
   hidden below and transparent, and slides up + fades in, staggered per line.
   Trigger: element top reaches 85% of the viewport.
4. **Scrubbed paragraph:** letters start at opacity 0.4 and light up to 1 one
   by one, tied to scroll position (scrub ≈ 0.8, stagger 0.05 per letter),
   so it reverses when scrolling back up.
5. **Cards:** fade in while rising 60px; FAQ items scale from 0.8 to 1 with a
   fade. Trigger: top 85%.
6. **Card image hover:** the image zooms slightly on hover.

## Where each effect goes

### Home (`src/components/home/*`)

| Area | Effect |
| --- | --- |
| Hero name (`h1`) | 2. Per-letter rise, on page load |
| Hero handle, meta, socials | 5. Fade + rise, staggered after the name |
| Hero bio (`hero/bio`) | 4, load-time variant (Ficho's choice): letters light up from 0.4 to 1 one by one over about 1–1.5s after load, not tied to scroll, so the intro is never left dimmed. |
| Section headings: Skills, Tools, "My selected works", Exploration, Contact, Experience company names | 3. Per-line mask rise |
| Experience entries | 5. Fade + rise, staggered |
| Skills & Tools chips | Already built (2026-11-12): staggered fade + rise, desktop hover lift + glow. Keep. |
| Study Case cards | 5. Fade + rise; 6. hover already exists (grayscale → colour, scale 1.02). Keep the hover. |
| Exploration cards/images | 5. Fade + rise; 6. hover already exists (grayscale → colour, scale 1.02, 500ms), same as Study Case. Keep it. |
| Contact block, footer | 5. Fade + rise |

### Case study (`src/layouts/CaseStudyLayout.astro`, `src/components/case-study/*`)

| Area | Effect |
| --- | --- |
| Title and summary (currently `Reveal`) | 2. Per-letter rise for the title; summary fades + rises (keeps current `Reveal` behaviour) |
| `PartHeader` (01–05) | 3. Per-line mask rise |
| `Section` titles | 3. Per-line mask rise |
| `Section` body text | 5. Fade + rise (paragraphs, lists, tables as one block) |
| `ImageFull`, `ImageGrid`, `FigmaEmbed` | 5. Fade + rise; `ImageGrid` items staggered |
| `Metrics` | 5. Fade + rise, staggered per metric |
| `Quote` | 4. Scrubbed letter light-up, tied to scroll. Start/end window is the builder's call (e.g. element top at 85% → element bottom at 50%); the quote must reach full opacity before it leaves the viewport. |
| `ProjectSnapshot` rows | 5. Fade + rise, staggered |
| `NextProject` card | 5. Fade + rise; 6. hover matches the home Study Case card |

## Constraints

- **Stack:** Astro 7, Tailwind CSS 4, `motion` 12.42 (already installed, used
  by `Reveal.astro` and `SkillsTools.astro`). Build the entrances on `motion`
  (`animate`, `inView`, `scroll`, `stagger`); do not add GSAP. Smooth scroll
  adds `lenis` as the one new dependency.
- **Smooth scroll site-wide (builder's call):** Lenis lives in `BaseLayout.astro`, so it also covers the legacy exploration detail pages and 404; nothing there conflicts with it.
- **Smooth scroll only on desktop pointers.** Leave touch scrolling native
  (Lenis's default). Off under reduced motion.
- **Tab bar:** `TabBar.astro` listens to `scroll` and jumps to sections via
  anchors with `scroll-mt-(--sticky-offset)` and the global
  `scroll-behavior: smooth`. With Lenis on, anchor jumps must go through Lenis
  and land at the same offset as today. The language-switch scroll restore in
  `BaseLayout.astro` uses `window.scrollTo({ behavior: 'instant' })` and must
  still land correctly.
- **Reduced motion:** every effect is skipped and content shows in its end
  state, following the existing pattern (`global.css` forces `.reveal` to its
  end state; scripts check `prefers-reduced-motion` before setting a hidden
  start state).
- **No hidden-by-default HTML.** Start states are set by script only, so
  content is visible without JS. The exception is `Reveal.astro`, which
  already uses inline `opacity:0`; keep its current safety rules.
- **Language switch:** content already on screen when landing from a language
  switch (`html[data-lang-switch]`) shows in its end state, as `Reveal` and the
  Skills chips do today.
- **Accessibility of split text:** splitting into letters/lines must not change
  what screen readers read (keep the original text accessible, hide the split
  spans from assistive tech).
- **Fonts:** split lines must be measured after Aileron has loaded, and
  re-split on resize, so line breaks match the rendered text.
- **Performance:** animate only `opacity` and `transform`/`translate`/`scale`.
  Unobserve each element after its one-shot entrance.
- **Design rules (CLAUDE.md):** no new colours, shadows, radii or effects
  beyond the motion listed here. The Skills chip glow is an explicit,
  documented exception from Ficho.

## Motion values

Ficho chose "Bravik style"; the exact numbers are the builder's call within
these bounds, set once as shared constants:

- Entrances: 0.4–0.7s, ease-out (e.g. `[0.22, 1, 0.36, 1]`, already used by
  `Reveal`). Stagger 0.03–0.08s.
- Travel: 8px for small items (chips, meta), up to 60px for cards and images
  (Bravik uses 60px on cards).
- Trigger: element top at ~85% of the viewport; one-shot (does not replay),
  except effect 4, which is scrubbed.
- Hover zoom: scale ≤ 1.05, 300–500ms.

## Left to the builder

- How to structure the shared code (one motion module + small Astro wrappers
  or data attributes is the expected shape).
- How to split text (a small hand-written splitter is fine; no SplitText).
- Exact constants within the bounds above.
- Whether `Reveal.astro` is extended or replaced, as long as its current
  callers keep working.

## Builder's calls already made

- The case study cover image keeps its current `Reveal` (not in the table above).
- In Experience, the per-entry fade must not also move the company name, which has its own line effect.
- The footer animates on case study pages too, since it is a shared component.
- The Skills chips move onto the shared timing constants.

## Already done (2026-11-12, not yet committed)

- Skills & Tools: "UX Writing (EN/ID)" removed; chips have a staggered
  entrance and a desktop hover lift + glow.
