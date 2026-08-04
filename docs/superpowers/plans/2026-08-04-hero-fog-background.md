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
| `src/styles/tokens.css` | Modify | Add a `:root` block with the four fog colour tokens and three scalar tokens. Deliberately outside `@theme`, which would tree-shake tokens no CSS references. Lives next to `--color-bg-primary` because `--fog-base` must equal it. |
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

- [x] **Step 1: Write the failing tests**

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

    it('keeps white hero text above 7:1 against the highlight token', () => {
      // Deliberately "against the token", not "against the brightest possible
      // pixel": the shader's final mix factor is unclamped, so real output runs
      // past this value by an amount that grows with it (+6/255 at the current
      // #4A4A4A). tokens.css has the measured table. So this floor is
      // optimistic by a widening margin — fine at today's value, but re-measure
      // rather than trusting a green suite if the highlight goes much higher.
      expect(contrastWithWhite(resolveColorToken(css, '--fog-highlight'))).toBeGreaterThanOrEqual(7)
    })
  })
```

- [x] **Step 2: Run the tests to verify they fail**

```bash
npm run build && npx vitest run tests/build-output.test.ts -t "fog background tokens"
```

Expected: FAIL, all 4 tests, each throwing `--fog-<name> not found in built CSS` out of `tokenValue`. No test may pass at this point — a test that is green before the tokens exist is not guarding anything.

- [x] **Step 3: Add the tokens**

Append to `src/styles/tokens.css`, after the closing `}` of the `@theme` block:

```css
/* Fog background — read at runtime by FogBackground.astro through
   getComputedStyle, never by a utility class.

   These sit in :root rather than in the @theme block above, and the reason is
   the opposite of the obvious one. It is not that @theme would emit unwanted
   .bg-fog-* utilities — --fog-* is outside Tailwind's --color-* namespace, so
   it is not a colour-utility key at all. The hazard is that @theme emits only
   the variables something in the CSS actually references, whether a utility or
   a hand-written rule, so variables read solely from JS are tree-shaken out of
   the build. Moving this block into @theme makes every --fog-* declaration
   vanish from dist and the fog degrades to a flat background with nothing to
   indicate why.

   --fog-base points at the page background rather than repeating #0B0B0B: the
   flat parts of the field have to be indistinguishable from the page for the
   hero's bottom edge to disappear, so this equality is structural, not a
   convention someone can quietly break.

   Every colour here is grey (R === G === B). That is the whole monochrome
   guarantee — the shader only mix()es these four values, and mix interpolates
   per channel, so grey inputs cannot produce a coloured pixel.

   --fog-highlight sets the field's brightest pixel but does not exactly cap
   it. The shader's final mix factor (f*f*f + .6*f*f + .5*f) is unclamped: it
   crosses 1.0 at f ~= 0.705 and reaches 2.1, so the result extrapolates past
   highlightColor.

   The overshoot GROWS with the token, so there is no single constant to
   memorise. Measured on the shipped shader at the hero's own aspect ratio,
   14.3M samples across 24 iTime values:

     token      real max   overshoot   white contrast (token -> real)
     #2E2E2E    #303030    +2          13.58 -> 13.20
     #4A4A4A    #505050    +6           8.86 ->  8.06   <- current

   That is why the 7:1 floor in build-output.test.ts is optimistic by a
   widening margin: it reads the token, not the output. Raising the highlight
   much further makes that gap worse, so re-measure rather than trusting the
   test alone if you push past roughly #4A4A4A. */
:root {
  --fog-base: var(--color-bg-primary);
  --fog-lowlight: #000000;
  --fog-midtone: #2E2E2E;
  --fog-highlight: #4A4A4A;

  /* blur-factor and zoom are Vanta's defaults. Speed is roughly half of
     Vanta's 1 — at the default rate the field visibly drifts behind an 88px
     headline, which reads as a widget rather than as depth. */
  --fog-speed: 0.55;
  --fog-blur-factor: 0.6;
  --fog-zoom: 1;
}
```

- [x] **Step 4: Run the tests to verify they pass**

```bash
npm run build && npx vitest run tests/build-output.test.ts -t "fog background tokens"
```

Expected: PASS, 4 tests.

- [x] **Step 5: Commit**

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

- [x] **Step 1: Write the failing tests**

Add this `describe` block to `tests/home-structure.test.ts`, immediately after the existing `describe('hero', ...)` block closes (currently line 43):

```ts
  describe('hero fog background', () => {
    it('mounts a decorative fog layer wrapping a canvas', () => {
      const layer = html.match(/<div[^>]*data-fog-layer[^>]*>/)?.[0]
      expect(layer).toBeDefined()
      // The layer carries no information and must never be announced or
      // focusable — it exists only to be looked at.
      expect(layer).toContain('aria-hidden="true"')
      // Proximity, not containment: a canvas that ended up as a *sibling*
      // rather than a child would still satisfy a loose distance window, but
      // container.querySelector('canvas') in the component script would then
      // return null and the effect would never mount.
      expect(html).toMatch(/<div[^>]*data-fog-layer[^>]*>\s*<canvas/)
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

    it('keeps the fog behind the headline rather than over it', () => {
      // The assertion that would actually catch the failure that matters. If
      // z-index: -1 were dropped, the opaque canvas would cover the h1 and
      // every other test here would still pass; global.css:25-33 records a
      // past bug in this exact stacking interaction. Astro inlines this
      // component's scoped rule into the page head, so dist/index.html has it.
      expect(html).toMatch(/\.fog-layer\[[^\]]+\][^}]*z-index:\s*-1/)
    })
  })
```

- [x] **Step 2: Run the tests to verify they fail**

```bash
npm run build && npx vitest run tests/home-structure.test.ts -t "hero fog background"
```

Expected: FAIL, 3 tests. First: `expect(layer).toBeDefined()` receives `undefined`. Second: the matched `<section>` lookahead itself matches nothing, since `data-fog-layer` doesn't exist yet, so `hero` is `undefined` rather than merely missing `overflow-hidden`. Third: the same absence — no `.fog-layer` rule exists in the built output yet, so the `z-index: -1` match fails too.

- [x] **Step 3: Create the component**

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
    /* Dissolves the field into the page at BOTH ends instead of stopping on a
       straight line. The flat parts already match --color-bg-primary exactly;
       this handles whatever is left.

       The top fade is not symmetry for its own sake. The header is
       deliberately transparent and static (see Header.astro), so the page
       texture runs behind it — and this layer starts at the hero's top edge,
       immediately below it. Without the fade the field begins at full
       strength on that boundary, drawing a horizontal line directly under the
       navbar and making the transparent header read as a separate darker bar.
       Invisible while the palette was dim; obvious as soon as the midtone and
       highlight were raised. 18% of an 880px hero is ~158px, so the field is
       at full strength just below the header rather than against it.

       There is deliberately no -webkit-mask-image here, and it is not because
       the build would add one. This build's CSS pipeline normalises vendor
       prefixes to a modern target: it neither adds them nor keeps hand-written
       ones where an unprefixed equivalent exists. Both halves were tested —
       adding -webkit-mask-image to this very rule and rebuilding produces
       dist/ output with the prefix stripped, and lightningcss reproduces that
       exactly when given modern targets. (-webkit-font-smoothing in
       global.css survives only because it has no unprefixed equivalent to be
       normalised to. Two earlier versions of this comment got the mechanism
       wrong in opposite directions; this one is measured.)

       Consequence, accepted: on Chrome below 120 and Safari below 16 the mask
       no-ops and the field ends on a hard horizontal edge. Firefox is
       unaffected at every version. Thresholds bisected against lightningcss's
       compat data rather than recalled.

       If that ever matters, the fix is not a prefix. It is to output alpha
       from the shader on a vertical ramp and drop this rule — which needs
       `alpha: true` on the context and premultiplied colour (finalColor *
       ramp). Note it is specifically NOT enough to mix toward baseColor: the
       mask makes this layer genuinely transparent at the bottom, revealing
       body::before and body::after, whereas mixing to a flat baseColor would
       cover them. Not done pre-emptively because it costs the "GLSL is
       Vanta's verbatim" property and risks a premultiply halo for everyone to
       fix a faint seam for almost no one. */
    mask-image: linear-gradient(to bottom, transparent 0%, #000 18%, #000 62%, transparent 100%);
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
  const MOBILE_BREAKPOINT = 600

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

  function mountFog(container: HTMLElement) {
    const canvas = container.querySelector('canvas')
    if (!canvas) return
    if (!setUpFog(container, canvas)) {
      // With `alpha: false` a live context that was never drawn to composites
      // as opaque black rather than transparent, so a half-initialised canvas
      // would paint a black band over the page. Removing it is what actually
      // delivers the "degrades to the flat background" guarantee; leaving it
      // in place only looked safe.
      canvas.remove()
    }
  }

  function setUpFog(container: HTMLElement, canvas: HTMLCanvasElement): boolean {
    // Only this bail is genuinely transparent: no context means the canvas is
    // just an empty element, letting the page show through. Every bail below
    // this point already holds a live context created with alpha: false, so
    // its backing store composites as opaque black the instant it exists —
    // mountFog above is what actually delivers "degrades to the flat
    // background" for those, by removing the canvas.
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    })
    if (!gl) return false

    const styles = getComputedStyle(document.documentElement)
    const colors = {
      baseColor: parseHexColor(styles.getPropertyValue('--fog-base')),
      lowlightColor: parseHexColor(styles.getPropertyValue('--fog-lowlight')),
      midtoneColor: parseHexColor(styles.getPropertyValue('--fog-midtone')),
      highlightColor: parseHexColor(styles.getPropertyValue('--fog-highlight')),
    }
    // Bailing beats uploading NaN: a partly-parsed palette renders garbage,
    // whereas removing the canvas (see mountFog above) renders the correct
    // flat background. This also covers the one assumption worth naming —
    // --fog-base is declared as var(--color-bg-primary), and this code relies
    // on getPropertyValue returning the substituted value. That is the
    // spec'd behaviour for a custom property's computed value, but if any
    // engine ever handed back the literal `var(...)` the parse fails here.
    if (Object.values(colors).some(color => color === null)) return false

    const speed = parseScalar(styles.getPropertyValue('--fog-speed'), 0.55)
    const blurFactor = parseScalar(styles.getPropertyValue('--fog-blur-factor'), 0.6)
    const zoom = parseScalar(styles.getPropertyValue('--fog-zoom'), 1)

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vertexShader || !fragmentShader) return false

    const program = gl.createProgram()
    if (!program) return false
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[fog] program link failed:', gl.getProgramInfoLog(program))
      return false
    }
    // Standard idiom: the program keeps its own copy once linked, so the
    // standalone shader objects are just sources and compiled intermediates
    // from here on.
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
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

    // The @media block in global.css only collapses CSS animations and
    // transitions; it cannot reach a requestAnimationFrame loop, which is the
    // same gap Reveal.astro documents. So this script checks the preference
    // itself: start() below refuses to schedule the loop when it's set, which
    // keeps the texture and drops the motion.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // One guard for three inputs — reduced motion, intersection, and tab
    // visibility all funnel through start()/stop(). Without it, an element
    // scrolling back in while the tab regains focus schedules a second loop
    // and the field runs at double speed.
    let frameId: number | null = null
    let previousNow: number | null = null
    let frames = 0
    let onScreen = false
    // Set once by webglcontextlost and never cleared — there is no restore
    // path, so this flag is what makes that degradation permanent rather than
    // a one-frame stall. See start() and the listener below.
    let contextLost = false

    function draw() {
      // Frames, not wall-clock seconds: iTime = frames / 60 mirrors Vanta's
      // own pace formula (t2 * 0.016667), so --fog-speed scales the same rate
      // Vanta produces rather than an unrelated one.
      gl.uniform1f(uTime, frames / 60)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    function tick(now: number) {
      frameId = requestAnimationFrame(tick)
      if (previousNow !== null) {
        // Clamp so one long frame cannot lurch the field forward. The
        // reachable case is a main-thread stall or a throttled rAF while the
        // tab still reports visible: a 200ms hitch would otherwise advance
        // time by 12 frames at once. It is NOT the backgrounded-tab case —
        // that is handled by stop() plus previousNow = null, which makes the
        // first frame after a resume contribute nothing. Vanta needs the clamp
        // for the backgrounded case because it keeps its loop running with a
        // stale timestamp; this loop does not.
        //
        // Vanta also floors the step at 0.2. Dropped deliberately: the floor
        // only engages above ~300Hz, where it makes the field run ~1.6x fast
        // at 480Hz. It changes nothing at 60, 120, or 240Hz.
        const step = Math.min((now - previousNow) / (1000 / 60), 5)
        frames += step * speed
      }
      previousNow = now
      draw()
    }

    function start() {
      if (frameId !== null || prefersReducedMotion || contextLost) return
      previousNow = null
      frameId = requestAnimationFrame(tick)
    }

    function stop() {
      if (frameId === null) return
      cancelAnimationFrame(frameId)
      frameId = null
    }

    function resize() {
      const dpr = window.innerWidth < MOBILE_BREAKPOINT
        ? 1
        : Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const width = Math.max(1, Math.round(container.clientWidth * dpr))
      const height = Math.max(1, Math.round(container.clientHeight * dpr))
      const changed = canvas.width !== width || canvas.height !== height
      // Guarded because assigning canvas.width reallocates and clears the
      // drawing buffer even when the value is unchanged. viewport and uniform2f
      // are idempotent and cost nothing, so they run every call — that is what
      // stops "have the dimensions changed" from also gating "has iResolution
      // ever been uploaded". Those two were entangled, and entangled they left
      // a path to draw() with iResolution at (0,0), dividing by zero in the
      // shader.
      if (changed) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, width, height)
      gl.uniform2f(uResolution, width, height)
      return changed
    }

    // Size, then draw unconditionally. Keeping the draw out of resize() is what
    // makes "exactly one frame under reduced motion" literally true.
    resize()
    draw()

    new ResizeObserver(() => {
      // Only the paused and reduced-motion cases need this; a running loop
      // redraws on its own next frame anyway.
      if (resize() && frameId === null) draw()
    }).observe(container)

    canvas.addEventListener('webglcontextlost', event => {
      // preventDefault is required for the event to count as handled at all.
      // The flag is what makes the degradation permanent: without it the
      // observers below are still live, so the next scroll-in calls start()
      // and spins a 60fps rAF against a dead context — nothing renders and the
      // page never idles its frame loop again.
      event.preventDefault()
      contextLost = true
      stop()
    })

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop()
      else if (onScreen) start()
    })

    // Replaces Vanta's per-frame isOnScreen() scan. entries.length - 1, not
    // [0]: the browser batches one entry per crossing and can deliver several
    // in one callback, so a fast scroll can arrive as enter-exit-enter in a
    // single call — taking the oldest record would leave onScreen false, and
    // the loop stopped, while the hero is actually visible.
    new IntersectionObserver(entries => {
      onScreen = entries[entries.length - 1].isIntersecting
      if (onScreen && !document.hidden) start()
      else stop()
    }).observe(container)

    return true
  }

  document.querySelectorAll<HTMLElement>('[data-fog-layer]').forEach(mountFog)
</script>
```

- [x] **Step 4: Mount it in the hero**

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
<section class="relative isolate flex min-h-[880px] items-center overflow-hidden">
  <FogBackground />
  <Container>
```

Leave everything from `<div class="mx-auto flex max-w-[1088px]...` onwards untouched.

> **Amended after execution:** the section's original `py-24` was dropped on request. It was invisible at desktop width — `min-h-[880px]` is `border-box`, so the 96px sat *inside* the 880 and `items-center` centred the content identically either way. It only did work once the headline wrapped tall enough to exceed the 688px content box, which is a narrow-viewport case; see the note below on what replaced it there.

- [x] **Step 5: Run the tests to verify they pass**

```bash
npm run build && npx vitest run tests/home-structure.test.ts -t "hero fog background"
```

Expected: PASS, 3 tests.

- [x] **Step 6: Run the whole suite, to prove nothing else moved**

```bash
npm test
```

Expected: PASS, every test in all three files. The hero's other assertions (single `h1`, decorative avatar) must still pass — the fog is inserted before `<Container>`, not inside the heading.

- [x] **Step 7: Commit**

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

- [x] **Step 1: Start the dev server**

Use the `preview_start` tool with `{name: "Astro dev"}` (the config already exists in `.claude/launch.json`). Do not run `astro dev` through Bash.

- [x] **Step 2: Confirm the console is clean**

Use `read_console_messages`. Expected: no errors. Specifically, no `[fog] shader compile failed` and no `[fog] program link failed` — those two messages are the component's own diagnostics and either one means the shader never ran.

- [x] **Step 3: Confirm the stacking order actually resolved as designed**

`global.css:25-33` documents a past bug in exactly this area, so the reasoning behind `isolate` gets verified rather than trusted. Use `javascript_tool`:

> **Correction from execution:** the `heroTextOnTop` line below is **vacuous** — do not treat a text result as proof. The layer and its canvas are `pointer-events: none`, so `elementFromPoint` skips them whatever their `z-index`; it would return a `SPAN` even with the negative index deleted. The real guard is the `z-index: -1` assertion in `tests/home-structure.test.ts`, which was verified to go red when the rule is broken. The rest of the readback below is sound and worth running.

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

- [x] **Step 4: Confirm the fog is moving**

> **Correction from execution: do not use the screenshot-pair method below in the in-app browser pane.** That pane reports `document.hidden === true` permanently, and hidden pages get no "update the rendering" steps, so `requestAnimationFrame` never fires there. The two frames are *necessarily* identical and the stated diagnosis ("the loop never started — check `IntersectionObserver` and the `frameId` guard") would send you chasing a phantom bug in correct code. Confirmed by measurement: 0 rAF calls over 18 seconds, which is the `visibilitychange` guard working. A `ResizeObserver` installed by hand also fired 0 times, which is separately why the canvas backing store does not follow a viewport resize in that pane.
>
> What was used instead, and works: recompile the same GLSL in a throwaway context with `preserveDrawingBuffer: true`, render at two `iTime` values, and `readPixels` both. Result: 85.6% of pixels differed between `iTime` 0 and 5.5, and 0 of 25,600 pixels were non-grey — which doubles as the empirical monochrome check. In a normal browser tab the screenshot-pair method is fine.

Original step, kept for use outside the in-app pane: take a `computer` screenshot, wait 3 seconds with `computer` `{action: "wait", duration: 3}`, take a second screenshot. The two must show visibly different cloud shapes.

- [x] **Step 5: Confirm reduced motion produces a static frame**

The Browser pane cannot emulate `prefers-reduced-motion`, so force it temporarily. In `src/components/ui/FogBackground.astro`, change:

```js
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

to:

```js
    const prefersReducedMotion = true // TEMPORARY — revert in this same step
```

Reload, screenshot, wait 3 seconds, screenshot again. Expected: the fog is visible (texture is present, the section is not flat black) and the two screenshots are identical. Then **revert the line** and confirm with `git diff src/components/ui/FogBackground.astro` that the working tree is clean. Do not commit while the line is forced.

- [x] **Step 6: Check mobile**

`resize_window` with `{preset: "mobile"}`. Screenshot. Expected: the fog fills the hero with no horizontal overflow and no visible seam at the bottom of the section. Then `javascript_tool` with:

```js
(() => {
  const canvas = document.querySelector('[data-fog-layer] canvas');
  return { backingWidth: canvas.width, cssWidth: canvas.clientWidth, dpr: window.devicePixelRatio };
})()
```

Expected: `backingWidth === cssWidth` — the mobile branch pins DPR to 1. Restore with `resize_window` `{preset: "desktop"}`.

- [x] **Step 7: If it renders but feels heavy, tune it — otherwise skip**

The levers, in order of preference: lower `MAX_DPR` from `1.5` to `1.25`, then drop `#define NUM_OCTAVES 6` to `4` in the fragment shader. Do not lower `--fog-speed` for performance reasons — speed does not affect cost. If either lever is used, record what changed and why in a comment, and rerun Steps 4 and 6.

- [x] **Step 8: Report the evidence and commit any tuning**

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

- [x] **Step 1: Run the full suite against a fresh build**

```bash
npm test
```

Expected: PASS across `tests/content.test.ts`, `tests/home-structure.test.ts`, and `tests/build-output.test.ts`.

- [x] **Step 2: Confirm no dependency crept in**

```bash
git diff e0cc844..HEAD --stat -- package.json package-lock.json
```

Expected: empty output. The whole point of the port is that neither file changes.

Note the baseline: `e0cc844` is the commit before this feature's spec, **not** `main`. An earlier draft of this step compared against `main` and was wrong — the `redesign/home-portfolite` branch already changed `package.json` for the typeface swap long before the fog work, so that comparison is never empty and says nothing about this feature.

- [x] **Step 3: Confirm the working tree is clean**

```bash
git status --short
```

Expected: empty. In particular, the temporary `prefersReducedMotion = true` from Task 3 Step 5 must be gone.

---

## Execution findings

All four tasks are complete and every step above is ticked. The suite is at 37 tests, `git diff e0cc844..HEAD -- package.json package-lock.json` is empty, and the working tree is clean.

**Task 3 Step 7 (performance tuning) was deliberately skipped.** The fog rendered without any sign of strain, so neither the `MAX_DPR` nor the `NUM_OCTAVES` lever was touched. Nothing was measured against a low-end device, so that remains untested rather than proven fine.

**Eight defects were found by review, and every one of them originated in this plan rather than in its execution.** Recorded because the pattern is the lesson: the transcription was reliable and the reasoning was not.

1. `hexToRgb` failed open — `parseInt` yields `NaN` for non-hex input and `NaN >> 16 & 255` is `0`, so an unparseable colour would have passed the greyscale check as black and scored 21:1 on contrast. Now throws.
2. The `@theme` rationale was backwards. `@theme` would not emit unwanted `bg-fog-*` utilities; the real hazard is that it emits only variables something in the CSS references, so JS-only tokens are tree-shaken away entirely. Verified by moving the block and rebuilding.
3. The `.bg-fog-` assertion attached to that wrong rationale could not fail. Deleted; the token-presence test was strengthened to require a real declaration and now carries the guarantee.
4. `webglcontextlost` set no flag, so the still-live observers would restart a 60fps loop against a dead context — a permanent no-op spin. The comment promised a permanence the code did not deliver.
5. The step clamp's comment described the backgrounded-tab case, which `stop()` plus a null previous timestamp already makes unreachable. Vanta's `0.2` floor was also dropped: it engages only above ~300Hz, where it makes the field run ~1.6× fast.
6. The bail paths did not degrade to the flat background. With `alpha: false` a live context that was never drawn to composites as *opaque black*, so a half-initialised canvas painted a black band. It is `canvas.remove()` that delivers the fallback.
7. A comment claimed the restructure had decoupled "have the dimensions changed" from "has `iResolution` ever been uploaded". It had not — `resize()` still returned before the upload. Fixed by making the claim true rather than rewording it.
8. The `-webkit-mask-image` question was got wrong twice, in opposite directions, before being settled by measurement. It was first removed on the premise that the build prefixes by browser target (false). Review then said to hand-write it, on the premise that the pipeline passes no targets and so prefixes nothing (also false). What actually happens: the pipeline normalises prefixes to a modern target, so it neither adds them nor keeps hand-written ones — adding the prefix and rebuilding yields `dist/` with it stripped. The rule therefore ships unprefixed, which is a real if narrow limitation below Chrome 120 / Safari 16, and the escape hatch is a shader-side vertical ramp rather than CSS. **The lesson is the one this whole list repeats: three confident mechanisms, none of them checked against the build until the third try.**

**Two verification steps as written could not fail, which is worse than a failing check.** Both are corrected in place above: `elementFromPoint` cannot detect the stacking bug it was aimed at, because `pointer-events: none` makes hit testing skip the layer regardless of `z-index`; and the screenshot-pair motion check is impossible in the in-app browser pane, which reports `document.hidden` permanently and therefore never runs `requestAnimationFrame` or `ResizeObserver`. The `z-index: -1` regression test and an offscreen `preserveDrawingBuffer` recompile replaced them.

**One number in the spec was wrong.** `--fog-highlight` was described as a hard ceiling; the shader's final mix factor is unclamped, so real output reaches `#303030` against a `#2E2E2E` token and white text measures 13.2:1, not the 13.58:1 the token implies. The AAA margin is untouched.

**Two known limitations, neither addressed.** `frames` accumulates unbounded while the hero is visible, so `iTime` loses float32 precision over a multi-hour session — inherited from Vanta verbatim and unreachable in practice. And there is no listener teardown, which is correct only while the site has no `ClientRouter`; adding view transitions later would leak a `visibilitychange` listener and two observers per navigation.
