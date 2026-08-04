# Hero Fog Background — Design

**Date:** 2026-08-04
**Origin:** VANTA.FOG (`vanta@0.5.24`, `dist/vanta.fog.min.js`), which in turn builds on Morgan McGuire's value noise (shadertoy `4dS3Wd`).
**Decision on dependencies:** none added. The effect is reimplemented on raw WebGL using Vanta's own GLSL verbatim.

## Goal

Give the home hero a slow monochrome fog behind the headline. Motion should read as depth in the surface, not as an effect layered on top of it.

Scope is the hero section only. Every other home section, the case study pages, the exploration pages, and 404 are untouched.

## Why not the library

`VANTA.FOG` is one fullscreen fragment shader. Inspecting the dist bundle, the only three.js surface it touches is `Color`, `Scene`, `Mesh`, `PlaneGeometry`, `ShaderMaterial`, `WebGLRenderer`, `Vector2`, and `Vector3` — no geometry class removed in modern three, so `vanta@0.5.24` would in fact still run against `three@0.185`. It is rejected on weight, not compatibility: ~110–150KB gzip of renderer for a shader that needs a quad, a clock, and six uniforms.

The GLSL is copied unchanged, so the rendered result is the same field Vanta produces. What is not copied is Vanta's harness — the mouse tracking, gyro handling, FPS meter, and per-frame `isOnScreen()` scan are all dropped.

One detail from the source worth recording: `vanta.fog` declares a `uniform vec2 iMouse` but never reads it in `main()`. FOG is not mouse-reactive. That uniform is not carried over, and no pointer listeners are added.

## Component

New file: `src/components/ui/FogBackground.astro`. It renders

```
<div class="fog-layer" aria-hidden="true"><canvas data-fog></canvas></div>
```

- container: `position: absolute; inset: 0; z-index: -1; pointer-events: none`
- canvas: `display: block; width: 100%; height: 100%`
- container carries `mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%)` (plus `-webkit-mask-image`) so the field dissolves into the page instead of ending on a straight edge

All of it lives in the component's own scoped `<style>` block rather than in Tailwind classes. The positioning and the mask are one idea, and splitting them across a `class` attribute and a stylesheet would hide that.

The WebGL setup lives in the component's own `<script>` tag, which Astro bundles and scopes to pages that use the component. The component takes no props; every tunable value is a CSS custom property (see *Colour*).

`src/components/home/Hero.astro` changes in two ways: its `<section>` gains `relative isolate overflow-hidden`, and `<FogBackground />` becomes its first child. `isolate` matters — see *Layering*.

## Layering

`global.css` already paints two fixed texture layers inside `body`'s stacking context: `body::before` at `z-index: -2` (radial light patches) and `body::after` at `z-index: -1` (SVG grain). Negative-z-index children of a stacking context paint before in-flow content, so a canvas inside `main` paints **above** both.

The shader writes `gl_FragColor.a = 1.0`. The fog is therefore opaque and hides the gradients and the grain within the hero band; both remain intact in every other section. This is intended. The fog's own fbm already supplies grain and depth, and compositing three noise fields produces mud rather than richness. An alpha-blended variant was considered and rejected for that reason.

The seam is handled by two facts working together: `--fog-base` *is* `--color-bg-primary` — declared as `var(--color-bg-primary)`, so the two cannot drift — which makes the flat parts of the field indistinguishable from the page; and the bottom-edge mask fades whatever is left.

## Colour

Four custom properties, declared in a `:root` block in `src/styles/tokens.css` — deliberately **outside** that file's `@theme` block. They sit in `tokens.css` rather than `global.css` so that `--fog-base` is adjacent to the `--color-bg-primary` it has to match. The script reads them with `getComputedStyle(document.documentElement)` and parses each `#rrggbb` into normalised RGB, so the palette stays a single source of truth in CSS.

The reason for avoiding `@theme` is the opposite of the obvious one, and an earlier draft of this spec had it backwards. It is *not* that `@theme` would emit unwanted `bg-fog-*` utilities — it would not: `--fog-*` is outside Tailwind's `--color-*` namespace, and `global.css` passes `source(none)`, so no candidates are scanned. The hazard is that Tailwind 4 emits only the theme variables some utility references, so variables read solely from JavaScript are tree-shaken out of the build. Moving this block into `@theme` makes every `--fog-*` declaration vanish from `dist`, and the fog degrades to a flat background with nothing to indicate why. This was verified empirically, not reasoned about.

| Token | Value | Role | Vanta default replaced |
|---|---|---|---|
| `--fog-base` | `var(--color-bg-primary)` | dominant field | `#FFEBEB` |
| `--fog-lowlight` | `#000000` | deepest troughs | `#2D00FF` |
| `--fog-midtone` | `#1A1A1A` | cloud body | `#FF1900` |
| `--fog-highlight` | `#2E2E2E` | brightest peaks | `#FFC300` |

Scalars: `--fog-blur-factor: 0.6` (Vanta's default), `--fog-zoom: 1`, `--fog-speed: 0.55`. Speed is roughly half of Vanta's `1` — at the default rate the field visibly drifts behind an 88px headline, which reads as a widget.

Contrast: the brightest pixel the field can produce is `#2E2E2E`, against which `#FFFFFF` measures 13.5:1. Hero text clears AAA at every point in the animation, so no scrim is needed behind the headline. This bound is a requirement, not an observation — raising `--fog-highlight` past roughly `#5A5A5A` would drop white text under 7:1 and must be accompanied by a scrim.

## Shader

Vertex shader: a single `attribute vec2 a_position`, passed straight to `gl_Position`. Two triangles covering clip space `[-1, 1]`. No matrices, no camera.

Fragment shader: Vanta's `vanta.fog` fragment source verbatim, minus the unused `iMouse` declaration, with a header comment attributing Vanta and shadertoy `4dS3Wd`. It uses six-octave fbm over a hash-based value noise, samples that field twice for domain warping, and mixes base → lowlight → midtone → highlight.

Uniforms: `iResolution` (vec2, device pixels), `iTime` (float, seconds), `blurFactor`, `zoom`, and the four `vec3` colours. Colours and scalars are uploaded once at init; only `iTime` and `iResolution` change afterwards.

Time advances the way Vanta advances it, so the visual pace matches: accumulate elapsed frames at 60fps (`dt / (1000/60)`), clamp each step to `[0.2, 5]`, scale by speed, and divide the accumulator by 60 to get `iTime`. The clamp is what keeps the field from jumping when a backgrounded tab resumes.

## Runtime guardrails

Each of these is a defined behaviour, not a best-effort:

- **Reduced motion.** The script checks `matchMedia('(prefers-reduced-motion: reduce)')` itself. The `@media` block in `global.css` collapses CSS animations and transitions only; it cannot reach a requestAnimationFrame loop, which is the same gap `Reveal.astro` documents. Under the preference the component draws exactly one frame at `iTime = 0` and never schedules the loop. Texture stays, motion goes.
- **Off-screen.** An `IntersectionObserver` on the container starts the loop on enter and cancels it on exit, replacing Vanta's per-frame `isOnScreen()` scan.
- **Hidden tab.** A `visibilitychange` listener cancels the loop while `document.hidden` and restarts it on return.
- **Resolution.** The backing store is the container's `clientWidth` and `clientHeight` each multiplied by `dpr`, where `dpr = min(devicePixelRatio, 1.5)`, or `1.0` when the viewport is under 600px wide. A soft noise field gains nothing from full retina density and costs fill rate for it. A `ResizeObserver` resizes the canvas and re-uploads `iResolution`.
- **No context.** If `getContext('webgl')` returns null, the script returns without touching the canvas. The container is transparent and `--color-bg-primary` shows through, which is already the correct colour.
- **Context lost.** A `webglcontextlost` handler calls `preventDefault()` and cancels the loop. No restore path is implemented; a lost context degrades to the flat background, which is an acceptable end state for a decorative layer. There is no state in which the hero becomes unreadable or blank.
- **Accessibility.** `aria-hidden="true"` on the container. The layer carries no information, and `pointer-events: none` keeps it out of the way of the hero's own interactive content.

## Verification

WebGL cannot run under vitest, so the checks split by what each can actually prove.

Automated, against built `dist/` output. In `tests/home-structure.test.ts`: the hero contains the fog container and a canvas, the container is `aria-hidden="true"`, and the hero section carries `relative isolate overflow-hidden`. In `tests/build-output.test.ts`: every fog token is genuinely *declared* in the shipped stylesheet — which is what catches the `@theme` tree-shaking hazard above, so it asserts a real declaration rather than merely finding the name somewhere — plus `--fog-base` is declared as `var(--color-bg-primary)` and `--fog-highlight` keeps white text at or above 7:1.

The colour helpers in that file throw on anything that is not a hex literal. This is deliberate: `parseInt` yields `NaN` for other notations and `NaN >> 16 & 255` is `0`, so a value the helper could not parse would pass the greyscale check as black and score a perfect 21:1 on contrast. The two assertions carrying the monochrome and contrast guarantees are exactly the ones that must not fail open.

**The monochrome check is a proof, not a sample.** The same test file asserts that all four fog colours satisfy `R === G === B`. Because the shader only ever `mix()`es those four uniforms and `mix` interpolates per channel, a grey palette cannot produce a coloured pixel — so this bounds the output rather than sampling it. Reading rendered pixels back was considered and dropped: it is strictly weaker, and it does not work — a WebGL canvas without `preserveDrawingBuffer` has an empty drawing buffer by the time console code can read it, and adding that flag to production for a test would be the wrong trade.

Manual, through the dev server and browser tools, reported back with artefacts rather than delegated to the reader: a screenshot of the rendered hero and of the mobile breakpoint; a clean console, checked specifically for the component's own `[fog] shader compile failed` / `[fog] program link failed` diagnostics; a scripted readback confirming the canvas has non-zero backing size, a live context, `isolation: isolate` on the section, and — via `elementFromPoint` at the hero's centre — that a text element and not the canvas is on top. That last one is checked rather than assumed because `global.css:25-33` records a past bug in exactly this stacking interaction.

Motion is verified by two screenshots three seconds apart showing different cloud shapes. Reduced motion is verified the same way with the preference forced on in the source temporarily — the Browser pane cannot emulate `prefers-reduced-motion` — expecting a visible but *identical* pair, then reverting.

## Out of scope

Fog on other sections, on case study pages, or as a fixed page-wide layer. Mouse or scroll reactivity. Any other Vanta effect. A light-theme variant of the palette — the case study pages that run light do not render the hero.
