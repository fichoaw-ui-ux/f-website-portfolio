# Page spec — Home (redesign)

Only what Figma can't express: structure, responsive behavior, interactions,
intentional exceptions. Values come from Figma and `src/styles/tokens.css`.

## Global
- Content width: 1040px at the 1440 frame (gutters 200 / 200) | mobile 402 frame, gutters 24
- Breakpoints: Figma frames are 402 (mobile) and 1440 (desktop). Switch point: **open question**
- Fonts: Aileron only (heading + body), weights 400 / 600
- Theme: dark page (#252525, `--color-neutral-900`) with light cards; white top band behind the avatar on desktop

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
### Tab bar
- Navigation, not content switching: every section stays on the page. Clicking a
  tab scrolls to its section; the active tab follows the section currently in
  view (scroll-spy). Decided by Ficho.
- Mobile: tabs are wider than the 402 frame (599px) — **assumed** horizontal scroll.

### Hero ↔ Compact profile
- The "scrolled" frames show the hero collapsing into a compact profile bar with
  the tab bar under it. **Assumed** sticky header that appears after the hero
  scrolls out; trigger and transition are open questions.

### Experience
- Desktop shows entries expanded with bullets; mobile shows them collapsed with a
  chevron. **Assumed** accordion (expand/collapse). Default state per breakpoint
  is an open question.

### Study Case / Exploration
- Card images are placeholders in Figma; content comes from the existing
  case-study and exploration collections.

## Open questions
- Breakpoint where the mobile layout switches to desktop.
- Sticky compact header: when it appears and how it transitions.
- Experience accordion default state (desktop expanded, mobile collapsed?).
- Content mismatch: Transfez dates and role (desktop "UI/UX Designer, October
  2022 – September 2025"; mobile "UI/UX Designer, October 2025 – Now" and Jack
  Finance "Associate UI/UX Designer"). Which is correct?
- Background video / fog / glass from the current site: dropped in the redesign?

## Intentional exceptions
- Hero top band (white, 164px) and section dividers are full-bleed; content sits in the 1040 band.
