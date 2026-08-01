# Home Page Redesign (Portfolite Style) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the home page (`/`) to a dark, strictly monochrome, single-typeface design matching the Portfolite Framer template, without changing the site's information architecture or breaking case study pages.

**Architecture:** Work bottom-up. First swap the design foundation (fonts, tokens, global CSS) so every later task inherits it. Then build three small shared UI components (`Badge`, `SectionHeader`, and a restyled `Button`/`Pill`) that encode the repeated Portfolite patterns once. Then restyle the six home sections one at a time, each in its own commit. Accent tokens are neutralized rather than deleted, because `CaseStudyLayout.astro` overrides them per project brand and ~30 MDX call sites depend on them.

**Tech Stack:** Astro 7, Tailwind CSS 4 (`@theme` tokens in `src/styles/tokens.css`), `@fontsource-variable/plus-jakarta-sans`, `motion` (existing `Reveal` component), Vitest (node environment).

**Spec:** `docs/superpowers/specs/2026-08-01-home-redesign-portfolite-design.md`

---

## A note on testing

This repository has one test file (`tests/content.test.ts`) running in a **node** environment against pure functions in `src/lib/content.ts`. There is no component-rendering test setup (no jsdom, no `@testing-library`, no Astro container API test harness), and adding one is out of scope.

Therefore:

- **Task 4** introduces genuinely testable pure logic (`isCurrentRole`) and follows strict TDD: failing test → run → implement → run → commit.
- **Task 3** adds a build-output assertion test that greps the generated HTML/CSS for forbidden strings. This is a real regression guard for "no colour, no other typeface" and it can fail meaningfully.
- All other tasks are visual restyles of `.astro` markup. Their verification is `npm run build` succeeding plus a browser check with explicit, checkable observations. Do **not** invent unit tests for these — assert what you actually observed.

Every task ends with a commit.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `src/components/ui/Badge.astro` | The small pill label used at the top of each section and in the hero. Optional leading dot. |
| `src/components/ui/SectionHeader.astro` | Badge + heading + optional sub-paragraph + optional right-aligned action link. Used by four sections. |
| `src/lib/experience.ts` | `isCurrentRole(year)` — pure predicate deciding whether an experience entry gets a `Currently` badge. |
| `tests/experience.test.ts` | Unit tests for `isCurrentRole`. |
| `tests/build-output.test.ts` | Regression guard: forbidden fonts/colours must not appear in the built home page. |

**Modified:**

| File | Change |
|---|---|
| `package.json` | Add `@fontsource-variable/plus-jakarta-sans`. |
| `src/styles/tokens.css` | New neutral surface/text tokens, neutralized accent defaults, Plus Jakarta Sans for all three font families, tighter display tracking. |
| `src/styles/global.css` | Import Plus Jakarta Sans, drop Inter, neutral `::selection` / `:focus-visible`, add `glow` utility. |
| `src/layouts/BaseLayout.astro` | Remove external Satoshi and Micro 5 `<link>`/`preconnect` tags. |
| `src/components/ui/Button.astro` | Monochrome `primary` / `ghost` variants, drop `font-mono`. |
| `src/components/ui/Pill.astro` | Add border and hover state. |
| `src/components/layout/Header.astro` | Monochrome hover states. |
| `src/components/home/Hero.astro` | Full rewrite per spec. |
| `src/components/home/SelectedWork.astro` | Card-contained projects, `SectionHeader`. |
| `src/components/home/About.astro` | Card portrait, `SectionHeader`, drop tinted section background. |
| `src/components/home/Experience.astro` | Hoverable rows, `Currently` badge, `SectionHeader`. |
| `src/components/home/ExplorationsGrid.astro` | Card-contained items, `SectionHeader`, drop tinted section background. |
| `src/components/home/Contact.astro` | Large CTA block. |
| `src/pages/index.astro` | Drop `theme="light"`. |

---

## Task 1: Install Plus Jakarta Sans and swap the design tokens

**Files:**
- Modify: `package.json`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Install the font package**

Run:

```bash
npm install @fontsource-variable/plus-jakarta-sans
```

Expected: package added to `dependencies`, no peer dependency errors.

- [ ] **Step 2: Replace the contents of `src/styles/tokens.css`**

Replace the whole file with:

```css
@theme {
  /* Colors — strictly neutral. No hue on the home page. */
  --color-bg-primary: #0A0A0A;
  --color-bg-secondary: #141414;
  --color-bg-elevated: #1A1A1A;
  --color-text-primary: #FAFAFA;
  --color-text-secondary: #A1A1A1;
  --color-text-tertiary: #525252;
  --color-border: #262626;
  --color-border-hover: #3A3A3A;

  /* Accent tokens are kept ONLY so case study pages keep working — they override
     these per project brand in CaseStudyLayout.astro. Their defaults are neutral,
     so any page that does not override them renders monochrome. */
  --color-accent: #FAFAFA;
  --color-accent-2: #A1A1A1;
  --gradient-accent: linear-gradient(135deg, #FAFAFA 0%, #FAFAFA 60%, #A1A1A1 100%);

  /* Font families — Plus Jakarta Sans is the only typeface on the site.
     --font-mono is kept as a token so existing `font-mono` class usages keep
     resolving, but it points at the same face. */
  --font-display: "Plus Jakarta Sans Variable", system-ui, sans-serif;
  --font-sans: "Plus Jakarta Sans Variable", system-ui, sans-serif;
  --font-mono: "Plus Jakarta Sans Variable", system-ui, sans-serif;

  /* Display font sizes (with line height) */
  --text-display-xl: clamp(3rem, 8vw, 6rem);
  --text-display-xl--line-height: 1.05;
  --text-display-xl--letter-spacing: -0.03em;

  --text-display-lg: clamp(2.5rem, 6vw, 4.5rem);
  --text-display-lg--line-height: 1.08;
  --text-display-lg--letter-spacing: -0.03em;

  --text-display-md: clamp(2rem, 4vw, 3rem);
  --text-display-md--line-height: 1.15;
  --text-display-md--letter-spacing: -0.02em;

  /* Layout */
  --container-container: 1280px;
  --spacing-section-y: 10rem;
  --spacing-section-y-sm: 5rem;
}
```

Note what is gone: `--font-micro` no longer exists. Any `font-micro` class in the codebase must be removed (Task 5 handles the only usage, in `Hero.astro`).

- [ ] **Step 3: Update `src/styles/global.css`**

Change the import block at the top from:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@import "@fontsource-variable/inter";
@import "./tokens.css";
```

to:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@import "@fontsource-variable/plus-jakarta-sans";
@import "./tokens.css";
```

Then change the `::selection` and `:focus-visible` rules inside `@layer base` from:

```css
  ::selection {
    background: var(--color-accent);
    color: #FAFAFA;
  }
  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 2px;
  }
```

to:

```css
  ::selection {
    background: var(--color-text-primary);
    color: var(--color-bg-primary);
  }
  :focus-visible {
    outline: 2px solid var(--color-text-primary);
    outline-offset: 2px;
    border-radius: 2px;
  }
```

Finally, add this `glow` utility immediately after the existing `border-gradient-accent` utility block (keep all three gradient utilities — case study pages use them):

```css
@utility glow {
  background: radial-gradient(
    50% 50% at 50% 50%,
    rgba(250, 250, 250, 0.05) 0%,
    rgba(250, 250, 250, 0) 100%
  );
}
```

- [ ] **Step 4: Remove external font links from `src/layouts/BaseLayout.astro`**

Delete these five lines from `<head>`:

```html
    <link rel="preconnect" href="https://api.fontshare.com" />
    <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700,900&display=swap" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Micro+5&display=swap" />
```

Leave the `<link rel="icon" ...>` line above them untouched.

Leave `lightThemeVars` alone; case study pages may still use `theme="light"`. It does not define the three new tokens (`--color-bg-elevated`, `--color-text-tertiary`, `--color-border-hover`), which is fine — those tokens are used only by home-page components, and the home page is always dark after this change.

- [ ] **Step 5: Verify the build succeeds**

Run: `npm run build`
Expected: exits 0, no "Cannot find module @fontsource-variable/plus-jakarta-sans" error.

- [ ] **Step 6: Verify no external font requests remain**

Run: `grep -rn "fontshare\|fonts.googleapis\|Micro+5\|font-micro" src/ dist/ || echo "CLEAN"`
Expected: `CLEAN`

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/styles/tokens.css src/styles/global.css src/layouts/BaseLayout.astro
git commit -m "style: swap design foundation to Plus Jakarta Sans and neutral tokens"
```

---

## Task 1b: Give the case study layout its own accent fallback

Added during execution. Spec review of Task 1 found a real regression the plan's premise missed.

`CaseStudyLayout.astro` only emitted its `--color-accent` override when `d.brandColor` was set, and only `02-voucher-points-banner.mdx` declares one. With the global default neutralized to `#FAFAFA`, `/work/quick-transfer` rendered its accent content invisible against the light theme's `#FAFAFA` background.

**Files:**
- Modify: `src/layouts/CaseStudyLayout.astro`

- [ ] **Step 1: Add an accent fallback to the frontmatter script**

After `const d = entry.data`:

```ts
// Case studies keep their brand colour. The global accent default is neutral so the
// home page stays monochrome, so this layout supplies its own fallback for entries
// that don't declare one. These two hexes are compatibility values: they reproduce
// the pre-redesign global accent default so untinted case studies look unchanged.
const DEFAULT_CASE_STUDY_ACCENT = '#1E4FCF'
const DEFAULT_CASE_STUDY_ACCENT_ALT = '#DC2626'
const accent = d.brandColor ?? DEFAULT_CASE_STUDY_ACCENT
const accentAlt = d.brandColorAlt ?? (d.brandColor ? accent : DEFAULT_CASE_STUDY_ACCENT_ALT)
```

The nested conditional on `accentAlt` matters: an entry that declares `brandColor` but
no `brandColorAlt` falls back to its own colour (a flat gradient), while only an entry
declaring neither gets the old blue-to-red default.

- [ ] **Step 2: Emit the override unconditionally**

Replace the `{d.brandColor && (...)}` block with:

```astro
  <style set:html={`
    :root{
      --color-accent: ${accent};
      --gradient-accent: linear-gradient(135deg, ${accent} 0%, ${accent} 60%, ${accentAlt} 100%);
    }
  `} />
```

- [ ] **Step 3: Verify**

```bash
npm run build
grep -o -- "--color-accent: [^;]*" dist/work/quick-transfer/index.html
grep -o -- "--gradient-accent: [^;]*" dist/work/quick-transfer/index.html
grep -o -- "--gradient-accent: [^;]*" dist/work/voucher-points-banner/index.html
grep -c -- "--color-accent:" dist/index.html
```

Expected:

- quick-transfer accent: `#1E4FCF`
- quick-transfer gradient: `linear-gradient(135deg, #1E4FCF 0%, #1E4FCF 60%, #DC2626 100%)` — byte-identical to the pre-redesign global default
- voucher-points-banner gradient: `linear-gradient(135deg, #DA649F 0%, #DA649F 60%, #7A2A55 100%)` — unchanged
- home page: `0` accent overrides

- [ ] **Step 4: Commit**

```bash
git add src/layouts/CaseStudyLayout.astro
git commit -m "fix: give case study layout its own accent fallback"
```

---

## Task 2: Restyle shared UI primitives (Button, Pill) and Header

**Files:**
- Modify: `src/components/ui/Button.astro`
- Modify: `src/components/ui/Pill.astro`
- Modify: `src/components/layout/Header.astro`

- [ ] **Step 1: Replace `src/components/ui/Button.astro`**

The existing file uses `bg-accent` for its primary variant and `font-mono`. Replace the whole file with:

```astro
---
interface Props {
  href?: string
  variant?: 'primary' | 'ghost'
  class?: string
}
const { href, variant = 'primary', class: className = '' } = Astro.props
const base = 'inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium transition duration-300'
const styles = variant === 'primary'
  ? 'bg-text-primary text-bg-primary hover:bg-text-secondary'
  : 'border border-border text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-bg-elevated'
const Tag = href ? 'a' : 'button'
---
<Tag href={href} class:list={[base, styles, className]}><slot /></Tag>
```

- [ ] **Step 2: Replace `src/components/ui/Pill.astro`**

```astro
---
interface Props { class?: string }
const { class: className = '' } = Astro.props
---
<span
  class:list={[
    'inline-flex items-center px-3 py-1.5 text-sm rounded-full border border-border bg-bg-secondary text-text-secondary transition duration-300 hover:text-text-primary hover:border-border-hover',
    className,
  ]}
><slot /></span>
```

- [ ] **Step 3: Make the Header hover states monochrome**

In `src/components/layout/Header.astro`, the "Get in touch" anchor currently ends with `hover:bg-accent hover:text-white transition`. Change that anchor's class attribute from:

```
class="inline-flex items-center gap-2 rounded-full bg-text-primary text-bg-primary pl-4 pr-3 py-3 text-sm shadow-[0_8px_16px_-4px_rgba(0,0,0,0.2)] hover:bg-accent hover:text-white transition"
```

to:

```
class="inline-flex items-center gap-2 rounded-full bg-text-primary text-bg-primary pl-4 pr-3 py-3 text-sm shadow-[0_8px_16px_-4px_rgba(0,0,0,0.2)] hover:bg-text-secondary transition"
```

Then, for each of the three nav links (`Work`, `About`, `Contact`), change `hover:bg-bg-primary/40` to `hover:bg-bg-elevated`. Their full class becomes:

```
class="px-4 py-2 rounded-full text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition"
```

- [ ] **Step 4: Verify the build succeeds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 5: Verify no accent usage remains in these three files**

Run: `grep -n "accent" src/components/ui/Button.astro src/components/ui/Pill.astro src/components/layout/Header.astro || echo "CLEAN"`
Expected: `CLEAN`

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Button.astro src/components/ui/Pill.astro src/components/layout/Header.astro
git commit -m "style: monochrome Button, Pill, and Header hover states"
```

---

## Task 3: Add Badge and SectionHeader components, plus a build-output regression test

**Files:**
- Create: `src/components/ui/Badge.astro`
- Create: `src/components/ui/SectionHeader.astro`
- Create: `tests/build-output.test.ts`

- [ ] **Step 1: Create `src/components/ui/Badge.astro`**

```astro
---
interface Props {
  /** Show a small leading dot. Used by the hero availability indicator. */
  dot?: boolean
  class?: string
}
const { dot = false, class: className = '' } = Astro.props
---
<span
  class:list={[
    'inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-bg-secondary text-xs uppercase tracking-[0.15em] text-text-secondary',
    className,
  ]}
>
  {dot && <span class="w-1.5 h-1.5 rounded-full bg-text-primary" aria-hidden="true"></span>}
  <slot />
</span>
```

Note the dot is `bg-text-primary` (white), not green. The page has no hue.

- [ ] **Step 2: Create `src/components/ui/SectionHeader.astro`**

```astro
---
import Badge from './Badge.astro'
import Reveal from './Reveal.astro'

interface Props {
  badge: string
  heading: string
  /** Optional one-line paragraph under the heading. */
  description?: string
  /** Optional right-aligned action link, desktop only. */
  actionLabel?: string
  actionHref?: string
  class?: string
}
const { badge, heading, description, actionLabel, actionHref, class: className = '' } = Astro.props
---
<div class:list={['flex items-end justify-between gap-8 mb-16', className]}>
  <Reveal>
    <div>
      <Badge class="mb-5">{badge}</Badge>
      <h2 class="font-display font-extrabold text-display-md">{heading}</h2>
      {description && <p class="mt-4 max-w-xl text-lg text-text-secondary">{description}</p>}
    </div>
  </Reveal>
  {actionLabel && actionHref && (
    <Reveal>
      <a
        href={actionHref}
        class="hidden md:inline-flex items-center gap-1 text-base text-text-secondary hover:text-text-primary transition shrink-0"
      >{actionLabel}</a>
    </Reveal>
  )}
</div>
```

- [ ] **Step 3: Write the failing build-output regression test**

Create `tests/build-output.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = join(process.cwd(), 'dist')

async function readHomeHtml(): Promise<string> {
  return readFile(join(DIST, 'index.html'), 'utf8')
}

async function readAllCss(): Promise<string> {
  const assetsDir = join(DIST, '_astro')
  const files = await readdir(assetsDir)
  const cssFiles = files.filter(f => f.endsWith('.css'))
  const contents = await Promise.all(
    cssFiles.map(f => readFile(join(assetsDir, f), 'utf8'))
  )
  return contents.join('\n')
}

describe('built home page', () => {
  let html: string
  let css: string

  beforeAll(async () => {
    html = await readHomeHtml()
    css = await readAllCss()
  })

  it('requests no external fonts', () => {
    expect(html).not.toContain('fontshare.com')
    expect(html).not.toContain('fonts.googleapis.com')
    expect(html).not.toContain('fonts.gstatic.com')
  })

  it('references no typeface other than Plus Jakarta Sans', () => {
    expect(html).not.toContain('Satoshi')
    expect(html).not.toContain('Micro 5')
    expect(css).not.toContain('Micro 5')
    expect(css).not.toContain('JetBrains')
  })

  it('defines no hued accent tokens', () => {
    // The old blue and red accents must not survive anywhere in the stylesheet.
    expect(css).not.toContain('#1E4FCF')
    expect(css).not.toContain('#DC2626')
  })
})
```

- [ ] **Step 4: Run the test to verify it passes against the current build**

Run:

```bash
npm run build && npx vitest run tests/build-output.test.ts
```

Expected: all three tests PASS. Task 1 already removed the fonts and neutralized the tokens, so this test is a *guard against regression*, not a red-to-green cycle.

If any assertion fails, the failure is real — a Task 1 step was missed. Go back and fix Task 1 rather than weakening the assertion.

- [ ] **Step 5: Verify the test actually fails when the invariant breaks**

A guard that cannot fail is worthless. Prove this one can:

```bash
sed -i '' 's/--color-accent: #FAFAFA;/--color-accent: #1E4FCF;/' src/styles/tokens.css
npm run build && npx vitest run tests/build-output.test.ts
```

Expected: the "defines no hued accent tokens" test FAILS.

Now restore it:

```bash
sed -i '' 's/--color-accent: #1E4FCF;/--color-accent: #FAFAFA;/' src/styles/tokens.css
npm run build && npx vitest run tests/build-output.test.ts
```

Expected: all tests PASS again, and `git diff src/styles/tokens.css` is empty.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the pre-existing `tests/content.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Badge.astro src/components/ui/SectionHeader.astro tests/build-output.test.ts
git commit -m "feat: add Badge and SectionHeader components with build-output guard"
```

---

## Task 4: Add the `isCurrentRole` helper (TDD)

The Experience section marks the newest role with a `Currently` badge. That decision is pure logic, so it gets a real red-green test cycle before Task 8 consumes it.

**Files:**
- Create: `tests/experience.test.ts`
- Create: `src/lib/experience.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/experience.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isCurrentRole } from '../src/lib/experience'

describe('isCurrentRole', () => {
  it('returns true for a year range ending in "Now"', () => {
    expect(isCurrentRole('2024 — Now')).toBe(true)
  })

  it('is case insensitive', () => {
    expect(isCurrentRole('2024 — NOW')).toBe(true)
    expect(isCurrentRole('2024 — now')).toBe(true)
  })

  it('returns true for "Present" as well', () => {
    expect(isCurrentRole('2024 — Present')).toBe(true)
  })

  it('returns false for a closed year range', () => {
    expect(isCurrentRole('2022 — 2024')).toBe(false)
  })

  it('does not match "Now" inside an unrelated word', () => {
    expect(isCurrentRole('2019 — Nowhere')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isCurrentRole('')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/experience.test.ts`
Expected: FAIL — `Failed to resolve import "../src/lib/experience"`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/experience.ts`:

```ts
/**
 * True when an experience entry's year range describes an ongoing role,
 * e.g. "2024 — Now" or "2024 — Present". Used to render a `Currently` badge.
 */
export function isCurrentRole(year: string): boolean {
  return /\b(now|present)\b/i.test(year)
}
```

The `\b` word boundaries are what make the "Nowhere" case fail correctly.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/experience.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/experience.ts tests/experience.test.ts
git commit -m "feat: add isCurrentRole helper for experience entries"
```

---

## Task 5: Rebuild the Hero section

**Files:**
- Modify: `src/components/home/Hero.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Switch the home page to dark**

In `src/pages/index.astro`, change the `<BaseLayout>` opening tag from:

```astro
<BaseLayout title={`${site.name} — ${site.role}`} description={site.tagline} theme="light">
```

to:

```astro
<BaseLayout title={`${site.name} — ${site.role}`} description={site.tagline}>
```

`theme` defaults to `'dark'`, so dropping the prop is the whole change. Leave the six section imports and their order untouched.

- [ ] **Step 2: Replace `src/components/home/Hero.astro`**

```astro
---
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import Badge from '../ui/Badge.astro'
import Button from '../ui/Button.astro'
import { site } from '../../content/site'
---
<section class="relative min-h-screen flex items-center justify-center py-32 text-center overflow-hidden">
  <div
    class="glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[80vh] pointer-events-none"
    aria-hidden="true"
  ></div>

  <Container class="relative">
    <Reveal>
      <Badge dot={site.available}>
        {site.available ? 'Available for work' : `${site.role} — ${site.location}`}
      </Badge>
    </Reveal>

    <Reveal delay={100}>
      <h1
        class="mt-10 font-display font-extrabold mx-auto max-w-5xl text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.95] tracking-[-0.03em]"
      >
        <span class="block text-text-primary">Design that people</span>
        <span class="block text-text-secondary">actually love</span>
      </h1>
    </Reveal>

    <Reveal delay={200}>
      <p class="mt-8 mx-auto max-w-[640px] text-xl leading-relaxed text-text-secondary">{site.bio[0]}</p>
    </Reveal>

    <Reveal delay={300}>
      <div class="mt-12 flex flex-wrap items-center justify-center gap-3">
        <Button href={`mailto:${site.email}`}>Get in touch</Button>
        <Button href="#work" variant="ghost">See projects</Button>
      </div>
    </Reveal>
  </Container>

  <div
    class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-xs uppercase tracking-[0.15em] text-text-tertiary"
  >
    <span>Scroll down</span>
    <span class="scroll-line block w-px h-10 bg-border overflow-hidden relative" aria-hidden="true"></span>
  </div>
</section>

<style>
  .scroll-line::after {
    content: '';
    position: absolute;
    inset-inline: 0;
    top: 0;
    height: 40%;
    background: var(--color-text-secondary);
    animation: scroll-hint 1.8s ease-in-out infinite;
  }

  @keyframes scroll-hint {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(250%); }
  }

  @media (prefers-reduced-motion: reduce) {
    .scroll-line::after {
      animation: none;
      transform: none;
    }
  }
</style>
```

What was removed relative to the old file: the accent-coloured SVG icon in the badge, the blue square glyph inside the headline, `font-micro`, and the `min-h-[90vh]`/`py-24` sizing.

- [ ] **Step 3: Verify the build succeeds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Verify the hero has no accent or legacy font references**

Run: `grep -n "accent\|font-micro" src/components/home/Hero.astro src/pages/index.astro || echo "CLEAN"`
Expected: `CLEAN`

Run: `grep -n "theme=" src/pages/index.astro || echo "NO THEME PROP"`
Expected: `NO THEME PROP`

- [ ] **Step 5: Check it in the browser**

Start the dev server via the preview tooling (`.claude/launch.json`), open `/`, and confirm by observation:

1. The page background is near-black (`#0A0A0A`), not light.
2. The headline renders in Plus Jakarta Sans — no pixel/retro lettering anywhere.
3. Line 1 is white, line 2 is grey.
4. Two pill buttons appear: a solid white one and a bordered one.
5. `Scroll down` with an animating line sits at the bottom.
6. The console has no errors.

Take a screenshot at 1280px width.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/Hero.astro src/pages/index.astro
git commit -m "feat(home): rebuild hero in Portfolite style and switch page to dark"
```

---

## Task 6: Restyle Selected Work

**Files:**
- Modify: `src/components/home/SelectedWork.astro`

- [ ] **Step 1: Replace `src/components/home/SelectedWork.astro`**

```astro
---
import { getCollection } from 'astro:content'
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import SectionHeader from '../ui/SectionHeader.astro'
import { sortByOrder, filterFeatured } from '../../lib/content'

const all = await getCollection('case-studies')
const featured = sortByOrder(filterFeatured(all))
const asymmetric = featured.length >= 4
---
<section id="work" class="border-t border-border py-section-y-sm md:py-section-y">
  <Container>
    <SectionHeader
      badge="Selected work"
      heading="Recent projects."
      description="A few problems I've worked through end to end, from research to shipped interface."
    />

    {featured.length === 0 && (
      <p class="text-text-secondary">No projects yet.</p>
    )}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      {featured.map((p, i) => {
        const fullWidth = asymmetric && (i === 0 || i === 3)
        return (
          <Reveal class={fullWidth ? 'md:col-span-2' : ''}>
            <a
              href={`/work/${p.data.slug}`}
              class="group block rounded-xl border border-border bg-bg-secondary p-3 transition duration-500 hover:border-border-hover hover:-translate-y-0.5"
            >
              <div class="overflow-hidden rounded-lg bg-bg-primary aspect-[16/10]">
                <img
                  src={p.data.thumbnail}
                  alt={p.data.thumbnailAlt}
                  class="w-full h-full object-contain transition duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div class="px-3 pt-5 pb-3">
                <h3 class="font-display font-semibold text-2xl md:text-3xl text-text-primary">{p.data.title}</h3>
                <p class="mt-2 max-w-lg text-text-secondary">{p.data.summary}</p>
                <span
                  class="mt-5 inline-flex items-center gap-1 text-sm text-text-tertiary transition group-hover:text-text-primary"
                >View case study ↗</span>
              </div>
            </a>
          </Reveal>
        )
      })}
    </div>
  </Container>
</section>
```

The `asymmetric` full-width rule is deliberately preserved — it activates on its own once there are four or more featured case studies. With the current two, the grid renders as a plain two-column layout.

`group-hover:brightness-105` was dropped: brightening a screenshot on a dark background reads as a colour shift rather than a highlight. The border and lift carry the hover state instead.

The old `View all →` link is dropped rather than ported. There is no `/work` index page in `src/pages/work/` (only `[slug].astro`), so the old markup pointed at `href="#"` — a link to nowhere. With two case studies there is nothing to "view all" of. `SectionHeader` still supports `actionLabel`/`actionHref` for when an index page exists.

- [ ] **Step 2: Verify the build succeeds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Check it in the browser**

Reload `/` and confirm:

1. The section label is a bordered pill reading `Selected work`, not `01 / Selected Work`.
2. Both case studies sit inside bordered cards with a visibly darker surface than the page.
3. Hovering a card lightens its border and nudges it upward; `View case study ↗` turns white.
4. Clicking a card navigates to `/work/<slug>`.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/SelectedWork.astro
git commit -m "feat(home): card-contained Selected Work section"
```

---

## Task 7: Restyle About

**Files:**
- Modify: `src/components/home/About.astro`

- [ ] **Step 1: Replace `src/components/home/About.astro`**

```astro
---
import Container from '../layout/Container.astro'
import Pill from '../ui/Pill.astro'
import Reveal from '../ui/Reveal.astro'
import SectionHeader from '../ui/SectionHeader.astro'
import { site } from '../../content/site'
---
<section id="about" class="border-t border-border py-section-y-sm md:py-section-y">
  <Container>
    <SectionHeader badge="About me" heading="Designer with a bias for shipping." />

    <div class="grid md:grid-cols-2 gap-12 items-start">
      <Reveal>
        <div class="group rounded-xl border border-border bg-bg-secondary p-3">
          <div class="aspect-[4/5] overflow-hidden rounded-lg bg-bg-primary">
            <img
              src="/images/placeholder.svg"
              alt={`Portrait of ${site.name}`}
              class="w-full h-full object-cover saturate-[0.2] transition duration-500 group-hover:saturate-100"
            />
          </div>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div>
          {site.bio.map(p => <p class="mb-4 text-lg text-text-secondary">{p}</p>)}

          <div class="mt-8">
            <div class="mb-3 text-xs uppercase tracking-[0.15em] text-text-tertiary">Skills</div>
            <div class="flex flex-wrap gap-2">{site.skills.map(s => <Pill>{s}</Pill>)}</div>
          </div>

          <div class="mt-6">
            <div class="mb-3 text-xs uppercase tracking-[0.15em] text-text-tertiary">Tools</div>
            <div class="flex flex-wrap gap-2">{site.tools.map(t => <Pill>{t}</Pill>)}</div>
          </div>
        </div>
      </Reveal>
    </div>
  </Container>
</section>
```

Two changes worth noting: the heading moved out of the right column into `SectionHeader` above the grid, and `bg-bg-secondary/40` on the section is replaced by a `border-t border-border` separator.

- [ ] **Step 2: Verify the build succeeds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Check it in the browser**

Reload `/` and confirm:

1. The section has no tinted background block — only a thin top border separates it from Selected Work.
2. The portrait sits in a bordered card and is visibly desaturated until hovered.
3. Skill and tool pills have borders and brighten on hover.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/About.astro
git commit -m "feat(home): card portrait and bordered separator for About section"
```

---

## Task 8: Restyle Experience

**Files:**
- Modify: `src/components/home/Experience.astro`

- [ ] **Step 1: Replace `src/components/home/Experience.astro`**

```astro
---
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import SectionHeader from '../ui/SectionHeader.astro'
import Badge from '../ui/Badge.astro'
import { site } from '../../content/site'
import { isCurrentRole } from '../../lib/experience'
---
<section class="border-t border-border py-section-y-sm md:py-section-y">
  <Container>
    <SectionHeader badge="Experience" heading="Where I've worked." />

    <ul class="divide-y divide-border">
      {site.experience.map((e, i) => (
        <Reveal
          as="li"
          delay={i * 60}
          class="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 rounded-lg px-4 py-6 transition duration-300 hover:bg-bg-elevated"
        >
          <div class="text-base text-text-tertiary">{e.year}</div>
          <div>
            <div class="flex flex-wrap items-center gap-3">
              <div class="font-display font-semibold text-xl text-text-primary">
                {e.role} <span class="font-normal text-text-secondary">· {e.company}</span>
              </div>
              {isCurrentRole(e.year) && <Badge>Currently</Badge>}
            </div>
            <p class="mt-1 text-text-secondary">{e.description}</p>
          </div>
        </Reveal>
      ))}
    </ul>
  </Container>
</section>
```

- [ ] **Step 2: Verify the build succeeds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Check it in the browser**

Reload `/` and confirm:

1. Four experience rows render.
2. Only the first row (`2024 — Now`) carries a `Currently` badge.
3. Hovering a row fills it with a slightly lighter surface, with rounded corners.
4. Year text is dimmer than the role text.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/Experience.astro
git commit -m "feat(home): hoverable experience rows with Currently badge"
```

---

## Task 9: Restyle Explorations

**Files:**
- Modify: `src/components/home/ExplorationsGrid.astro`

- [ ] **Step 1: Replace `src/components/home/ExplorationsGrid.astro`**

```astro
---
import { getCollection } from 'astro:content'
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import SectionHeader from '../ui/SectionHeader.astro'
import { sortByOrder } from '../../lib/content'

const all = await getCollection('explorations')
const items = sortByOrder(all)
---
<section class="border-t border-border py-section-y-sm md:py-section-y">
  <Container>
    <SectionHeader badge="Explorations" heading="Visual experiments." />

    {items.length === 0 ? (
      <p class="text-text-secondary">No explorations yet.</p>
    ) : (
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {items.map((e, i) => (
          <Reveal delay={i * 40}>
            <a
              href={`/explorations/${e.data.slug}`}
              class="group block rounded-xl border border-border bg-bg-secondary p-3 transition duration-500 hover:border-border-hover hover:-translate-y-0.5"
            >
              <div class="overflow-hidden rounded-lg bg-bg-primary aspect-[4/5]">
                <img
                  src={e.data.cover}
                  alt={e.data.coverAlt}
                  class="w-full h-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div class="flex items-center justify-between px-2 pt-4 pb-1 text-base">
                <div class="text-text-primary">{e.data.title}</div>
                <div class="text-text-tertiary">{e.data.year}</div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    )}
  </Container>
</section>
```

The empty state is preserved verbatim, because the `explorations` collection may legitimately be empty.

- [ ] **Step 2: Verify the build succeeds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Check it in the browser**

Reload `/` and confirm:

1. Six exploration cards render (`src/content/explorations/` holds `01-`through `06-exploration.mdx`), in a three-column grid on desktop.
2. Each sits inside a bordered card; hovering lifts it and lightens its border.
3. Title is white, year is dim, both inside the card.

If the empty state (`No explorations yet.`) renders instead, the collection failed to load — investigate rather than accepting it.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/ExplorationsGrid.astro
git commit -m "feat(home): card-contained Explorations grid"
```

---

## Task 10: Rebuild Contact as a CTA block

**Files:**
- Modify: `src/components/home/Contact.astro`

- [ ] **Step 1: Replace `src/components/home/Contact.astro`**

```astro
---
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import Badge from '../ui/Badge.astro'
import Button from '../ui/Button.astro'
import { site } from '../../content/site'

const linkedin = site.socials.find(s => s.label === 'LinkedIn')
const otherSocials = site.socials.filter(s => s.label !== 'Email')
---
<section id="contact" class="border-t border-border py-section-y-sm md:py-section-y">
  <Container>
    <Reveal>
      <div class="relative overflow-hidden rounded-2xl border border-border bg-bg-secondary px-6 py-20 text-center md:px-16 md:py-28">
        <div
          class="glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] pointer-events-none"
          aria-hidden="true"
        ></div>

        <div class="relative">
          <Badge>Contact</Badge>

          <h2 class="mt-8 font-display font-extrabold text-display-lg text-text-primary">
            Let's build<br />something together.
          </h2>

          <p class="mt-6 mx-auto max-w-[520px] text-lg text-text-secondary">
            Open to product design work and collaborations. The fastest way to reach me is email.
          </p>

          <div class="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button href={`mailto:${site.email}`}>Email me</Button>
            {linkedin && <Button href={linkedin.href} variant="ghost">LinkedIn</Button>}
          </div>
        </div>
      </div>
    </Reveal>

    <Reveal delay={150}>
      <div class="mt-8 flex flex-wrap justify-center gap-6 text-sm text-text-tertiary">
        {otherSocials.map(s => (
          <a href={s.href} class="hover:text-text-primary transition">{s.label} ↗</a>
        ))}
      </div>
    </Reveal>
  </Container>
</section>
```

The `text-gradient-accent` email link is gone; the email address is now reached through the `Email me` button.

- [ ] **Step 2: Verify the build succeeds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Verify no gradient utility remains on the home page**

Run: `grep -rn "gradient-accent" src/components/home/ src/pages/index.astro || echo "CLEAN"`
Expected: `CLEAN`

- [ ] **Step 4: Check it in the browser**

Reload `/` and confirm:

1. Contact renders as one large bordered block with a faint centre glow.
2. Two buttons: solid `Email me`, bordered `LinkedIn`.
3. No gradient-coloured text anywhere.
4. Social links sit below the block.
5. `Email me` opens a `mailto:` for `ficho@transfez.com`.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Contact.astro
git commit -m "feat(home): rebuild Contact as a CTA block"
```

---

## Task 11: Full verification pass

**Files:** none modified unless a defect is found.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass — `content.test.ts`, `experience.test.ts`, `build-output.test.ts`.

- [ ] **Step 2: Build cleanly from scratch**

Run: `rm -rf dist && npm run build`
Expected: exits 0 with no warnings about missing fonts or unresolved imports.

- [ ] **Step 3: Grep the home page code path for forbidden references**

Run:

```bash
grep -rn -E "accent|font-micro|Satoshi|Micro 5|JetBrains|Inter" \
  src/components/home/ src/components/ui/ src/components/layout/ src/pages/index.astro \
  || echo "CLEAN"
```

Expected: `CLEAN`

- [ ] **Step 4: Confirm every colour on the home page is neutral**

Run:

```bash
grep -oE '#[0-9A-Fa-f]{6}' src/styles/tokens.css | sort -u
```

Expected output — every value has equal R, G, and B pairs:

```
#0A0A0A
#141414
#1A1A1A
#262626
#3A3A3A
#525252
#A1A1A1
#FAFAFA
```

If any value appears whose three byte pairs are not identical, that is a hue and must be fixed.

- [ ] **Step 5: Browser check at desktop width**

Open `/` at 1280px. Confirm all six sections render in order: Hero, Selected Work, About, Experience, Explorations, Contact. Confirm the console is free of errors. Take a full-page screenshot.

- [ ] **Step 6: Browser check at mobile width**

Resize to 375px. Confirm:

1. No horizontal scrolling on the page body.
2. The hero headline does not overflow its container.
3. Selected Work collapses to a single column; Explorations stays at two columns.
4. Buttons wrap rather than overflowing.

Take a screenshot.

- [ ] **Step 7: Keyboard accessibility check**

Tab through the page from the top. Confirm a visible white focus ring appears on: header nav links, header CTA, hero's two buttons, each project card, each exploration card, contact's two buttons, and each social link. No element may be reachable without a visible ring.

- [ ] **Step 8: Case study regression check**

Open `/work/quick-transfer`. Confirm:

1. The page still renders with its per-project brand colour (gradient borders on images, coloured metrics) — accent tokens still work because `CaseStudyLayout.astro` overrides them.
2. Text renders in Plus Jakarta Sans, not Satoshi. This change is intended and site-wide.
3. The console is free of errors.

- [ ] **Step 9: Commit any fixes**

If steps 1–8 surfaced defects, fix them and commit:

```bash
git add -A
git commit -m "fix(home): address issues found in verification pass"
```

If nothing needed fixing, there is nothing to commit — say so explicitly rather than creating an empty commit.

---

## What execution changed

Four things the plan did not anticipate, all found by review or by the guard test:

**Task 1b — case study accent fallback.** Neutralizing the global accent defaults made
`/work/quick-transfer` render invisible accent content, because `CaseStudyLayout` only
emitted its override when an entry declared `brandColor`, and that entry declares none.
Fixed with compatibility fallbacks reproducing the pre-redesign default exactly.

**Task 2b — review cleanup.** Three real problems: `font-black` (900) is unreachable in
Plus Jakarta Sans, whose range is 200–800, so seven call sites silently rendered 800
while claiming 900 — all swapped to `font-extrabold`. The accent comment in `tokens.css`
had gone stale after Task 1b. And `brandColor` accepted any string, so an empty value
would emit the invalid declaration `--color-accent: ;` — now validated as a hex colour
in `src/content.config.ts`. Unused `inter` and `jetbrains-mono` dependencies removed.

**Task 3 — the guard caught a real leak, then a flaw in itself.**
`src/components/case-study/Section.astro` hardcoded the old blue and red hexes as a
Tailwind arbitrary value, which compiled into the shared CSS bundle that the home page
links. Replaced with `bg-gradient-accent`, which also fixed an existing inconsistency:
the voucher-points-banner blockquote bar had been rendering blue-to-red while the
project's brand colour is pink.

Then the "prove the guard can fail" step exposed that the guard was case-sensitive while
the minifier lowercases hex values — so it only ever protected Tailwind class names, never
the token path it exists to defend. Assertions are now case-insensitive regexes. `npm test`
also runs a build first, so the guard protects whoever breaks it rather than only CI.

**Concurrency.** Running a reviewer alongside an implementer corrupted a write: the
reviewer's `git checkout` detached HEAD and reverted an in-progress edit. Nothing was
lost, but only because the implementer happened to read the file back. Reviewers must
inspect read-only (`git show`, `git diff`), and implementers must not run concurrently.

## Definition of done

- `npm test` passes; `npm run build` exits 0.
- The home page renders dark, strictly monochrome, entirely in Plus Jakarta Sans.
- All six sections keep their original order and content.
- No external font requests are made by any page.
- Case study pages still show their per-project brand colours and are otherwise unchanged apart from the typeface.
- Screenshots at 1280px and 375px have been captured and shared.
