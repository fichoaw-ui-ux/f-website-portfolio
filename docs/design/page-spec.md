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
  keeps playing behind the page, muted under a semi-transparent #252525 layer so
  the page still reads as the design's #252525. Intentional exception (Ficho).

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

### Tab bar
- Navigation, not content switching: every section stays on the page. Clicking a
  tab scrolls to its section; the active tab follows the section currently in
  view (scroll-spy). Decided by Ficho.
- Mobile: tabs are wider than the 402 frame (599px) — **assumed** horizontal scroll.

### Hero ↔ Compact profile
- The "scrolled" frames show the hero collapsing into a compact profile bar with
  the tab bar under it. Confirmed: sticky header that appears after the hero
  scrolls out, with a smooth transition (Ficho: "yang smooth saja").
  Respect `prefers-reduced-motion`.

### Experience
- Accordion, one entry open at a time: the top entry (Transfez) starts open on
  every breakpoint; opening another entry closes the one that was open.
  (Differs from the static Figma frames, which show desktop all open and
  mobile all closed — decided by Ficho.)
- Copy follows the mobile frame: Transfez — UI/UX Designer, October 2025 – Now;
  Jack Finance — Associate UI/UX Designer, October 2022 – September 2025.
  The desktop frame's duplicated dates are a copy error.

### Study Case / Exploration
- Card images are placeholders in Figma; content comes from the existing
  case-study and exploration collections.

## Intentional exceptions
- Hero top band (white, 164px) and section dividers are full-bleed; content sits in the 1040 band.
- Storm video behind the page (see Global → Background). Not in Figma.
- Experience accordion opening state (see Experience). Not in Figma.
- Glass surfaces and the fog effect from the previous design are not used in redesigned sections.
