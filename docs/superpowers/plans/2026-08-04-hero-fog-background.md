# Hero Fog Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a slow monochrome fog behind the home hero headline, using VANTA.FOG's shader without adding Vanta or three.js as dependencies.

**Architecture:** One Astro component owns a `<canvas>`, a raw-WebGL fullscreen quad, and Vanta's fog fragment shader verbatim. Its palette and pace come from CSS custom properties so colour stays a single source of truth in `tokens.css`. The hero section becomes a stacking context and mounts the component as its first child. The animation loop is gated by a single `frameId` guard driven by three inputs: reduced-motion preference, an `IntersectionObserver`, and `visibilitychange`.

**Tech Stack:** Astro 7, Tailwind CSS 4 (`@theme` in `src/styles/tokens.css`), vitest 4 against built `dist/` output, raw WebGL 1 (`webgl` context, `gl_FragColor`), no new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-08-04-hero-fog-background-design.md`

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/styles/tokens.css` | Modify | Add a `:root` block with the four fog colour tokens and three scalar tokens. Deliberately outside `@theme` so Tailwind emits no `bg-fog-*` utilities. Lives next to `--color-bg-primary` because `--fog-base` must equal it. |
| `src/components/ui/FogBackground.astro` | Create | The whole effect: markup, scoped positioning + mask CSS, shader source, WebGL setup, loop gating. Takes no props. |
| `src/components/home/Hero.astro` | Modify | Becomes a stacking context (`relative isolate overflow-hidden`) and mounts `<FogBackground />` as its first child. Two lines. |
| `tests/build-output.test.ts` | Modify | Assert every fog token is genuinely declared in the built stylesheet, that every fog colour is grey, that `--fog-base` indirects to `--color-bg-primary`, and that the highlight keeps white text above 7:1. |
| `tests/home-structure.test.ts` | Modify | Assert the built hero markup contract: fog layer present, `aria-hidden`, canvas inside it, hero clips its overflow. |

**Two deliberate deviations from the spec, both cosmetic:** tokens go in `tokens.css` rather than `global.css` (more discoverable, and adjacency to `--color-bg-primary` is the point), and the layer's positioning lives in the component's scoped `<style>` block next to the mask rather than being split between Tailwind classes and CSS. The spec is amended to match.

**Where the monochrome guarantee actually comes from:** the shader only ever `mix()`es the four colour uniforms, and `mix` interpolates per channel. Any mix of colours where `R === G === B` is itself grey. So asserting the four tokens are grey (Task 1) *proves* the output is greyscale — it is a stronger check than sampling rendered pixels, and unlike `gl.readPixels` it works at all (a WebGL canvas without `preserveDrawingBuffer` has an empty drawing buffer by the time a console script can read it).

---

## Task 1: Fog colour and scalar tokens

**Files:**
- Modify: `src/styles/tokens.css` (append a `:root` block after the closing `}` of `@theme`, currently line 68)
- Test: `tests/build-output.test.ts`

- [ ] **Step 1: Write the failing tests**

Add these helpers to `tests/build-output.test.ts`, immediately after the existing `readAllCss` function (around line 30, before `describe('built home page'`):

```ts
/* Reads a custom property's declared value out of the built stylesheet, and
   follows one level of `var()` indirection — `--fog-base` is declared as
   `var(--color-bg-primary)` on purpose, so that the two can never drift. */
function tokenValue(css: string, name: string): string {
  // The leading boundary matters because the haystack is an order-independent
  // concatenation of every stylesheet in dist/_astro — without it, `--fog-base`
  // would also match a `--hero-fog-base:` declaration in some other chunk.
  const match = css.match(new RegExp(`(?:^|[;{\\s])${name}\\s*:\\s*([^;}]+)`))
  if (!match) throw new Error(`${name} not found in built CSS`)
  return match[1].trim()
}

function resolveColorToken(css: string, name: string): string {
  const value = tokenValue(css, name)
  const reference = value.match(/^var\(\s*(--[\w-]+)\s*\)$/)
  return reference ? tokenValue(css, reference[1]) : value
}

function hexToRgb(hex: string): [number, number, number] {
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
    // Not pedantry: parseInt returns NaN for anything else and NaN >> 16 & 255
    // is 0, so an unparseable colour would sail through the greyscale check as
    // black and score a perfect 21:1 on contrast. The two guards that carry the
    // monochrome and contrast guarantees must fail loudly, not fail open.
    throw new Error(`${hex} is not a hex colour — the greyscale and contrast guards cannot judge it`)
  }
  const clean = hex.replace(/^#/, '')
  // The minifier really does shorten #000000 to #000 in dist/_astro/*.css.
  const full = clean.length === 3 ? clean.replace(/./g, c => c + c) : clean
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function contrastWithWhite(hex: string): number {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const [r, g, b] = hexToRgb(hex)
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  return 1.05 / (luminance + 0.05)
}

const FOG_COLOR_TOKENS = ['--fog-base', '--fog-lowlight', '--fog-midtone', '--fog-highlight']
```

Then add this `describe` block at the end of the file, inside the outer `describe('built home page', ...)`:

```ts
  describe('fog background tokens', () => {
    it('declares every fog token in the shipped stylesheet', () => {
      // Not merely `css.toContain(name)` — that passes on a stray var()
      // reference with no declaration behind it. This is the test that catches
      // the @theme tree-shaking hazard described in tokens.css, so it has to
      // require a real declaration.
      for (const name of [...FOG_COLOR_TOKENS, '--fog-speed', '--fog-blur-factor', '--fog-zoom']) {
        expect(tokenValue(css, name)).toBeTruthy()
      }
    })

    it('keeps the fog field greyscale', () => {
      // Why this bounds the whole output rather than sampling it: see tokens.css.
      for (const name of FOG_COLOR_TOKENS) {
        const [r, g, b] = hexToRgb(resolveColorToken(css, name))
        expect([g, b], name).toEqual([r, r])
      }
    })

    it('anchors the fog base to the page background so the edges cannot drift', () => {
      expect(tokenValue(css, '--fog-base')).toBe('var(--color-bg-primary)')
    })

    it('keeps white hero text above 7:1 against the brightest possible pixel', () => {
      // --fog-highlight is the brightest pixel the field can reach; the bound
      // and what breaks if it moves are documented in tokens.css.
      expect(contrastWithWhite(resolveColorToken(css, '--fog-highlight'))).toBeGreaterThanOrEqual(7)
    })
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm run build && npx vitest run tests/build-output.test.ts -t "fog background tokens"
```

Expected: FAIL, all 4 tests, each throwing `--fog-<name> not found in built CSS` out of `tokenValue`. No test may pass at this point — a test that is green before the tokens exist is not guarding anything.

- [ ] **Step 3: Add the tokens**

Append to `src/styles/tokens.css`, after the closing `}` of the `@theme` block:

```css
/* Fog background — read at runtime by FogBackground.astro through
   getComputedStyle, never by a utility class.

   These sit in :root rather than in the @theme block above, and the reason is
   the opposite of the obvious one. It is not that @theme would emit unwanted
   .bg-fog-* utilities: --fog-* is not in Tailwind's --color-* namespace, and
   global.css passes source(none) so no candidates are scanned anyway. The
   hazard is that @theme emits only the variables a utility actually
   references, so variables read solely from JS are tree-shaken out of the
   build. Moving this block into @theme makes every --fog-* declaration vanish
   from dist and the fog degrades to a flat background with nothing to
   indicate why.

   --fog-base points at the page background rather than repeating #0B0B0B: the
   flat parts of the field have to be indistinguishable from the page for the
   hero's bottom edge to disappear, so this equality is structural, not a
   convention someone can quietly break.

   Every colour here is grey (R === G === B). That is the whole monochrome
   guarantee — the shader only mix()es these four values, and mix interpolates
   per channel, so grey inputs cannot produce a coloured pixel.

   --fog-highlight is the brightest pixel the field can reach. At #2E2E2E,
   white text over it measures 13.5:1. Past roughly #5A5A5A white drops under
   7:1 and the hero would need a scrim; a test in build-output.test.ts holds
   this line. */
:root {
  --fog-base: var(--color-bg-primary);
  --fog-lowlight: #000000;
  --fog-midtone: #1A1A1A;
  --fog-highlight: #2E2E2E;

  /* blur-factor and zoom are Vanta's defaults. Speed is roughly half of
     Vanta's 1 — at the default rate the field visibly drifts behind an 88px
     headline, which reads as a widget rather than as depth. */
  --fog-speed: 0.55;
  --fog-blur-factor: 0.6;
  --fog-zoom: 1;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm run build && npx vitest run tests/build-output.test.ts -t "fog background tokens"
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css tests/build-output.test.ts
git commit -m "feat(tokens): add the monochrome fog palette

Greyscale by construction: the shader only mixes these four colours and
mix interpolates per channel, so grey inputs cannot yield a coloured
pixel. A test asserts that rather than sampling rendered output.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: The FogBackground component, mounted in the hero

The component and the hero edit land together: the markup assertions read `dist/index.html`, and nothing reaches that file until the hero mounts the component.

**Files:**
- Create: `src/components/ui/FogBackground.astro`
- Modify: `src/components/home/Hero.astro` (line 1-6: add the import, rewrite the `<section>` class, add the component as the first child)
- Test: `tests/home-structure.test.ts`

- [ ] **Step 1: Write the failing tests**

Add this `describe` block to `tests/home-structure.test.ts`, immediately after the existing `describe('hero', ...)` block closes (currently line 43):

```ts
  describe('hero fog background', () => {
    it('mounts a decorative fog layer wrapping a canvas', () => {
      const layer = html.match(/<div[^>]*data-fog-layer[^>]*>/)?.[0]
      expect(layer).toBeDefined()
      // The layer carries no information and must never be announced or
      // focusable — it exists only to be looked at.
      expect(layer).toContain('aria-hidden="true"')
      expect(html).toMatch(/data-fog-layer[\s\S]{0,200}?<canvas/)
    })

    it('clips the fog to the hero and puts it behind the headline', () => {
      // Identified by the layer it wraps rather than by a character-distance
      // lookahead to "Hello!" — the nested Container/Reveal/h1 markup between
      // the two is long enough that any such window would be brittle.
      const hero = html.match(/<section[^>]*>(?=\s*<div[^>]*data-fog-layer)/)?.[0]
      expect(hero).toBeDefined()
      // overflow-hidden is what keeps the canvas inside the section, and
      // isolate is what makes the layer's negative z-index resolve against
      // the hero instead of against body — body::before and body::after
      // already occupy negative indices in that context.
      expect(hero).toContain('overflow-hidden')
      expect(hero).toContain('relative')
      expect(hero).toContain('isolate')
    })
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm run build && npx vitest run tests/home-structure.test.ts -t "hero fog background"
```

Expected: FAIL, 2 tests. First: `expect(layer).toBeDefined()` receives `undefined`. Second: the matched `<section>` lacks `overflow-hidden`.

- [ ] **Step 3: Create the component**

Create `src/components/ui/FogBackground.astro` with exactly this content:

```astro
---
/*
  Monochrome fog for the home hero.

  The fragment shader below is VANTA.FOG's, copied verbatim from
  vanta@0.5.24 (dist/vanta.fog.min.js, MIT), which itself builds on Morgan
  McGuire's value noise — https://www.shadertoy.com/view/4dS3Wd. Vanta is not
  a dependency here: FOG is a single fullscreen fragment shader, and the only
  three.js surface Vanta uses for it is Color/Scene/Mesh/PlaneGeometry/
  ShaderMaterial/WebGLRenderer. That is ~110-150KB gzip of renderer to draw a
  quad, so the quad is drawn directly instead. The GLSL is unchanged, so the
  field is the one Vanta produces.

  What is NOT carried over from Vanta: mouse tracking, gyro handling, the FPS
  meter, and the per-frame isOnScreen() scan. Note that vanta.fog declares
  `uniform vec2 iMouse` but never reads it in main() — FOG is not
  mouse-reactive, so that uniform and its listeners are gone rather than
  merely unused.

  Colour and pace come from tokens in tokens.css. See the spec at
  docs/superpowers/specs/2026-08-04-hero-fog-background-design.md.
*/
---
<div class="fog-layer" data-fog-layer aria-hidden="true">
  <canvas></canvas>
</div>

<style>
  /* z-index: -1 rather than a Tailwind class, so it sits next to the mask it
     works with. The hero's `isolate` is what scopes this negative index to
     the hero — without it, this competes with body::before (-2) and
     body::after (-1) in body's stacking context. */
  .fog-layer {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    /* Dissolves the field into the page instead of ending it on a straight
       line. The flat parts already match --color-bg-primary exactly; this
       handles whatever is left. */
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
  }

  .fog-layer canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>

<script>
  const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

  /* Verbatim from vanta.fog, minus the unused iMouse uniform. `precision
     highp float` is added because three.js injected it for Vanta and a raw
     WebGL 1 fragment shader has no default float precision. */
  const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 iResolution;
uniform float iTime;

uniform float blurFactor;
uniform vec3 baseColor;
uniform vec3 lowlightColor;
uniform vec3 midtoneColor;
uniform vec3 highlightColor;
uniform float zoom;

float random (in vec2 _st) {
  return fract(sin(dot(_st.xy,
                     vec2(0.129898,0.78233)))*
        437.585453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 _st) {
  vec2 i = floor(_st);
  vec2 f = fract(_st);

  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
          (c - a)* u.y * (1.0 - u.x) +
          (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 6

float fbm ( in vec2 _st) {
  float v = 0.0;
  float a = blurFactor;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5),
                  -sin(0.5), cos(0.50));
  for (int i = 0; i < NUM_OCTAVES; ++i) {
      v += a * noise(_st);
      _st = rot * _st * 2.0 + shift;
      a *= (1. - blurFactor);
  }
  return v;
}

void main() {
  vec2 st = gl_FragCoord.xy / iResolution.xy*3.;
  st.x *= 0.7 * iResolution.x / iResolution.y ;
  st *= zoom;

  vec3 color = vec3(0.0);

  vec2 q = vec2(0.);
  q.x = fbm( st + 0.00*iTime);
  q.y = fbm( st + vec2(1.0));

  vec2 dir = vec2(0.15,0.126);
  vec2 r = vec2(0.);
  r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ dir.x*iTime );
  r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ dir.y*iTime);

  float f = fbm(st+r);

  color = mix(baseColor,
              lowlightColor,
              clamp((f*f)*4.0,0.0,1.0));

  color = mix(color,
              midtoneColor,
              clamp(length(q),0.0,1.0));

  color = mix(color,
              highlightColor,
              clamp(length(r.x),0.0,1.0));

  vec3 finalColor = mix(baseColor, color, f*f*f+.6*f*f+.5*f);
  gl_FragColor = vec4(finalColor,1.0);
}
`

  /* A soft noise field gains nothing from full retina density and pays fill
     rate for it: six-octave fbm sampled three times is ~18 noise evaluations
     per pixel per frame. Phones render at 1x for the same reason. */
  const MAX_DPR = 1.5
  const MOBILE_MAX_WIDTH = 600

  function parseHexColor(value: string): [number, number, number] | null {
    const clean = value.trim().replace(/^#/, '')
    const full = clean.length === 3 ? clean.replace(/./g, c => c + c) : clean
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
    const n = parseInt(full, 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }

  function parseScalar(value: string, fallback: number): number {
    const n = Number.parseFloat(value)
    return Number.isFinite(n) ? n : fallback
  }

  function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('[fog] shader compile failed:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  function initFog(container: HTMLElement) {
    const canvas = container.querySelector('canvas')
    if (!canvas) return

    // Every early return below leaves the canvas untouched and transparent,
    // so --color-bg-primary shows through — which is already the right
    // colour. There is no failure mode where the hero goes blank.
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    })
    if (!gl) return

    const styles = getComputedStyle(document.documentElement)
    const colors = {
      baseColor: parseHexColor(styles.getPropertyValue('--fog-base')),
      lowlightColor: parseHexColor(styles.getPropertyValue('--fog-lowlight')),
      midtoneColor: parseHexColor(styles.getPropertyValue('--fog-midtone')),
      highlightColor: parseHexColor(styles.getPropertyValue('--fog-highlight')),
    }
    // Bailing beats uploading NaN: a partly-parsed palette renders garbage,
    // whereas no fog renders the correct flat background. This also covers the
    // one assumption worth naming — --fog-base is declared as
    // var(--color-bg-primary), and this code relies on getPropertyValue
    // returning the substituted value. That is the spec'd behaviour for a
    // custom property's computed value, but if any engine ever handed back the
    // literal `var(...)` the parse fails here and the hero falls back to flat.
    if (Object.values(colors).some(color => color === null)) return

    const speed = parseScalar(styles.getPropertyValue('--fog-speed'), 0.55)
    const blurFactor = parseScalar(styles.getPropertyValue('--fog-blur-factor'), 0.6)
    const zoom = parseScalar(styles.getPropertyValue('--fog-zoom'), 1)

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[fog] program link failed:', gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    // Two triangles covering clip space. No matrices, no camera — the shader
    // works off gl_FragCoord.
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW)
    const aPosition = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

    gl.uniform1f(gl.getUniformLocation(program, 'blurFactor'), blurFactor)
    gl.uniform1f(gl.getUniformLocation(program, 'zoom'), zoom)
    gl.uniform3fv(gl.getUniformLocation(program, 'baseColor'), colors.baseColor!)
    gl.uniform3fv(gl.getUniformLocation(program, 'lowlightColor'), colors.lowlightColor!)
    gl.uniform3fv(gl.getUniformLocation(program, 'midtoneColor'), colors.midtoneColor!)
    gl.uniform3fv(gl.getUniformLocation(program, 'highlightColor'), colors.highlightColor!)

    const uResolution = gl.getUniformLocation(program, 'iResolution')
    const uTime = gl.getUniformLocation(program, 'iTime')

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // One guard for three inputs — reduced motion, intersection, and tab
    // visibility all funnel through start()/stop(). Without it, an element
    // scrolling back in while the tab regains focus schedules a second loop
    // and the field runs at double speed.
    let frameId: number | null = null
    let previousNow: number | null = null
    let frames = 0
    let onScreen = false

    function draw() {
      gl.uniform1f(uTime, frames / 60)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    function tick(now: number) {
      frameId = requestAnimationFrame(tick)
      if (previousNow !== null) {
        // Vanta's clamp, and it earns its place: without it, returning from a
        // backgrounded tab advances the field by the whole elapsed gap in one
        // frame and the fog visibly jumps.
        const step = Math.min(Math.max((now - previousNow) / (1000 / 60), 0.2), 5)
        frames += step * speed
      }
      previousNow = now
      draw()
    }

    function start() {
      if (frameId !== null || prefersReducedMotion) return
      previousNow = null
      frameId = requestAnimationFrame(tick)
    }

    function stop() {
      if (frameId === null) return
      cancelAnimationFrame(frameId)
      frameId = null
    }

    function resize() {
      const dpr = window.innerWidth < MOBILE_MAX_WIDTH
        ? 1
        : Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const width = Math.max(1, Math.round(container.clientWidth * dpr))
      const height = Math.max(1, Math.round(container.clientHeight * dpr))
      if (canvas.width === width && canvas.height === height) return
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
      gl.uniform2f(uResolution, width, height)
      // While paused or under reduced motion nothing else will redraw, and a
      // resized buffer starts out blank.
      if (frameId === null) draw()
    }

    resize()
    new ResizeObserver(resize).observe(container)

    canvas.addEventListener('webglcontextlost', event => {
      // Degrades to the flat background permanently. Acceptable for a
      // decorative layer, and preventDefault is required for the event to be
      // treated as handled at all.
      event.preventDefault()
      stop()
    })

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop()
      else if (onScreen) start()
    })

    // Replaces Vanta's per-frame isOnScreen() scan.
    new IntersectionObserver(entries => {
      onScreen = entries[0].isIntersecting
      if (onScreen && !document.hidden) start()
      else stop()
    }).observe(container)

    // Reduced motion keeps the texture and drops the motion. The @media block
    // in global.css cannot reach this: it collapses CSS animations and
    // transitions, and a requestAnimationFrame loop is neither — the same gap
    // Reveal.astro documents. start() is a no-op above, so this single frame
    // is all that ever renders.
    if (prefersReducedMotion) draw()
  }

  document.querySelectorAll<HTMLElement>('[data-fog-layer]').forEach(initFog)
</script>
```

- [ ] **Step 4: Mount it in the hero**

In `src/components/home/Hero.astro`, add the import after line 3 (`import { site } from '../../content/site'`) so the frontmatter reads:

```astro
---
import Container from '../layout/Container.astro'
import Reveal from '../ui/Reveal.astro'
import FogBackground from '../ui/FogBackground.astro'
import { site } from '../../content/site'
---
```

Then replace the opening `<section>` tag (line 6) and add the component as its first child:

```astro
<section class="relative isolate flex min-h-[880px] items-center overflow-hidden py-24">
  <FogBackground />
  <Container>
```

Leave everything from `<div class="mx-auto flex max-w-[1088px]...` onwards untouched.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npm run build && npx vitest run tests/home-structure.test.ts -t "hero fog background"
```

Expected: PASS, 2 tests.

- [ ] **Step 6: Run the whole suite, to prove nothing else moved**

```bash
npm test
```

Expected: PASS, every test in all three files. The hero's other assertions (single `h1`, decorative avatar) must still pass — the fog is inserted before `<Container>`, not inside the heading.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/FogBackground.astro src/components/home/Hero.astro tests/home-structure.test.ts
git commit -m "feat(hero): add the monochrome fog background

VANTA.FOG's fragment shader on raw WebGL, no vanta or three.js. One
frameId guard gates reduced motion, IntersectionObserver, and tab
visibility so the loop can never double-start or be left dead.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: Browser verification

Nothing in Task 1 or 2 proves the effect renders. WebGL cannot run under vitest, so this task is the only evidence that it works, and every check here produces an artefact to show the user rather than a request for them to look.

**Files:** none modified, unless a check fails.

- [ ] **Step 1: Start the dev server**

Use the `preview_start` tool with `{name: "Astro dev"}` (the config already exists in `.claude/launch.json`). Do not run `astro dev` through Bash.

- [ ] **Step 2: Confirm the console is clean**

Use `read_console_messages`. Expected: no errors. Specifically, no `[fog] shader compile failed` and no `[fog] program link failed` — those two messages are the component's own diagnostics and either one means the shader never ran.

- [ ] **Step 3: Confirm the stacking order actually resolved as designed**

This is the check most likely to fail. `global.css:25-33` documents a past bug in exactly this area, so the reasoning behind `isolate` gets verified rather than trusted. Use `javascript_tool`:

```js
(() => {
  const layer = document.querySelector('[data-fog-layer]');
  const canvas = layer.querySelector('canvas');
  const section = layer.closest('section');
  return {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    hasContext: !!canvas.getContext('webgl'),
    sectionIsolation: getComputedStyle(section).isolation,
    layerZIndex: getComputedStyle(layer).zIndex,
    heroTextOnTop: document.elementFromPoint(
      window.innerWidth / 2,
      section.getBoundingClientRect().top + section.offsetHeight / 2
    )?.tagName,
  };
})()
```

Expected: `canvasWidth`/`canvasHeight` non-zero and roughly viewport-width × 880 times the DPR cap; `hasContext` true; `sectionIsolation` `"isolate"`; `layerZIndex` `"-1"`; `heroTextOnTop` a text element (`H1`, `SPAN`, or `P`) — **not** `CANVAS` or `DIV`. If it returns `CANVAS`, the layer is painting over the headline and the `z-index`/`isolate` pairing is wrong.

- [ ] **Step 4: Confirm the fog is moving**

Take a `computer` screenshot, wait 3 seconds with `computer` `{action: "wait", duration: 3}`, take a second screenshot. The two must show visibly different cloud shapes. Identical frames mean the loop never started — check `IntersectionObserver` firing and the `frameId` guard.

- [ ] **Step 5: Confirm reduced motion produces a static frame**

The Browser pane cannot emulate `prefers-reduced-motion`, so force it temporarily. In `src/components/ui/FogBackground.astro`, change:

```js
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

to:

```js
    const prefersReducedMotion = true // TEMPORARY — revert in this same step
```

Reload, screenshot, wait 3 seconds, screenshot again. Expected: the fog is visible (texture is present, the section is not flat black) and the two screenshots are identical. Then **revert the line** and confirm with `git diff src/components/ui/FogBackground.astro` that the working tree is clean. Do not commit while the line is forced.

- [ ] **Step 6: Check mobile**

`resize_window` with `{preset: "mobile"}`. Screenshot. Expected: the fog fills the hero with no horizontal overflow and no visible seam at the bottom of the section. Then `javascript_tool` with:

```js
(() => {
  const canvas = document.querySelector('[data-fog-layer] canvas');
  return { backingWidth: canvas.width, cssWidth: canvas.clientWidth, dpr: window.devicePixelRatio };
})()
```

Expected: `backingWidth === cssWidth` — the mobile branch pins DPR to 1. Restore with `resize_window` `{preset: "desktop"}`.

- [ ] **Step 7: If it renders but feels heavy, tune it — otherwise skip**

The levers, in order of preference: lower `MAX_DPR` from `1.5` to `1.25`, then drop `#define NUM_OCTAVES 6` to `4` in the fragment shader. Do not lower `--fog-speed` for performance reasons — speed does not affect cost. If either lever is used, record what changed and why in a comment, and rerun Steps 4 and 6.

- [ ] **Step 8: Report the evidence and commit any tuning**

Send the user the desktop screenshot, the mobile screenshot, and the console result. State plainly which checks passed and which, if any, needed tuning.

```bash
git status --short
```

If Step 7 changed anything:

```bash
git add src/components/ui/FogBackground.astro
git commit -m "perf(hero): tune the fog's render cost

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

If nothing changed, `git status --short` must be empty. Commit nothing.

---

## Task 4: Final check

- [ ] **Step 1: Run the full suite against a fresh build**

```bash
npm test
```

Expected: PASS across `tests/content.test.ts`, `tests/home-structure.test.ts`, and `tests/build-output.test.ts`.

- [ ] **Step 2: Confirm no dependency crept in**

```bash
git diff main --stat -- package.json package-lock.json
```

Expected: empty output. The whole point of the port is that neither file changes.

- [ ] **Step 3: Confirm the working tree is clean**

```bash
git status --short
```

Expected: empty. In particular, the temporary `prefersReducedMotion = true` from Task 3 Step 5 must be gone.
