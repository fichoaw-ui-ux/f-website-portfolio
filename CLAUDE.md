# Design implementation rules

Figma is the source of truth for how this site looks. Translate the design into
code; don't reinterpret it.

## Sources
- Figma file: **Draft** — https://www.figma.com/design/OXwf8tiGQHyIw6XX4ZhSrj/Draft?node-id=0-1 (page "Page 1").
  Spacing and radius are bound to local variables there; colours and text styles
  come from the original library. ("Portfolio Asset" `ARRQteKJDZ3K0THAdoyH0h`,
  page Main `8965:1737`, holds the same design but its Figma MCP quota is used up.)
- Section node IDs: `docs/design/page-spec.md`
- Tokens: `src/styles/tokens.css` (redesign block at the top; the legacy block
  below it is being phased out — don't use legacy tokens in redesigned code)
- Stack: Astro 7, Tailwind CSS 4 (`@tailwindcss/vite`, `@theme` in
  `src/styles/global.css` → `tokens.css`), Aileron via `@fontsource/aileron`,
  `motion` for animation. Bilingual: EN at `/`, ID under `/id/`.

## Workflow (per section)
1. Fetch only the requested section node (design context + screenshot + variables).
   Sparse response → fetch child nodes individually.
2. Before coding, write a value sheet: every spacing, size, type and color
   value from Figma, unrounded, with the matching token or "not in tokens".
3. Implement one section as one component, inside the shared container.
4. Render at the Figma frame width (1440 desktop, 402 mobile), measure, compare
   with the value sheet, fix differences.

## Values
- Never round Figma values to framework defaults (18px stays 18px).
- Use tokens on exact match only; otherwise the exact value with a comment
  `/* not in tokens: Figma <value> */`.
- Tailwind: no default spacing/colour classes for design values (`gap-4`,
  `text-gray-400`). Use token utilities (`text-neutral-600`, `text-title-lg`) or
  `gap-(--space-24)` / `rounded-(--radius-32)`; non-token values as arbitrary
  values with the exact number (`gap-[18px]`).
- Don't add colors, shadows, radii, borders, fonts or effects not in the design.
- One typeface: Aileron. Figma layers set in TypeFezStd or Inter render in Aileron.
- Auto layout → flex/grid. Absolute positioning only for real overlays.
- Mark key elements with `data-figma="<layer path>"`.

## Scope
- Change only the section requested.
- If something in the design looks off, ask — don't "fix" it silently.
- Indonesian copy: casual-professional register, not slang.
