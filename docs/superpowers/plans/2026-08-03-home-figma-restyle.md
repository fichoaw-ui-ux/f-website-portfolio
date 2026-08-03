# Home Figma Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the home page to match the Figma `main-page` frame at full fidelity — Aileron typeface, Figma's type scale and palette, 32px radii, a textured near-black background, and a per-section relayout.

**Architecture:** Tokens change first in `src/styles/tokens.css` and `src/styles/global.css`, so every later task inherits the new palette and scale. Section components are then rewritten one at a time, each verified by an assertion against the built HTML. Two orphaned UI components are deleted at the end, once nothing imports them.

**Tech Stack:** Astro 7, Tailwind CSS 4 (via `@tailwindcss/vite`, config-less — theme lives in `@theme` in `tokens.css`), Vitest, `motion` for scroll reveals, `@fontsource/aileron`.

**Spec:** `docs/superpowers/specs/2026-08-03-home-figma-restyle-design.md`

**Figma source:** file `ARRQteKJDZ3K0THAdoyH0h`, frame `main-page` = `8920:2112`.

---

## Background you need before starting

**Tailwind 4 here has no config file.** The theme is defined with `@theme { }` inside `src/styles/tokens.css`. A custom property named `--color-foo` automatically produces `text-foo`, `bg-foo`, `border-foo`. Likewise `--radius-foo` produces `rounded-foo`, `--shadow-foo` produces `shadow-foo`, `--text-foo` produces `text-foo` as a font size, `--container-foo` produces `max-w-foo`, and `--spacing-foo` produces `p-foo` / `py-foo`. This is why the existing token file is named for those prefixes.

**Tests run against the built output.** `npm test` runs `astro build` and then `vitest run`. The tests read `dist/index.html` and the CSS files in `dist/_astro/`. There is no component-level test runner and no DOM harness, so "write the failing test first" here means asserting on built markup and CSS. To iterate on one file without a full `npm test`:

```bash
npm run build && npx vitest run tests/home-structure.test.ts
```

**A build is required before any test run.** If `dist/` is stale, the tests assert against old markup and will mislead you.

**Reveal wrapper.** `src/components/ui/Reveal.astro` sets `opacity: 0` inline and animates it in via `motion` on scroll. Content inside it **is** present in the built HTML, so assertions on markup work normally. Keep every section wrapped as it is today.

## File structure

**Created:**
- `tests/home-structure.test.ts` — structural assertions about the built home page: which sections exist, which removed elements are gone. Separate from `build-output.test.ts`, which stays focused on global concerns (fonts, tokens, colour guards).
- `public/images/ficho-portrait.png` — the portrait photo, exported from Figma. Used twice: cropped to a circle in the hero, and full-bleed in About. Figma exports one image fill for both frames, so there is deliberately no second avatar file.
- `public/images/logo-ficho.svg` — navbar wordmark, exported from Figma.

**Modified:**
- `package.json` — swap the font dependency.
- `src/styles/tokens.css` — full rewrite of the `@theme` block.
- `src/styles/global.css` — font import, textured background, drop the `glow` utility.
- `src/content/site.ts` — experience entries gain `highlights`; tools list replaced; `available` and `location` removed.
- `src/components/ui/Button.astro` — becomes the 48px pill.
- `src/components/ui/Pill.astro` — becomes the 40px chip.
- `src/components/layout/Container.astro` — 64px gutter at `lg`.
- `src/components/layout/Header.astro` — logo plus one CTA, static, no bar.
- `src/components/layout/Footer.astro` — centred copyright only.
- `src/components/home/Hero.astro`, `SelectedWork.astro`, `About.astro`, `Experience.astro`, `ExplorationsGrid.astro`, `Contact.astro` — rewritten per section.
- `tests/build-output.test.ts` — typeface and colour guards updated.

**Deleted:**
- `src/components/ui/SectionHeader.astro`, `src/components/ui/Badge.astro` — orphaned once the sections stop using badges.
- `src/lib/experience.ts`, `tests/experience.test.ts` — `isCurrentRole` only existed for the `Currently` badge.

---

### Task 1: Export the three Figma assets

**Files:**
- Create: `public/images/ficho-avatar.png`, `public/images/ficho-portrait.png`, `public/images/logo-ficho.svg`

Figma asset URLs expire about seven days after they are issued, so you must request fresh ones rather than reusing any URL written in this plan.

- [ ] **Step 1: Request fresh asset URLs**

Call `get_design_context` three times (they are independent — batch them in one message). Pass `skillNames: "resource:figma-design-to-code"` on each, and read `skill://figma/figma-design-to-code/SKILL.md` from the `plugin:figma:figma` MCP server first if you have not already this session — that skill is a mandatory prerequisite for the tool.

| Node | Contains |
|---|---|
| `8920:2151` | hero avatar (`image 38`) |
| `8927:2824` | About portrait (`image 37`) |
| `8920:2156` | navbar wordmark (`Vector`, 106×32) |

Each response includes asset URLs as `const` declarations at the top of the returned code.

- [ ] **Step 2: Download the bytes**

Substitute the URLs from Step 1. Do not link the Figma URLs from the site — they expire.

```bash
mkdir -p public/images
curl -sL -o public/images/ficho-avatar.png "<avatar url>"
curl -sL -o public/images/ficho-portrait.png "<portrait url>"
curl -sL -o public/images/logo-ficho.svg "<logo url>"
file public/images/ficho-avatar.png public/images/ficho-portrait.png public/images/logo-ficho.svg
```

- [ ] **Step 3: Confirm the formats match the filenames**

Expected from `file`: the two photos report `PNG image data`, the logo reports `SVG Scalable Vector Graphics image` or `XML`. If a photo comes back as JPEG, rename it to `.jpg` and use that name everywhere it appears later in this plan. If the logo is not SVG, keep the extension the tool actually returned.

Also record the portrait's pixel dimensions from `file` — Task 10 relies on it being taller than it is wide (Figma places it at 646×861).

- [ ] **Step 4: Commit**

```bash
git add public/images
git commit -m "assets: export hero avatar, portrait, and wordmark from Figma"
```

**Executed 2026-08-03. Outcome, and one correction to the rest of this plan:**

The hero avatar and the About portrait came back **byte-for-byte identical** (768×1024 PNG, 416KB, same MD5). This is not a download error — Figma exports the underlying image *fill*, and nodes `8920:2151` and `8927:2824` both reference the same source photo. The two different framings in the design are achieved by cropping in CSS, exactly as this plan already specifies via `object-position`.

So `ficho-avatar.png` was deleted and **there are only two assets**: `public/images/ficho-portrait.png` and `public/images/logo-ficho.svg`. Shipping the same 416KB twice would have doubled the page's image weight for no visual difference.

The hero in Task 7 therefore points at `/images/ficho-portrait.png`. Its derived `object-position: 53% 37%` still holds: the source is 768×1024 (ratio 0.750) and Figma's avatar frame is 128×171 (ratio 0.749), so the crop maths is unchanged.

---

### Task 2: Swap Plus Jakarta Sans for Aileron

**Files:**
- Modify: `package.json`, `src/styles/global.css:3`, `src/styles/tokens.css:22-27`
- Test: `tests/build-output.test.ts:43-48`

- [ ] **Step 1: Update the failing test**

Replace the existing typeface test in `tests/build-output.test.ts` (currently named `references no typeface other than Plus Jakarta Sans`) with:

```ts
  it('references Aileron and no other typeface', () => {
    expect(css).toContain('Aileron')
    expect(css).not.toContain('Plus Jakarta Sans')
    expect(html).not.toContain('Plus Jakarta Sans')
    expect(html).not.toContain('Satoshi')
    expect(css).not.toContain('Micro 5')
    expect(css).not.toContain('JetBrains')
  })
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npm run build && npx vitest run tests/build-output.test.ts
```

Expected: FAIL on `expect(css).toContain('Aileron')`.

- [ ] **Step 3: Install Aileron, remove Plus Jakarta Sans**

```bash
npm uninstall @fontsource-variable/plus-jakarta-sans && npm install @fontsource/aileron@^5.3.0
ls node_modules/@fontsource/aileron | head -30
```

Aileron ships static weights only — there is no variable build. Confirm from the `ls` output that `400.css` and `600.css` both exist. If `600.css` is absent, use `700.css` instead and change the `font-semibold` utilities in later tasks to `font-bold`.

- [ ] **Step 4: Import the two weights**

In `src/styles/global.css`, replace line 3:

```css
@import "@fontsource/aileron/400.css";
@import "@fontsource/aileron/600.css";
```

- [ ] **Step 5: Point the font tokens at Aileron**

In `src/styles/tokens.css`, replace the three font-family declarations and their comment:

```css
  /* Font families — Aileron is the only typeface on the site.
     --font-mono is kept as a token so existing `font-mono` class usages keep
     resolving, but it points at the same face. */
  --font-display: "Aileron", system-ui, sans-serif;
  --font-sans: "Aileron", system-ui, sans-serif;
  --font-mono: "Aileron", system-ui, sans-serif;
```

- [ ] **Step 6: Run the test to confirm it passes**

```bash
npm run build && npx vitest run tests/build-output.test.ts
```

Expected: PASS, including the pre-existing `requests no external fonts` test — Fontsource self-hosts, so nothing should reach `fonts.googleapis.com`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/styles/global.css src/styles/tokens.css tests/build-output.test.ts
git commit -m "feat(type): replace Plus Jakarta Sans with Aileron"
```

---

### Task 3: Remap the design tokens

**Files:**
- Modify: `src/styles/tokens.css`
- Test: `tests/build-output.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/build-output.test.ts`, inside the existing `describe('built home page')`:

```ts
  it('uses the Figma palette', () => {
    expect(css).toMatch(/--color-bg-primary:\s*#0b0b0b/i)
    expect(css).toMatch(/--color-text-primary:\s*#fff/i)
    expect(css).toMatch(/--color-text-secondary:\s*#bbbbc0/i)
    expect(css).toMatch(/--color-text-tertiary:\s*#909098/i)
  })

  it('drops the sub-AA grey that --color-text-tertiary used to hold', () => {
    // #525252 was 2.4:1 on the page background. The token name survives but
    // now points at #909098 (6.2:1), so guard the value, not the name.
    expect(css).not.toMatch(/#525252/i)
    expect(css).not.toMatch(/#A1A1A1/i)
  })
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npm run build && npx vitest run tests/build-output.test.ts
```

Expected: FAIL — `--color-bg-primary` is still `#0A0A0A`.

- [ ] **Step 3: Rewrite the token file**

Replace the whole of `src/styles/tokens.css` with:

```css
@theme {
  /* Colours — from Figma `Portfolio Asset`, frame main-page (8920:2112).
     Every text tier clears WCAG AA on --color-bg-primary:
     #FFFFFF 19.6:1, #BBBBC0 10.3:1, #909098 6.2:1. */
  --color-bg-primary: #0B0B0B;
  --color-bg-secondary: #171819;
  --color-bg-elevated: #1D1D1D;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #BBBBC0;
  --color-text-tertiary: #909098;
  --color-border: rgba(255, 255, 255, 0.12);
  --color-border-hover: rgba(255, 255, 255, 0.24);

  /* Figma also defines color/neutral/800 (#6C6C71). It reaches only 3.78:1 on
     the page background, so it is deliberately absent — do not add it for text. */

  /* These tokens must exist so Tailwind still emits .text-accent / .bg-accent /
     .bg-gradient-accent for case-study MDX and components. Case studies override
     the values in CaseStudyLayout.astro; nothing else does, so the neutral
     defaults here are what the home page actually renders. Keep them greyscale. */
  --color-accent: #FFFFFF;
  --color-accent-2: #BBBBC0;
  --gradient-accent: linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 60%, #BBBBC0 100%);

  /* Font families — Aileron is the only typeface on the site.
     --font-mono is kept as a token so existing `font-mono` class usages keep
     resolving, but it points at the same face. */
  --font-display: "Aileron", system-ui, sans-serif;
  --font-sans: "Aileron", system-ui, sans-serif;
  --font-mono: "Aileron", system-ui, sans-serif;

  /* Type scale — Figma sizes, each clamp pinned so the max equals the 1440px
     value exactly. letter-spacing is 0 at every level, unlike the previous
     scale which tracked headings at -0.03em. */
  --text-display-xl: clamp(2.75rem, 6.111vw, 5.5rem);   /* 88px @ 1440 */
  --text-display-xl--line-height: 1.25;
  --text-display-xl--letter-spacing: 0em;

  --text-display-lg: clamp(2rem, 3.889vw, 3.5rem);      /* 56px @ 1440 */
  --text-display-lg--line-height: 1.25;
  --text-display-lg--letter-spacing: 0em;

  --text-display-md: clamp(1.5rem, 2.222vw, 2rem);      /* 32px @ 1440 */
  --text-display-md--line-height: 1.6;
  --text-display-md--letter-spacing: 0em;

  /* Radii — radius/radius-2xl for cards, one step tighter for media inside them. */
  --radius-card: 2rem;    /* 32px */
  --radius-media: 1.5rem; /* 24px */

  /* Shadow — Figma's Shadow/Far geometry (0/16/32 and 0/4/12/-4) with an opaque
     black instead of its light-mode #16223329, which is invisible on near-black. */
  --shadow-card: 0 16px 32px rgba(0, 0, 0, 0.45), 0 4px 12px -4px rgba(0, 0, 0, 0.35);

  /* Layout — 1312px content band inside a 1440px frame leaves 64px gutters.
     Section padding is Figma's 80px, down from the previous 160px. */
  --container-container: 1312px;
  --spacing-section-y: 5rem;
  --spacing-section-y-sm: 3.5rem;
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npm run build && npx vitest run tests/build-output.test.ts
```

Expected: PASS. The pre-existing `defines no hued accent tokens` test must also still pass — the replacements are greyscale.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css tests/build-output.test.ts
git commit -m "feat(tokens): remap palette, type scale, radii to Figma"
```

---

### Task 4: Textured background

**Files:**
- Modify: `src/styles/global.css`

Figma paints the page background as a 1440×6636 image fill: near-black at `#0B0B0B` with soft lighter patches reaching about `#1D1D1D`. We reproduce it with gradients rather than shipping that bitmap.

The layers are `position: fixed`, so the texture stays put while content scrolls — it reads as light falling on the page rather than a gradient sliding past. They sit at negative `z-index` beneath all content, and `html` keeps the flat base colour so overscroll areas are never bare.

- [ ] **Step 1: Add the texture layers**

In `src/styles/global.css`, replace the `html` and `body` rules inside `@layer base` with:

```css
  html {
    scroll-behavior: smooth;
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
  }
  body {
    font-family: var(--font-sans);
    letter-spacing: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Soft light patches. Figma's background is an image fill spanning the full
     6636px frame; gradients approximate it at a fraction of the page weight and
     adapt to any page height. */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -2;
    pointer-events: none;
    background:
      radial-gradient(60% 40% at 18% 12%, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0)),
      radial-gradient(50% 35% at 82% 34%, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0)),
      radial-gradient(55% 40% at 30% 68%, rgba(255, 255, 255, 0.040), rgba(255, 255, 255, 0)),
      radial-gradient(45% 30% at 74% 88%, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0));
  }

  /* Fine grain, so the gradients do not band on wide displays. */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    opacity: 0.035;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
```

- [ ] **Step 2: Verify in the browser**

Start the dev server with the `preview_start` tool (never `npm run dev` in Bash), then take a screenshot. Expected: the page background is not a flat black — lighter patches are visible toward the upper-left and mid-right, and headings still read at full contrast. If the patches are invisible, confirm `body::before` is not being covered: no section may set an opaque `background-color`.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(bg): textured near-black field from Figma"
```

---

### Task 5: Content updates in site.ts

**Files:**
- Modify: `src/content/site.ts`

Figma supplies real company and role names, and a different tools list. Three Figma typos are corrected rather than copied: `Pineaple` → `Pineapple`, `Comunication` → `Communication`, `Mix Pannel` → `Mixpanel`.

- [ ] **Step 1: Rewrite the file**

Replace the whole of `src/content/site.ts` with:

```ts
export const site = {
  name: 'Ficho',
  role: 'UI/UX Designer',
  tagline: 'UI/UX Designer crafting digital products for growing brands.',
  bio: [
    "I'm a product designer focused on turning complex problems into simple, beautiful interfaces.",
    "Currently exploring the intersection of design systems and motion.",
  ],
  email: 'ficho@transfez.com',
  skills: [
    'Product Design',
    'User Research',
    'Design Systems',
    'Interaction Design',
    'Prototyping',
    'Information Architecture',
  ],
  tools: [
    'Figma',
    'Notion',
    'Mixpanel',
    'Claude Code',
    'Bitbucket',
    'Github',
    'Photoshop',
    'Illustrator',
  ],
  socials: [
    { label: 'LinkedIn', href: '#' },
    { label: 'Dribbble', href: '#' },
    { label: 'Read.cv', href: '#' },
    { label: 'Email', href: 'mailto:ficho@transfez.com' },
  ],
  // TODO: real year ranges. Figma shows "2023 - NOW" on all three roles, which
  // is placeholder text, not three concurrent jobs.
  // TODO: real highlights. The bullets below are the lorem ipsum from Figma and
  // must be replaced before this page is published.
  experience: [
    {
      year: '2023 — NOW',
      company: 'Transfez & Jack',
      role: 'Product Designer',
      highlights: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      ],
    },
    {
      year: '2023 — NOW',
      company: 'Transfez & Jack',
      role: 'Graphic Designer (Intern)',
      highlights: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      ],
    },
    {
      year: '2023 — NOW',
      company: 'Great Giant Pineapple',
      role: 'Corporate Communication',
      highlights: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      ],
    },
  ],
} as const

export type SiteConfig = typeof site
```

`available` and `location` are gone — the hero badge was their only reader. `description` on each experience entry is replaced by `highlights`.

- [ ] **Step 2: Confirm the breakage — which is silent, not a build failure**

```bash
npm run build && grep -c 'undefined' dist/index.html
```

**Corrected 2026-08-03, after this task ran.** An earlier version of this step predicted a FAIL here, because `Hero.astro` reads `site.available` and `Experience.astro` reads `e.description`. **The build does not fail.** `astro build` transpiles `.astro` frontmatter with esbuild, which strips types without checking them, and this project runs no `astro check`. Reading a field that no longer exists is not an error — it evaluates to `undefined`.

What actually happens: the build succeeds, the hero badge renders the literal text `UI/UX Designer — undefined`, and each Experience row renders an empty `<p>`. The `grep` reports `1`.

**Every "expected: FAIL at the build step" downstream of here was wrong for the same reason and has been corrected.** The lesson to carry into the remaining tasks: a green build proves nothing about whether the page works, and no existing test noticed a visible `undefined` in the markup. A guard was added to `tests/build-output.test.ts` for exactly this:

```ts
  it('leaks no literal "undefined" into the markup', () => {
    expect(html).not.toContain('undefined')
  })
```

That guard is **red from this task until Task 7** rewrites the hero. That is intended: it is the honest signal that the page is broken, replacing a build failure that never came.

Do not patch `Hero.astro` or `Experience.astro` here. Tasks 7 and 11 own them.

- [ ] **Step 3: Commit**

```bash
git add src/content/site.ts
git commit -m "content: adopt Figma company names, roles, and tools list"
```

Committing a red build is intentional — this task and the section rewrites form one sequence, and splitting the content change out keeps the diffs readable. Do not stop here.

---

### Task 6: Restyle Button and Pill, widen the Container gutter

**Files:**
- Modify: `src/components/ui/Button.astro`, `src/components/ui/Pill.astro`, `src/components/layout/Container.astro`

Figma's interactive pill is 48px tall with 20px side padding and a 16px/600 label. The chip in About is 40px tall. `Button` must keep its `href` / `variant` / `class` interface because `src/pages/404.astro` uses it.

- [ ] **Step 1: Rewrite Button.astro**

```astro
---
interface Props {
  href?: string
  variant?: 'primary' | 'ghost'
  class?: string
}
const { href, variant = 'primary', class: className = '' } = Astro.props
const base = 'inline-flex h-12 items-center gap-2 px-5 rounded-full text-base font-semibold leading-none transition duration-300'
const styles = variant === 'primary'
  ? 'bg-text-primary text-bg-primary hover:bg-text-secondary'
  : 'border border-border text-text-primary hover:border-border-hover hover:bg-bg-elevated'
const Tag = href ? 'a' : 'button'
---
<Tag href={href} class:list={[base, styles, className]}><slot /></Tag>
```

The ghost label moves from `text-text-secondary` to `text-text-primary`: Figma's pills are white-labelled, and 48px of pill around a dimmed label reads as disabled.

- [ ] **Step 2: Rewrite Pill.astro**

```astro
---
interface Props { class?: string }
const { class: className = '' } = Astro.props
---
<span
  class:list={[
    'inline-flex h-10 items-center px-5 text-base font-semibold leading-none rounded-full border border-border bg-bg-secondary text-text-primary',
    className,
  ]}
><slot /></span>
```

The hover styles are dropped. These chips are not interactive, and a hover response on a non-clickable element invites a click that does nothing.

- [ ] **Step 3: Widen the container gutter**

In `src/components/layout/Container.astro`, replace the class list:

```astro
<div class:list={['mx-auto w-full max-w-container px-6 md:px-8 lg:px-16', className]}><slot /></div>
```

At 1440px this yields 1440 − 128 = 1312px of content, matching Figma.

- [ ] **Step 4: Verify 404 still renders its button**

```bash
npm run build
```

The build succeeds — see the correction in Task 5, Step 2. What you are checking here is that `404.astro` still compiles and still renders a button, since it is the one out-of-scope consumer of `Button`. Confirm with:

```bash
grep -c 'rounded-full' dist/404.html
```

Expected: at least `1`. If it is `0`, the `Button` interface was changed and must be restored.

The `leaks no literal "undefined"` guard is still red at this point, from Task 5. That is expected until Task 7.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Button.astro src/components/ui/Pill.astro src/components/layout/Container.astro
git commit -m "feat(ui): Figma pill styling for Button and Pill"
```

---

### Task 7: Hero

**Files:**
- Modify: `src/components/home/Hero.astro`
- Test: `tests/home-structure.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/home-structure.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = join(process.cwd(), 'dist')

async function readHomeHtml(): Promise<string> {
  return readFile(join(DIST, 'index.html'), 'utf8').catch((err: unknown) => {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      throw new Error('dist/ not found — run `npm run build` before this test')
    }
    throw err
  })
}

describe('home page structure', () => {
  let html: string

  beforeAll(async () => {
    html = await readHomeHtml()
  })

  describe('hero', () => {
    it('greets by name in a single h1', () => {
      const h1s = html.match(/<h1\b/g) ?? []
      expect(h1s).toHaveLength(1)
      expect(html).toContain('Hello!')
      expect(html).toContain('a product designer')
    })

    it('drops the availability badge, CTAs, and scroll hint', () => {
      expect(html).not.toContain('Available for work')
      expect(html).not.toContain('See projects')
      expect(html).not.toContain('Scroll down')
    })

    it('shows the avatar as decorative, since the h1 already names him', () => {
      // Same source file as the About portrait — Figma exports one image fill
      // for both frames. `alt=""` is what distinguishes the hero's decorative
      // copy from About's described one.
      expect(html).toMatch(/<img[^>]+ficho-portrait\.png[^>]+alt=""/)
    })
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npm run build && npx vitest run tests/home-structure.test.ts
```

Expected: the build succeeds (see Task 5, Step 2 — missing `site` fields do not fail the build), and the new hero tests FAIL because the hero has not been rewritten yet. The `greets by name in a single h1` and `shows the avatar as decorative` assertions should both fail.

- [ ] **Step 3: Rewrite Hero.astro**

```astro
---
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import { site } from '../../content/site'
---
<section class="flex min-h-[880px] items-center py-24">
  <Container>
    <div class="mx-auto flex max-w-[1088px] flex-col items-center gap-8">
      <Reveal>
        <h1 class="font-display font-semibold text-display-xl text-text-primary">
          <span class="flex flex-wrap items-center justify-center gap-6">
            <span>Hello!</span>
            <img
              src="/images/ficho-portrait.png"
              alt=""
              width="97"
              height="96"
              class="h-24 w-24 shrink-0 rounded-full border-2 border-text-primary object-cover"
              style="object-position: 53% 37%"
            />
            <span>I&rsquo;m Ficho.</span>
          </span>
          <span class="mt-1 block text-center">a product designer</span>
        </h1>
      </Reveal>

      <Reveal delay={100}>
        <p class="mx-auto max-w-[640px] text-center text-2xl leading-[1.6] text-text-secondary">
          {site.bio[0]}
        </p>
      </Reveal>
    </div>
  </Container>
</section>
```

Three notes on why this shape:

- **One `<h1>`, not three.** Figma draws `Hello!`, `I'm Ficho.`, and `a product designer` as three text nodes, but they are one sentence. Three `h1` elements on a page is a document-outline error.
- **`object-position: 53% 37%`** is derived from Figma, not guessed. The source image is 128×171 inside a 97×96 circle; the visible window lands at x −20…108 and y −16…155, whose centre is 53% across and 37% down the source. Plain centring would crop the forehead.
- **`alt=""`** because the `h1` already says "I'm Ficho." A described avatar would make the heading announce his name twice.

The hero's other CTA — `Get in touch` — is deliberately *not* asserted absent here. That exact string is also the current header's CTA, which survives until Task 14, so asserting it now would fail for the wrong reason. Task 14 covers the header's own strings.

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npm run build && npx vitest run tests/home-structure.test.ts
```

Expected: the three `hero` tests PASS. Also run the global guards, because this task is what turns one of them green:

```bash
npx vitest run tests/build-output.test.ts
```

Expected: all six PASS, including `leaks no literal "undefined" into the markup` — removing the availability badge removes the `site.location` read that was rendering it. **If that guard is still red, grep `dist/index.html` for `undefined` and report what you find rather than adjusting the test.**

Then verify visually: `preview_start`, screenshot, and compare against the Figma hero — heading centred, avatar between the two phrases, one line of grey sub-copy below.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Hero.astro tests/home-structure.test.ts
git commit -m "feat(home): centred hero with inline avatar"
```

---

### Task 8: Selected Works

**Files:**
- Modify: `src/components/home/SelectedWork.astro`
- Test: `tests/home-structure.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside `describe('home page structure')` in `tests/home-structure.test.ts`:

```ts
  describe('selected works', () => {
    it('uses the Figma heading and sub-copy', () => {
      expect(html).toContain('My selected works')
      expect(html).toContain('With my keen eye for detail')
      expect(html).not.toContain('Recent projects')
      expect(html).not.toContain('Selected work</')
    })

    it('labels each card with its upper-cased tags and a View Details pill', () => {
      expect(html).toContain('View Details')
      expect(html).not.toContain('View case study')
    })
  })
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npm run build && npx vitest run tests/home-structure.test.ts
```

Expected: the build succeeds and the two new `selected works` tests FAIL, because the old markup still says `Recent projects.` and `View case study ↗`.

- [ ] **Step 3: Rewrite SelectedWork.astro**

```astro
---
import { getCollection } from 'astro:content'
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import { sortByOrder, filterFeatured } from '../../lib/content'

const all = await getCollection('case-studies')
const featured = sortByOrder(filterFeatured(all))
---
<section id="work" class="py-section-y-sm md:py-section-y">
  <Container>
    <Reveal>
      <div class="mx-auto max-w-[1088px] text-center">
        <h2 class="font-display font-semibold text-display-lg text-text-primary">My selected works</h2>
        <p class="mx-auto mt-6 max-w-[864px] text-2xl leading-[1.6] text-text-secondary">
          With my keen eye for detail and sharp critical thinking skills, I specialize in
          crafting captivating websites, products, and experiences.
        </p>
      </div>
    </Reveal>

    {featured.length === 0 && <p class="mt-16 text-text-tertiary">No projects yet.</p>}

    <div class="mt-16 flex flex-col gap-16">
      {featured.map(p => (
        <Reveal>
          <a
            href={`/work/${p.data.slug}`}
            class="group block rounded-card bg-bg-secondary p-6 shadow-card transition duration-500 hover:-translate-y-1 md:p-12"
          >
            <div class="grid items-center gap-8 md:grid-cols-[438px_1fr] md:gap-12">
              <div class="order-2 md:order-1">
                <h3 class="font-display font-semibold text-display-md text-text-primary">{p.data.title}</h3>
                <p class="mt-4 text-base font-semibold uppercase leading-none text-text-tertiary">
                  {p.data.tags.join(', ')}
                </p>
                <p class="mt-8 text-lg leading-[1.6] text-text-tertiary">{p.data.summary}</p>
                <span
                  class="mt-8 inline-flex h-12 items-center rounded-full border border-border px-5 text-base font-semibold leading-none text-text-primary transition duration-300 group-hover:border-border-hover group-hover:bg-bg-elevated"
                >View Details</span>
              </div>
              <div class="order-1 aspect-[730/438] overflow-hidden rounded-media bg-bg-primary md:order-2">
                <img
                  src={p.data.thumbnail}
                  alt={p.data.thumbnailAlt}
                  class="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]"
                />
              </div>
            </div>
          </a>
        </Reveal>
      ))}
    </div>
  </Container>
</section>
```

`View Details` is a `<span>`, not a nested `<a>`. The whole card is already the link, and an anchor inside an anchor is invalid HTML that browsers silently restructure.

The `asymmetric` variable and the two-column grid are gone — Figma stacks full-width cards in one column.

- [ ] **Step 4: Run the test to confirm the assertions pass**

```bash
npm run build && npx vitest run tests/home-structure.test.ts
```

Expected: the `selected works` tests PASS, and every test added by earlier tasks still passes. Then verify visually with `preview_start` plus a screenshot, comparing card padding, the 64px gap between cards, and the image sitting on the right.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/SelectedWork.astro tests/home-structure.test.ts
git commit -m "feat(home): full-width work cards with side-by-side layout"
```

---

### Task 9: About

**Files:**
- Modify: `src/components/home/About.astro`
- Test: `tests/home-structure.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside `describe('home page structure')`:

```ts
  describe('about', () => {
    it('runs the bio as one paragraph and drops the section badge pattern', () => {
      expect(html).toContain('About me')
      expect(html).not.toContain('Designer with a bias for shipping')
      expect(html).toContain('beautiful interfaces. Currently exploring')
    })

    it('shows the real portrait rather than the placeholder', () => {
      expect(html).toContain('/images/ficho-portrait.png')
      expect(html).not.toContain('/images/placeholder.svg')
    })

    it('keeps the skills and tools groups labelled', () => {
      expect(html).toContain('SKILLS')
      expect(html).toContain('TOOLS')
      expect(html).toContain('Mixpanel')
      expect(html).not.toContain('Framer')
    })
  })
```

The `beautiful interfaces. Currently exploring` assertion is the one that proves `site.bio` was joined into a single paragraph — with two `<p>` elements a tag would sit between those words.

- [ ] **Step 2: Run it to confirm it fails**

```bash
npm run build && npx vitest run tests/home-structure.test.ts
```

Expected: FAIL on the joined-bio and portrait assertions.

- [ ] **Step 3: Rewrite About.astro**

```astro
---
import Container from '../layout/Container.astro'
import Pill from '../ui/Pill.astro'
import Reveal from '../ui/Reveal.astro'
import { site } from '../../content/site'
---
<section id="about" class="overflow-x-clip py-section-y-sm md:py-section-y">
  <Container>
    <div class="grid items-start gap-12 md:grid-cols-[620px_1fr] md:gap-20">
      <Reveal delay={100} class="order-1 md:order-2">
        <img
          src="/images/ficho-portrait.png"
          alt={`Portrait of ${site.name}`}
          class="w-full rounded-card object-cover md:-mb-[103px] md:-ml-[18px] md:-mt-[102px] md:h-[861px] md:w-[646px] md:max-w-none"
        />
      </Reveal>

      <Reveal class="order-2 md:order-1">
        <div>
          <h2 class="font-display font-semibold text-display-lg text-text-primary">About me</h2>
          <p class="mt-6 max-w-[559px] text-2xl leading-[1.6] text-text-secondary">{site.bio.join(' ')}</p>

          <hr class="my-8 border-0 border-t border-border" />

          <div>
            <div class="text-lg leading-[1.6] text-text-tertiary">SKILLS</div>
            <div class="mt-4 flex flex-wrap gap-4">{site.skills.map(s => <Pill>{s}</Pill>)}</div>
          </div>

          <hr class="my-8 border-0 border-t border-border" />

          <div>
            <div class="text-lg leading-[1.6] text-text-tertiary">TOOLS</div>
            <div class="mt-4 flex flex-wrap gap-4">{site.tools.map(t => <Pill>{t}</Pill>)}</div>
          </div>
        </div>
      </Reveal>
    </div>
  </Container>
</section>
```

The negative margins are the composition, not a mistake: Figma runs the 861px portrait past its 656px column by 102px above and 103px below, and 18px to the left. They apply only from `md` up, because beside nothing the bleed just looks like a misaligned image. `overflow-x-clip` on the section stops the 18px left bleed from producing a horizontal scrollbar while still letting the vertical bleed show.

The portrait is `order-1` on mobile so it leads the stack, and `md:order-2` to sit on the right on desktop — the reverse of the current build.

- [ ] **Step 4: Run the test**

```bash
npm run build && npx vitest run tests/home-structure.test.ts
```

Expected: the `about` assertions pass once the build succeeds (still blocked by Task 11). Verify visually in the meantime: the portrait should extend above and below the text column, and the page must not scroll sideways.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/About.astro tests/home-structure.test.ts
git commit -m "feat(home): About with bleeding portrait and divided skill groups"
```

---

### Task 10: Audit SectionHeader and Badge for outside dependents

**Files:** none modified.

`SectionHeader` and `Badge` are slated for deletion, but two files still import them at this point — `Experience.astro` and `ExplorationsGrid.astro`, rewritten in Tasks 11 and 12. **Do not delete them here.** Deleting now would break the build and make the green gate at the end of Task 11 impossible. The deletion happens in Task 15, once nothing imports them.

What this task establishes is that the deletion will be safe — that nothing outside the home page depends on either component.

- [ ] **Step 1: List every importer**

```bash
grep -rn "SectionHeader\|Badge" src --include='*.astro' --include='*.ts' --include='*.mdx'
```

Expected hits, and nothing else:
- `src/components/home/Experience.astro` — rewritten in Task 11
- `src/components/home/ExplorationsGrid.astro` — rewritten in Task 12
- `src/components/ui/SectionHeader.astro` — itself, and it imports `Badge`
- `src/components/ui/Badge.astro` — itself

- [ ] **Step 2: Decide based on what you found**

If the list matches, Task 15 can delete both. Write nothing; move on to Task 11.

If any case study layout, MDX file, exploration page, or 404 appears, **stop**. Those pages are out of scope for relayout, so the component they depend on has to stay. Amend Task 15 to skip that component and note it in your summary.

---

### Task 11: Experience

**Files:**
- Modify: `src/components/home/Experience.astro`
- Delete: `src/lib/experience.ts`, `tests/experience.test.ts`
- Test: `tests/home-structure.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside `describe('home page structure')`:

```ts
  describe('experience', () => {
    it('lists company, role, and two bullets per entry', () => {
      expect(html).toMatch(/Where I(&#39;|&rsquo;|&apos;|'|’)ve worked/)
      expect(html).toMatch(/Transfez (&#38;|&amp;|&) Jack/)
      expect(html).toContain('Great Giant Pineapple')
      expect(html).toContain('Corporate Communication')
    })

    it('drops the Currently badge', () => {
      // `>Currently<` targets the badge's own text node. A bare 'Currently'
      // would also match site.bio[1] — "Currently exploring the intersection
      // of design systems and motion" — which the About section still renders.
      expect(html).not.toContain('>Currently<')
    })
  })
```

Both string assertions are regexes on purpose. Astro passes literal template text through unescaped but escapes `{expression}` output, so `Where I've worked` — written literally in the heading — keeps its raw apostrophe, while `{e.company}` turns `&` into an entity. Matching either form means the test survives that distinction instead of encoding a guess about it.

- [ ] **Step 2: Run it to confirm it fails**

```bash
npm run build && npx vitest run tests/home-structure.test.ts
```

Expected: the build succeeds and the two new `experience` tests FAIL — the old markup still renders `Company A`–`Company D` and a `Currently` badge, and `{e.description}` renders as an empty paragraph rather than bullets.

- [ ] **Step 3: Rewrite Experience.astro**

```astro
---
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import { site } from '../../content/site'
---
<section class="py-section-y-sm md:py-section-y">
  <Container>
    <Reveal>
      <h2 class="font-display font-semibold text-display-lg text-text-primary">Where I've worked</h2>
    </Reveal>

    <ul class="mt-16">
      {site.experience.map((e, i) => (
        <Reveal as="li" delay={i * 60} class={i > 0 ? 'mt-8 border-t border-border pt-8' : ''}>
          <div class="grid gap-4 md:grid-cols-[303px_1fr] md:gap-8">
            <div class="text-2xl leading-[1.6] text-text-tertiary">{e.year}</div>
            <div>
              <div class="flex flex-wrap items-baseline gap-3 text-2xl leading-[1.6] text-text-primary">
                <span>{e.company}</span>
                <span class="text-text-tertiary" aria-hidden="true">-</span>
                <span>{e.role}</span>
              </div>
              <ul class="mt-3 space-y-2">
                {e.highlights.map(h => (
                  <li class="flex gap-2 text-lg leading-[1.6] text-text-tertiary">
                    <span class="select-none" aria-hidden="true">&bull;</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      ))}
    </ul>
  </Container>
</section>
```

The separating dash is `aria-hidden` — read aloud it turns "Transfez & Jack, Product Designer" into "Transfez and Jack hyphen Product Designer". The bullet glyph is hidden for the same reason; the `<li>` already conveys list membership.

Rows are separated by `mt-8 … pt-8` on every entry after the first, giving Figma's 32px above and below each hairline, rather than `divide-y`, which cannot pad both sides.

- [ ] **Step 4: Delete the dead helper and its test**

```bash
git rm src/lib/experience.ts tests/experience.test.ts
```

`isCurrentRole` existed only to decide whether to render the `Currently` badge. With the badge gone it has no caller.

- [ ] **Step 5: Run the full suite — the build should finally be green**

```bash
npm test
```

Expected: PASS. Task 5's content change is now fully absorbed — this task consumes the last of it, `highlights`. If `tests/content.test.ts` fails, read the failure — it asserts on the content collections, which this plan does not touch, so a failure there means something unintended changed.

(The suite first went green again at Task 7, when the hero rewrite cleared the `undefined` guard. There is no long red window; only that single guard is red, and only between Tasks 5 and 7.)

- [ ] **Step 6: Commit**

```bash
git add src/components/home/Experience.astro tests/home-structure.test.ts
git commit -m "feat(home): Experience rows with bulleted highlights"
```

---

### Task 12: Explorations

**Files:**
- Modify: `src/components/home/ExplorationsGrid.astro`
- Test: `tests/home-structure.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside `describe('home page structure')`:

```ts
  describe('explorations', () => {
    it('drops the section heading and per-card captions', () => {
      expect(html).not.toContain('Visual experiments')
      expect(html).not.toContain('Explorations</')
    })

    it('keeps every card a labelled link', () => {
      const links = html.match(/href="\/explorations\/[^"]+"/g) ?? []
      expect(links.length).toBeGreaterThanOrEqual(6)
    })
  })
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npm run build && npx vitest run tests/home-structure.test.ts
```

Expected: FAIL — `Visual experiments.` is still in the markup.

- [ ] **Step 3: Rewrite ExplorationsGrid.astro**

```astro
---
import { getCollection } from 'astro:content'
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import { sortByOrder } from '../../lib/content'

const all = await getCollection('explorations')
const items = sortByOrder(all)

/* Three consecutive chunks, not round-robin. Staggered columns need real column
   containers — a plain grid cannot offset one column without moving the shared
   row — so DOM order is whatever the split produces. Chunking keeps DOM order
   equal to content order, which is what the single-column mobile layout stacks
   and what a screen reader announces. */
const perColumn = Math.ceil(items.length / 3)
const columns = [
  items.slice(0, perColumn),
  items.slice(perColumn, perColumn * 2),
  items.slice(perColumn * 2),
]
---
<section class="py-section-y-sm md:py-section-y">
  <Container>
    {items.length === 0 ? (
      <p class="text-text-tertiary">No explorations yet.</p>
    ) : (
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map((column, ci) => (
          <div class:list={['flex flex-col gap-8', ci !== 1 && 'lg:mt-[276px]']}>
            {column.map(e => (
              <Reveal>
                <a
                  href={`/explorations/${e.data.slug}`}
                  class="group block aspect-[416/520] overflow-hidden rounded-card bg-bg-secondary transition duration-500 hover:-translate-y-1"
                >
                  <img
                    src={e.data.cover}
                    alt={e.data.coverAlt}
                    class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                </a>
              </Reveal>
            ))}
          </div>
        ))}
      </div>
    )}
  </Container>
</section>
```

The outer columns get `lg:mt-[276px]`, matching Figma's offset, and only from `lg` — below that the columns sit side by side or stack, and an offset would read as a gap. With the title and year removed, each card's accessible name is its `coverAlt`, which the collection schema already requires.

- [ ] **Step 4: Run the suite**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/ExplorationsGrid.astro tests/home-structure.test.ts
git commit -m "feat(home): staggered three-column explorations grid"
```

---

### Task 13: Contact and Footer

**Files:**
- Modify: `src/components/home/Contact.astro`, `src/components/layout/Footer.astro`
- Test: `tests/home-structure.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside `describe('home page structure')`:

```ts
  describe('contact and footer', () => {
    it('offers LinkedIn and a mail link', () => {
      expect(html).toMatch(/Let(&#39;|&rsquo;|&apos;|'|’)s build something together/)
      expect(html).toContain('Contact me')
      expect(html).toContain('mailto:ficho@transfez.com')
      expect(html).not.toContain('Email me')
    })

    it('reduces the footer to a centred copyright', () => {
      expect(html).toContain('All rights reserved')
      expect(html).not.toContain('Read.cv')
      expect(html).not.toContain('Dribbble')
    })
  })
```

`Read.cv` and `Dribbble` appear only in the old footer's social row, so their absence proves it is gone.

- [ ] **Step 2: Run it to confirm it fails**

```bash
npm run build && npx vitest run tests/home-structure.test.ts
```

Expected: FAIL — `Email me` is still present and the footer still lists socials.

- [ ] **Step 3: Rewrite Contact.astro**

```astro
---
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import Button from '../ui/Button.astro'
import { site } from '../../content/site'

const linkedin = site.socials.find(s => s.label === 'LinkedIn')
---
<section id="contact" class="flex min-h-[818px] items-center py-24">
  <Container>
    <Reveal>
      <div class="mx-auto max-w-[1088px] text-center">
        <h2 class="font-display font-semibold text-display-lg text-text-primary">
          Let's build something together
        </h2>

        <p class="mx-auto mt-8 max-w-[640px] text-2xl leading-[1.6] text-text-secondary">
          Open to product design work and collaborations. The fastest way to reach me is email.
        </p>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
          {linkedin && <Button href={linkedin.href} variant="ghost">LinkedIn</Button>}
          <Button href={`mailto:${site.email}`}>Contact me</Button>
        </div>
      </div>
    </Reveal>
  </Container>
</section>
```

The bordered, glowing card is gone — Figma sets this content directly on the page background. `min-h-[818px]` is Figma's 880px section minus the 62px footer strip that follows it.

- [ ] **Step 4: Rewrite Footer.astro**

```astro
---
import Container from './Container.astro'
import { site } from '../../content/site'
const year = new Date().getFullYear()
---
<footer class="py-5">
  <Container>
    <p class="text-center text-sm leading-[1.6] text-text-tertiary">
      &copy; {year} {site.name}. All rights reserved.
    </p>
  </Container>
</footer>
```

`py-5` plus a 22px line gives Figma's 62px strip. The top border and `mt-24` go: with Contact already ending in whitespace, a rule there just draws a line under nothing.

- [ ] **Step 5: Run the suite**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/Contact.astro src/components/layout/Footer.astro tests/home-structure.test.ts
git commit -m "feat(home): centred contact block and minimal footer"
```

---

### Task 14: Header

**Files:**
- Modify: `src/components/layout/Header.astro`
- Test: `tests/home-structure.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside `describe('home page structure')`:

```ts
  describe('header', () => {
    it('is reduced to a wordmark and one CTA', () => {
      expect(html).toContain('/images/logo-ficho.svg')
      expect(html).toContain('Contact Us')
      expect(html).not.toContain('href="/#work"')
      expect(html).not.toContain('href="/#about"')
      expect(html).not.toContain('href="/#contact"')
    })
  })
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npm run build && npx vitest run tests/home-structure.test.ts
```

Expected: FAIL — the nav links are still in the markup.

- [ ] **Step 3: Rewrite Header.astro**

```astro
---
import Container from './Container.astro'
import { site } from '../../content/site'
---
<header class="pt-8">
  <Container>
    <div class="flex h-[72px] items-center justify-between gap-3">
      <a href="/" class="inline-flex items-center" aria-label={`${site.name} — home`}>
        <img src="/images/logo-ficho.svg" alt="" width="106" height="32" class="h-8 w-auto" />
      </a>

      <a
        href={`mailto:${site.email}`}
        class="inline-flex h-12 items-center gap-2 rounded-full border border-border px-5 text-base font-semibold leading-none text-text-primary transition duration-300 hover:border-border-hover hover:bg-bg-elevated"
      >
        <span>Contact Us</span>
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="m13 5 7 7-7 7" />
        </svg>
      </a>
    </div>
  </Container>
</header>
```

Two deliberate departures from the current header:

- **No longer sticky, and no bar.** Figma draws neither. A sticky header with no background scrolls transparently over the content, and 88px headings passing under the wordmark is illegible. The `Contact Us` CTA is duplicated in the Contact section, so nothing is lost by letting the header scroll away.
- **The wordmark is the exported SVG**, with `alt=""` on the image and the accessible name on the link. Naming both would make the link announce itself twice.

The nav links are gone per the design. This is a known trade-off recorded in the spec: a 6636px page now has no in-page navigation.

- [ ] **Step 4: Run the suite**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Header.astro tests/home-structure.test.ts
git commit -m "feat(layout): reduce header to wordmark and contact CTA"
```

---

### Task 15: Delete the orphaned components and the dead glow utility

**Files:**
- Delete: `src/components/ui/SectionHeader.astro`, `src/components/ui/Badge.astro`
- Modify: `src/styles/global.css`

Everything that imported `SectionHeader` or `Badge` has now been rewritten, so the deletion Task 10 audited is finally safe.

- [ ] **Step 1: Re-confirm both components are orphaned**

```bash
grep -rn "SectionHeader\|Badge" src --include='*.astro' --include='*.ts' --include='*.mdx'
```

Expected: hits only inside the two component files themselves. If a home section still imports one, that section's rewrite is incomplete — go back and finish it before deleting.

- [ ] **Step 2: Delete both**

```bash
git rm src/components/ui/SectionHeader.astro src/components/ui/Badge.astro
npm run build
```

Expected: the build succeeds. A failure here names the file that still imports them.

- [ ] **Step 3: Confirm nothing uses the glow utility**

```bash
grep -rn "glow" src --include='*.astro' --include='*.ts' --include='*.mdx' --include='*.css'
```

Expected: the only hit is the `@utility glow` definition in `src/styles/global.css`. If a case study or layout still uses it, leave the utility in place and say so in your summary.

- [ ] **Step 4: Delete the utility block**

Remove this from `src/styles/global.css`:

```css
@utility glow {
  background: radial-gradient(
    50% 50% at 50% 50%,
    rgba(250, 250, 250, 0.05) 0%,
    rgba(250, 250, 250, 0) 100%
  );
}
```

- [ ] **Step 5: Run the suite and commit**

```bash
npm test
```

Expected: PASS.

```bash
git add src/styles/global.css
git commit -m "refactor: drop SectionHeader, Badge, and the unused glow utility"
```

---

### Task 16: Responsive pass

**Files:**
- Modify: whichever section files the checks below reveal as broken

Figma provides desktop 1440 only. The rules already written into Tasks 7–14 cover the intended behaviour; this task verifies them at real widths and fixes what does not hold.

- [ ] **Step 1: Check three widths in the browser**

Start the preview, then use `resize_window` for each of `mobile` (375), `tablet` (768), and `desktop` (1280), taking a screenshot at each.

- [ ] **Step 2: Assert these specific properties at each width**

| Width | Expected |
|---|---|
| 375 | No horizontal scrollbar. Hero heading wraps without clipping and the avatar stays on a line with text rather than alone. Work cards are one column with the image above the text. About shows the portrait first, full-width, with no bleed. Explorations is a single column in content order. |
| 768 | Work cards still stacked; About still one column; Explorations two columns with no 276px offsets. |
| 1280 | Work cards side by side; About two columns with the portrait bleeding above and below; Explorations three columns with the outer two offset down. |

Confirm no horizontal scroll with:

```js
document.documentElement.scrollWidth <= document.documentElement.clientWidth
```

Run it via `javascript_tool` at each width. Expected: `true`. If it is `false` at `lg`, the About portrait's `-ml-[18px]` is escaping `overflow-x-clip` — check that the class is on the `<section>`.

- [ ] **Step 3: Fix any failure and re-verify**

Adjust the responsive classes in the offending component only. Do not change desktop values — those are Figma's and are verified in Task 17.

- [ ] **Step 4: Commit**

```bash
git add -A src
git commit -m "fix(home): responsive behaviour at mobile and tablet widths"
```

If nothing needed fixing, skip the commit and say so.

---

### Task 17: Final verification against Figma

**Files:** none modified unless a discrepancy is found.

- [ ] **Step 1: Full suite**

```bash
npm test
```

Expected: PASS, with no skipped tests. Report the actual output — do not assert success without it.

- [ ] **Step 2: Confirm the deletions landed**

```bash
git status --short && ls src/components/ui src/lib
```

Expected: a clean tree; `SectionHeader.astro`, `Badge.astro`, and `experience.ts` all absent.

- [ ] **Step 3: Side-by-side against Figma**

Screenshot the built home page at 1440 width, then fetch the Figma frame for comparison:

```
get_screenshot on fileKey ARRQteKJDZ3K0THAdoyH0h, nodeId 8920:2112, maxDimension 1400
```

Compare section by section: hero centring and avatar placement, work card padding and image position, the About portrait bleed, Experience row rhythm, the Explorations column offsets, and the Contact block.

- [ ] **Step 4: Confirm the hairline colour matches Figma**

The spec chose `rgba(255, 255, 255, 0.12)` for the About and Experience hairlines without reading the stroke off the Figma vector. Confirm it now:

```
get_design_context on fileKey ARRQteKJDZ3K0THAdoyH0h, nodeId 8921:2749
```

That is the About left column, which contains the two hairline vectors (`8921:2750`, `8921:2784`). Compare the stroke colour in the returned code against `--color-border`. If it differs materially, update `--color-border` in `src/styles/tokens.css` and re-run `npm test`. If it matches within a couple of percent of opacity, leave it and say so.

- [ ] **Step 5: Confirm reduced motion is still honoured**

The blanket `prefers-reduced-motion` rule in `src/styles/global.css` was never touched, but the `Reveal` component sets `opacity: 0` inline and relies on JS to animate it back. Under forced reduced motion the transition is collapsed to `0.01ms`, not cancelled, so content must still become visible.

Emulate reduced motion in the browser and reload, then confirm every section is readable — no permanently invisible content. If anything stays at `opacity: 0`, that is a real bug: report it rather than working around it.

- [ ] **Step 6: Confirm the out-of-scope pages still work**

Visit `/work/quick-transfer`, `/explorations/01-exploration`, and a deliberately bad URL to hit the 404. Each must render in Aileron with the new palette, with no broken layout. Relayout is explicitly out of scope — you are checking for breakage, not fidelity.

- [ ] **Step 7: Report what is still placeholder**

State plainly in your summary that the Experience bullets are lorem ipsum and all three roles read `2023 — NOW`, so the page is not publishable until real copy lands. Both are marked `TODO` in `src/content/site.ts`.

---

## Findings during execution

Two defects surfaced while executing the early tasks. Both were fixed outside the task sequence because everything downstream depends on them.

**Tailwind was scanning `docs/`.** Automatic file detection covered the whole project, so the markup samples in this plan and in the design spec were emitting real utilities into the shipped stylesheet — seven arbitrary values (`880px`, `276px`, `103px`, `646px`, `559px`, `864px`, `438px`) that appear nowhere in `src/`. Beyond the 8KB of dead CSS, this meant editing a document changed production output, and it would let an assertion of the form "this class is emitted" pass because a document mentioned the class. Fixed with `@import "tailwindcss" source(none)` plus an explicit `@source "../../src"` in `global.css`. Bundle went 54,022 → 46,026 bytes.

**The light-theme override in `BaseLayout.astro` was incomplete.** Case study pages render light through an inline custom-property override, but it remapped only five colour tokens. The `Header` and `Footer` render on those pages too, so Task 3's `--color-border-hover: rgba(255, 255, 255, 0.24)` became invisible-on-white there — the header CTA's border would vanish on hover while gaining a `#1D1D1D` fill. `--color-bg-elevated` had the same hole already. Added `border-hover`, `bg-elevated`, and `text-tertiary` to the override, with contrast figures recorded in a comment.

The general lesson for the remaining tasks: any token added to `@theme` has to be checked against the light override, because an unmapped token silently falls through to its dark value on case study pages.

## Notes on things deliberately not done

- **No light mode.** Figma's variable set includes `color/background/bg-default: #ffffff`, but no node in the frame uses it.
- **No relayout of case studies, exploration detail pages, or 404.** They inherit tokens and typeface only. Note that `--spacing-section-y` drops from 160px to 80px, which tightens their vertical rhythm; that is accepted, not a bug to chase.
- **`site.socials` keeps its `#` placeholder for LinkedIn.** Supplying the real URL is content work.
