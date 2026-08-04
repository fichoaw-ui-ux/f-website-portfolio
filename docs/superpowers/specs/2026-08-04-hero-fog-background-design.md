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
<div class="fog-layer" data-fog-layer aria-hidden="true"><canvas></canvas></div>
```

- container: `position: absolute; inset: 0; z-index: -1; pointer-events: none`
- canvas: `display: block; width: 100%; height: 100%`
- container carries `mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%)` so the field dissolves into the page instead of ending on a straight edge

**Unprefixed, and not by oversight.** This build's CSS pipeline normalises vendor prefixes to a modern target: it neither adds them nor keeps hand-written ones where an unprefixed equivalent exists. Adding `-webkit-mask-image` to the rule and rebuilding produces `dist/` output with the prefix stripped — measured, after two earlier drafts of this spec got the mechanism wrong in opposite directions. The accepted consequence is that on Chrome below 120 and Safari below 15.4 the mask no-ops and the field ends on a hard horizontal edge. The fix, should that ever matter, is not a prefix but folding the fade into the shader as a vertical ramp mixing toward `baseColor` — pixel-equivalent, since `baseColor` *is* the page background, at the cost of the "GLSL is Vanta's verbatim" property.

All of it lives in the component's own scoped `<style>` block rather than in Tailwind classes. The positioning and the mask are one idea, and splitting them across a `class` attribute and a stylesheet would hide that.

The WebGL setup lives in the component's own `<script>` tag, which Astro bundles and scopes to pages that use the component. The component takes no props; every tunable value is a CSS custom property (see *Colour*).

`src/components/home/Hero.astro` changes in two ways: its `<section>` gains `relative isolate overflow-hidden`, and `<FogBackground />` becomes its first child. `isolate` matters — see *Layering*.

## Layering

`global.css` already paints two fixed texture layers inside `body`'s stacking context: `body::before` at `z-index: -2` (radial light patches) and `body::after` at `z-index: -1` (SVG grain). Negative-z-index children of a stacking context paint before in-flow content, so a canvas inside `main` paints **above** both.

The shader writes `gl_FragColor.a = 1.0`. The fog is therefore opaque and hides the gradients and the grain within the hero band; both remain intact in every other section. This is intended. The fog's own fbm already supplies grain and depth, and compositing three noise fields produces mud rather than richness. An alpha-blended variant was considered and rejected for that reason.

The seam is handled by two facts working together: `--fog-base` *is* `--color-bg-primary` — declared as `var(--color-bg-primary)`, so the two cannot drift — which makes the flat parts of the field indistinguishable from the page; and the bottom-edge mask fades whatever is left.

## Colour

Four custom properties, declared in a `:root` block in `src/styles/tokens.css` — deliberately **outside** that file's `@theme` block. They sit in `tokens.css` rather than `global.css` so that `--fog-base` is adjacent to the `--color-bg-primary` it has to match. The script reads them with `getComputedStyle(document.documentElement)` and parses each `#rrggbb` into normalised RGB, so the palette stays a single source of truth in CSS.

The reason for avoiding `@theme` is the opposite of the obvious one, and an earlier draft of this spec had it backwards. It is *not* that `@theme` would emit unwanted `bg-fog-*` utilities — it would not, because `--fog-*` is outside Tailwind's `--color-*` namespace and so is not a colour-utility key at all. The hazard is that Tailwind 4 emits only the theme variables something in the CSS actually references, whether a utility or a hand-written rule, so variables read solely from JavaScript are tree-shaken out of the build. Moving this block into `@theme` makes every `--fog-*` declaration vanish from `dist`, and the fog degrades to a flat background with nothing to indicate why. This was verified empirically, not reasoned about.

| Token | Value | Role | Vanta default replaced |
|---|---|---|---|
| `--fog-base` | `var(--color-bg-primary)` | dominant field | `#FFEBEB` |
| `--fog-lowlight` | `#000000` | deepest troughs | `#2D00FF` |
| `--fog-midtone` | `#1A1A1A` | cloud body | `#FF1900` |
| `--fog-highlight` | `#2E2E2E` | brightest peaks | `#FFC300` |

Scalars: `--fog-blur-factor: 0.6` (Vanta's default), `--fog-zoom: 1`, `--fog-speed: 0.55`. Speed is roughly half of Vanta's `1` — at the default rate the field visibly drifts behind an 88px headline, which reads as a widget.

Contrast: `--fog-highlight` sets the field's brightest pixel but does not exactly cap it. The shader's final `mix(baseColor, color, f*f*f + .6*f*f + .5*f)` has an **unclamped** factor — it crosses 1.0 at `f ≈ 0.705` and reaches 2.1 — so the result extrapolates slightly past `highlightColor`. Measured against the shipped shader, a `#2E2E2E` token yields a real maximum of `#303030`, 2/255 over, and white text on it measures **13.2:1** rather than the 13.58:1 the token alone implies. An earlier draft of this spec asserted `#2E2E2E` as a hard ceiling and quoted 13.5:1; both were wrong, if harmlessly.

Hero text therefore clears AAA at every point in the animation and no scrim is needed. The `7:1` floor the test enforces is very slightly optimistic for the same reason — a `#5A5A5A` token (6.90:1) would really deliver about `#5C5C5C` (6.69:1) — so treat the token as a close approximation of the bound rather than the bound itself when moving it. Raising `--fog-highlight` far enough to approach that floor must be accompanied by a scrim.

## Shader

Vertex shader: a single `attribute vec2 a_position`, passed straight to `gl_Position`. Two triangles covering clip space `[-1, 1]`. No matrices, no camera.

Fragment shader: Vanta's `vanta.fog` fragment source verbatim, minus the unused `iMouse` declaration, with a header comment attributing Vanta and shadertoy `4dS3Wd`. It uses six-octave fbm over a hash-based value noise, samples that field twice for domain warping, and mixes base → lowlight → midtone → highlight.

Uniforms: `iResolution` (vec2, device pixels), `iTime` (float, seconds), `blurFactor`, `zoom`, and the four `vec3` colours. Colours and scalars are uploaded once at init; only `iTime` and `iResolution` change afterwards.

Time advances on Vanta's pace formula, so the drift rate is the one Vanta produces: accumulate elapsed frames at 60fps (`dt / (1000/60)`), scale by speed, and divide the accumulator by 60 to get `iTime`. That is why time is kept in speed-scaled frame units rather than as plain seconds.

Each step is capped at 5 frames so one long frame cannot lurch the field forward. The reachable case for that cap is a main-thread stall or a throttled `requestAnimationFrame` while the tab still reports itself visible; a 200ms hitch would otherwise advance time by 12 frames at once. It is explicitly *not* the backgrounded-tab case, which an earlier draft of this spec named — that is handled by `stop()` plus resetting the previous timestamp to null, which makes the first frame after a resume contribute nothing. Vanta needs its clamp for the backgrounded case because Vanta keeps its loop running with a stale timestamp; this loop does not.

Vanta also floors each step at 0.2 frames. That floor is deliberately dropped: it only engages above roughly 300Hz, where it makes the field run about 1.6× fast at 480Hz — on exactly the hardware with the most headroom — and it changes nothing at 60, 120, or 240Hz.

## Runtime guardrails

Each of these is a defined behaviour, not a best-effort:

- **Reduced motion.** The script checks `matchMedia('(prefers-reduced-motion: reduce)')` itself. The `@media` block in `global.css` collapses CSS animations and transitions only; it cannot reach a requestAnimationFrame loop, which is the same gap `Reveal.astro` documents. Under the preference the component draws one frame at `iTime = 0` at startup and never schedules the loop. It will redraw — still at `iTime = 0` — if the `ResizeObserver` reallocates the backing store, so "exactly one frame" holds for startup, not for the lifetime of the page. Texture stays, motion goes.
- **Off-screen.** An `IntersectionObserver` on the container starts the loop on enter and cancels it on exit, replacing Vanta's per-frame `isOnScreen()` scan.
- **Hidden tab.** A `visibilitychange` listener cancels the loop while `document.hidden` and restarts it on return.
- **Resolution.** The backing store is the container's `clientWidth` and `clientHeight` each multiplied by `dpr`, where `dpr = min(devicePixelRatio, 1.5)`, or `1.0` when the viewport is under 600px wide. A soft noise field gains nothing from full retina density and costs fill rate for it. A `ResizeObserver` resizes the canvas and re-uploads `iResolution`.
- **Any failure to initialise.** If `getContext('webgl')` returns null, if a `--fog-*` token will not parse, or if the shader fails to compile or link, the setup bails and the canvas is **removed from the DOM**. Removing it is what delivers the fallback, and this is a correction to an earlier draft that said the canvas could simply be left alone as "transparent": the context is created with `alpha: false`, so a live context that was never drawn to composites as *opaque black*, not transparent. A half-initialised canvas left in place would paint a black band over the page. With it removed, `--color-bg-primary` shows through, which is already the correct colour.
- **Context lost.** A `webglcontextlost` handler calls `preventDefault()`, sets a `contextLost` flag, and cancels the loop. The flag is not optional bookkeeping: the `IntersectionObserver` and `visibilitychange` listeners stay live, so without it the next scroll-in would restart a 60fps loop issuing GL calls against a dead context — rendering nothing and never letting the page idle its frame loop again. No restore path is implemented; a lost context degrades to the flat background permanently, which is an acceptable end state for a decorative layer. There is no state in which the hero becomes unreadable, and none in which a dead layer keeps burning frames.
- **Accessibility.** `aria-hidden="true"` on the container. The layer carries no information, and `pointer-events: none` keeps it out of the way of the hero's own interactive content.

## Verification

WebGL cannot run under vitest, so the checks split by what each can actually prove.

Automated, against built `dist/` output. In `tests/home-structure.test.ts`: the hero contains the fog container with a canvas nested directly inside it, the container is `aria-hidden="true"`, the hero section carries `relative isolate overflow-hidden`, and — the assertion that guards the failure that actually matters — the layer's scoped rule still declares `z-index: -1`. Without that last one, dropping the negative index would let the opaque canvas paint over the `h1` while every other assertion here still passed. In `tests/build-output.test.ts`: every fog token is genuinely *declared* in the shipped stylesheet — which is what catches the `@theme` tree-shaking hazard above, so it asserts a real declaration rather than merely finding the name somewhere — plus `--fog-base` is declared as `var(--color-bg-primary)` and `--fog-highlight` keeps white text at or above 7:1.

The colour helpers in that file throw on anything that is not a hex literal. This is deliberate: `parseInt` yields `NaN` for other notations and `NaN >> 16 & 255` is `0`, so a value the helper could not parse would pass the greyscale check as black and score a perfect 21:1 on contrast. The two assertions carrying the monochrome and contrast guarantees are exactly the ones that must not fail open.

**The monochrome check is a proof, not a sample.** The same test file asserts that all four fog colours satisfy `R === G === B`. Because the shader only ever `mix()`es those four uniforms and `mix` interpolates per channel, a grey palette cannot produce a coloured pixel — so this bounds the output rather than sampling it. Reading rendered pixels back was considered and dropped: it is strictly weaker, and it does not work — a WebGL canvas without `preserveDrawingBuffer` has an empty drawing buffer by the time console code can read it, and adding that flag to production for a test would be the wrong trade.

Manual, through the dev server and browser tools, reported with artefacts rather than delegated to the reader: screenshots of the rendered hero at desktop and mobile; a clean console, checked specifically for the component's own `[fog] shader compile failed` / `[fog] program link failed` diagnostics; and a scripted readback of the canvas backing size, a live context, `isolation: isolate` on the section, and `z-index: -1` on the layer.

**The environment imposes a real limit, recorded here so nobody mistakes it for a bug.** The in-app browser pane reports `document.hidden === true` permanently. Hidden pages get no "update the rendering" steps, so neither `requestAnimationFrame` nor `ResizeObserver` callbacks ever run in it. Two things follow, both measured rather than assumed: 0 rAF calls over 18 seconds (which is the `visibilitychange` guard behaving correctly), and a separately installed `ResizeObserver` firing 0 times across two viewport changes — which is why the canvas backing store does not follow a resize there. Neither is a component defect.

Because of that, three checks are done differently:

- **Motion and greyscale** are proven by recompiling the same GLSL in a throwaway context with `preserveDrawingBuffer: true` and reading pixels directly — 85.6% of pixels differ between `iTime` 0 and 5.5, and 0 of 25,600 pixels are non-grey. This is also the empirical confirmation of the by-construction monochrome argument above. Note the brightest channel sampled this way (41) is a small-sample floor, not the true maximum; see the Colour section for the real bound.
- **The mobile DPR branch** is exercised through the synchronous initial `resize()` by reloading at 375px wide, which does not depend on any observer: the backing store comes out 375×880, exactly the CSS size, against 563 if the desktop branch had run.
- **Reduced motion** needs no source patch. Since the pane never runs the loop, everything screenshotted *is* the single-static-frame path, which is precisely what the preference produces.

One warning about a check that looks stronger than it is: `elementFromPoint` at the hero's centre returns a text element, but that proves nothing about stacking. The layer and its canvas are `pointer-events: none`, so hit testing skips them whatever their `z-index`. The real guard against the `global.css:25-33` class of bug is the `z-index: -1` assertion in `tests/home-structure.test.ts`, which was verified to go red when the rule is broken.

## Out of scope

Fog on other sections, on case study pages, or as a fixed page-wide layer. Mouse or scroll reactivity. Any other Vanta effect. A light-theme variant of the palette — the case study pages that run light do not render the hero.
