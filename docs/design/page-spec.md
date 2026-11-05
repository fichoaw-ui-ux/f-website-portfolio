# Page spec — Home (redesign)

Only what Figma can't express: structure, responsive behavior, interactions,
intentional exceptions. Values come from Figma and `src/styles/tokens.css`.

## Global
- Content width: max 1040px (gutters 200 / 200 at the 1440 frame, shrinking on
  narrower desktops) | mobile 402 frame, gutters 24
- Breakpoint: desktop layout from **1024px**; below that the mobile layout.
  (The current site flips at 1201px; the redesign replaces that.)
- Fonts: Aileron only (heading + body), weights 400 / 600
- Theme: dark page (#252525, `--color-neutral-900`) with light cards; white top band behind the avatar on desktop
- Background: the existing storm video (`BackgroundVideo`, `public/videos/bg-storm-light*`)
  keeps playing behind the page, under a #252525 scrim at 0.88 (ASSUMED; tune
  `--bg-video-scrim-opacity` in global.css) so the page still reads as Figma's
  #252525. Intentional exception (Ficho). Done: `<BaseLayout redesign>` sets
  `data-redesign`; redesigned sections have no fill of their own; the legacy light
  patches and grain are off there. The tab bar gets a #252525/88 + blur surface
  only while stuck; the compact header always has it.

## Section map
Figma file **Draft** (`OXwf8tiGQHyIw6XX4ZhSrj`). Refer to sections by name.

- Full page — desktop: `8:116` | desktop scrolled: `8:384` | mobile: `8:624` | mobile scrolled: `8:877`

| Section | Mobile node | Desktop node | Desktop scrolled |
|---|---|---|---|
| Hero / Profile | `8:627` | `8:117` | — |
| Compact profile (sticky) | `8:1092` (scrolled frame) | — | `8:594` |
| Tab bar | `8:662` (scrolled: `8:1071`) | `8:156` | `8:603` |
| Experience | `8:684` | `8:177` | `8:386` |
| Skills & Tools | `8:753` | `8:247` | `8:456` |
| Study Case | `8:798` | `8:290` | `8:499` |
| Exploration | `8:831` | `8:334` | `8:543` |
| Contact | `8:837` | `8:346` | `8:555` |
| Footer | `8:874` | `8:382` | `8:591` |

Mobile layers still have generic names (`Frame 15978804xx`); pairing is by order.
Same design in "Portfolio Asset" (`ARRQteKJDZ3K0THAdoyH0h`): desktop `9225:11713`, mobile `9225:12221`.

## Sections
### Hero — done (`src/components/home/Hero.astro`)
- Measured equal to Figma at 1440 and 402 (0px off on every `data-figma` element).
- Mobile order: photo → name → bio → meta → divider → socials; desktop: identity | bio.
- ASSUMED, approved: mobile white band 72px (Figma 128 incl. 56 status bar), mobile
  bottom padding 55 (24 + 31 gap before the tab bar), 1024–1440 content max 1040
  with ≥24px gutters, socials use `site.ts` links with no hover (focus ring only),
  one SVG per icon scaled per breakpoint.
- Not in tokens: desktop name 48/1.25, mobile photo radius 16, mobile meta text 12/1.
- Photo is decorative (`alt=""`) — the h1 right after it is the name.
- Figma rounds percent line heights to whole px (14 × 1.6 → 22). `--text-body-sm`
  uses 22px; check other fractional styles the same way.

### Tab bar — done, not sticky yet (`src/components/home/TabBar.astro`)
- Navigation, not content switching: every section stays on the page. Clicking a
  tab scrolls to its section; the active tab follows the section currently in
  view (scroll-spy). Decided by Ficho.
- Measured equal to Figma at 1440 (68.4 tall, tabs 260 × 66.4) and 402 (56 tall).
  Mobile tab widths hug the rendered text: 146/155/145/149 vs Figma 147/156/146/150.
- Mobile: tabs scroll horizontally (scrollbar hidden); the active tab is scrolled
  into view inside the bar.
- Targets: Experience → `#experience`, Skills & Tools → `#skills`,
  Study Case → `#work`, Exploration → `#explorations`.
- The scrolled desktop frame sets the tabs in Inter; built in Aileron from the
  default frame (`8:156`) styles.

### Compact header — done (`src/components/home/CompactHeader.astro`)
- Fixed at the top, hidden (and inert) while the hero is on screen; slides/fades in
  (300ms, off under reduced motion) when the tab bar sticks under it. The tab bar
  is sticky at 80 (mobile) / 84 (desktop). Sections scroll to `--sticky-offset`
  (136 / 152.4) so tab clicks land just under both bars.
- Measured equal to Figma: desktop 84 (photo 56, name 20/30, handle 15/22.5,
  Contact 48 tall), mobile 80 (photo 64 r16, name 18/29, handle 14/1, Contact 38).
  Figma's Inter text is rendered in Aileron at Figma's sizes.
- Name text "Ficho Aji W" as designed (Ficho). Contact links to `#contact`.
- **No language switch** — set aside by Ficho for now. The home pages no longer
  render the legacy header (`showHeader={false}`); /id stays reachable by URL.
- Default language is English: `/` is EN, `/id` is ID, and `resolveLocale` falls
  back to EN. The 404 page is in English.

### Experience — done (`src/components/home/Experience.astro`)
- Measured equal to Figma: desktop with both jobs open (section 1141, Transfez 340,
  Jack Finance 513), mobile closed (398) and mobile open (hidden layers 8:705 /
  8:732: bullets 12/19, rows gap 12).
- Content: Transfez + Jack Finance only (`site.jobs`); General Responsibilities and
  the intern role moved to `experienceArchive`, not shown (Ficho). Key numbers stay
  semibold via `**x**` (Ficho, not in Figma).
- Desktop role-badge strokes are 1.33px inset shadows (borders round down to 1px).
- Accordion, one entry open at a time: the top entry (Transfez) starts open on
  every breakpoint; opening another entry closes the one that was open.
  (Differs from the static Figma frames, which show desktop all open and
  mobile all closed — decided by Ficho.)
- Copy follows the mobile frame: Transfez — UI/UX Designer, October 2025 – Now;
  Jack Finance — Associate UI/UX Designer, October 2022 – September 2025.
  The desktop frame's duplicated dates are a copy error.

### Skills & Tools — done (`src/components/home/SkillsTools.astro`, `#skills`)
- Chip lists follow the mobile frame on every breakpoint (Ficho): 9 skills with
  Information Architecture last, 10 tools with "Claude", no Mixpanel.
- Mobile measured equal to Figma (517). Desktop matches Figma per element; the
  section is 461 instead of 407 because the 9th skill wraps to a 4th row (the
  desktop frame only has 8).
- Replaces the legacy About section (deleted; bio and photo are in the hero).
  Legacy header nav "About" now reads "Skills" / "Skill" and links to `#skills`.

### Study Case — done (`src/components/home/StudyCase.astro`, `#work`)
- Measured equal to Figma: desktop rows (cover 504×360, content centred, 40+1+40
  dividers; section 1058 with 2 studies), mobile cards (532 each, section 1255).
- Featured case studies from the collection (2; Figma's 3rd card is a duplicate).
  Real thumbnails fill Figma's placeholder covers. Tags exclude "Product Design"
  (Ficho), so Voucher shows its real tags (Fintech, Mobile App, Remittance), not
  the "Fintech B2B, Web Portal" copied in Figma.
- Replaces the legacy SelectedWork sticky-stack (deleted).
- Covers live in `src/assets/case-studies/` and go through astro:assets (content
  schema `image()`): WebP at the rendered widths (home 302/504 at 1×/2×, case
  study header up to 1088, next-project card up to 700). Home downloads 3–15 KB
  per cover instead of the 1.3 / 2.5 MB 7680×4800 PNGs. og:image is a 1200px JPG.

### Exploration — done (`src/components/home/Explorations.astro`, `#explorations`)
- Measured equal to Figma: desktop 3-column grid of 330.7×420 cards (gap 24, r32;
  section 1565), mobile 354×400 cards (gap 24; 3095 with all 7).
- All 7 explorations on every breakpoint (Ficho; Figma's 9 / 3 are placeholders).
  Covers fill the cards, in colour (the legacy grayscale hover and staggered
  columns are gone).
- Not in Figma, kept (Ficho): "See Prototype" / "Visit Live Site" pills, styled
  like View Details, 16px from the card edges (ASSUMED). See Prototype opens the
  Figma modal, as before.
- Images moved to `src/assets/explorations/` (schema `image()` for cover and
  images): 15–42 KB WebP per card instead of 2–6.5 MB PNGs; og:image 1200px JPG.

### Contact — done (`src/components/home/Contact.astro`, `#contact`)
- Measured equal to Figma: desktop 523 (headline 520 | list 424, gap 96, centred),
  mobile 593. Each row (Email, WhatsApp, LinkedIn) is one link.
- Figma's "LinkedInd" label is a typo → "LinkedIn". The e-mail in the copy is Aileron
  Bold + underline on desktop (Aileron 700 now loaded), SemiBold on mobile.
- Indonesian heading keeps the existing translation ("Terbuka untuk peluang kerja
  dan freelance").

### Footer — done (`src/components/layout/FooterRedesign.astro`)
- Measured equal to Figma: desktop 83 with a 1px top rule, text left; mobile 74, no
  rule, text centred.
- Only on redesigned pages (`<BaseLayout redesign>`, both home pages). Case study and
  exploration pages keep the legacy footer until they are redesigned.

## Intentional exceptions
- Study case and exploration covers are black & white and turn to colour (with a
  1.02 zoom, 500ms) while their card is hovered — kept from the previous design
  (Ficho). Exploration pills stack vertically, full width. The profile photo has no
  hover effect for now: the Figma photo is already black & white (Ficho: later).
- Hero top band (white, 164px) and section dividers are full-bleed; content sits in the 1040 band.
- Storm video behind the page (see Global → Background). Not in Figma.
- Experience accordion opening state (see Experience). Not in Figma.
- Glass surfaces and the fog effect from the previous design are not used in redesigned sections.
