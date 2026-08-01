# Home Page Redesign — Portfolite Style

**Date:** 2026-08-01
**Scope:** `/` (home page) only. Case study pages and exploration pages are out of scope.

## Goal

Restyle the home page to match the visual language of the
[Portfolite Framer template](https://portfolite.framer.website/): dark, monochrome,
large clean sans-serif typography, card-contained content, subtle borders instead of
colored accents.

The information architecture does not change. The six existing sections stay in the
same order. This is a visual and component-level redesign, not a content restructure.

## Decisions

| Decision | Choice |
|---|---|
| Typography | Plus Jakarta Sans (variable) for everything. `Micro 5`, `Satoshi`, `Inter`, and any monospace face are removed. |
| Color | Strictly monochrome — black, white, and greys only. No hue anywhere on the page. Blue (`#1E4FCF`) and red (`#DC2626`) accents removed. |
| Theme | Dark. Home page switches from `theme="light"` to dark. |
| Sections | Existing six, unchanged order: Hero, Selected Work, About, Experience, Explorations, Contact. |
| Section labels | Numbered labels (`01 / Selected Work`) replaced by badge pills (`Selected work`). |

## Foundation

### Tokens (`src/styles/tokens.css`)

```
--color-bg-primary:    #0A0A0A   (unchanged)
--color-bg-secondary:  #141414   (unchanged — card surface)
--color-bg-elevated:   #1A1A1A   (new — hover/raised surface)
--color-text-primary:  #FAFAFA   (unchanged)
--color-text-secondary:#A1A1A1   (unchanged)
--color-text-tertiary: #525252   (new — muted meta text)
--color-border:        #262626   (unchanged)
--color-border-hover:  #3A3A3A   (new)
```

**Accent tokens are neutralized, not deleted.** `CaseStudyLayout.astro` overrides
`--color-accent` and `--gradient-accent` per project brand, and roughly thirty call
sites across the case-study MDX files and components depend on them. Deleting the
tokens would break pages this spec puts out of scope. Instead their *defaults* become
neutral, so any page that does not override them renders monochrome:

```
--color-accent:    #FAFAFA   (was #1E4FCF)
--color-accent-2:  #A1A1A1   (was #DC2626)
--gradient-accent: linear-gradient(135deg, #FAFAFA 0%, #FAFAFA 60%, #A1A1A1 100%)
```

Case study pages keep their brand colours because they set these variables inline.
The home page never references them at all after this redesign.

Font families:

```
--font-display: "Plus Jakarta Sans Variable", system-ui, sans-serif
--font-sans:    "Plus Jakarta Sans Variable", system-ui, sans-serif
--font-mono:    "Plus Jakarta Sans Variable", system-ui, sans-serif
```

Plus Jakarta Sans is the only typeface on the page. `--font-micro` is removed
entirely. `--font-mono` is kept as a token only so existing `font-mono` class usages
keep resolving, but it points at Plus Jakarta Sans — there is no monospace typeface.
Those call sites rely on uppercase + wide tracking for their "label" character, which
survives the substitution.

Display sizes keep their existing `clamp()` scale but tighten tracking to `-0.03em`
for `display-xl` and `display-lg`.

Radius: `12px` for cards, `8px` for images inside cards, `16px` for the contact block,
`999px` for pills and badges.

Section spacing (`--spacing-section-y`, `--spacing-section-y-sm`) unchanged.

### Global (`src/styles/global.css`)

- Import `@fontsource-variable/plus-jakarta-sans`; drop the Inter import. No other
  font is imported.
- The `text-gradient-accent`, `bg-gradient-accent`, and `border-gradient-accent`
  utilities stay — case study pages use them. Home-page call sites stop using them
  (see per-section notes).
- `::selection` and `:focus-visible` use `--color-text-primary` instead of the accent,
  so focus rings are white everywhere rather than brand-coloured.
- Add a `glow` utility: a radial white gradient at ~4% opacity, used behind the hero
  headline and inside the contact block. This replaces colored accents as the only
  source of visual "lift".

### Layout (`src/layouts/BaseLayout.astro`)

- Remove the Fontshare (Satoshi) and Google Fonts (Micro 5) `<link>` tags and their
  `preconnect`s. Fonts now ship via `@fontsource-variable`, so no external font
  requests remain.
- Because `BaseLayout` and `--font-display` are shared, this is a **site-wide** font
  change: case study and exploration pages also render in Plus Jakarta Sans. That is
  intended — one typeface across the whole site.
- `lightThemeVars` stays in place — case study pages may still use `theme="light"`.
  Only the home page stops passing it.

### Header (`src/components/layout/Header.astro`)

Already a floating pill, which matches Portfolite. Changes are limited to color:

- `Get in touch` button hover changes from `hover:bg-accent hover:text-white` to
  `hover:bg-text-secondary` (stays monochrome).
- Nav link hover background uses `--color-bg-elevated`.

### Shared components

- **`Pill.astro`** — gains a border (`--color-border`), background `--color-bg-secondary`,
  text `--color-text-secondary`, and a hover state that raises text to
  `--color-text-primary` and border to `--color-border-hover`.
- **New `Badge.astro`** — the small section label used at the top of every section and
  in the hero. Renders a rounded-full span with border, `--color-bg-secondary` background,
  12px uppercase text with wide tracking, and an optional leading dot (used by the hero's
  availability indicator).
- **New `SectionHeader.astro`** — encapsulates the repeated badge + heading + optional
  sub-paragraph + optional right-aligned action link. Used by Selected Work, About,
  Experience, and Explorations so the pattern is defined once.
- **`Button.astro`** — already exists with `primary` / `ghost` variants but its primary
  style uses `bg-accent`. Restyled: `primary` becomes white background with `#0A0A0A`
  text; `ghost` becomes transparent with a `--color-border` border and
  `--color-text-secondary` text that brightens on hover. Used by the hero and contact
  CTAs.

## Sections

### 1. Hero (`src/components/home/Hero.astro`)

Centered, `min-h-screen`, vertically centered content. Top to bottom:

1. **Badge** — `● Available for work` when `site.available` is true, otherwise
   `UI/UX Designer — Jakarta`. The dot is `--color-text-primary` (white), not green.
   The page contains no hue at all.
2. **Headline** — two lines, `font-display` weight 800,
   `clamp(3.5rem, 9vw, 7.5rem)`, `line-height: 0.95`, `letter-spacing: -0.03em`.
   Line 1 is `--color-text-primary`; line 2 is `--color-text-secondary`. This
   two-tone contrast replaces the removed accent color.
   Copy: "Design that people" / "actually love".
3. **Subhead** — `site.bio[0]`, `max-width: 640px`, `--color-text-secondary`, 20px.
4. **CTA row** — primary `Get in touch` (mailto) and ghost `See projects` (`#work`).
5. **Scroll hint** — small `Scroll down` label with a thin animated vertical line,
   pinned near the bottom of the viewport. Respects `prefers-reduced-motion`.
6. **Background glow** — the `glow` utility positioned behind the headline,
   `pointer-events: none`, `aria-hidden`.

Removed: the accent-colored icon in the badge, the blue square glyph inside the
headline, and the `font-micro` class.

### 2. Selected Work (`src/components/home/SelectedWork.astro`)

Header uses `SectionHeader`: badge `Selected work`, heading "Recent projects.",
sub-paragraph, and a right-aligned `View all →` link (desktop only, as today).

Each project becomes a contained card:

- Card: `--color-bg-secondary` background, `--color-border` border, `12px` radius,
  `12px` padding.
- Image: `8px` radius, `16/10` aspect, `object-contain` (unchanged, since thumbnails
  are UI screenshots rather than photos).
- Below the image, inside the card: title (`font-display`, 600), summary
  (`--color-text-secondary`), and a `View case study ↗` ghost link.
- Hover: border → `--color-border-hover`, image `scale(1.02)`, card lifts by 2px.
  All transitions are `duration-500` and covered by the existing reduced-motion rule.

Grid stays 2-column on desktop. The existing asymmetric rule (items 0 and 3 span full
width when there are at least four featured case studies) is preserved. With the
current two case studies the grid renders as a plain 2-column layout.

### 3. About (`src/components/home/About.astro`)

- `SectionHeader` with badge `About me` and heading "Designer with a bias for shipping."
- Portrait wrapped in a card (`--color-bg-secondary`, border, `12px` radius) with the
  image at `saturate(0.2)`, returning to full saturation on hover.
- Bio paragraphs unchanged (`site.bio`).
- Skills and Tools render through the restyled `Pill`.
- The `bg-bg-secondary/40` section background is removed. Sections are separated by a
  `1px --color-border` top border instead of alternating background blocks.

### 4. Experience (`src/components/home/Experience.astro`)

- `SectionHeader` with badge `Experience` and heading "Where I've worked."
- Each row becomes a hoverable block: `8px` radius, background transitions to
  `--color-bg-elevated` on hover, with padding adjusted so the hover surface has
  breathing room. The `divide-y` divider is kept.
- Year column uses `--color-text-tertiary`; role uses `--color-text-primary`;
  company uses `--color-text-secondary`.
- A `Currently` badge is appended to any entry whose `year` string contains "Now".

### 5. Explorations (`src/components/home/ExplorationsGrid.astro`)

- `SectionHeader` with badge `Explorations` and heading "Visual experiments."
- Cards match the Selected Work card treatment (container, border, radius, hover),
  in a 3-column desktop grid with `4/5` aspect covers.
- Title and year sit inside the card below the image; year uses
  `--color-text-tertiary`.
- The `bg-bg-secondary/40` section background is removed, as in About.
- The existing empty state ("No explorations yet.") is preserved.

### 6. Contact (`src/components/home/Contact.astro`)

Becomes a single large CTA block rather than a bare section:

- Full-width card: `--color-bg-secondary` background, `--color-border` border,
  `16px` radius, generous padding, with the `glow` utility inside it.
- Centered contents: badge `Contact` → heading "Let's build something together." →
  one-line subhead.
- CTA row: primary `Email me` (mailto) and ghost `LinkedIn`.
- The gradient email link is removed; if the address is shown it renders in
  `--color-text-primary`.
- Social links from `site.socials` (excluding Email) render as a small row beneath
  the card.

## Page composition (`src/pages/index.astro`)

`theme="light"` is dropped so the home page renders dark. Section order and imports
are unchanged.

## Out of scope

- Case study pages, exploration pages, and 404 — apart from the unavoidable site-wide
  typeface change described above.
- Making case study pages monochrome. They keep their per-project brand colours.
- Content changes to `src/content/site.ts` (placeholder experience entries such as
  "Company A" stay as they are).
- Adding new sections from Portfolite that the site does not currently have
  (Process, Services, Testimonials, marquee).
- Light-mode support for the home page.

## Verification

- `npm run build` completes without errors.
- The dev server renders `/` with all six sections and no console errors.
- No `accent`, `gradient-accent`, `font-micro`, `Satoshi`, `Inter`, `Micro 5`, or
  `JetBrains` references remain in home-page code paths (`grep`).
- No hue on the home page: every colour used resolves to a neutral (equal R, G, B)
  value.
- Case study pages still render with their per-project brand colours (regression
  check — they are out of scope and must not change visually apart from the typeface).
- No external font requests appear in the network log for `/`.
- Screenshots at desktop (1280) and mobile (375) widths.
- Keyboard focus is visible on every interactive element in the new components.
