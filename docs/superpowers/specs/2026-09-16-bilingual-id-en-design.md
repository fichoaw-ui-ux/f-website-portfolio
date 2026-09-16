# Bilingual site (ID / EN)

## Problem

The site currently mixes languages inconsistently: UI copy (nav, hero, about,
footer, `site.ts`) is English, while case-study and exploration content
(MDX) is Indonesian. We want a genuine bilingual site — every page available
in both Indonesian and English, with a switcher, not a single mixed-language
version.

## Scope

Full bilingual: all UI strings, `site.ts` content (bio, tagline, role, nav,
experience), and all case-study/exploration MDX content get ID and EN
versions. Claude translates the Indonesian MDX prose into casual, plain
English (avoid jargon and rare words). Default locale is Indonesian at the
unprefixed root (`/`); English lives under `/en/...`.

Not translated: image assets, brand colors, tool/skill names (`Figma`,
`Notion`, etc.), contact links, and proper nouns (company names, product
names).

## 1. Routing

`astro.config.mjs` gets Astro's built-in i18n config:

```js
i18n: {
  locales: ['id', 'en'],
  defaultLocale: 'id',
  routing: { prefixDefaultLocale: false },
}
```

- `/`, `/work/quick-transfer`, `/explorations/exploration-01` → Indonesian
  (unprefixed, matches current URLs — no redirects needed for existing links)
- `/en`, `/en/work/quick-transfer`, `/en/explorations/exploration-01` →
  English

Astro's i18n config provides `Astro.currentLocale` and
`getRelativeLocaleUrl()`, but page **files** still need to exist per locale.
Each page's body moves into a shared component that takes a `lang: 'id' |
'en'` prop; thin per-locale files under `src/pages/` and `src/pages/en/`
render that shared component:

| Route | ID file (existing, becomes thin wrapper) | EN file (new) |
|---|---|---|
| Home | `src/pages/index.astro` | `src/pages/en/index.astro` |
| Case study | `src/pages/work/[slug].astro` | `src/pages/en/work/[slug].astro` |
| Exploration | `src/pages/explorations/[slug].astro` | `src/pages/en/explorations/[slug].astro` |
| 404 | `src/pages/404.astro` (stays ID; Astro serves it for unmatched paths in both locale trees) | — |

## 2. Content collections

`case-studies` and `explorations` restructure into locale subfolders so each
MDX file gets a real translated sibling with the same `slug` value:

```
src/content/case-studies/id/01-quick-transfer.mdx
src/content/case-studies/en/01-quick-transfer.mdx
src/content/case-studies/id/02-voucher-points-banner.mdx
src/content/case-studies/en/02-voucher-points-banner.mdx

src/content/explorations/id/01-exploration.mdx ... 07-exploration.mdx
src/content/explorations/en/01-exploration.mdx ... 07-exploration.mdx
```

The existing glob loader pattern (`**/*.{md,mdx}`) already matches nested
folders, so no loader change is needed — entry IDs become `id/01-...` and
`en/01-...`. `getStaticPaths` in each `[slug].astro` filters entries by the
`id/` or `en/` prefix before mapping to params.

Frontmatter fields that are prose (`title`, `summary`, `overview`, `caption`,
`snapshot[].label/value`, deliverables, team role labels where descriptive)
get translated per locale. Fields that are identifiers or shared facts
(`slug`, image paths, `year`, `tags` that are proper nouns like "Figma",
`brandColor`) stay identical between the two files.

## 3. UI strings

- New `src/i18n/ui.ts`: an `id`/`en` dictionary plus a `useTranslations(lang)`
  helper, covering the ~25 hardcoded strings found in `Header`, `Footer`,
  `Hero`, `About`, `Contact`, `SelectedWork`, `Experience`, `404`,
  `NextProject`, `ExplorationsGrid`, `Lightbox`, `FigmaEmbed`, `ImageFull`
  (button labels, empty states, aria-labels, section headings).
- `src/content/site.ts` becomes locale-aware: `getSite(lang)` returns the
  same shape per language, translating `role`, `tagline`, `bio`, `nav[].label`,
  and `experience[].sections[].label` / `.items`. `name`, `email`, `whatsapp`,
  `socials[].label`, `skills`, `tools` stay identical across locales.
- `BaseLayout.astro`'s `<html lang="en">` becomes dynamic from
  `Astro.currentLocale`.
- Every component currently importing `{ site }` directly switches to
  receiving `lang` (or the resolved `site`/`t` object) from its caller, so
  each locale's page wrapper is the single place that resolves language.

## 4. Language switcher

A small "ID / EN" toggle added to `Header.astro`'s existing 3-slot layout
(desktop: next to the section nav / Contact Me pill; mobile: inside the
`<details>` menu). It computes the counterpart URL by swapping the locale
segment of the current path via `getRelativeLocaleUrl`, so switching
language on a case-study page stays on that same case study in the other
language.

## 5. SEO

- `hreflang` alternate `<link>` tags in `BaseLayout.astro`'s `<head>`
  (`id` ⇄ `en`, plus `x-default` pointing at the Indonesian root).
- `@astrojs/sitemap`'s `i18n` option gets wired to `{ defaultLocale: 'id',
  locales: { id: 'id', en: 'en' } }` so the sitemap emits both locale trees.
- Page `<title>` / `description` strings (currently English-only templates
  like `` `${d.title} — Case Study` ``) become locale-aware suffixes.

## Out of scope

- Auto-detecting the visitor's browser language / redirecting based on
  `Accept-Language`.
- Persisting the user's chosen language across sessions (cookie).
- Translating file names, image alt-text templates beyond what's listed
  above, or third-party embed content (Figma prototypes).
