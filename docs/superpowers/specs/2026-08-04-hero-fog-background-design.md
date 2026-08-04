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

- container: `absolute inset-0 -z-10 pointer-events-none`
- canvas: `block h-full w-full`
- container carries `mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%)` (plus `-webkit-mask-image`) so the field dissolves into the page instead of ending on a straight edge

The WebGL setup lives in the component's own `<script>` tag, which Astro bundles and scopes to pages that use the component. The component takes no props; every tunable value is a CSS custom property (see *Colour*).

`src/components/home/Hero.astro` changes in two ways: its `<section>` gains `relative isolate overflow-hidden`, and `<FogBackground />` becomes its first child. `isolate` matters — see *Layering*.

## Layering

`global.css` already paints two fixed texture layers inside `body`'s stacking context: `body::before` at `z-index: -2` (radial light patches) and `body::after` at `z-index: -1` (SVG grain). Negative-z-index children of a stacking context paint before in-flow content, so a canvas inside `main` paints **above** both.

The shader writes `gl_FragColor.a = 1.0`. The fog is therefore opaque and hides the gradients and the grain within the hero band; both remain intact in every other section. This is intended. The fog's own fbm already supplies grain and depth, and compositing three noise fields produces mud rather than richness. An alpha-blended variant was considered and rejected for that reason.

The seam is handled by two facts working together: `--fog-base` equals `--color-bg-primary` exactly, so the flat parts of the field are indistinguishable from the page; and the bottom-edge mask fades whatever is left.

## Colour

Four custom properties, declared in `:root` in `src/styles/global.css` — deliberately **outside** `@theme`, so Tailwind does not emit `bg-fog-base` and friends that nothing would ever use. The script reads them with `getComputedStyle(document.documentElement)` and parses each `#rrggbb` into normalised RGB, so the palette stays a single source of truth in CSS.

| Token | Value | Role | Vanta default replaced |
|---|---|---|---|
| `--fog-base` | `#0B0B0B` | dominant field; equals `--color-bg-primary` | `#FFEBEB` |
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

Automated, added to `tests/home-structure.test.ts` against built `dist/index.html`: the hero contains the fog container and a canvas, the container is `aria-hidden="true"`, and the hero section carries `overflow-hidden`. These assert the markup contract only.

Manual, through the dev server and browser tools, and reported back with evidence rather than delegated to the reader: a screenshot of the rendered hero; a clean console; and a readback of rendered pixels via `gl.readPixels` or a 2D-canvas sample confirming `R === G === B` across the field, which is what actually proves the palette is monochrome. Reduced motion is checked by emulating the preference and confirming the field is static.

## Out of scope

Fog on other sections, on case study pages, or as a fixed page-wide layer. Mouse or scroll reactivity. Any other Vanta effect. A light-theme variant of the palette — the case study pages that run light do not render the hero.
