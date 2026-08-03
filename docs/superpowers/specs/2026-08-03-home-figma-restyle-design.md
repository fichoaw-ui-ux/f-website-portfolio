# Home Restyle from Figma — Design

**Date:** 2026-08-03
**Source of truth:** Figma `Portfolio Asset`, file `ARRQteKJDZ3K0THAdoyH0h`, frame `main-page` (`8920:2112`), 1440×6636.
**Decision on fidelity:** follow Figma fully. Where Figma and the current build disagree, Figma wins — including the loss of features the current build has.

## Goal

Replace the home page's visual language with the one in the Figma frame. The section order is already identical, so this is a restyle plus per-section relayout, not a restructure.

Scope is the home page. Case study pages, exploration detail pages, and 404 are out of scope for relayout; they must merely keep working under the new global tokens and typeface.

## Foundation

### Typeface

Plus Jakarta Sans is removed entirely. Aileron replaces it at weights 400 and 600, via `@fontsource/aileron` (v5.3.0, static weights — there is no variable build). `@fontsource-variable/plus-jakarta-sans` is dropped from `package.json`.

`--font-display`, `--font-sans`, and `--font-mono` all point at Aileron. `--font-mono` is kept as a token because existing `font-mono` class usages resolve through it; it is not a distinct face.

### Type scale

Every size below was derived from Figma node heights and confirmed against the file's type styles. Headings are `line-height: 1.25`, prose is `1.6`, pill labels are `1.0`.

| Role | Size | Weight | Used by |
|---|---|---|---|
| Display H1 | 88px / 1.25 | 600 | `Hello!`, `I'm Ficho.`, `a product designer` |
| Section H3 | 56px / 1.25 | 600 | `My selected works`, `About me`, `Where I've worked`, `Let's build something together` |
| Card title | 32px / 1.6 | 600 | case study titles in work cards |
| Sub-heading | 24px / 1.6 | 400 | section sub-copy, About prose, year label, company · role |
| Body | 18px / 1.6 | 400 | card summary, experience bullets, `SKILLS` / `TOOLS` labels |
| Label | 16px / 1.0 | 600 | pill labels, card tag line |
| Caption | 14px / 1.6 | 400 | footer copyright |

`letter-spacing: 0` at every level. This is a deliberate departure from the current build, which tracks headings at `-0.03em`.

### Colour

| Token | Value | Contrast on `#0B0B0B` |
|---|---|---|
| `--color-text-primary` | `#FFFFFF` | 19.6:1 |
| `--color-text-muted` | `#BBBBC0` | 10.3:1 |
| `--color-text-subtle` | `#909098` | 6.2:1 |
| `--color-bg-primary` | `#0B0B0B` | — |
| `--color-bg-card` | `#171819` | — |

All three text tokens clear WCAG AA for normal-size text.

Figma also defines `color/neutral/800` (`#6C6C71`), which reaches only 3.78:1 on the page background. It must not be used for text at any size below 24px/600. No node in the frame currently needs it.

The current `--color-text-tertiary` (`#525252`, 2.4:1) is retired rather than remapped; nothing in the new design calls for a tier that dim.

### Token migration

The out-of-scope pages — case studies, exploration details, 404 — consume the existing token names. Tokens are therefore remapped in place rather than replaced with new names, so those pages pick up the new palette without edits.

| Existing token | Was | Becomes |
|---|---|---|
| `--color-bg-primary` | `#0A0A0A` | `#0B0B0B` |
| `--color-bg-secondary` | `#141414` | `#171819` (the card fill) |
| `--color-bg-elevated` | `#1A1A1A` | `#1D1D1D` |
| `--color-text-primary` | `#FAFAFA` | `#FFFFFF` |
| `--color-text-secondary` | `#A1A1A1` | `#BBBBC0` |
| `--color-text-tertiary` | `#525252` | `#909098` |
| `--color-border` | `#262626` | `rgba(255, 255, 255, 0.12)` |
| `--color-border-hover` | `#3A3A3A` | `rgba(255, 255, 255, 0.24)` |

So `--color-text-tertiary` is retired as a *contrast tier*, not as a name: it stops being the 2.4:1 dimmest step and takes over the 6.2:1 `#909098` role. No token in the set now falls below AA for normal text. `--color-accent`, `--color-accent-2`, and `--gradient-accent` keep their current greyscale values and their existing role — case study pages override them per-study, and nothing on the home page reads them.

The hairlines in About and Experience use `--color-border` at its new value. Figma draws them as vector strokes whose exact colour was not read from the file; `rgba(255, 255, 255, 0.12)` is the chosen value and is checked against the vector's stroke during implementation, and corrected if it differs.

### Background

Figma renders the page background as a dark mottled field: sampled values run `#0B0B0B` at the edges up to roughly `#1D1D1D` in soft patches. In the file this is an image fill spanning all 6636px.

We reproduce it in CSS instead of shipping that bitmap — a few large, low-opacity radial gradients over `#0B0B0B` plus a faint SVG noise overlay, applied to `html` so it covers any page height. Rationale: the source asset is a 1440×6636 PNG that would dominate the page weight, cannot adapt to a taller or shorter page, and encodes no detail a gradient cannot approximate at these amplitudes.

### Radius, spacing, layout

- Card and image radius: `32px` (`radius/radius-2xl`). Pills: fully round.
- Content container: `1312px` (1440 minus 64px gutters). The current container is 1280px and changes to 1312px.
- Centred text blocks sit in a `1088px` band; sub-copy is capped at `640px`.
- Shadow: Figma's `Shadow/Far` is authored for light mode (`#16223329`) and is invisible on a near-black field. We keep its geometry — `0 16px 32px` plus `0 4px 12px -4px` — and substitute an opaque-black colour.

## Sections

Coordinates below are Figma's, at 1440 width.

### Navbar — `8920:2156`

1312×72, logo left, a single `Contact Us` pill right (156×48; 20px side padding, 8px gap to a 24×24 arrow icon). Figma draws no bar background, so the current translucent rounded bar and its border are removed.

The nav links `Work` / `About` / `Contact` do not exist in Figma and are removed. **Flagged concern:** this leaves a 6636px page with no in-page navigation and no way back to a section except scrolling. Proceeding per the fidelity decision, but it is worth revisiting.

**The header also stops being sticky.** This reverses an earlier draft of this spec, which kept stickiness on the grounds that a static frame cannot express behaviour. That reasoning does not survive the removal of the bar background: a sticky header with no background scrolls transparently over the content beneath it, and 88px headings passing under 32px nav text is illegible. With the nav links gone the only thing left to keep pinned is the `Contact Us` CTA, which is already duplicated in the Contact section. Static is both what Figma draws and the only version that reads correctly.

### Hero — `8920:2146`

880px tall, contents vertically centred, everything centre-aligned.

Row one (`gap: 24px`, centred): `Hello!` at 88px — a 97×96 circular avatar with a 2px white border — `I'm Ficho.` at 88px. Row two, 4px below: `a product designer` at 88px, centred. Then 32px below the heading block, the sub-copy at 24px `#BBBBC0`, capped at 640px, centred. The sub-copy is `site.bio[0]`, which already matches Figma's text.

The avatar image is 128×171 inside the 97×96 circle, so it is cropped to fill, but not centred: Figma offsets it 4.5px left and 21.5px down from centre, framing the face rather than the middle of the photo. That offset is reproduced, not simplified to `object-position: center`.

Removed: the `Available for work` badge, both CTA buttons, and the animated scroll hint.

### Selected Works — `8920:2113`

Header block at 1088px wide: `My selected works` at 56px centred, then 24px below it the sub-copy at 24px `#BBBBC0` centred in an 864px band. The copy is new, from Figma: *"With my keen eye for detail and sharp critical thinking skills, I specialize in crafting captivating websites, products, and experiences."*

Cards are full-width (1312), 534px tall, stacked with a 64px gap — one column, not the current two. Card padding is 48px on all sides.

Inside each card: a 438px text column offset 75px from the card top, holding the case study title (32px/600), a tag line 16px below it (`tags` joined and upper-cased, e.g. `UI/UX DESIGN, PORTAL/WEBSITE`, 16px/600 `#909098`), the summary 32px below that (18px `#909098`), and a `View Details` pill 32px lower (132×48). The thumbnail occupies 730×438 on the right, inset 48px from the card's top, right, and bottom edges, at radius 24 — one step tighter than the card's 32, as Figma draws it.

The whole card stays a single link to the case study, as it is today.

### About — `8921:2700`

Two columns, 620px and 611px, with an 80px gap.

Left column: `About me` at 56px, sub-copy 24px below at 24px `#BBBBC0` (559px wide), a hairline at y=278, then the `SKILLS` group — an 18px label and pills wrapping across two 40px rows with 16px gaps — a second hairline at y=483, then the `TOOLS` group in the same shape.

Right column: the portrait at 646×861, radius 32, deliberately overflowing its 656px column — 102px above the top, 103px below the bottom, 18px past the left edge. This bleed is the point of the composition and must survive; the section needs `overflow: visible` vertically, clipped only where it would cause horizontal scroll.

Note the portrait and text swap sides relative to the current build (portrait moves from left to right).

Figma sets the About prose as a single four-line paragraph whose text is `site.bio[0]` and `site.bio[1]` run together. The current build renders `site.bio` as two separate `<p>` elements; it becomes one paragraph joined with a space.

### Experience — `8927:2830`

`Where I've worked` at 56px, left-aligned. Below it, rows 116px tall separated by hairlines, with 32px of space on each side of every hairline.

Each row: a 303px year label at 24px `#909098` on the left; at x=335 a 976px column containing `company - role` at 24px on one line, then two bullets 50px below, each 29px tall with an 8px gap, each a 16px marker plus 18px text.

Removed: the `Currently` badge and the row hover highlight. `src/lib/experience.ts` and `tests/experience.test.ts` become dead code and are deleted with them.

### Explorations — `8932:1847`

Three 416px columns with 32px gaps. The middle column starts at the top; the two outer columns are pushed down 276px. Cards are 416×520 at radius 32, stacked with 32px gaps.

Figma shows **no section heading here** — the current `Explorations / Visual experiments.` header is removed. Figma's cards are also image-only, so the per-card title and year are removed.

Figma draws seven cards (2 / 3 / 2) but the content collection holds six. The layout is content-driven: items are split into three consecutive chunks — items 1–2 to the left column, 3–4 to the middle, 5–6 to the right. Six items give 2 / 2 / 2, and the middle column stays un-offset regardless of count.

Chunking is chosen over round-robin deliberately. Staggered columns require real column containers — a plain grid cannot offset one column without shifting the shared row — and with containers the DOM order is whatever the distribution produces. Round-robin would emit items in the order 1, 4, 2, 5, 3, 6, which is the order a screen reader announces and the order the single-column mobile layout stacks them in. Chunking keeps DOM order identical to content order at every breakpoint.

Cards remain links to their exploration pages.

Dropping the per-card title leaves the cover image as the only content in the link, so each card's accessible name comes from the image `alt` (`coverAlt`, already required by the collection schema). Without it the grid would be six unlabelled links.

### Contact and footer — `8932:1918`

Centred in an 1088px band: `Let's build something together` at 56px, sub-copy 32px below at 24px `#BBBBC0` capped at 640px, then two pills 32px lower — `LinkedIn` (106×48) and `Contact me` (127×48) — with a 16px gap, centred as a group.

Below, a 62px footer strip with `© 2026 Ficho. All rights reserved.` centred at 14px. The current footer's social link row is removed; `site.socials` stays in place because the Contact pills read from it.

The current build's bordered, glowing contact card is removed — Figma places this content directly on the page background.

## Shared components

Removing the badges and the section-header pattern orphans two components. Both are consumed only by home sections, so both are deleted:

- `ui/SectionHeader.astro` — used by SelectedWork, About, Experience, and ExplorationsGrid, all four of which move to a plain heading with no badge and no description slot.
- `ui/Badge.astro` — used by Hero, Experience, Contact, and `SectionHeader`, every one of which loses its badge.

Two are kept and restyled to the new pill language:

- `ui/Button.astro` becomes the 48px pill (`View Details`, `LinkedIn`, `Contact me`, `Contact Us`). It must stay because `pages/404.astro` uses it; that page is out of scope for relayout but inherits the new pill styling, which is the desired outcome rather than breakage.
- `ui/Pill.astro` becomes the 40px non-interactive chip used by the About skills and tools rows.

`ui/Tag.astro` and `ui/Reveal.astro` are untouched — `Tag` is consumed only by the case study layout and exploration pages, and `Reveal` stays in use everywhere.

### Link targets

Figma labels the buttons but does not encode destinations. They resolve as:

| Label | Destination |
|---|---|
| `Contact Us` (navbar) | `mailto:site.email` |
| `View Details` (work card) | the card's case study — the whole card is already the link, so the pill is decorative markup inside it, not a nested anchor |
| `Contact me` | `mailto:site.email` |
| `LinkedIn` | the `LinkedIn` entry in `site.socials` |

The `LinkedIn` href in `site.socials` is currently `'#'`. It stays a placeholder; supplying the real URL is content work, not part of this change.

## Content changes

Figma supplies real names where `site.ts` still has placeholders. We adopt them:

- Experience becomes three roles: `Transfez & Jack — Product Designer`, `Transfez & Jack — Graphic Designer (Intern)`, `Great Giant Pineapple — Corporate Communication`. This replaces the four `Company A`–`Company D` entries.
- Tools becomes: Figma, Notion, Mixpanel, Claude Code, Bitbucket, Github, Photoshop, Illustrator. Skills are unchanged — Figma matches `site.ts` exactly.

Three typos in the Figma text are corrected rather than copied: `Pineaple` → `Pineapple`, `Comunication` → `Communication`, `Mix Pannel` → `Mixpanel`.

Removing the hero badge also orphans two `site.ts` fields. `site.available` and `site.location` are read nowhere else and are deleted with it; `site.role` and `site.tagline` stay, since `pages/index.astro` uses both for the page title and meta description.

Placeholders that stay placeholders, by explicit decision: the experience bullets remain lorem ipsum (two per role), and every role's year reads `2023 — NOW` as Figma has it. Both are marked with a `TODO` comment in `site.ts` so they are not mistaken for real content. **The home page is therefore not publishable as-is** — it needs real bullets and real year ranges first.

## Assets

The hero avatar (`image 38`) and the About portrait (`image 37`) are exported from Figma and committed under `public/images/`. Figma's asset URLs expire in about seven days, so the bytes must be downloaded, not linked. The About portrait replaces the current `/images/placeholder.svg`.

Case study thumbnails and exploration covers already exist in the content collections and are reused unchanged.

## Responsive behaviour

Figma provides desktop 1440 only, so smaller viewports are our own judgement, held as close to the desktop composition as the width allows:

- Headings scale with `clamp()`, anchored so that the desktop value is exactly Figma's (88px, 56px).
- Work cards stack to a single column with the image above the text below `md`.
- About collapses to one column, portrait first, with the bleed removed — the overflow only reads as intentional beside a text column.
- Explorations drops to two columns then one, and the 276px column offsets are removed below `lg`, where they would only produce a ragged gap.
- The navbar keeps logo plus `Contact Us` pill at all widths; there is nothing to collapse into a menu now that the links are gone.

## Motion

Figma is static and cannot express motion, so the current behaviour is preserved where it does not contradict the design:

- The `Reveal` scroll-in wrapper stays on every section.
- Interactive elements keep a subtle hover and a visible focus ring. Links without hover affordance are a real usability regression, and the focus ring is an accessibility requirement — neither is something a static frame is arguing against.
- The Experience row hover highlight is removed, since Figma restructures that row into a bulleted layout where the full-width highlight no longer fits.
- The existing `prefers-reduced-motion` blanket rule in `global.css` continues to cover all of it.

## Tests

- `tests/build-output.test.ts` asserts "references no typeface other than Plus Jakarta Sans". It is updated to assert Aileron and to guard that Plus Jakarta Sans is gone from both HTML and CSS.
- Its existing guards — no external font requests, no hued accent tokens — must keep passing.
- `tests/experience.test.ts` is deleted along with `src/lib/experience.ts`.
- `tests/content.test.ts` is expected to be unaffected; it is re-run to confirm.
- A new assertion asserts `#525252` is absent from the shared stylesheet, so the old 2.4:1 value cannot creep back in behind the `--color-text-tertiary` name now that the name points at an AA-passing colour.

Verification is `npm test` (which builds first), plus a browser pass over the built home page at desktop, tablet, and mobile widths compared against the Figma frame.

## Out of scope

- Any relayout of case study pages, exploration detail pages, or 404. They inherit the new tokens and typeface and are checked for breakage only.
- Real experience copy and year ranges.
- A light mode. Figma's `color/background/bg-default: #ffffff` token exists in the file's variable set but no node in this frame uses it; the design is dark-only.
