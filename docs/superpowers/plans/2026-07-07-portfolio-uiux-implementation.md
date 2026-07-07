# Portfolio Website UI/UX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark-mode personal portfolio for a UI/UX designer targeting recruiters, with 3-4 in-depth case studies, exploration gallery, and file-based (MDX) content that scales without touching component code.

**Architecture:** Astro static-site generator with Content Collections for typed MDX content. Tailwind CSS for styling with centralized design tokens. Motion One for scroll-reveal and hover animations. Deploys to Vercel from GitHub.

**Tech Stack:** Astro 4.x, Tailwind CSS 3.x, Motion One, `@astrojs/mdx`, `@astrojs/sitemap`, `@fontsource-variable/*`, TypeScript.

**Verification approach:** This is a static content site — the "tests" that matter are (1) `npm run build` succeeds with all content-collection schemas validating, and (2) `npm run dev` renders each section correctly in a browser. Where behavior is programmatic (e.g. sort order, next-project resolution), we add a small Vitest unit test. Otherwise verification is `build + visual inspection`.

---

## File Structure Overview

```
website-ficho/
├── src/
│   ├── pages/
│   │   ├── index.astro                  # Homepage
│   │   ├── work/[slug].astro            # Case study detail
│   │   ├── explorations/[slug].astro    # Exploration detail
│   │   └── 404.astro
│   ├── content/
│   │   ├── config.ts                    # Collection schemas
│   │   ├── site.ts                      # Global site config
│   │   ├── case-studies/*.mdx
│   │   └── explorations/*.mdx
│   ├── components/
│   │   ├── layout/{Header,Footer,Container}.astro
│   │   ├── ui/{Button,Tag,Pill,Reveal}.astro
│   │   ├── home/{Hero,SelectedWork,About,Experience,ExplorationsGrid,Contact}.astro
│   │   └── case-study/{Section,ImageFull,ImageGrid,Quote,Metrics,NextProject}.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── CaseStudyLayout.astro
│   ├── lib/
│   │   └── content.ts                   # Sort/filter helpers
│   └── styles/global.css
├── public/images/                        # Placeholder + real images
├── astro.config.mjs
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── tests/                               # Vitest unit tests for lib/
```

---

## Task 1: Project scaffold + git init

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.nvmrc`

- [ ] **Step 1: Init git and set Node version**

```bash
cd /Users/jacktfz/Downloads/Portfolio/website-ficho
git init -b main
echo "22" > .nvmrc
```

- [ ] **Step 2: Create Astro project in the current (empty) directory**

```bash
npm create astro@latest . -- --template minimal --typescript strict --install --no-git --skip-houston --yes
```

Expected: dependencies installed, `src/pages/index.astro` scaffolded.

- [ ] **Step 3: Verify the base project builds**

Run: `npm run build`
Expected: exits 0, produces `dist/`.

- [ ] **Step 4: Add `.gitignore` entries**

Append to `.gitignore`:
```
.DS_Store
.vercel
.env
.env.local
dist/
node_modules/
```

- [ ] **Step 5: First commit**

```bash
git add .
git commit -m "chore: scaffold Astro project"
```

---

## Task 2: Install project dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Astro integrations**

```bash
npx astro add tailwind mdx sitemap --yes
```

Expected: `astro.config.mjs` updated with integrations; `tailwind.config.mjs` created.

- [ ] **Step 2: Install runtime + font dependencies**

```bash
npm install motion @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

Note: Satoshi is not on npm (Fontshare-only). We load it via Fontshare CDN link in the BaseLayout `<head>` in Task 8. Inter and JetBrains Mono come from Fontsource.

- [ ] **Step 3: Install dev dependencies for testing**

```bash
npm install -D vitest @types/node
```

- [ ] **Step 4: Add `test` script to `package.json`**

In `package.json`, under `"scripts"`, add:
```json
"test": "vitest run"
```

- [ ] **Step 5: Verify build still works**

Run: `npm run build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tailwind.config.mjs
git commit -m "chore: add tailwind, mdx, sitemap, motion, fonts"
```

---

## Task 3: Configure Tailwind v4 design tokens (CSS-based)

**Files:**
- Create: `src/styles/tokens.css`

Note: Tailwind v4 uses CSS-based config via the `@theme` directive — no `tailwind.config.mjs` needed. Tokens defined as CSS custom properties inside `@theme` generate the corresponding Tailwind utility classes.

- [ ] **Step 1: Create the tokens file**

Write to `src/styles/tokens.css`:
```css
@theme {
  /* Colors */
  --color-bg-primary: #0A0A0A;
  --color-bg-secondary: #141414;
  --color-text-primary: #FAFAFA;
  --color-text-secondary: #A1A1A1;
  --color-accent: #E4FF3F;
  --color-border: #262626;

  /* Font families */
  --font-display: "Satoshi", system-ui, sans-serif;
  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, monospace;

  /* Display font sizes (with line height) */
  --text-display-xl: clamp(3rem, 8vw, 6rem);
  --text-display-xl--line-height: 1.05;
  --text-display-xl--letter-spacing: -0.02em;

  --text-display-lg: clamp(2.5rem, 6vw, 4.5rem);
  --text-display-lg--line-height: 1.08;
  --text-display-lg--letter-spacing: -0.02em;

  --text-display-md: clamp(2rem, 4vw, 3rem);
  --text-display-md--line-height: 1.15;
  --text-display-md--letter-spacing: -0.01em;

  /* Layout */
  --container-container: 1280px;
  --spacing-section-y: 10rem;
  --spacing-section-y-sm: 5rem;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success (tokens.css is imported by global.css in Task 4).

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat(design): centralize color, type, spacing tokens (Tailwind v4)"
```

---

## Task 4: Global styles and fonts

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Write global CSS**

Write to `src/styles/global.css`:
```css
@import "tailwindcss";
@import "@fontsource-variable/inter";
@import "@fontsource-variable/jetbrains-mono";
@import "./tokens.css";

@layer base {
  html {
    scroll-behavior: smooth;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }
  body {
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ::selection {
    background: var(--color-accent);
    color: var(--color-bg-primary);
  }
  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Note: Tailwind v4 uses a single `@import "tailwindcss";` line instead of the v3 `@tailwind base/components/utilities;` directives.

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(design): global styles, fonts, focus & motion preferences"
```

---

## Task 5: Content collections schema

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Write schema**

Write to `src/content/config.ts`:
```ts
import { defineCollection, z } from 'astro:content'

const caseStudies = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    client: z.string(),
    role: z.string(),
    year: z.number().int(),
    duration: z.string(),
    tags: z.array(z.string()),
    cover: z.string(),
    coverAlt: z.string(),
    thumbnail: z.string(),
    thumbnailAlt: z.string(),
    summary: z.string(),
    overview: z.string(),
    team: z.array(z.string()).optional(),
    deliverables: z.array(z.string()),
    tools: z.array(z.string()),
    featured: z.boolean().default(false),
    order: z.number().int(),
  }),
})

const explorations = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    year: z.number().int(),
    tags: z.array(z.string()),
    cover: z.string(),
    coverAlt: z.string(),
    images: z.array(z.object({ src: z.string(), alt: z.string() })),
    caption: z.string(),
    order: z.number().int().default(0),
  }),
})

export const collections = {
  'case-studies': caseStudies,
  'explorations': explorations,
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success (empty collections OK).

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts
git commit -m "feat(content): case-studies & explorations collection schemas"
```

---

## Task 6: Site config

**Files:**
- Create: `src/content/site.ts`

- [ ] **Step 1: Write site config with placeholder data**

Write to `src/content/site.ts`:
```ts
export const site = {
  name: 'Ficho',
  role: 'UI/UX Designer',
  tagline: 'UI/UX Designer crafting digital products for growing brands.',
  bio: [
    "I'm a product designer focused on turning complex problems into simple, beautiful interfaces.",
    "Currently exploring the intersection of design systems and motion.",
  ],
  available: true,
  email: 'ficho@transfez.com',
  location: 'Jakarta, Indonesia',
  skills: [
    'Product Design',
    'User Research',
    'Design Systems',
    'Interaction Design',
    'Prototyping',
    'Information Architecture',
  ],
  tools: ['Figma', 'Framer', 'Notion', 'Principle', 'Miro', 'Linear'],
  socials: [
    { label: 'LinkedIn', href: '#' },
    { label: 'Dribbble', href: '#' },
    { label: 'Read.cv', href: '#' },
    { label: 'Email', href: 'mailto:ficho@transfez.com' },
  ],
  experience: [
    { year: '2024 — Now', role: 'Senior Product Designer', company: 'Company A', description: 'Leading design for the core platform.' },
    { year: '2022 — 2024', role: 'Product Designer', company: 'Company B', description: 'Shipped design system and onboarding.' },
    { year: '2020 — 2022', role: 'UI Designer', company: 'Company C', description: 'Marketing site and mobile app.' },
    { year: '2019 — 2020', role: 'Junior Designer', company: 'Company D', description: 'First role — visual design and prototyping.' },
  ],
} as const

export type SiteConfig = typeof site
```

- [ ] **Step 2: Commit**

```bash
git add src/content/site.ts
git commit -m "feat(content): site config with placeholder profile data"
```

---

## Task 7: Content helper library + test

**Files:**
- Create: `src/lib/content.ts`, `tests/content.test.ts`, `vitest.config.ts`

- [ ] **Step 1: Write vitest config**

Write to `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node' } })
```

- [ ] **Step 2: Write the failing test**

Write to `tests/content.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { sortByOrder, getNextItem, filterFeatured } from '../src/lib/content'

const items = [
  { data: { order: 3, featured: true, slug: 'c' } },
  { data: { order: 1, featured: true, slug: 'a' } },
  { data: { order: 2, featured: false, slug: 'b' } },
]

describe('sortByOrder', () => {
  it('sorts items ascending by data.order', () => {
    const sorted = sortByOrder(items)
    expect(sorted.map(i => i.data.slug)).toEqual(['a', 'b', 'c'])
  })
})

describe('filterFeatured', () => {
  it('returns only items with data.featured === true', () => {
    const featured = filterFeatured(items)
    expect(featured.map(i => i.data.slug)).toEqual(['c', 'a'])
  })
})

describe('getNextItem', () => {
  it('returns the next item after the given slug in sort order', () => {
    const sorted = sortByOrder(items)
    expect(getNextItem(sorted, 'a')?.data.slug).toBe('b')
  })
  it('wraps around at the end', () => {
    const sorted = sortByOrder(items)
    expect(getNextItem(sorted, 'c')?.data.slug).toBe('a')
  })
  it('returns null when list is empty', () => {
    expect(getNextItem([], 'a')).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — module `../src/lib/content` not found.

- [ ] **Step 4: Implement the helpers**

Write to `src/lib/content.ts`:
```ts
type Item<T> = { data: T & { order: number; featured?: boolean; slug: string } }

export function sortByOrder<T>(items: Item<T>[]): Item<T>[] {
  return [...items].sort((a, b) => a.data.order - b.data.order)
}

export function filterFeatured<T>(items: Item<T>[]): Item<T>[] {
  return items.filter(i => i.data.featured === true)
}

export function getNextItem<T>(items: Item<T>[], slug: string): Item<T> | null {
  if (items.length === 0) return null
  const idx = items.findIndex(i => i.data.slug === slug)
  if (idx === -1) return null
  return items[(idx + 1) % items.length]
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content.ts tests/content.test.ts vitest.config.ts
git commit -m "feat(lib): sort/filter/next helpers with tests"
```

---

## Task 8: BaseLayout + SEO

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Write the layout**

Write to `src/layouts/BaseLayout.astro`:
```astro
---
import '../styles/global.css'
import Header from '../components/layout/Header.astro'
import Footer from '../components/layout/Footer.astro'

interface Props {
  title: string
  description?: string
  ogImage?: string
}
const { title, description = 'Portfolio of Ficho — UI/UX Designer', ogImage = '/images/og-default.jpg' } = Astro.props
const canonical = new URL(Astro.url.pathname, Astro.site ?? 'https://example.com').toString()
---
<!doctype html>
<html lang="en" class="bg-bg-primary text-text-primary">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <!-- Satoshi via Fontshare CDN (not available on npm) -->
    <link rel="preconnect" href="https://api.fontshare.com" />
    <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700,900&display=swap" />
  </head>
  <body class="min-h-screen bg-bg-primary text-text-primary">
    <Header />
    <main><slot /></main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 2: Create a placeholder favicon**

```bash
mkdir -p public
printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="%23E4FF3F"/><text x="16" y="22" font-family="sans-serif" font-size="20" font-weight="900" text-anchor="middle" fill="%230A0A0A">F</text></svg>' > public/favicon.svg
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro public/favicon.svg
git commit -m "feat(layout): BaseLayout with SEO meta + favicon"
```

---

## Task 9: Container, Header, Footer

**Files:**
- Create: `src/components/layout/Container.astro`, `Header.astro`, `Footer.astro`

- [ ] **Step 1: Container**

Write to `src/components/layout/Container.astro`:
```astro
---
interface Props { class?: string }
const { class: className = '' } = Astro.props
---
<div class:list={['mx-auto w-full max-w-container px-6 md:px-8', className]}><slot /></div>
```

- [ ] **Step 2: Header**

Write to `src/components/layout/Header.astro`:
```astro
---
import Container from './Container.astro'
import { site } from '../../content/site'
---
<header class="sticky top-0 z-40 bg-bg-primary/70 backdrop-blur border-b border-border">
  <Container class="flex items-center justify-between py-4">
    <a href="/" class="font-display font-black text-lg tracking-tight">{site.name}</a>
    <nav class="flex items-center gap-6 text-sm font-mono">
      <a href="/#work" class="text-text-secondary hover:text-text-primary transition">Work</a>
      <a href="/#about" class="text-text-secondary hover:text-text-primary transition">About</a>
      <a href="/#contact" class="text-text-secondary hover:text-text-primary transition">Contact</a>
    </nav>
  </Container>
</header>
```

- [ ] **Step 3: Footer**

Write to `src/components/layout/Footer.astro`:
```astro
---
import Container from './Container.astro'
import { site } from '../../content/site'
const year = new Date().getFullYear()
---
<footer class="border-t border-border mt-24">
  <Container class="py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-text-secondary font-mono">
    <div>© {year} {site.name}. All rights reserved.</div>
    <div class="flex gap-4">
      {site.socials.map(s => <a href={s.href} class="hover:text-text-primary transition">{s.label}</a>)}
    </div>
  </Container>
</footer>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout
git commit -m "feat(layout): Container, Header, Footer"
```

---

## Task 10: UI primitives (Button, Tag, Pill)

**Files:**
- Create: `src/components/ui/Button.astro`, `Tag.astro`, `Pill.astro`

- [ ] **Step 1: Button**

Write to `src/components/ui/Button.astro`:
```astro
---
interface Props {
  href?: string
  variant?: 'primary' | 'ghost'
  class?: string
}
const { href, variant = 'primary', class: className = '' } = Astro.props
const base = 'inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-mono transition'
const styles = variant === 'primary'
  ? 'bg-accent text-bg-primary hover:brightness-95'
  : 'border border-border text-text-primary hover:bg-bg-secondary'
const Tag = href ? 'a' : 'button'
---
<Tag href={href} class:list={[base, styles, className]}><slot /></Tag>
```

- [ ] **Step 2: Tag (category label)**

Write to `src/components/ui/Tag.astro`:
```astro
---
interface Props { class?: string }
const { class: className = '' } = Astro.props
---
<span class:list={['inline-flex items-center px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-text-secondary border border-border rounded', className]}><slot /></span>
```

- [ ] **Step 3: Pill (skill/tool chip)**

Write to `src/components/ui/Pill.astro`:
```astro
---
interface Props { class?: string }
const { class: className = '' } = Astro.props
---
<span class:list={['inline-flex items-center px-3 py-1.5 text-sm text-text-primary bg-bg-secondary rounded-full', className]}><slot /></span>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui
git commit -m "feat(ui): Button, Tag, Pill primitives"
```

---

## Task 11: Reveal (scroll-triggered motion wrapper)

**Files:**
- Create: `src/components/ui/Reveal.astro`

- [ ] **Step 1: Implement Reveal**

Write to `src/components/ui/Reveal.astro`:
```astro
---
interface Props {
  as?: string
  delay?: number
  class?: string
}
const { as: Tag = 'div', delay = 0, class: className = '' } = Astro.props
---
<Tag class:list={['reveal', className]} data-reveal-delay={delay} style="opacity:0; transform:translateY(20px)">
  <slot />
</Tag>

<script>
  import { animate, inView } from 'motion'
  const els = document.querySelectorAll<HTMLElement>('.reveal')
  els.forEach(el => {
    inView(el, () => {
      const delay = Number(el.dataset.revealDelay ?? 0) / 1000
      animate(el, { opacity: 1, transform: 'translateY(0px)' }, { duration: 0.5, delay, easing: [0.22, 1, 0.36, 1] })
    }, { amount: 0.2 })
  })
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Reveal.astro
git commit -m "feat(ui): Reveal wrapper for scroll-triggered fade+rise"
```

---

## Task 12: Homepage — Hero section

**Files:**
- Create: `src/components/home/Hero.astro`

- [ ] **Step 1: Implement Hero**

Write to `src/components/home/Hero.astro`:
```astro
---
import Container from '../layout/Container.astro'
import Button from '../ui/Button.astro'
import Reveal from '../ui/Reveal.astro'
import { site } from '../../content/site'
---
<section class="min-h-[90vh] flex items-center py-24">
  <Container>
    <Reveal>
      <div class="flex items-center gap-2 mb-8 font-mono text-xs uppercase tracking-widest text-text-secondary">
        {site.available && (
          <span class="relative inline-flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
          </span>
        )}
        {site.available ? 'Available for opportunities' : 'Currently unavailable'} · {site.location}
      </div>
    </Reveal>
    <Reveal delay={100}>
      <h1 class="font-display font-black text-display-xl max-w-5xl">{site.tagline}</h1>
    </Reveal>
    <Reveal delay={200}>
      <p class="mt-8 max-w-2xl text-lg text-text-secondary">{site.bio[0]}</p>
    </Reveal>
    <Reveal delay={300}>
      <div class="mt-10 flex flex-wrap gap-3">
        <Button href="#work" variant="primary">View Work →</Button>
        <Button href="#contact" variant="ghost">Get in Touch</Button>
      </div>
    </Reveal>
  </Container>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/Hero.astro
git commit -m "feat(home): Hero with availability indicator and dual CTA"
```

---

## Task 13: Homepage — SelectedWork section

**Files:**
- Create: `src/components/home/SelectedWork.astro`

- [ ] **Step 1: Implement SelectedWork**

Write to `src/components/home/SelectedWork.astro`:
```astro
---
import { getCollection } from 'astro:content'
import { Image } from 'astro:assets'
import Container from '../layout/Container.astro'
import Tag from '../ui/Tag.astro'
import Reveal from '../ui/Reveal.astro'
import { sortByOrder, filterFeatured } from '../../lib/content'

const all = await getCollection('case-studies')
const featured = sortByOrder(filterFeatured(all))
// Asymmetric grid: [full, half, half, full]. Fallback to symmetric if <4.
const asymmetric = featured.length >= 4
---
<section id="work" class="py-section-y-sm md:py-section-y">
  <Container>
    <div class="flex items-end justify-between mb-16">
      <Reveal>
        <div>
          <div class="font-mono text-xs uppercase tracking-widest text-text-secondary mb-3">01 / Selected Work</div>
          <h2 class="font-display font-bold text-display-lg">Recent projects.</h2>
        </div>
      </Reveal>
      <Reveal><a href="#" class="hidden md:inline text-sm text-text-secondary hover:text-text-primary transition font-mono">View all →</a></Reveal>
    </div>

    {featured.length === 0 && (
      <p class="text-text-secondary">No projects yet.</p>
    )}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      {featured.map((p, i) => {
        const fullWidth = asymmetric && (i === 0 || i === 3)
        return (
          <Reveal class={fullWidth ? 'md:col-span-2' : ''}>
            <a href={`/work/${p.data.slug}`} class="group block">
              <div class="overflow-hidden rounded-lg bg-bg-secondary aspect-[16/10]">
                <img src={p.data.thumbnail} alt={p.data.thumbnailAlt} class="w-full h-full object-cover transition duration-500 group-hover:scale-[1.02] group-hover:brightness-105" />
              </div>
              <div class="mt-5 flex items-start justify-between gap-6">
                <div>
                  <div class="flex gap-2 mb-2">{p.data.tags.slice(0, 2).map(t => <Tag>{t}</Tag>)}</div>
                  <h3 class="font-display font-bold text-2xl md:text-3xl">{p.data.title}</h3>
                  <p class="text-text-secondary mt-2 max-w-lg">{p.data.summary}</p>
                </div>
                <div class="font-mono text-sm text-text-secondary shrink-0">{p.data.year}</div>
              </div>
            </a>
          </Reveal>
        )
      })}
    </div>
  </Container>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/SelectedWork.astro
git commit -m "feat(home): SelectedWork asymmetric grid"
```

---

## Task 14: Homepage — About section

**Files:**
- Create: `src/components/home/About.astro`

- [ ] **Step 1: Implement About**

Write to `src/components/home/About.astro`:
```astro
---
import Container from '../layout/Container.astro'
import Pill from '../ui/Pill.astro'
import Reveal from '../ui/Reveal.astro'
import { site } from '../../content/site'
---
<section id="about" class="py-section-y-sm md:py-section-y bg-bg-secondary/40">
  <Container>
    <div class="grid md:grid-cols-2 gap-12 items-start">
      <Reveal>
        <div class="aspect-[4/5] rounded-lg overflow-hidden bg-bg-secondary">
          <img src="/images/portrait-placeholder.jpg" alt={`Portrait of ${site.name}`} class="w-full h-full object-cover" />
        </div>
      </Reveal>
      <Reveal delay={100}>
        <div>
          <div class="font-mono text-xs uppercase tracking-widest text-text-secondary mb-3">02 / About</div>
          <h2 class="font-display font-bold text-display-md mb-8">Designer with a bias for shipping.</h2>
          {site.bio.map(p => <p class="text-text-secondary text-lg mb-4">{p}</p>)}

          <div class="mt-8">
            <div class="font-mono text-xs uppercase tracking-widest text-text-secondary mb-3">Skills</div>
            <div class="flex flex-wrap gap-2">{site.skills.map(s => <Pill>{s}</Pill>)}</div>
          </div>
          <div class="mt-6">
            <div class="font-mono text-xs uppercase tracking-widest text-text-secondary mb-3">Tools</div>
            <div class="flex flex-wrap gap-2">{site.tools.map(t => <Pill>{t}</Pill>)}</div>
          </div>
        </div>
      </Reveal>
    </div>
  </Container>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/About.astro
git commit -m "feat(home): About section with skills & tools"
```

---

## Task 15: Homepage — Experience section

**Files:**
- Create: `src/components/home/Experience.astro`

- [ ] **Step 1: Implement Experience**

Write to `src/components/home/Experience.astro`:
```astro
---
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import { site } from '../../content/site'
---
<section class="py-section-y-sm md:py-section-y">
  <Container>
    <Reveal>
      <div class="font-mono text-xs uppercase tracking-widest text-text-secondary mb-3">03 / Experience</div>
      <h2 class="font-display font-bold text-display-md mb-12">Where I've worked.</h2>
    </Reveal>
    <ul class="divide-y divide-border">
      {site.experience.map((e, i) => (
        <Reveal as="li" delay={i * 60} class="py-6 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
          <div class="font-mono text-sm text-text-secondary">{e.year}</div>
          <div>
            <div class="font-display font-bold text-xl">{e.role} <span class="text-text-secondary font-normal">· {e.company}</span></div>
            <p class="text-text-secondary mt-1">{e.description}</p>
          </div>
        </Reveal>
      ))}
    </ul>
  </Container>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/Experience.astro
git commit -m "feat(home): Experience timeline"
```

---

## Task 16: Homepage — Explorations grid

**Files:**
- Create: `src/components/home/ExplorationsGrid.astro`

- [ ] **Step 1: Implement ExplorationsGrid**

Write to `src/components/home/ExplorationsGrid.astro`:
```astro
---
import { getCollection } from 'astro:content'
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import { sortByOrder } from '../../lib/content'

const all = await getCollection('explorations')
const items = sortByOrder(all)
---
<section class="py-section-y-sm md:py-section-y bg-bg-secondary/40">
  <Container>
    <Reveal>
      <div class="font-mono text-xs uppercase tracking-widest text-text-secondary mb-3">04 / Explorations</div>
      <h2 class="font-display font-bold text-display-md mb-12">Visual experiments.</h2>
    </Reveal>
    {items.length === 0 ? (
      <p class="text-text-secondary">No explorations yet.</p>
    ) : (
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {items.map((e, i) => (
          <Reveal delay={i * 40}>
            <a href={`/explorations/${e.data.slug}`} class="group block">
              <div class="overflow-hidden rounded-lg bg-bg-secondary aspect-[4/5]">
                <img src={e.data.cover} alt={e.data.coverAlt} class="w-full h-full object-cover transition duration-500 group-hover:scale-[1.02] group-hover:brightness-105" />
              </div>
              <div class="mt-3 flex items-center justify-between text-sm">
                <div class="text-text-primary">{e.data.title}</div>
                <div class="text-text-secondary font-mono">{e.data.year}</div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    )}
  </Container>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/ExplorationsGrid.astro
git commit -m "feat(home): Explorations grid"
```

---

## Task 17: Homepage — Contact section

**Files:**
- Create: `src/components/home/Contact.astro`

- [ ] **Step 1: Implement Contact**

Write to `src/components/home/Contact.astro`:
```astro
---
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import { site } from '../../content/site'
---
<section id="contact" class="py-section-y-sm md:py-section-y">
  <Container>
    <Reveal>
      <div class="font-mono text-xs uppercase tracking-widest text-text-secondary mb-3">05 / Contact</div>
      <h2 class="font-display font-black text-display-xl leading-none">Let's build<br />something together.</h2>
    </Reveal>
    <Reveal delay={150}>
      <a href={`mailto:${site.email}`} class="mt-12 inline-block font-display font-bold text-2xl md:text-4xl text-accent hover:brightness-90 transition">
        {site.email} →
      </a>
    </Reveal>
    <Reveal delay={250}>
      <div class="mt-10 flex flex-wrap gap-6 font-mono text-sm text-text-secondary">
        {site.socials.filter(s => s.label !== 'Email').map(s => (
          <a href={s.href} class="hover:text-text-primary transition">{s.label} ↗</a>
        ))}
      </div>
    </Reveal>
  </Container>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/Contact.astro
git commit -m "feat(home): Contact CTA section"
```

---

## Task 18: Assemble homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace index.astro**

Write to `src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Hero from '../components/home/Hero.astro'
import SelectedWork from '../components/home/SelectedWork.astro'
import About from '../components/home/About.astro'
import Experience from '../components/home/Experience.astro'
import ExplorationsGrid from '../components/home/ExplorationsGrid.astro'
import Contact from '../components/home/Contact.astro'
import { site } from '../content/site'
---
<BaseLayout title={`${site.name} — ${site.role}`} description={site.tagline}>
  <Hero />
  <SelectedWork />
  <About />
  <Experience />
  <ExplorationsGrid />
  <Contact />
</BaseLayout>
```

- [ ] **Step 2: Run dev server and visually verify**

Run: `npm run dev`
Open http://localhost:4321 in browser.
Expected: all 6 sections render top-to-bottom on dark background. Empty states shown for Work & Explorations (no content yet).

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): assemble homepage"
```

---

## Task 19: Case study body components

**Files:**
- Create: `src/components/case-study/Section.astro`, `ImageFull.astro`, `ImageGrid.astro`, `Quote.astro`, `Metrics.astro`

- [ ] **Step 1: Section**

Write to `src/components/case-study/Section.astro`:
```astro
---
interface Props { title: string }
const { title } = Astro.props
---
<section class="my-16 md:my-24 grid md:grid-cols-[220px_1fr] gap-8">
  <div class="font-mono text-xs uppercase tracking-widest text-text-secondary md:sticky md:top-24 self-start">{title}</div>
  <div class="prose prose-invert max-w-none prose-p:text-text-primary prose-p:text-lg prose-p:leading-relaxed prose-headings:font-display prose-headings:font-bold prose-a:text-accent prose-strong:text-text-primary"><slot /></div>
</section>
```

- [ ] **Step 2: Install prose plugin**

```bash
npm install -D @tailwindcss/typography
```

Then add the plugin to `src/styles/global.css` immediately after the `@import "tailwindcss";` line:
```css
@plugin "@tailwindcss/typography";
```

Note: Tailwind v4 registers plugins via CSS `@plugin` directive, not a JS config file.

- [ ] **Step 3: ImageFull**

Write to `src/components/case-study/ImageFull.astro`:
```astro
---
interface Props { src: string; alt: string; caption?: string }
const { src, alt, caption } = Astro.props
---
<figure class="my-12">
  <div class="rounded-lg overflow-hidden bg-bg-secondary">
    <img src={src} alt={alt} class="w-full h-auto" loading="lazy" />
  </div>
  {caption && <figcaption class="mt-3 text-sm text-text-secondary font-mono text-center">{caption}</figcaption>}
</figure>
```

- [ ] **Step 4: ImageGrid**

Write to `src/components/case-study/ImageGrid.astro`:
```astro
---
interface Props { cols?: 2 | 3 }
const { cols = 2 } = Astro.props
const colClass = cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
---
<div class:list={['my-12 grid grid-cols-1 gap-4', colClass]}><slot /></div>
```

- [ ] **Step 5: Quote**

Write to `src/components/case-study/Quote.astro`:
```astro
---
interface Props { author?: string }
const { author } = Astro.props
---
<blockquote class="my-12 border-l-2 border-accent pl-6">
  <p class="font-display text-2xl md:text-3xl italic text-text-primary"><slot /></p>
  {author && <cite class="not-italic block mt-4 font-mono text-sm text-text-secondary">— {author}</cite>}
</blockquote>
```

- [ ] **Step 6: Metrics**

Write to `src/components/case-study/Metrics.astro`:
```astro
---
interface Props { items: { value: string; label: string }[] }
const { items } = Astro.props
---
<div class="my-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
  {items.map(m => (
    <div class="p-6 rounded-lg bg-bg-secondary border border-border">
      <div class="font-display font-black text-4xl md:text-5xl text-accent">{m.value}</div>
      <div class="mt-2 font-mono text-xs uppercase tracking-widest text-text-secondary">{m.label}</div>
    </div>
  ))}
</div>
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 8: Commit**

```bash
git add src/components/case-study tailwind.config.mjs package.json package-lock.json
git commit -m "feat(case-study): body components (Section, ImageFull, ImageGrid, Quote, Metrics)"
```

---

## Task 20: NextProject component

**Files:**
- Create: `src/components/case-study/NextProject.astro`

- [ ] **Step 1: Implement**

Write to `src/components/case-study/NextProject.astro`:
```astro
---
interface Props {
  slug: string
  title: string
  cover: string
  coverAlt: string
}
const { slug, title, cover, coverAlt } = Astro.props
---
<a href={`/work/${slug}`} class="group block mt-24 border-t border-border pt-12">
  <div class="font-mono text-xs uppercase tracking-widest text-text-secondary mb-6">Next project</div>
  <div class="grid md:grid-cols-[1fr_auto] gap-8 items-end">
    <div>
      <h3 class="font-display font-black text-display-md group-hover:text-accent transition">{title} →</h3>
    </div>
    <div class="w-full md:w-80 aspect-[16/10] rounded-lg overflow-hidden bg-bg-secondary">
      <img src={cover} alt={coverAlt} class="w-full h-full object-cover transition duration-500 group-hover:scale-[1.02]" />
    </div>
  </div>
</a>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/case-study/NextProject.astro
git commit -m "feat(case-study): NextProject teaser"
```

---

## Task 21: CaseStudyLayout + dynamic route

**Files:**
- Create: `src/layouts/CaseStudyLayout.astro`, `src/pages/work/[slug].astro`

- [ ] **Step 1: CaseStudyLayout**

Write to `src/layouts/CaseStudyLayout.astro`:
```astro
---
import BaseLayout from './BaseLayout.astro'
import Container from '../components/layout/Container.astro'
import Tag from '../components/ui/Tag.astro'
import NextProject from '../components/case-study/NextProject.astro'
import type { CollectionEntry } from 'astro:content'

interface Props {
  entry: CollectionEntry<'case-studies'>
  next: CollectionEntry<'case-studies'>
}
const { entry, next } = Astro.props
const d = entry.data
---
<BaseLayout title={`${d.title} — Case Study`} description={d.summary} ogImage={d.cover}>
  <article class="pt-12">
    <Container>
      <a href="/#work" class="font-mono text-sm text-text-secondary hover:text-text-primary transition">← Back to work</a>

      <header class="mt-8">
        <div class="flex flex-wrap gap-2 mb-6">{d.tags.map(t => <Tag>{t}</Tag>)}</div>
        <h1 class="font-display font-black text-display-xl max-w-4xl">{d.title}</h1>
        <div class="mt-8 flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm text-text-secondary">
          <div><span class="uppercase tracking-widest text-[10px] mr-2">Client</span>{d.client}</div>
          <div><span class="uppercase tracking-widest text-[10px] mr-2">Role</span>{d.role}</div>
          <div><span class="uppercase tracking-widest text-[10px] mr-2">Year</span>{d.year}</div>
          <div><span class="uppercase tracking-widest text-[10px] mr-2">Duration</span>{d.duration}</div>
        </div>
      </header>

      <div class="mt-12 rounded-lg overflow-hidden bg-bg-secondary">
        <img src={d.cover} alt={d.coverAlt} class="w-full h-auto max-h-[70vh] object-cover" />
      </div>

      <div class="mt-16 grid md:grid-cols-2 gap-12">
        <div>
          <div class="font-mono text-xs uppercase tracking-widest text-text-secondary mb-3">Overview</div>
          <p class="text-lg text-text-primary">{d.overview}</p>
        </div>
        <dl class="space-y-4 font-mono text-sm">
          {d.team && d.team.length > 0 && (
            <div><dt class="uppercase tracking-widest text-[10px] text-text-secondary">Team</dt><dd class="mt-1">{d.team.join(', ')}</dd></div>
          )}
          <div><dt class="uppercase tracking-widest text-[10px] text-text-secondary">My Role</dt><dd class="mt-1">{d.role}</dd></div>
          <div><dt class="uppercase tracking-widest text-[10px] text-text-secondary">Deliverables</dt><dd class="mt-1">{d.deliverables.join(', ')}</dd></div>
          <div><dt class="uppercase tracking-widest text-[10px] text-text-secondary">Tools</dt><dd class="mt-1">{d.tools.join(', ')}</dd></div>
        </dl>
      </div>

      <div class="mt-8"><slot /></div>

      <NextProject slug={next.data.slug} title={next.data.title} cover={next.data.thumbnail} coverAlt={next.data.thumbnailAlt} />
    </Container>
  </article>
</BaseLayout>
```

- [ ] **Step 2: Dynamic route**

Write to `src/pages/work/[slug].astro`:
```astro
---
import { getCollection } from 'astro:content'
import CaseStudyLayout from '../../layouts/CaseStudyLayout.astro'
import { sortByOrder, getNextItem } from '../../lib/content'

export async function getStaticPaths() {
  const all = await getCollection('case-studies')
  const sorted = sortByOrder(all)
  return sorted.map(entry => ({
    params: { slug: entry.data.slug },
    props: { entry, next: getNextItem(sorted, entry.data.slug)! },
  }))
}

const { entry, next } = Astro.props
const { Content } = await entry.render()
---
<CaseStudyLayout entry={entry} next={next}>
  <Content />
</CaseStudyLayout>
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/CaseStudyLayout.astro src/pages/work
git commit -m "feat(case-study): layout + dynamic [slug] route"
```

---

## Task 22: Exploration detail page

**Files:**
- Create: `src/pages/explorations/[slug].astro`

- [ ] **Step 1: Implement**

Write to `src/pages/explorations/[slug].astro`:
```astro
---
import { getCollection } from 'astro:content'
import BaseLayout from '../../layouts/BaseLayout.astro'
import Container from '../../components/layout/Container.astro'
import Tag from '../../components/ui/Tag.astro'

export async function getStaticPaths() {
  const all = await getCollection('explorations')
  return all.map(entry => ({ params: { slug: entry.data.slug }, props: { entry } }))
}

const { entry } = Astro.props
const d = entry.data
---
<BaseLayout title={`${d.title} — Exploration`} description={d.caption} ogImage={d.cover}>
  <Container class="pt-12">
    <a href="/#explorations" class="font-mono text-sm text-text-secondary hover:text-text-primary transition">← Back to explorations</a>
    <header class="mt-8 mb-12">
      <div class="flex flex-wrap gap-2 mb-4">{d.tags.map(t => <Tag>{t}</Tag>)}</div>
      <h1 class="font-display font-black text-display-lg">{d.title}</h1>
      <div class="mt-3 font-mono text-sm text-text-secondary">{d.year}</div>
      <p class="mt-6 max-w-2xl text-lg text-text-secondary">{d.caption}</p>
    </header>
    <div class="space-y-6">
      {d.images.map(img => (
        <div class="rounded-lg overflow-hidden bg-bg-secondary">
          <img src={img.src} alt={img.alt} class="w-full h-auto" loading="lazy" />
        </div>
      ))}
    </div>
  </Container>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/explorations
git commit -m "feat(exploration): detail page"
```

---

## Task 23: 404 page

**Files:**
- Create: `src/pages/404.astro`

- [ ] **Step 1: Implement**

Write to `src/pages/404.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Container from '../components/layout/Container.astro'
import Button from '../components/ui/Button.astro'
---
<BaseLayout title="404 — Not Found">
  <Container class="min-h-[60vh] flex flex-col justify-center py-24">
    <div class="font-mono text-xs uppercase tracking-widest text-text-secondary mb-3">Error 404</div>
    <h1 class="font-display font-black text-display-lg mb-6">Page not found.</h1>
    <p class="text-text-secondary text-lg mb-8 max-w-lg">The page you're looking for doesn't exist or has been moved.</p>
    <div><Button href="/" variant="primary">← Back home</Button></div>
  </Container>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat: 404 page"
```

---

## Task 24: Placeholder images

**Files:**
- Create: `public/images/*` (12 images total)

- [ ] **Step 1: Download placeholder images**

Note: These are Unsplash placeholder URLs. If Unsplash is unreachable, substitute any dark, minimal royalty-free stock images with matching aspect ratios.

```bash
mkdir -p public/images
cd public/images

# Portrait (4:5)
curl -sL "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&auto=format" -o portrait-placeholder.jpg

# OG default (1200x630)
curl -sL "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop&auto=format" -o og-default.jpg

# Case study covers (16:10)
curl -sL "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&h=1000&fit=crop&auto=format" -o cs-01-cover.jpg
curl -sL "https://images.unsplash.com/photo-1618788372246-79faff0c3742?w=1600&h=1000&fit=crop&auto=format" -o cs-02-cover.jpg
curl -sL "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=1600&h=1000&fit=crop&auto=format" -o cs-03-cover.jpg
curl -sL "https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=1600&h=1000&fit=crop&auto=format" -o cs-04-cover.jpg

# Explorations (4:5)
for i in 01 02 03 04 05 06; do
  curl -sL "https://images.unsplash.com/photo-16$((RANDOM % 90))00000000?w=800&h=1000&fit=crop&auto=format" -o "exp-$i.jpg" 2>/dev/null || \
  curl -sL "https://picsum.photos/seed/exp-$i/800/1000" -o "exp-$i.jpg"
done

cd -
```

- [ ] **Step 2: Verify all images downloaded**

```bash
ls public/images/ | wc -l
```
Expected: at least 12 files.

- [ ] **Step 3: Commit**

```bash
git add public/images
git commit -m "chore: placeholder images"
```

---

## Task 25: Placeholder case studies (3 files)

**Files:**
- Create: `src/content/case-studies/01-fintech-onboarding.mdx`, `02-ecommerce-redesign.mdx`, `03-design-system.mdx`, `04-analytics-dashboard.mdx`

- [ ] **Step 1: Case study 1 — Fintech Onboarding**

Write to `src/content/case-studies/01-fintech-onboarding.mdx`:
```mdx
---
title: "Reimagining Fintech Onboarding"
slug: "fintech-onboarding"
client: "Placeholder Fintech Co."
role: "Lead Product Designer"
year: 2025
duration: "3 months"
tags: ["Product Design", "Mobile"]
cover: "/images/cs-01-cover.jpg"
coverAlt: "Fintech app onboarding cover"
thumbnail: "/images/cs-01-cover.jpg"
thumbnailAlt: "Fintech app onboarding thumbnail"
summary: "Reduced drop-off from 42% to 18% by rethinking KYC as a guided story rather than a form."
overview: "The existing onboarding funnel treated KYC as a legal checkbox. We redesigned it as a progressive disclosure flow that respected the user's time while satisfying compliance."
team: ["1 PM", "2 Engineers", "1 Compliance Lead"]
deliverables: ["User research", "Prototypes", "Design system tokens", "Handoff specs"]
tools: ["Figma", "Notion", "Framer"]
featured: true
order: 1
---
import Section from '../../components/case-study/Section.astro'
import ImageFull from '../../components/case-study/ImageFull.astro'
import ImageGrid from '../../components/case-study/ImageGrid.astro'
import Quote from '../../components/case-study/Quote.astro'
import Metrics from '../../components/case-study/Metrics.astro'

<Section title="Problem">
Drop-off during KYC was 42%. Users abandoned the flow at the document-upload step, citing confusion about which document was required and why.

Placeholder body. Replace with your real narrative when ready.
</Section>

<ImageFull src="/images/cs-01-cover.jpg" alt="Problem framing" caption="Fig. 1 — Original funnel drop-off analysis." />

<Section title="Research">
We interviewed 12 recently-abandoned users and 4 support agents. Three themes emerged: unclear requirements, no progress indicator, and no explanation of "why we need this."

Placeholder body.
</Section>

<Quote author="User interview, P07">
"I gave up because I couldn't tell what I'd done wrong."
</Quote>

<Section title="Process">
We mapped the compliance requirements against the user's mental model, then rebuilt the flow around what the user needs to do next rather than what the system needs to collect.

Placeholder body.
</Section>

<ImageGrid cols={2}>
  <img src="/images/exp-01.jpg" alt="Wireframe A" />
  <img src="/images/exp-02.jpg" alt="Wireframe B" />
</ImageGrid>

<Section title="Solution">
A five-step flow with clear progress, per-step context, and a document-scanner that gave real-time feedback.

Placeholder body.
</Section>

<Section title="Outcome">
Drop-off fell to 18% within 6 weeks of launch. Support tickets related to KYC dropped 60%.

<Metrics items={[
  { value: "-24pp", label: "Drop-off reduction" },
  { value: "-60%", label: "Support tickets" },
  { value: "4.6/5", label: "Post-flow rating" },
]} />
</Section>
```

- [ ] **Step 2: Case study 2 — E-commerce Redesign**

Write to `src/content/case-studies/02-ecommerce-redesign.mdx`:
```mdx
---
title: "E-commerce Redesign"
slug: "ecommerce-redesign"
client: "Placeholder Retail Co."
role: "Senior Product Designer"
year: 2024
duration: "5 months"
tags: ["E-commerce", "Web"]
cover: "/images/cs-02-cover.jpg"
coverAlt: "E-commerce redesign cover"
thumbnail: "/images/cs-02-cover.jpg"
thumbnailAlt: "E-commerce redesign thumbnail"
summary: "Rebuilt product discovery and checkout, lifting conversion by 34% on mobile."
overview: "The legacy storefront was optimized for desktop; 70% of traffic was mobile. We rebuilt the discovery and checkout paths mobile-first."
deliverables: ["Design audit", "Redesign", "A/B test specs"]
tools: ["Figma", "Maze", "Amplitude"]
featured: true
order: 2
---
import Section from '../../components/case-study/Section.astro'
import Metrics from '../../components/case-study/Metrics.astro'

<Section title="Problem">
Mobile conversion sat at 1.4% against a category benchmark of 2.1%. Placeholder body.
</Section>

<Section title="Process">
Placeholder body describing research, prototyping, and validation.
</Section>

<Section title="Outcome">
<Metrics items={[
  { value: "+34%", label: "Mobile conversion" },
  { value: "-18%", label: "Cart abandonment" },
  { value: "+22%", label: "AOV" },
]} />
</Section>
```

- [ ] **Step 3: Case study 3 — Design System**

Write to `src/content/case-studies/03-design-system.mdx`:
```mdx
---
title: "Building a Design System From Zero"
slug: "design-system"
client: "Placeholder SaaS Co."
role: "Design Systems Lead"
year: 2024
duration: "6 months"
tags: ["Design System", "Tooling"]
cover: "/images/cs-03-cover.jpg"
coverAlt: "Design system cover"
thumbnail: "/images/cs-03-cover.jpg"
thumbnailAlt: "Design system thumbnail"
summary: "Cut new-screen time from 3 days to 4 hours by shipping tokens, components, and docs."
overview: "Three product teams were each maintaining their own component library. We consolidated, tokenized, and documented — then migrated all three."
deliverables: ["Tokens", "Component library", "Docs site", "Migration guide"]
tools: ["Figma", "Storybook", "Style Dictionary"]
featured: true
order: 3
---
import Section from '../../components/case-study/Section.astro'

<Section title="Problem">Placeholder body.</Section>
<Section title="Process">Placeholder body.</Section>
<Section title="Outcome">Placeholder body.</Section>
```

- [ ] **Step 4: Case study 4 — Analytics Dashboard**

Write to `src/content/case-studies/04-analytics-dashboard.mdx`:
```mdx
---
title: "Analytics Dashboard for Operators"
slug: "analytics-dashboard"
client: "Placeholder B2B Co."
role: "Product Designer"
year: 2023
duration: "4 months"
tags: ["Data", "B2B"]
cover: "/images/cs-04-cover.jpg"
coverAlt: "Analytics dashboard cover"
thumbnail: "/images/cs-04-cover.jpg"
thumbnailAlt: "Analytics dashboard thumbnail"
summary: "Turned a wall of numbers into a decision tool operators actually opened daily."
overview: "The old dashboard showed 40+ metrics with no hierarchy. We redesigned around three questions operators asked every morning."
deliverables: ["Operator interviews", "Information architecture", "Redesign"]
tools: ["Figma", "Metabase"]
featured: true
order: 4
---
import Section from '../../components/case-study/Section.astro'

<Section title="Problem">Placeholder body.</Section>
<Section title="Process">Placeholder body.</Section>
<Section title="Outcome">Placeholder body.</Section>
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: success. `dist/work/fintech-onboarding/index.html` etc. generated.

- [ ] **Step 6: Commit**

```bash
git add src/content/case-studies
git commit -m "content: 4 placeholder case studies"
```

---

## Task 26: Placeholder explorations (6 files)

**Files:**
- Create: `src/content/explorations/{01..06}-*.mdx`

- [ ] **Step 1: Write all 6 exploration files**

For `i` in `01..06`, write to `src/content/explorations/0{i}-exploration-{i}.mdx`:

```mdx
---
title: "Exploration 01"
slug: "exploration-01"
year: 2025
tags: ["UI"]
cover: "/images/exp-01.jpg"
coverAlt: "Exploration 01 cover"
images:
  - src: "/images/exp-01.jpg"
    alt: "Exploration 01 detail"
caption: "A short exploration into type-driven layouts."
order: 1
---
```

Repeat for 02-06, changing filename, slug, title, cover/coverAlt, images src/alt, and order. Keep tags varied: `["UI"]`, `["Motion"]`, `["Type"]`, `["Illustration"]`, `["Icon"]`, `["Layout"]`.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success. `dist/explorations/exploration-01/index.html` etc.

- [ ] **Step 3: Commit**

```bash
git add src/content/explorations
git commit -m "content: 6 placeholder explorations"
```

---

## Task 27: Sitemap + Astro site URL

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Update astro.config.mjs**

Open `astro.config.mjs`. It should already have `tailwind()`, `mdx()`, and `sitemap()` from Task 2. Add `site` config at the top level:

```js
import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://ficho.example.com',  // replace with real domain when known
  integrations: [tailwind(), mdx(), sitemap()],
})
```

- [ ] **Step 2: Verify sitemap is generated**

Run: `npm run build`
Then check: `ls dist/sitemap*`
Expected: `sitemap-index.xml` and `sitemap-0.xml` exist.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat: site URL + sitemap generation"
```

---

## Task 28: Full-site verification

**Files:** None — verification only.

- [ ] **Step 1: Clean build**

Run: `rm -rf dist && npm run build`
Expected: success.

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: PASS, 4 tests.

- [ ] **Step 3: Preview and visual walkthrough**

Run: `npm run preview`
Open http://localhost:4321.

Verify manually:
- Homepage: all 6 sections render, hero has pulsing accent dot, sections fade+rise as you scroll
- `/work/fintech-onboarding`: header with meta, cover image, overview + detail list, sections render, Next project card at bottom links to `/work/ecommerce-redesign`
- Click through all 4 case studies, confirm "next project" wraps from #4 back to #1
- `/explorations/exploration-01`: title, tags, caption, image stack
- `/nonexistent`: 404 page renders (Note: in `preview`, unknown routes serve `/404.html`)
- Resize to mobile width (~375px): grids collapse to single column, typography scales down, no horizontal scroll
- Toggle system "reduce motion" — verify transforms disabled, opacity fade remains

- [ ] **Step 4: Lighthouse check (optional but recommended)**

In Chrome DevTools > Lighthouse, run against `http://localhost:4321`.
Expected: Performance ≥95, Accessibility ≥95, Best Practices ≥95, SEO ≥95. If any fail, note the issue and address before shipping.

- [ ] **Step 5: Commit any tweaks + tag**

```bash
git add -A
git commit -m "chore: verify build & preview" || true
git tag v0.1.0
```

---

## Task 29: Deploy to Vercel (optional, can be done later)

**Files:** None (Vercel auto-detects Astro).

- [ ] **Step 1: Push to GitHub**

```bash
gh repo create website-ficho --public --source=. --remote=origin --push
```

(Requires `gh auth login` beforehand. If `gh` unavailable, create repo manually in GitHub UI and `git remote add origin ...; git push -u origin main`.)

- [ ] **Step 2: Import to Vercel**

Go to https://vercel.com/new, import the `website-ficho` repo, accept the auto-detected Astro settings, deploy.

- [ ] **Step 3: Update `site` URL in astro.config.mjs**

Replace `https://ficho.example.com` with the actual Vercel domain (or the custom domain once configured). Commit and push — Vercel auto-redeploys.

---

## Post-launch checklist

- Swap portrait placeholder with real photo (`public/images/portrait-placeholder.jpg`).
- Update `src/content/site.ts` with real bio, experience entries, and social URLs.
- Replace each `.mdx` case study one at a time — the layout won't shift as long as frontmatter fields are filled and word counts are similar.
- Once real content is in, capture better OG images (1200×630) per case study and swap into frontmatter `cover`.
- Set up a custom domain in Vercel and update `astro.config.mjs` `site` value.
