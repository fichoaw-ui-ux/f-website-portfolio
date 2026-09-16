# Bilingual site (ID / EN) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the whole site available in Indonesian (default, unprefixed URLs) and English (`/en/...`), with a language switcher, translated UI copy, and translated case-study/exploration content.

**Architecture:** Astro's built-in i18n routing (`locales: ['id','en']`, `defaultLocale: 'id'`, `prefixDefaultLocale: false`). Every component resolves its own language via `Astro.currentLocale` (no prop-drilling) through two new helpers: `getSite(lang)` (replaces the static `site` export) and `useTranslations(lang)` (a small UI-string dictionary). Content collections split into `id/` and `en/` subfolders per collection; thin per-locale page files under `src/pages/` and `src/pages/en/` render shared, locale-agnostic components.

**Tech Stack:** Astro 7 (content collections, i18n routing, `astro:i18n`), TypeScript, Tailwind, Vitest (build-output assertions).

**Spec:** `docs/superpowers/specs/2026-09-16-bilingual-id-en-design.md`

---

## Before you start

Set up an isolated workspace using the `superpowers:using-git-worktrees` skill (branch `feature/bilingual-id-en`, per the user's stated preference to keep `main` untouched during this work).

Run `npm install` if needed, then `npm test` to confirm a clean baseline (`npm run build && vitest run`).

---

### Task 1: Astro i18n routing + sitemap config

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Add the `i18n` config and wire the sitemap integration's `i18n` option**

Replace the whole file with:

```js
// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Canonical origin for <link rel=canonical>, the sitemap, and the absolute
  // og:image URL. Vercel's free subdomain until a real domain is bought —
  // swap this one line then, and set the same value as the production
  // domain in Vercel so the two never disagree.
  site: 'https://ficho-portfolio.vercel.app',
  i18n: {
    locales: ['id', 'en'],
    defaultLocale: 'id',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'id',
        locales: { id: 'id', en: 'en' },
      },
    }),
  ]
});
```

- [ ] **Step 2: Verify the build still works with no locale-aware pages yet**

Run: `npm run build`
Expected: build succeeds (same output as before — no pages use i18n features yet).

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(i18n): configure Astro locale routing and sitemap i18n"
```

---

### Task 2: UI string dictionary

**Files:**
- Create: `src/i18n/ui.ts`

- [ ] **Step 1: Write the dictionary, locale type, and helpers**

```ts
export type Lang = 'id' | 'en'

export const locales: Lang[] = ['id', 'en']
export const defaultLocale: Lang = 'id'

export function resolveLocale(currentLocale: string | undefined): Lang {
  return currentLocale === 'en' ? 'en' : 'id'
}

const dictionary = {
  id: {
    header: { backToHome: 'Kembali ke Beranda', contactMe: 'Hubungi Aku', menu: 'Menu' },
    footer: { rights: 'Hak cipta dilindungi.' },
    hero: { greeting: 'Halo!', intro: "Aku Ficho.", roleLine: 'product designer' },
    about: {
      heading: 'Tentang aku',
      skills: 'SKILL',
      tools: 'TOOLS',
      portraitAlt: (name: string) => `Potret ${name}`,
    },
    contact: {
      heading: 'Yuk, bikin sesuatu bareng',
      bodyBefore: 'Terbuka untuk kerja product design dan kolaborasi. Bisa hubungi aku di ',
      bodyAfter: ', atau say hi lewat LinkedIn atau WhatsApp di bawah.',
    },
    experience: { heading: 'Tempat aku pernah kerja' },
    common: { viewDetails: 'Lihat Detail' },
    selectedWork: {
      heading: 'Karya pilihanku',
      subcopy: 'Dengan mata yang detail dan cara berpikir yang kritis, aku fokus bikin website, produk, dan experience yang menarik.',
      noProjects: 'Belum ada proyek.',
    },
    notFound: {
      pageTitle: '404 — Tidak Ditemukan',
      errorLabel: 'Error 404',
      heading: 'Halaman tidak ditemukan.',
      body: 'Halaman yang kamu cari nggak ada atau udah dipindah.',
      backHome: '← Kembali ke beranda',
    },
    caseStudy: { titleSuffix: ' — Studi Kasus', nextProject: 'Proyek selanjutnya' },
    exploration: {
      backToExplorations: '← Kembali ke eksplorasi',
      titleSuffix: ' — Eksplorasi',
      noExplorations: 'Belum ada eksplorasi.',
      openPrototype: (title: string) => `Buka prototipe ${title}`,
      openDetails: (title: string) => `Buka detail ${title}`,
      seePrototype: 'Lihat Prototipe',
      visitLiveSite: 'Kunjungi Situs Live',
      closePrototype: 'Tutup prototipe',
      closeLabel: 'Tutup ✕',
    },
    figmaEmbed: { prototypeLabel: 'Prototipe', openInFigma: 'Buka di Figma ↗', defaultTitle: 'Prototipe Figma' },
    imageFull: { imageLabel: 'Gambar', placeholderLabel: 'Placeholder', viewFull: 'Lihat penuh ↗' },
    lightbox: { close: 'Tutup' },
  },
  en: {
    header: { backToHome: 'Back to Home', contactMe: 'Contact Me', menu: 'Menu' },
    footer: { rights: 'All rights reserved.' },
    hero: { greeting: 'Hello!', intro: "I'm Ficho.", roleLine: 'a product designer' },
    about: {
      heading: 'About me',
      skills: 'SKILLS',
      tools: 'TOOLS',
      portraitAlt: (name: string) => `Portrait of ${name}`,
    },
    contact: {
      heading: "Let's build something together",
      bodyBefore: 'Open to product design work and collaborations. You can reach me at ',
      bodyAfter: ', or say hi on LinkedIn or WhatsApp below.',
    },
    experience: { heading: "Where I've worked" },
    common: { viewDetails: 'View Details' },
    selectedWork: {
      heading: 'My selected works',
      subcopy: 'With my keen eye for detail and sharp critical thinking skills, I specialize in crafting captivating websites, products, and experiences.',
      noProjects: 'No projects yet.',
    },
    notFound: {
      pageTitle: '404 — Not Found',
      errorLabel: 'Error 404',
      heading: 'Page not found.',
      body: "The page you're looking for doesn't exist or has been moved.",
      backHome: '← Back home',
    },
    caseStudy: { titleSuffix: ' — Case Study', nextProject: 'Next project' },
    exploration: {
      backToExplorations: '← Back to explorations',
      titleSuffix: ' — Exploration',
      noExplorations: 'No explorations yet.',
      openPrototype: (title: string) => `Open ${title} prototype`,
      openDetails: (title: string) => `Open ${title} details`,
      seePrototype: 'See Prototype',
      visitLiveSite: 'Visit Live Site',
      closePrototype: 'Close prototype',
      closeLabel: 'Close ✕',
    },
    figmaEmbed: { prototypeLabel: 'Prototype', openInFigma: 'Open in Figma ↗', defaultTitle: 'Figma prototype' },
    imageFull: { imageLabel: 'Image', placeholderLabel: 'Placeholder', viewFull: 'View full ↗' },
    lightbox: { close: 'Close' },
  },
} as const

export function useTranslations(lang: Lang) {
  return dictionary[lang]
}
```

- [ ] **Step 2: Type-check**

Run: `npx astro check --minimumSeverity error` (or `npx tsc --noEmit` if `astro check` isn't set up)
Expected: no errors from `src/i18n/ui.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/ui.ts
git commit -m "feat(i18n): add UI string dictionary and locale resolver"
```

---

### Task 3: `site.ts` becomes locale-aware

**Files:**
- Modify: `src/content/site.ts`

- [ ] **Step 1: Replace the file with a `getSite(lang)` factory**

Fields that don't change between languages (`name`, `role`, `email`, `whatsapp`, `skills`, `tools`, `socials`) stay in a `shared` object. `tagline`, `bio`, `nav`, and `experience` move into a `perLang` map. Replace the whole file with:

```ts
import type { Lang } from '../i18n/ui'

const shared = {
  name: 'Ficho',
  role: 'UI/UX Designer',
  email: 'fichoajiwibowo@gmail.com',
  // International format for wa.me deep links (Indonesia country code 62, leading 0 dropped).
  // Local number is 082111183273.
  whatsapp: '6282111183273',
  skills: [
    'Product Design',
    'Usability Testing',
    'Wireframing',
    'Prototyping',
    'User Flows',
    'Information Architecture',
    'Design Systems',
    'Graphic Design',
    'HTML/CSS',
  ],
  tools: [
    'Figma',
    'Claude Code',
    'Notion',
    'Slack',
    'Jira',
    'Mixpanel',
    'Bitbucket',
    'Github',
    'Photoshop',
    'Illustrator',
    'Google Workspace',
  ],
  socials: [
    { label: 'LinkedIn', href: 'https://linkedin.com/in/fichoajiwibowo' },
    { label: 'WhatsApp', href: 'https://wa.me/6282111183273' },
    { label: 'Email', href: 'mailto:fichoajiwibowo@gmail.com' },
  ],
} as const

const perLang = {
  id: {
    tagline: 'Product Designer yang bikin produk digital user-centric, dari flow sampai high-fidelity interface.',
    bio: [
      'Product Designer dengan pengalaman 4+ tahun, sekarang fokus di fintech remittance di Transfez (lewat Jack Finance) — KYC, transaksi cross-border, dan compliance flows.',
      'Background Sistem Informasi, dengan pengalaman langsung di implementasi front-end berbantuan AI.',
    ],
    nav: [
      { label: 'Karya', href: '/#work' },
      { label: 'Tentang', href: '/#about' },
      { label: 'Pengalaman', href: '/#experience' },
      { label: 'Eksplorasi', href: '/#explorations' },
    ],
    experience: [
      {
        year: 'Juli 2022 — Sekarang',
        company: 'Transfez & Jack Finance',
        role: 'UI/UX Designer',
        sections: [
          {
            label: 'Tanggung Jawab Umum',
            items: [
              'Kerja bareng tim **Product, Engineering, Compliance, dan Data** buat nerjemahin kebutuhan regulasi dan bisnis jadi solusi desain yang solid dan bisa diuji.',
              'Ngerjain **usability review** dan iterasi desain berdasarkan data (misalnya **analisis transaksi/funnel**) dan feedback kualitatif dari tim Ops dan Compliance.',
            ],
          },
          {
            label: 'Fokus: Transfez (Sekarang)',
            items: [
              'Ikut bangun website Transfez pakai **AI-assisted development (Claude Code)** yang terintegrasi sama **Figma lewat MCP** — jadi proses handoff desain langsung nyambung ke kode, termasuk **git workflow** (commit, push, pull request) bareng tim development.',
              'Nemuin gap UX besar di **fitur voucher Send Money** Transfez — cuma **31.43% dari 6.297 user** yang pakai voucher yang tersedia menurut data Mixpanel — terus mimpin eksekusi desain dari awal sampai handoff ke engineering (analisis, iterasi, restrukturisasi halaman); solusinya **divalidasi tim Growth dan disetujui buat dikembangkan**.',
            ],
          },
          {
            label: 'Fokus Sebelumnya: Jack Finance (Afiliasi Transfez)',
            items: [
              'Megang **desain end-to-end** buat **Send Money (Transfer Internasional & Lokal), Payroll**, dan produk inti lainnya — mulai dari user flow, information architecture, sampai UI high-fidelity.',
              'Ngedesain UI flow, mockup, dan elemen interface buat fitur **transaction recovery**, yang bikin **tiket support turun 70%** dan payment success rate naik dari **80% ke 95%**.',
              'Mimpin desain UI/UX buat **flow Local Transfer yang mobile-native**, yang bikin **56% adopsi mobile** di bulan pertama dan **motong waktu penyelesaian 40%**.',
              'Ngedesain flow **"Quick Transfer"** yang lebih ringkas buat pembayaran satuan/volume kecil, motong waktu mulai transfer **52%** dan berhasil dipakai buat **41% dari semua inisiasi Local Transfer** dalam dua minggu setelah rilis.',
              'Ngedesain pengalaman **Enhanced Due Diligence (EDD)** yang dilihat client — form permintaan dokumen yang dinamis, notifikasi multi-channel, dan alert perubahan kurs — buat sistem **monitoring compliance AML/CFT** otomatis di transfer cross-border.',
            ],
          },
        ],
      },
      {
        year: 'Oktober 2021 — Juni 2022',
        company: 'Transfez',
        role: 'Desainer Grafis (Magang)',
        sections: [
          {
            items: [
              'Bikin materi marketing, aset brand identity, dan grafis media sosial buat dukung kampanye dan publikasi perusahaan.',
              'Kerja bareng tim Marketing, Product, dan Content buat mastiin hasil desain sesuai sama tujuan kampanye.',
            ],
          },
        ],
      },
      {
        year: 'Oktober 2021 — Maret 2022',
        company: 'Great Giant Foods',
        role: 'Corporate Communication (Magang)',
        sections: [
          {
            items: [
              'Bikin dan jalanin konten corporate communication di media sosial dan newsletter buat dukung tujuan perusahaan.',
              'Nulis, ngedit, dan visualisasiin materi komunikasi termasuk press release dan laporan sustainability (ESG/governance).',
            ],
          },
        ],
      },
    ],
  },
  en: {
    tagline: 'Product Designer crafting user-centric digital products from flows to high-fidelity interfaces.',
    bio: [
      "Product Designer with 4+ years of experience, currently focused on fintech remittance at Transfez (via Jack Finance) — KYC, cross-border transactions, and compliance flows.",
      "Background in Information Systems, with hands-on experience in AI-assisted front-end implementation.",
    ],
    nav: [
      { label: 'Work', href: '/#work' },
      { label: 'About', href: '/#about' },
      { label: 'Experience', href: '/#experience' },
      { label: 'Exploration', href: '/#explorations' },
    ],
    experience: [
      {
        year: 'July 2022 — Present',
        company: 'Transfez & Jack Finance',
        role: 'UI/UX Designer',
        sections: [
          {
            label: 'General Responsibilities',
            items: [
              'Collaborated closely with **Product, Engineering, Compliance, and Data** teams to translate regulatory and business requirements into cohesive, testable design solutions.',
              'Conducted **usability reviews** and iterated on designs based on data (e.g., **transaction/funnel analysis**) and qualitative feedback from Ops and Compliance stakeholders.',
            ],
          },
          {
            label: 'Focus: Transfez (Current)',
            items: [
              'Collaborated on implementation of the Transfez website using **AI-assisted development (Claude Code)** integrated with **Figma via MCP** — bridging design handoff directly into code, including **git workflows** (commit, push, pull requests) alongside the development team.',
              "Identified a major UX gap in Transfez's **Send Money voucher experience** — only **31.43% of 6,297 users** engaged with available vouchers per Mixpanel data — and led full design execution (analysis, iteration, page restructuring) through engineering handoff; solution **validated by Growth stakeholders and approved for development**.",
            ],
          },
          {
            label: 'Prior Focus: Jack Finance (Transfez Affiliate)',
            items: [
              'Managed **end-to-end design** for **Send Money (International & Local Transfers), Payroll**, and other core products — from user flows and information architecture to high-fidelity UI.',
              'Designed UI flows, mockups, and interface elements for a **transaction recovery** feature, contributing to a **70% drop in support tickets** and lifting payment success rate from **80% to 95%**.',
              'Led UI/UX design for a **mobile-native Local Transfer flow**, driving **56% mobile adoption** within the first month and **cutting time-to-completion by 40%**.',
              'Designed a streamlined **"Quick Transfer" flow** for single/small-volume payments, reducing transfer initiation time by **52%** and capturing **41% of Local Transfer initiations** within two weeks of launch.',
              'Designed the client-facing **Enhanced Due Diligence (EDD)** experience — dynamic document-request forms, multi-channel notifications, and FX-rate change alerts — for an automated **AML/CFT compliance monitoring** system across cross-border transfers.',
            ],
          },
        ],
      },
      {
        year: 'October 2021 — June 2022',
        company: 'Transfez',
        role: 'Graphic Designer (Intern)',
        sections: [
          {
            items: [
              'Produced marketing materials, brand identity assets, and social media graphics supporting company campaigns and publications.',
              'Partnered with Marketing, Product, and Content teams to ensure design output aligned with campaign objectives.',
            ],
          },
        ],
      },
      {
        year: 'October 2021 — March 2022',
        company: 'Great Giant Foods',
        role: 'Corporate Communication (Intern)',
        sections: [
          {
            items: [
              'Developed and executed corporate communication content across social media and newsletters in support of company goals.',
              'Drafted, edited, and visualized communication materials including press releases and sustainability reports (ESG/governance).',
            ],
          },
        ],
      },
    ],
  },
} as const

export function getSite(lang: Lang) {
  return { ...shared, ...perLang[lang] }
}

export type SiteConfig = ReturnType<typeof getSite>
```

- [ ] **Step 2: Find every remaining import of the old `site` export**

Run: `grep -rln "import { site } from" src`
Expected: lists every component still using the old static export — these are fixed in later tasks (4 through 11). Confirm the list matches: `Header.astro`, `Footer.astro`, `Hero.astro`, `About.astro`, `Contact.astro`, `Experience.astro`, `src/pages/index.astro`. (`SelectedWork.astro` imports `sortByOrder`/`filterFeatured`, not `site` — leave as is until Task 8.)

- [ ] **Step 3: Commit**

```bash
git add src/content/site.ts
git commit -m "feat(i18n): make site.ts locale-aware via getSite(lang)"
```

Note: the build will not succeed again until Task 9 (home page wiring) — every component above still does `import { site } from '../../content/site'`, which no longer exists. That's expected; keep going through Tasks 4-9 before building.

---

### Task 4: `localeEntries` helper for content collections

**Files:**
- Modify: `src/lib/content.ts`

- [ ] **Step 1: Add the helper and its test**

Add to `tests/content.test.ts` (append, don't replace the file):

```ts
import { localeEntries } from '../src/lib/content'

describe('localeEntries', () => {
  const entries = [
    { id: 'id/01-quick-transfer', data: { slug: 'quick-transfer' } },
    { id: 'en/01-quick-transfer', data: { slug: 'quick-transfer' } },
    { id: 'id/02-voucher-points-banner', data: { slug: 'voucher-points-banner' } },
  ]

  it('keeps only entries whose id is prefixed with the given locale', () => {
    expect(localeEntries(entries, 'id').map(e => e.id)).toEqual([
      'id/01-quick-transfer',
      'id/02-voucher-points-banner',
    ])
    expect(localeEntries(entries, 'en').map(e => e.id)).toEqual(['en/01-quick-transfer'])
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/content.test.ts`
Expected: FAIL — `localeEntries is not exported from '../src/lib/content'`

- [ ] **Step 3: Implement `localeEntries`**

Append to `src/lib/content.ts`:

```ts
export function localeEntries<T>(
  items: { id: string; data: T }[],
  locale: 'id' | 'en',
): { id: string; data: T }[] {
  return items.filter(item => item.id.startsWith(`${locale}/`))
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run tests/content.test.ts`
Expected: PASS (all tests in the file, including the pre-existing ones)

- [ ] **Step 5: Commit**

```bash
git add src/lib/content.ts tests/content.test.ts
git commit -m "feat(i18n): add localeEntries helper for locale-split collections"
```

---

### Task 5: `BaseLayout` — dynamic `<html lang>` and hreflang tags

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Resolve the current locale, compute alternate URLs, and use them**

Replace the frontmatter block (lines 1-36) with:

```astro
---
import '../styles/global.css'
import Header from '../components/layout/Header.astro'
import Footer from '../components/layout/Footer.astro'
import { getRelativeLocaleUrl } from 'astro:i18n'
import { resolveLocale } from '../i18n/ui'

interface Props {
  title: string
  description?: string
  ogImage?: string
  theme?: 'dark' | 'light'
  showHeader?: boolean
  showBackToHome?: boolean
}
const { title, description, ogImage = '/images/og-default.jpg', theme = 'dark', showHeader = true, showBackToHome = false } = Astro.props
const lang = resolveLocale(Astro.currentLocale)
const resolvedDescription = description ?? (lang === 'id' ? 'Portofolio Ficho — UI/UX Designer' : 'Portfolio of Ficho — UI/UX Designer')
const origin = Astro.site ?? new URL('https://ficho-portfolio.vercel.app')
const canonical = new URL(Astro.url.pathname, origin).toString()
// og:image must be absolute: Facebook, LinkedIn, Slack and X all discard a
// root-relative path, which is why link previews rendered without a card.
const ogImageUrl = new URL(ogImage, origin).toString()

// Strip the /en prefix (if present) to get the locale-agnostic path, then
// rebuild it for both locales — this is what the hreflang alternates point at.
const rawPath = lang === 'en' ? (Astro.url.pathname.replace(/^\/en/, '') || '/') : Astro.url.pathname
const hreflangId = new URL(getRelativeLocaleUrl('id', rawPath), origin).toString()
const hreflangEn = new URL(getRelativeLocaleUrl('en', rawPath), origin).toString()

/* Case study pages render light. This must override every colour token the
   shared chrome can reach, not just the ones the case-study body uses — the
   Header and Footer render on these pages too. An unmapped token silently
   falls through to its dark value, which is how `--color-border-hover` ended
   up as near-white-on-white here.
   Contrast on #FAFAFA: #0A0A0A 19.0:1, #525252 7.5:1, #6B6B6B 5.1:1. */
const lightThemeVars = [
  '--color-bg-primary: #FAFAFA',
  '--color-bg-secondary: #F0F0F0',
  '--color-bg-elevated: #E8E8E8',
  '--color-text-primary: #0A0A0A',
  '--color-text-secondary: #525252',
  '--color-text-tertiary: #6B6B6B',
  '--color-border: #E5E5E5',
  '--color-border-hover: #C4C4C4',
].join(';')
---
```

Replace the `<html>...<head>` block (old lines 38-53) with:

```astro
<!doctype html>
<html lang={lang} class="bg-bg-primary text-text-primary" style={theme === 'light' ? lightThemeVars : undefined}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={resolvedDescription} />
    <link rel="canonical" href={canonical} />
    <link rel="alternate" hreflang="id" href={hreflangId} />
    <link rel="alternate" hreflang="en" href={hreflangEn} />
    <link rel="alternate" hreflang="x-default" href={hreflangId} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={resolvedDescription} />
    <meta property="og:image" content={ogImageUrl} />
    <meta property="og:url" content={canonical} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
```

The `<body>` block is unchanged.

- [ ] **Step 2: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(i18n): resolve locale and emit hreflang alternates in BaseLayout"
```

---

### Task 6: Header — locale-aware + language switcher

**Files:**
- Create: `src/components/layout/LanguageSwitcher.astro`
- Modify: `src/components/layout/Header.astro`

- [ ] **Step 1: Write the switcher component**

```astro
---
import { getRelativeLocaleUrl } from 'astro:i18n'
import type { Lang } from '../../i18n/ui'

interface Props { currentLang: Lang }
const { currentLang } = Astro.props
const rawPath = currentLang === 'en' ? (Astro.url.pathname.replace(/^\/en/, '') || '/') : Astro.url.pathname
const idHref = getRelativeLocaleUrl('id', rawPath)
const enHref = getRelativeLocaleUrl('en', rawPath)
---
<div class="flex items-center gap-1 font-mono text-sm text-text-secondary" aria-label="Language">
  <a href={idHref} class:list={['px-1 transition hover:text-text-primary', currentLang === 'id' && 'font-semibold text-text-primary']}>ID</a>
  <span aria-hidden="true">/</span>
  <a href={enHref} class:list={['px-1 transition hover:text-text-primary', currentLang === 'en' && 'font-semibold text-text-primary']}>EN</a>
</div>
```

- [ ] **Step 2: Wire it into `Header.astro`**

Add to the frontmatter imports (after the existing `logo` import):

```astro
import LanguageSwitcher from './LanguageSwitcher.astro'
import { resolveLocale, useTranslations } from '../../i18n/ui'
import { getSite } from '../../content/site'
```

Replace `import { site } from '../../content/site'` with the two lines above, and add before the `interface Props` line:

```astro
const lang = resolveLocale(Astro.currentLocale)
const site = getSite(lang)
const t = useTranslations(lang)
```

Then apply these exact text replacements:

| Old | New |
|---|---|
| `<span>Back to Home</span>` | `<span>{t.header.backToHome}</span>` |
| `aria-label="Menu"` (summary element) | `aria-label={t.header.menu}` |
| `<span>Contact Me</span>` (desktop, inside the `mailto:` link) | `<span>{t.header.contactMe}</span>` |
| `<span>Contact Me</span>` (mobile menu, inside the second `mailto:` link) | `<span>{t.header.contactMe}</span>` |

- [ ] **Step 3: Add the switcher to the desktop trailing slot**

In slot 3 (trailing — the `<div class="md:justify-self-end">` block), add the switcher just before the `mailto:` "Contact Me" link, wrapped so it only shows on desktop:

```astro
<div class="md:justify-self-end flex items-center gap-4">
  <LanguageSwitcher currentLang={lang} class="hidden md:flex" />
  <a
    href={`mailto:${site.email}`}
    ...
```

(Keep the rest of that `<a>` tag and everything after it exactly as it was — only the wrapping `<div>`'s classes and the switcher line are new. `LanguageSwitcher` needs a `class` prop passthrough — add `class?: string` to its `Props` interface and spread it onto the root `<div>` via `class:list={[..., className]}` if you want the `hidden md:flex` override to apply; simplest is to instead wrap the call: `<div class="hidden md:flex"><LanguageSwitcher currentLang={lang} /></div>` — use that form instead, no prop change needed on `LanguageSwitcher`.)

- [ ] **Step 4: Add the switcher to the mobile menu**

Inside the mobile `<details>` menu's content `<div>`, add it after the `<hr>` and before the mobile "Contact Me" link:

```astro
<hr class="my-4 border-0 border-t border-border" />
<LanguageSwitcher currentLang={lang} />
<a
  href={`mailto:${site.email}`}
  ...
```

- [ ] **Step 5: Verify it renders (deferred — full build happens in Task 9)**

This component can't build standalone yet because `getSite`/`useTranslations` compile fine but `Hero.astro` etc. still import the old `site` export. Just run the type checker:

Run: `npx astro check --minimumSeverity error`
Expected: no errors in `Header.astro` or `LanguageSwitcher.astro` (errors in still-unmigrated files are expected at this point and fixed by Task 8).

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/Header.astro src/components/layout/LanguageSwitcher.astro
git commit -m "feat(i18n): make Header locale-aware and add language switcher"
```

---

### Task 7: Footer — locale-aware

**Files:**
- Modify: `src/components/layout/Footer.astro`

- [ ] **Step 1: Replace the file**

```astro
---
import Container from './Container.astro'
import { getSite } from '../../content/site'
import { resolveLocale, useTranslations } from '../../i18n/ui'
const year = new Date().getFullYear()
const lang = resolveLocale(Astro.currentLocale)
const site = getSite(lang)
const t = useTranslations(lang)
---
{/* py-5 around a 22px line gives Figma's 62px strip. The old top border and
    mt-24 are gone: Contact already ends in whitespace, so a rule there just
    draws a line under nothing. */}
<footer class="py-5">
  <Container>
    <p class="text-center text-sm leading-[1.6] text-text-tertiary">
      &copy; {year} {site.name}. {t.footer.rights}
    </p>
  </Container>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Footer.astro
git commit -m "feat(i18n): make Footer locale-aware"
```

---

### Task 8: Home components — locale-aware

**Files:**
- Modify: `src/components/home/Hero.astro`
- Modify: `src/components/home/About.astro`
- Modify: `src/components/home/Contact.astro`
- Modify: `src/components/home/Experience.astro`
- Modify: `src/components/home/SelectedWork.astro`
- Modify: `src/components/home/ExplorationsGrid.astro`

- [ ] **Step 1: `Hero.astro`**

Replace the import line `import { site } from '../../content/site'` with:

```astro
import { getSite } from '../../content/site'
import { resolveLocale, useTranslations } from '../../i18n/ui'
```

Add before the closing `---`:

```astro
const lang = resolveLocale(Astro.currentLocale)
const site = getSite(lang)
const t = useTranslations(lang)
```

Replace:
- `<span>Hello!</span>` → `<span>{t.hero.greeting}</span>`
- `<span>I&rsquo;m Ficho.</span>` → `<span>{t.hero.intro}</span>`
- `<span class="mt-1 block text-center">a product designer</span>` → `<span class="mt-1 block text-center">{t.hero.roleLine}</span>`

`{site.tagline}` stays as-is (already resolves per-locale via `getSite`).

- [ ] **Step 2: `About.astro`**

Replace `import { site } from '../../content/site'` with:

```astro
import { getSite } from '../../content/site'
import { resolveLocale, useTranslations } from '../../i18n/ui'
```

Add before the closing `---`:

```astro
const lang = resolveLocale(Astro.currentLocale)
const site = getSite(lang)
const t = useTranslations(lang)
```

Replace:
- `alt={`Portrait of ${site.name}`}` → `alt={t.about.portraitAlt(site.name)}`
- `<h2 class="font-display font-semibold text-display-lg text-text-primary">About me</h2>` → `<h2 class="font-display font-semibold text-display-lg text-text-primary">{t.about.heading}</h2>`
- `<div class="text-lg leading-[1.6] text-text-tertiary">SKILLS</div>` → `<div class="text-lg leading-[1.6] text-text-tertiary">{t.about.skills}</div>`
- `<div class="text-lg leading-[1.6] text-text-tertiary">TOOLS</div>` → `<div class="text-lg leading-[1.6] text-text-tertiary">{t.about.tools}</div>`

- [ ] **Step 3: `Contact.astro`**

Replace `import { site } from '../../content/site'` with:

```astro
import { getSite } from '../../content/site'
import { resolveLocale, useTranslations } from '../../i18n/ui'
```

Add after the imports, before `const linkedin = ...`:

```astro
const lang = resolveLocale(Astro.currentLocale)
const site = getSite(lang)
const t = useTranslations(lang)
```

Replace the heading and body paragraph:

```astro
<h2 class="font-display font-semibold text-display-lg text-text-primary">
  {t.contact.heading}
</h2>

<p class="mx-auto mt-6 max-w-[640px] text-lg leading-[1.6] text-text-secondary md:mt-8 md:text-2xl">
  {t.contact.bodyBefore}
  <a
    href={`mailto:${site.email}`}
    class="font-medium text-text-primary underline decoration-border underline-offset-4 transition hover:decoration-text-primary"
  >{site.email}</a>{t.contact.bodyAfter}
</p>
```

- [ ] **Step 4: `Experience.astro`**

Replace `import { site } from '../../content/site'` with:

```astro
import { getSite } from '../../content/site'
import { resolveLocale, useTranslations } from '../../i18n/ui'
```

Add before the `escape`/`highlight` helper functions:

```astro
const lang = resolveLocale(Astro.currentLocale)
const site = getSite(lang)
const t = useTranslations(lang)
```

Replace `<h2 class="font-display font-semibold text-display-lg text-text-primary">Where I've worked</h2>` with `<h2 class="font-display font-semibold text-display-lg text-text-primary">{t.experience.heading}</h2>`.

`{site.experience.map(...)}` stays as-is (already resolves per-locale).

- [ ] **Step 5: `SelectedWork.astro`**

Add to the imports:

```astro
import { resolveLocale, useTranslations } from '../../i18n/ui'
```

Add after `const all = await getCollection('case-studies')` line's block (before or after `featured` — either works):

```astro
const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)
```

Replace:
- `<h2 class="font-display font-semibold text-display-lg text-text-primary">My selected works</h2>` → `{t.selectedWork.heading}` in place of the text
- The subcopy paragraph body → `{t.selectedWork.subcopy}`
- `<p class="mt-16 text-text-tertiary">No projects yet.</p>` → `{t.selectedWork.noProjects}` in place of the text
- `>View Details</span>` → `>{t.common.viewDetails}</span>`

Note: this component filters `case-studies` by `featured`, but does **not** yet filter by locale — that's added in Task 10 once the collection is split into `id/`/`en/` folders. Leave the `getCollection`/`sortByOrder`/`filterFeatured` lines untouched in this step.

- [ ] **Step 6: `ExplorationsGrid.astro`**

Add to the imports:

```astro
import { resolveLocale, useTranslations } from '../../i18n/ui'
```

Add after `const items = sortByOrder(all)`:

```astro
const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)
```

Replace:
- `<p class="text-text-tertiary">No explorations yet.</p>` → text becomes `{t.exploration.noExplorations}`
- `` aria-label={`Open ${e.data.title} prototype`} `` → `aria-label={t.exploration.openPrototype(e.data.title)}`
- `` aria-label={`Open ${e.data.title} details`} `` → `aria-label={t.exploration.openDetails(e.data.title)}`
- `<Pill class="w-full justify-center">See Prototype</Pill>` → `<Pill class="w-full justify-center">{t.exploration.seePrototype}</Pill>`
- `<Pill class="w-full justify-center">Visit Live Site</Pill>` → `<Pill class="w-full justify-center">{t.exploration.visitLiveSite}</Pill>`
- `<span class="font-mono text-xs uppercase tracking-widest text-text-tertiary">Prototype</span>` (inside the `<dialog>`) → `{t.figmaEmbed.prototypeLabel}`
- `aria-label="Close prototype"` → `aria-label={t.exploration.closePrototype}`
- `>Close ✕</button>` → `>{t.exploration.closeLabel}</button>`

For the inline `<script>` block's fallback title (`const title = btn.dataset.protoTitle ?? 'Prototype'`), the script runs client-side and can't reference `t` directly — pass it in via `define:vars`. Change the `<script>` opening tag from `<script>` to:

```astro
<script define:vars={{ fallbackTitle: t.figmaEmbed.prototypeLabel }}>
```

and change the line inside it from `const title = btn.dataset.protoTitle ?? 'Prototype'` to `const title = btn.dataset.protoTitle ?? fallbackTitle`.

Note: like `SelectedWork.astro`, this component's `getCollection('explorations')` call isn't locale-filtered yet — that's Task 10.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/Hero.astro src/components/home/About.astro src/components/home/Contact.astro src/components/home/Experience.astro src/components/home/SelectedWork.astro src/components/home/ExplorationsGrid.astro
git commit -m "feat(i18n): make home section components locale-aware"
```

---

### Task 9: Home page — extract shared body, add EN route

**Files:**
- Create: `src/components/home/HomePage.astro`
- Modify: `src/pages/index.astro`
- Create: `src/pages/en/index.astro`

- [ ] **Step 1: Extract the composition**

```astro
---
import Hero from './Hero.astro'
import SelectedWork from './SelectedWork.astro'
import About from './About.astro'
import Experience from './Experience.astro'
import ExplorationsGrid from './ExplorationsGrid.astro'
import Contact from './Contact.astro'
---
<Hero />
<SelectedWork />
<About />
<Experience />
<ExplorationsGrid />
<Contact />
```

- [ ] **Step 2: Rewrite `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import HomePage from '../components/home/HomePage.astro'
import { getSite } from '../content/site'

const site = getSite('id')
---
<BaseLayout title={`${site.name} — ${site.role}`} description={site.tagline}>
  <HomePage />
</BaseLayout>
```

- [ ] **Step 3: Create `src/pages/en/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import HomePage from '../../components/home/HomePage.astro'
import { getSite } from '../../content/site'

const site = getSite('en')
---
<BaseLayout title={`${site.name} — ${site.role}`} description={site.tagline}>
  <HomePage />
</BaseLayout>
```

- [ ] **Step 4: Build and smoke-check both homes**

Run: `npm run build`
Expected: succeeds, producing `dist/index.html` and `dist/en/index.html`.

Run: `grep -o 'Halo!' dist/index.html | head -1 && grep -o 'Hello!' dist/en/index.html | head -1`
Expected: both print their match — confirms `/` renders Indonesian and `/en` renders English.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/HomePage.astro src/pages/index.astro src/pages/en/index.astro
git commit -m "feat(i18n): render home page per locale (id at /, en at /en)"
```

---

### Task 10: Restructure content collections into `id/`/`en/`, filter by locale

**Files:**
- Move: `src/content/case-studies/01-quick-transfer.mdx` → `src/content/case-studies/id/01-quick-transfer.mdx`
- Move: `src/content/case-studies/02-voucher-points-banner.mdx` → `src/content/case-studies/id/02-voucher-points-banner.mdx`
- Move: `src/content/explorations/01-exploration.mdx` … `07-exploration.mdx` → `src/content/explorations/id/01-exploration.mdx` … `07-exploration.mdx`
- Modify: `src/components/home/SelectedWork.astro`
- Modify: `src/components/home/ExplorationsGrid.astro`
- Modify: `src/pages/work/[slug].astro`
- Modify: `src/pages/explorations/[slug].astro`

- [ ] **Step 1: Move the existing MDX files into `id/` subfolders**

```bash
mkdir -p src/content/case-studies/id src/content/explorations/id
git mv src/content/case-studies/01-quick-transfer.mdx src/content/case-studies/id/01-quick-transfer.mdx
git mv src/content/case-studies/02-voucher-points-banner.mdx src/content/case-studies/id/02-voucher-points-banner.mdx
git mv src/content/explorations/01-exploration.mdx src/content/explorations/id/01-exploration.mdx
git mv src/content/explorations/02-exploration.mdx src/content/explorations/id/02-exploration.mdx
git mv src/content/explorations/03-exploration.mdx src/content/explorations/id/03-exploration.mdx
git mv src/content/explorations/04-exploration.mdx src/content/explorations/id/04-exploration.mdx
git mv src/content/explorations/05-exploration.mdx src/content/explorations/id/05-exploration.mdx
git mv src/content/explorations/06-exploration.mdx src/content/explorations/id/06-exploration.mdx
git mv src/content/explorations/07-exploration.mdx src/content/explorations/id/07-exploration.mdx
```

The MDX files import components via relative paths like `'../../components/case-study/PartHeader.astro'` — moving one directory deeper breaks those. Fix each moved case-study file's imports by adding one more `../`:

Run: `sed -i '' "s#from '../../components/#from '../../../components/#g" src/content/case-studies/id/*.mdx`

(On Linux, drop the `''` after `-i`.) Explorations MDX files don't import components (verify: `grep -L "^import" src/content/explorations/id/*.mdx` should list all 7 — they're image/caption-only).

- [ ] **Step 2: Verify the loader sees locale-prefixed ids**

Run: `npx astro build 2>&1 | tail -20` — expect it to fail here, because `SelectedWork.astro`/`ExplorationsGrid.astro`/the two `[slug].astro` pages don't filter by locale yet, so they'll try to render both `id/...` and `en/...` (nonexistent) entries mixed together, or `getStaticPaths` will collide on duplicate `slug` values across future locales. That's expected — proceed to the next step regardless of this build's outcome, it's just a checkpoint to eyeball.

- [ ] **Step 3: Filter `SelectedWork.astro` and `ExplorationsGrid.astro` by locale**

In `src/components/home/SelectedWork.astro`, add the import and filter:

```astro
import { sortByOrder, filterFeatured, localeEntries } from '../../lib/content'
```

Change:

```astro
const all = await getCollection('case-studies')
const featured = sortByOrder(filterFeatured(all))
```

to:

```astro
const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)
const all = await getCollection('case-studies')
const featured = sortByOrder(filterFeatured(localeEntries(all, lang)))
```

(This replaces the separate `lang`/`t` declarations added in Task 8 Step 5 — keep only one copy, placed here before `all`/`featured` are computed.)

In `src/components/home/ExplorationsGrid.astro`, add `localeEntries` to the import from `'../../lib/content'` and change:

```astro
const all = await getCollection('explorations')
const items = sortByOrder(all)
```

to:

```astro
const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)
const all = await getCollection('explorations')
const items = sortByOrder(localeEntries(all, lang))
```

(Again, replaces the separate declaration from Task 8 Step 6 — one copy only, placed before `all`/`items`.)

- [ ] **Step 4: Filter `work/[slug].astro` by locale and add lang/t**

Replace the whole file:

```astro
---
import { getCollection, render } from 'astro:content'
import CaseStudyLayout from '../../layouts/CaseStudyLayout.astro'
import { sortByOrder, getNextItem, localeEntries } from '../../lib/content'

export async function getStaticPaths() {
  const all = await getCollection('case-studies')
  const sorted = sortByOrder(localeEntries(all, 'id'))
  return sorted.map(entry => ({
    params: { slug: entry.data.slug },
    props: { entry, next: getNextItem(sorted, entry.data.slug)! },
  }))
}

const { entry, next } = Astro.props
const { Content } = await render(entry)
---
<CaseStudyLayout entry={entry} next={next}>
  <Content />
</CaseStudyLayout>
```

- [ ] **Step 5: Create `src/pages/en/work/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content'
import CaseStudyLayout from '../../../layouts/CaseStudyLayout.astro'
import { sortByOrder, getNextItem, localeEntries } from '../../../lib/content'

export async function getStaticPaths() {
  const all = await getCollection('case-studies')
  const sorted = sortByOrder(localeEntries(all, 'en'))
  return sorted.map(entry => ({
    params: { slug: entry.data.slug },
    props: { entry, next: getNextItem(sorted, entry.data.slug)! },
  }))
}

const { entry, next } = Astro.props
const { Content } = await render(entry)
---
<CaseStudyLayout entry={entry} next={next}>
  <Content />
</CaseStudyLayout>
```

This will generate zero routes until Task 14 adds `en/*.mdx` case-study files — that's fine, `getStaticPaths` returning `[]` just means no pages are built for `/en/work/*` yet.

- [ ] **Step 6: Filter `explorations/[slug].astro` by locale and translate its own strings**

Replace the whole file:

```astro
---
import { getCollection } from 'astro:content'
import BaseLayout from '../../layouts/BaseLayout.astro'
import Container from '../../components/layout/Container.astro'
import Tag from '../../components/ui/Tag.astro'
import { localeEntries } from '../../lib/content'
import { resolveLocale, useTranslations } from '../../i18n/ui'

export async function getStaticPaths() {
  const all = await getCollection('explorations')
  return localeEntries(all, 'id').map(entry => ({ params: { slug: entry.data.slug }, props: { entry } }))
}

const { entry } = Astro.props
const d = entry.data
const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)

// Strip any inbound `show-proto-sidebar` flag so we can force the chromeless
// player (sidebar hidden). Figma's player still draws its own device frame
// and prev/next/reset controls, which is exactly what we want here.
const prototypeEmbedSrc = d.prototype
  ? (() => {
      const cleanUrl = d.prototype.replace(/[?&]show-proto-sidebar=[^&]*/g, '')
      const sep = cleanUrl.includes('?') ? '&' : '?'
      const protoUrl = `${cleanUrl}${sep}show-proto-sidebar=0`
      return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(protoUrl)}`
    })()
  : null
---
<BaseLayout title={`${d.title}${t.exploration.titleSuffix}`} description={d.caption} ogImage={d.cover}>
  <Container class="pt-12">
    <a href="/#explorations" class="font-mono text-base text-text-secondary hover:text-text-primary transition">{t.exploration.backToExplorations}</a>
    <header class="mt-8 mb-12">
      <div class="flex flex-wrap gap-2 mb-4">{d.tags.map(t => <Tag>{t}</Tag>)}</div>
      <h1 class="font-display font-extrabold text-display-lg">{d.title}</h1>
      <div class="mt-3 font-mono text-base text-text-secondary">{d.year}</div>
      <p class="mt-6 max-w-2xl text-lg text-text-secondary">{d.caption}</p>
    </header>
  </Container>

  {prototypeEmbedSrc && (
    /* Full-bleed dark stage so Figma's device frame reads the way it does in
       Figma itself. h-[85vh] keeps the phone comfortably tall on desktop but
       clamps on short viewports; min-h-[560px] keeps it usable on mobile. */
    <section class="bg-[#0B0B0B]">
      <iframe
        src={prototypeEmbedSrc}
        title={d.prototypeTitle ?? d.title}
        loading="lazy"
        allowfullscreen
        class="block h-[85vh] min-h-[560px] w-full border-0"
      ></iframe>
    </section>
  )}

  {d.images.length > 0 && !prototypeEmbedSrc && (
    <Container class="pt-12">
      <div class="space-y-6">
        {d.images.map(img => (
          <div class="rounded-lg overflow-hidden bg-bg-secondary">
            <img src={img.src} alt={img.alt} class="w-full h-auto" loading="lazy" />
          </div>
        ))}
      </div>
    </Container>
  )}
</BaseLayout>
```

(Note: the `d.tags.map(t => <Tag>{t}</Tag>)` line shadows the outer `t` translations object inside that one arrow function — harmless since it's not used in that scope, but if it reads awkwardly rename the map variable to `tag`: `d.tags.map(tag => <Tag>{tag}</Tag>)`. Use the renamed version to avoid the shadowing entirely.)

- [ ] **Step 7: Create `src/pages/en/explorations/[slug].astro`**

Same as Step 6's file, but with import paths one level deeper (`../../../` instead of `../../`) and `localeEntries(all, 'en')` instead of `'id'`:

```astro
---
import { getCollection } from 'astro:content'
import BaseLayout from '../../../layouts/BaseLayout.astro'
import Container from '../../../components/layout/Container.astro'
import Tag from '../../../components/ui/Tag.astro'
import { localeEntries } from '../../../lib/content'
import { resolveLocale, useTranslations } from '../../../i18n/ui'

export async function getStaticPaths() {
  const all = await getCollection('explorations')
  return localeEntries(all, 'en').map(entry => ({ params: { slug: entry.data.slug }, props: { entry } }))
}

const { entry } = Astro.props
const d = entry.data
const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)

const prototypeEmbedSrc = d.prototype
  ? (() => {
      const cleanUrl = d.prototype.replace(/[?&]show-proto-sidebar=[^&]*/g, '')
      const sep = cleanUrl.includes('?') ? '&' : '?'
      const protoUrl = `${cleanUrl}${sep}show-proto-sidebar=0`
      return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(protoUrl)}`
    })()
  : null
---
<BaseLayout title={`${d.title}${t.exploration.titleSuffix}`} description={d.caption} ogImage={d.cover}>
  <Container class="pt-12">
    <a href="/en/#explorations" class="font-mono text-base text-text-secondary hover:text-text-primary transition">{t.exploration.backToExplorations}</a>
    <header class="mt-8 mb-12">
      <div class="flex flex-wrap gap-2 mb-4">{d.tags.map(tag => <Tag>{tag}</Tag>)}</div>
      <h1 class="font-display font-extrabold text-display-lg">{d.title}</h1>
      <div class="mt-3 font-mono text-base text-text-secondary">{d.year}</div>
      <p class="mt-6 max-w-2xl text-lg text-text-secondary">{d.caption}</p>
    </header>
  </Container>

  {prototypeEmbedSrc && (
    <section class="bg-[#0B0B0B]">
      <iframe
        src={prototypeEmbedSrc}
        title={d.prototypeTitle ?? d.title}
        loading="lazy"
        allowfullscreen
        class="block h-[85vh] min-h-[560px] w-full border-0"
      ></iframe>
    </section>
  )}

  {d.images.length > 0 && !prototypeEmbedSrc && (
    <Container class="pt-12">
      <div class="space-y-6">
        {d.images.map(img => (
          <div class="rounded-lg overflow-hidden bg-bg-secondary">
            <img src={img.src} alt={img.alt} class="w-full h-auto" loading="lazy" />
          </div>
        ))}
      </div>
    </Container>
  )}
</BaseLayout>
```

Also apply the `tag => <Tag>{tag}</Tag>` rename from Step 6 to the ID version's file for consistency.

- [ ] **Step 8: Build and verify**

Run: `npm run build`
Expected: succeeds. `dist/work/quick-transfer/index.html` and `dist/work/voucher-points-banner/index.html` exist (ID); `dist/en/work/` does not exist yet (no EN case studies yet — expected). `dist/explorations/exploration-01/index.html` through `-07` exist (ID); `dist/en/explorations/` does not exist yet.

Run: `npm test`
Expected: `tests/build-output.test.ts` passes (it only inspects `dist/index.html` and CSS, unaffected by this restructure). `tests/home-structure.test.ts` will FAIL now — its assertions expect the old English home copy, but `dist/index.html` is now Indonesian. That's expected; Task 16 fixes it. `tests/content.test.ts` passes.

- [ ] **Step 9: Commit**

```bash
git add src/content/case-studies src/content/explorations src/components/home/SelectedWork.astro src/components/home/ExplorationsGrid.astro src/pages/work/[slug].astro src/pages/en/work/[slug].astro src/pages/explorations/[slug].astro src/pages/en/explorations/[slug].astro
git commit -m "feat(i18n): split content collections into id/en, add EN routes"
```

---

### Task 11: Case-study components — locale-aware

**Files:**
- Modify: `src/layouts/CaseStudyLayout.astro`
- Modify: `src/components/case-study/NextProject.astro`
- Modify: `src/components/case-study/FigmaEmbed.astro`
- Modify: `src/components/case-study/ImageFull.astro`
- Modify: `src/components/case-study/Lightbox.astro`

- [ ] **Step 1: `CaseStudyLayout.astro`**

Add to the imports:

```astro
import { resolveLocale, useTranslations } from '../i18n/ui'
```

Add after the `accent`/`accentAlt` computation:

```astro
const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)
```

Replace `<BaseLayout title={`${d.title} — Case Study`} ...>` with `<BaseLayout title={`${d.title}${t.caseStudy.titleSuffix}`} ...>`.

- [ ] **Step 2: `NextProject.astro`**

Add to the imports:

```astro
import { resolveLocale, useTranslations } from '../../i18n/ui'
```

Add before the `<div class="mt-24">` markup:

```astro
const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)
```

Replace `Next project` with `{t.caseStudy.nextProject}` and `>View Details</span>` with `>{t.common.viewDetails}</span>`.

- [ ] **Step 3: `FigmaEmbed.astro`**

Add to the imports:

```astro
import { resolveLocale, useTranslations } from '../../i18n/ui'
```

Change the props line from:

```astro
const { url, title = 'Figma prototype', caption, indent = false } = Astro.props
```

to:

```astro
const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)
const { url, title = t.figmaEmbed.defaultTitle, caption, indent = false } = Astro.props
```

(Move the `lang`/`t` lines above the destructure since `title`'s default now references `t`.)

Replace `<span class="font-mono text-xs uppercase tracking-widest text-text-tertiary">Prototype</span>` with `{t.figmaEmbed.prototypeLabel}` and `Open in Figma ↗` with `{t.figmaEmbed.openInFigma}`.

- [ ] **Step 4: `ImageFull.astro`**

Add to the imports:

```astro
import { resolveLocale, useTranslations } from '../../i18n/ui'
```

Change:

```astro
const { src, alt, caption, label = 'Image', indent = false, mobile = false } = Astro.props
const indentClass = indent === 2 ? 'md:pl-20' : indent ? 'md:pl-8' : ''
const isPlaceholder = src.includes('placeholder')
const resolvedLabel = isPlaceholder ? 'Placeholder' : label
```

to:

```astro
const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)
const { src, alt, caption, label, indent = false, mobile = false } = Astro.props
const indentClass = indent === 2 ? 'md:pl-20' : indent ? 'md:pl-8' : ''
const isPlaceholder = src.includes('placeholder')
const resolvedLabel = isPlaceholder ? t.imageFull.placeholderLabel : (label ?? t.imageFull.imageLabel)
```

Replace `View full ↗` with `{t.imageFull.viewFull}`.

- [ ] **Step 5: `Lightbox.astro`**

Add frontmatter (the file currently has an empty `---\n---` block):

```astro
---
import { resolveLocale, useTranslations } from '../../i18n/ui'
const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)
---
```

Replace:

```astro
<button type="button" data-lightbox-close aria-label="Close" class="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white hover:opacity-80 transition">
  Close <span class="text-xl leading-none">×</span>
</button>
```

with:

```astro
<button type="button" data-lightbox-close aria-label={t.lightbox.close} class="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white hover:opacity-80 transition">
  {t.lightbox.close} <span class="text-xl leading-none">×</span>
</button>
```

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: succeeds. `dist/work/quick-transfer/index.html` still exists and now shows " — Studi Kasus" in its `<title>`.

Run: `grep -o ' — Studi Kasus' dist/work/quick-transfer/index.html | head -1`
Expected: prints the match.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/CaseStudyLayout.astro src/components/case-study/NextProject.astro src/components/case-study/FigmaEmbed.astro src/components/case-study/ImageFull.astro src/components/case-study/Lightbox.astro
git commit -m "feat(i18n): make case-study components locale-aware"
```

---

### Task 12: 404 page — locale-aware

**Files:**
- Modify: `src/pages/404.astro`

- [ ] **Step 1: Replace the file**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Container from '../components/layout/Container.astro'
import Button from '../components/ui/Button.astro'
import { resolveLocale, useTranslations } from '../i18n/ui'

const lang = resolveLocale(Astro.currentLocale)
const t = useTranslations(lang)
---
<BaseLayout title={t.notFound.pageTitle}>
  <Container class="min-h-[60vh] flex flex-col justify-center py-24">
    <div class="font-mono text-sm uppercase tracking-widest text-text-secondary mb-3">{t.notFound.errorLabel}</div>
    <h1 class="font-display font-extrabold text-display-lg mb-6">{t.notFound.heading}</h1>
    <p class="text-text-secondary text-lg mb-8 max-w-lg">{t.notFound.body}</p>
    <div><Button href="/" variant="primary">{t.notFound.backHome}</Button></div>
  </Container>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat(i18n): make 404 page locale-aware"
```

---

### Task 13: Rewrite home-structure tests for both locales

**Files:**
- Modify: `tests/home-structure.test.ts` (assert the Indonesian home page)
- Create: `tests/home-structure-en.test.ts` (assert the English home page)

- [ ] **Step 1: Create the EN test file as a copy of the current file, pointed at `dist/en/index.html`**

```bash
cp tests/home-structure.test.ts tests/home-structure-en.test.ts
```

Then in `tests/home-structure-en.test.ts`, change:

```ts
async function readHomeHtml(): Promise<string> {
  return readFile(join(DIST, 'index.html'), 'utf8').catch((err: unknown) => {
```

to:

```ts
async function readHomeHtml(): Promise<string> {
  return readFile(join(DIST, 'en', 'index.html'), 'utf8').catch((err: unknown) => {
```

Everything else in this file stays as-is — it's asserting the original English copy, which is exactly what `/en` now serves.

- [ ] **Step 2: Overwrite `tests/home-structure.test.ts` with Indonesian assertions**

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

describe('home page structure (id)', () => {
  let html: string

  beforeAll(async () => {
    html = await readHomeHtml()
  })

  describe('hero', () => {
    it('greets by name in a single h1', () => {
      const h1s = html.match(/<h1\b/g) ?? []
      expect(h1s).toHaveLength(1)
      expect(html).toContain('Halo!')
      expect(html).toContain('product designer')
    })

    it('drops the availability badge, CTAs, and scroll hint', () => {
      expect(html).not.toContain('Available for work')
      expect(html).not.toContain('See projects')
      expect(html).not.toContain('Scroll down')
    })

    it('shows the avatar as decorative, since the h1 already names him', () => {
      expect(html).toMatch(/<img[^>]+ficho-portrait\.png[^>]+alt=""/)
    })
  })

  describe('hero fog background', () => {
    it('mounts a decorative fog layer wrapping a canvas', () => {
      const layer = html.match(/<div[^>]*data-fog-layer[^>]*>/)?.[0]
      expect(layer).toBeDefined()
      expect(layer).toContain('aria-hidden="true"')
      expect(html).toMatch(/<div[^>]*data-fog-layer[^>]*>\s*<canvas/)
    })

    it('clips the fog to the hero and puts it behind the headline', () => {
      const hero = html.match(/<section[^>]*>(?=\s*<div[^>]*data-fog-layer)/)?.[0]
      expect(hero).toBeDefined()
      expect(hero).toContain('overflow-hidden')
      expect(hero).toContain('relative')
      expect(hero).toContain('isolate')
    })

    it('keeps the fog behind the headline rather than over it', () => {
      expect(html).toMatch(/\.fog-layer\[[^\]]+\][^}]*z-index:\s*-1/)
    })
  })

  describe('selected works', () => {
    it('uses the Indonesian heading and sub-copy', () => {
      expect(html).toContain('Karya pilihanku')
      expect(html).toContain('mata yang detail')
      expect(html).not.toContain('My selected works')
    })

    it('labels each card with a Lihat Detail pill', () => {
      expect(html).toContain('Lihat Detail')
      expect(html).not.toContain('View Details')
    })
  })

  describe('about', () => {
    it('runs the bio as one paragraph and drops the section badge pattern', () => {
      expect(html).toContain('Tentang aku')
      // Proves site.bio was joined into a single <p>: with two paragraphs a
      // closing and opening tag would sit between these two sentences.
      expect(html).toContain('compliance flows. Background Sistem Informasi')
    })

    it('shows the real portrait, described rather than decorative', () => {
      expect(html).toMatch(/<img[^>]+ficho-portrait\.png[^>]+alt="Potret Ficho"/)
    })

    it('keeps the skills and tools groups labelled', () => {
      expect(html).toContain('SKILL')
      expect(html).toContain('TOOLS')
      expect(html).toContain('Mixpanel')
      expect(html).not.toContain('Framer')
    })
  })

  describe('experience', () => {
    it('lists company and role per entry', () => {
      expect(html).toContain('Tempat aku pernah kerja')
      expect(html).toMatch(/Transfez (&#38;|&amp;|&) Jack/)
      expect(html).toContain('Great Giant Foods')
      expect(html).toContain('Corporate Communication')
    })

    it('renders every responsibility as a bulleted list item', () => {
      // Same content shape as the English version, just translated — the
      // item/label count is language-independent.
      const bullets = html.match(/aria-hidden="true">&bull;/g) ?? []
      expect(bullets).toHaveLength(16)
      expect(html).toMatch(/<li[^>]*>\s*<span[^>]*aria-hidden/)
      expect(html).toContain('Tanggung Jawab Umum')
      expect(html).toContain('<mark')
      expect(html).not.toContain('**')
    })

    it('drops the Currently badge', () => {
      expect(html).not.toContain('>Currently<')
      expect(html).not.toContain('>Sekarang<')
    })
  })

  describe('explorations', () => {
    it('drops the section heading and per-card captions', () => {
      expect(html).not.toContain('Visual experiments')
      expect(html).not.toContain('>Explorations<')
    })

    it('keeps every card reachable through one labelled action', () => {
      const actions = html.match(/aria-label="Buka [^"]+"/g) ?? []
      expect(actions).toHaveLength(7)
      expect(html.match(/data-proto-src="/g) ?? []).toHaveLength(7)
      const covers = html.match(/<img[^>]+\/images\/explorations\/[^>]*>/g) ?? []
      expect(covers).toHaveLength(7)
      covers.forEach(img => expect(img).toMatch(/alt="[^"]+"/))
    })
  })

  describe('contact and footer', () => {
    it('offers LinkedIn, WhatsApp and a mail link', () => {
      expect(html).toContain('Yuk, bikin sesuatu bareng')
      expect(html).toContain('mailto:fichoajiwibowo@gmail.com')
      expect(html).toContain('>LinkedIn<')
      expect(html).toContain('>WhatsApp<')
      expect(html).not.toContain('ficho@transfez.com')
    })

    it('reduces the footer to a centred copyright', () => {
      expect(html).toContain('Hak cipta dilindungi.')
      expect(html).not.toContain('Read.cv')
      expect(html).not.toContain('Dribbble')
    })
  })

  describe('header', () => {
    it('carries the section nav, the wordmark, and one CTA', () => {
      const header = html.match(/<header[\s\S]*?<\/header>/)?.[0]
      expect(header).toBeDefined()
      expect(header).toMatch(/<svg[^>]*viewBox="0 0 106 32"/)
      expect(header).toContain('fill="currentColor"')
      expect(html).not.toContain('src="/images/logo-ficho.svg"')
      expect(html).toContain('Hubungi Aku')
      expect(html).toContain('href="/#work"')
      expect(html).toContain('href="/#about"')
      expect(html).toContain('href="/#experience"')
      expect(html).toContain('href="/#explorations"')
      expect(html).not.toContain('Get in touch')
    })

    it('offers the ID/EN language switcher', () => {
      expect(html).toMatch(/>ID<\/a>/)
      expect(html).toMatch(/>EN<\/a>/)
      expect(html).toMatch(/href="\/en"/)
    })

    it('sticks — which is only safe while the bar stays opaque', () => {
      const header = html.match(/<header[^>]*>/)?.[0]
      expect(header).toBeDefined()
      expect(header).toContain('sticky')
      expect(header).toContain('z-40')
      expect(header).toContain('var(--color-bg-primary)')

      const bar = html.match(/<header[\s\S]*?<div[^>]*class="[^"]*h-\[72px\][^"]*"/)?.[0]
      expect(bar).toContain('var(--color-bg-elevated)')
    })

    it('draws the wordmark and CTA inside a bordered pill, as Figma does', () => {
      const bar = html.match(/<header[\s\S]{0,600}?<div[^>]*class="[^"]*h-\[72px\][^"]*"/)?.[0]
      expect(bar).toBeDefined()
      expect(bar).toContain('rounded-full')
      expect(bar).toContain('stroke-gradient')
      expect(bar).toContain('var(--color-bg-elevated)')
      expect(bar).not.toMatch(/bg-\[(linear-gradient\()?#[0-9a-fA-F]{3,8}/)
    })
  })
})
```

- [ ] **Step 3: Run both files**

Run: `npm run build && npx vitest run tests/home-structure.test.ts tests/home-structure-en.test.ts`
Expected: both PASS. If the ID file fails on the bullet count (16) or a specific string, open `dist/index.html` and check the actual rendered text against `src/content/site.ts`'s `perLang.id.experience` — fix whichever is wrong (test or content), they must agree.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all tests pass (`build-output.test.ts`, `content.test.ts`, `home-structure.test.ts`, `home-structure-en.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add tests/home-structure.test.ts tests/home-structure-en.test.ts
git commit -m "test(i18n): assert Indonesian home copy at / and English copy at /en"
```

---

### Task 14: Translate case-study MDX content to English

**Files:**
- Create: `src/content/case-studies/en/01-quick-transfer.mdx`
- Create: `src/content/case-studies/en/02-voucher-points-banner.mdx`

- [ ] **Step 1: Translate `01-quick-transfer.mdx`**

Read `src/content/case-studies/id/01-quick-transfer.mdx` in full. Write `src/content/case-studies/en/01-quick-transfer.mdx` with:
- Identical frontmatter keys, `slug: "quick-transfer"` (same slug as the ID file — this is what makes `getNextItem`/`NextProject` line up across locales), same `cover`/`thumbnail`/image paths, same `brandColor`, same `year`/`duration`/`tags` structurally (tag *values* like "Product Design", "Fintech B2B", "Web Portal" can stay in English as they already are).
- Translate every prose field (`title`, `summary`, `overview`, `snapshot[].value` where it's descriptive text, `team` role descriptions, `deliverables`) and the full MDX body (every `<Section>`, `<Quote>`, `<Metrics>` text) into casual, plain English — short sentences, everyday words, no jargon beyond terms already used in the source (KYC, batch transfer, etc. stay as-is since they're domain terms, not translation targets).
- Keep every `import` line and component usage (`<PartHeader>`, `<Section>`, `<ImageFull>`, `<ImageGrid>`, `<FigmaEmbed>`, `<Quote>`, `<Metrics>`) structurally identical — only their text content/props change, not the component tree shape. Image `src` paths and `alt` text: translate `alt` text, keep `src` unchanged.
- **Bold** (`***word***` / `**word**`) emphasis should land on the same *kind* of information in the translation (numbers, product names), even if the exact phrase differs.

- [ ] **Step 2: Translate `02-voucher-points-banner.mdx`**

Read `src/content/case-studies/id/02-voucher-points-banner.mdx` in full and apply the same process as Step 1 to produce `src/content/case-studies/en/02-voucher-points-banner.mdx`, keeping `slug: "voucher-points-banner"`.

- [ ] **Step 3: Build and verify both EN case studies render**

Run: `npm run build`
Expected: succeeds. `dist/en/work/quick-transfer/index.html` and `dist/en/work/voucher-points-banner/index.html` now exist.

Run: `grep -c '<h1' dist/en/work/quick-transfer/index.html dist/en/work/voucher-points-banner/index.html`
Expected: `1` for each file.

- [ ] **Step 4: Spot-check the "Next project" link crosses correctly**

Run: `grep -o 'href="/en/work/[a-z-]*"' dist/en/work/quick-transfer/index.html`
Expected: prints `href="/en/work/voucher-points-banner"` (there are only two case studies, so each links to the other).

- [ ] **Step 5: Commit**

```bash
git add src/content/case-studies/en
git commit -m "content(i18n): translate case studies to English"
```

---

### Task 15: Translate exploration MDX content to English

**Files:**
- Create: `src/content/explorations/en/01-exploration.mdx` … `07-exploration.mdx`

- [ ] **Step 1: Translate all 7 files**

For each `src/content/explorations/id/0N-exploration.mdx`, read it in full and write `src/content/explorations/en/0N-exploration.mdx` with:
- Identical frontmatter structure and `slug` (same slug as the ID file), identical `year`, `images[].src`, `prototype`/`liveUrl` URLs (don't translate URLs).
- Translate `title`, `tags` (only if they're descriptive Indonesian phrases — most exploration tags like "Mobile App", "Dashboard" are already English; leave those), `caption`, `images[].alt`, and `prototypeTitle` into casual plain English.

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: succeeds. `dist/en/explorations/exploration-01/index.html` through `exploration-07/index.html` all exist.

Run: `for i in 01 02 03 04 05 06 07; do test -f "dist/en/explorations/exploration-$i/index.html" && echo "ok $i" || echo "MISSING $i"; done`
Expected: `ok 01` through `ok 07`, no `MISSING` lines.

- [ ] **Step 3: Commit**

```bash
git add src/content/explorations/en
git commit -m "content(i18n): translate explorations to English"
```

---

### Task 16: Full verification and sitemap check

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, 0 failures.

- [ ] **Step 2: Type-check the whole project**

Run: `npx astro check`
Expected: 0 errors (warnings about unrelated pre-existing issues, if any, are out of scope).

- [ ] **Step 3: Verify the sitemap includes both locale trees**

Run: `grep -o '<loc>[^<]*</loc>' dist/sitemap-0.xml | grep '/en/' | head -5`
Expected: several `/en/...` URLs are listed (home, both case studies, all 7 explorations).

Run: `grep -c '<loc>' dist/sitemap-0.xml`
Expected: roughly double the pre-i18n count (every ID page now has an EN counterpart, except `/404` which isn't in the sitemap either way).

- [ ] **Step 4: Manual click-through**

Start a local preview and click through both language trees at least once each: home → a case study → next project → back to home → switch language → repeat. Confirm the language switcher always lands on the equivalent page in the other language (not the other language's home page), and that `<html lang>` matches the visible copy in each case (view-source or devtools).

Run: `npm run preview`

- [ ] **Step 5: Final commit (if Step 4 turned up fixes) and hand back to main**

If everything is clean, this task needs no commit — Tasks 1-15 already captured all the work. Report the branch is ready for the user to review, merge, or open a PR (per `superpowers:finishing-a-development-branch`).

---

## Summary of new/changed public routes

| Route (ID, default) | Route (EN) |
|---|---|
| `/` | `/en` |
| `/work/quick-transfer` | `/en/work/quick-transfer` |
| `/work/voucher-points-banner` | `/en/work/voucher-points-banner` |
| `/explorations/exploration-01` … `-07` | `/en/explorations/exploration-01` … `-07` |
| `/404` (locale resolved from path prefix at request time) | — |
