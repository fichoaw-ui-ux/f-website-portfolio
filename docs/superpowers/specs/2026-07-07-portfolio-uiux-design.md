# Portfolio Website UI/UX — Design Spec

**Date:** 2026-07-07
**Owner:** Ficho (ficho@transfez.com)
**Status:** Draft, pending approval

---

## 1. Goal & Audience

Build a personal portfolio website for a UI/UX designer. Primary audience is recruiters and hiring managers evaluating for full-time roles; secondary audience is peers viewing as personal branding / showcase. The site's success is measured by whether a recruiter can, within 60 seconds, understand who Ficho is, see representative work, and reach a "read the case study in depth" or "contact" action.

Non-goals: freelance client acquisition, pricing/packages, blog, e-commerce, authentication.

## 2. Content Model

**Case Study (`src/content/case-studies/*.mdx`)** — 3-4 pieces at launch, will grow over time.

Frontmatter schema:
```yaml
title: string
slug: string
client: string
role: string
year: number
duration: string          # e.g. "3 months"
tags: string[]
cover: string             # path to hero image
thumbnail: string         # path to grid image
summary: string           # 1-line for card
overview: string          # 2-3 sentence paragraph for detail page
team: string[]            # optional
deliverables: string[]
tools: string[]
featured: boolean         # controls appearance in homepage Selected Work
order: number             # controls sort order
```

Body is authored in MDX using reusable section components (see §5).

**Exploration (`src/content/explorations/*.mdx`)** — lightweight visual pieces.

Frontmatter:
```yaml
title: string
slug: string
year: number
tags: string[]
cover: string
images: string[]
caption: string           # short, 1-2 sentences
```

**Site config (`src/content/site.ts`)** — single source of truth for name, tagline, bio, skills, tools, experience entries, social links. Homepage sections read from here so content updates don't require touching component code.

## 3. Pages & Routes

- `/` — Homepage
- `/work/[slug]` — Case study detail (generated from `case-studies` collection)
- `/explorations/[slug]` — Exploration detail (generated from `explorations` collection)
- `/404` — Not found

No separate `/about`, `/work` index, or `/explorations` index at launch. Homepage sections cover these; index pages can be added later without restructuring content.

## 4. Homepage Sections

1. **Hero** — full-height dark section. Small role label (mono), large statement typography (72-96px), 2-line bio, dual CTA ("View Work" scrolls to Selected Work; "Get in Touch" scrolls to Contact). "Available for opportunities" dot indicator with pulse animation in accent color.
2. **Selected Work** — heading + "View all" link (placeholder for now). Asymmetric 2-col grid: entries 1 & 4 full-width, entries 2 & 3 half-width. Each card: cover image, category tag, title, 1-line description, year. Hover: image scale to 1.02, arrow indicator reveals. Links to `/work/[slug]`.
3. **About** — 2-col layout. Left: portrait image. Right: 100-150 word narrative + Skills pills + Tools pills.
4. **Experience** — minimal vertical timeline. Each entry: year (mono, muted) on left; role + company + 1-2 line description on right. 4-6 entries, reverse chronological.
5. **Explorations** — heading + subheading. 3-col grid, 4:5 or square thumbnails. Title reveals on hover. Links to `/explorations/[slug]`.
6. **Contact** — large statement ("Let's build something together."), large clickable email (mailto), small row of social links (LinkedIn, Dribbble, Read.cv). Minimal footer beneath: copyright.

## 5. Case Study Detail Page

Structure:
- **Header** — back link, category tags, large title (60-80px), meta row (Client · Role · Year · Duration).
- **Cover image** — full-width, ~70vh.
- **Overview** — 2-col: left overview paragraph, right detail list (Team, My Role, Deliverables, Tools).
- **Body** — authored in MDX. Reusable components:
  - `<Section title="...">` — titled content block; standard titles are Problem, Research, Process, Solution, Outcome
  - `<ImageFull src="..." alt="..." caption="..." />`
  - `<ImageGrid cols={2 | 3}>` — grid of images
  - `<Quote author="...">` — pull quote
  - `<Metrics items={[{value, label}]} />` — large-number impact tiles
- **Next project** — full-width card linking to the next case study by `order`.

## 6. Exploration Detail Page

Minimal. Title, year, tags, then a stack of large images with optional short captions. Purpose is visual — no long narrative expected.

## 7. Design System

**Colors** (Tailwind theme extension):
- `bg-primary` — `#0A0A0A`
- `bg-secondary` — `#141414`
- `text-primary` — `#FAFAFA`
- `text-secondary` — `#A1A1A1`
- `accent` — `#E4FF3F` (adjustable via single token; consumers must not hardcode hex)
- `border` — `#262626`

**Typography:**
- Display: Satoshi (weights: Medium, Bold, Black)
- Body: Inter (weights: Regular, Medium)
- Mono: JetBrains Mono (labels, meta info)
- Loaded via `@fontsource-variable` packages; `font-display: swap`.

**Layout:**
- Container max-width 1280px; horizontal padding 24px mobile, 32px desktop.
- Section vertical padding 120-160px desktop; 80-96px mobile.
- 12-col grid, 24px gap.

**Motion (Motion One):**
- Element enter: fade + translateY(20px→0), duration 500ms, easeOutQuart, trigger on IntersectionObserver.
- Image hover: scale 1.02 + brightness 1.05, duration 300ms.
- Page transition: fade only.
- Respect `prefers-reduced-motion` — disable transforms, keep fade only.

**Breakpoints:** 640 / 768 / 1024 / 1280 (Tailwind defaults).

## 8. Architecture

Framework: Astro (static output). Styling: Tailwind CSS. Motion: Motion One. Content: Astro Content Collections (MDX). Deploy: Vercel from GitHub main branch.

```
website-ficho/
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── work/[slug].astro
│   │   ├── explorations/[slug].astro
│   │   └── 404.astro
│   ├── content/
│   │   ├── config.ts             # collection schemas
│   │   ├── site.ts               # global site config
│   │   ├── case-studies/*.mdx
│   │   └── explorations/*.mdx
│   ├── components/
│   │   ├── layout/               # Header, Footer, Container
│   │   ├── home/                 # Hero, SelectedWork, About, Experience, Explorations, Contact
│   │   ├── case-study/           # Section, ImageFull, ImageGrid, Quote, Metrics, NextProject
│   │   └── ui/                   # Button, Tag, Pill, Reveal (motion wrapper)
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── CaseStudyLayout.astro
│   └── styles/
│       └── global.css
├── public/
│   └── images/
├── astro.config.mjs
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

**Boundaries:**
- Components in `home/` and `case-study/` are presentational; they receive props, do not fetch.
- Data fetching happens in page files (`.astro`) via `getCollection('case-studies')`, then passed down.
- `site.ts` is imported directly by section components that need global data (bio, socials).
- Design tokens live in `tailwind.config.js`; no hex codes in components.

## 9. Placeholder Strategy

At launch, all content is placeholder — real content will be swapped in file-by-file later. Placeholders must:
- Use realistic word counts and structure so layout doesn't shift when replaced.
- Use royalty-free stock images (Unsplash) with clear filenames indicating they are placeholders (`placeholder-cover-01.jpg`).
- Include 3 case studies and 6 explorations at launch so grids look populated.
- Site config placeholders use generic-but-plausible values (name = "Ficho", tagline = draft, socials = `#`).

## 10. Performance, SEO, Accessibility

- Astro `<Image />` for all images (auto WebP + responsive srcset + lazy).
- Font subset to Latin; preload display font.
- Target Lighthouse: Performance ≥95, Accessibility ≥95, Best Practices ≥95, SEO ≥95.
- Per-page meta: title, description, og:image (defaults to cover image for case studies).
- `@astrojs/sitemap` for sitemap.xml; robots.txt allowing all.
- Contrast: all body text on `bg-primary` and `bg-secondary` meets WCAG AA (4.5:1). `text-secondary` used only on `bg-primary`.
- All interactive elements have visible focus states (2px accent outline, 2px offset).
- Alt text required in frontmatter schema for all images; build fails if missing.

## 11. Edge Cases

- No featured case studies → Selected Work section renders empty-state message.
- Fewer than 4 case studies total → asymmetric grid falls back to symmetric 2-col.
- Missing image → build fails (validated via schema).
- Long titles → clamped to 2 lines with ellipsis on cards; full title always shown on detail page.
- Reduced motion → all `translateY`/`scale` disabled, opacity fades kept.

## 12. Out of Scope (v1)

- CMS integration (planned migration path: swap `getCollection` calls with fetch from Sanity/Contentful; components unchanged).
- Blog / journal.
- Dark/light mode toggle (site is dark-only).
- i18n.
- Analytics (can be added later via simple script tag).
- Contact form (email link only).

## 13. Success Criteria

- Recruiter lands on `/`, understands role within 5 seconds (hero clarity).
- Can reach at least one case study detail in one click from anywhere on homepage.
- Case study detail communicates problem → process → outcome without reader having to search.
- Adding a new case study requires only: (1) create `.mdx` file, (2) add images to `public/images/`, (3) push. Zero component edits.
- Lighthouse scores meet targets on both mobile and desktop.
