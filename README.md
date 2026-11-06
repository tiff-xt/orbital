# Orbital

**A fictional design and motion studio, rendered entirely with shaders.**
Every visit generates its own identity: the palette, the planet, its rings
and the logo's orbit all come from one short seed that you can reroll or share.

> Orbital, its clients and its work are invented. It's a concept piece by
> [Tiff](https://github.com/tiff-xt).

## What's interesting

### One fragment shader, no engine

The whole sky is a single WebGL2 fragment shader (`src/gl/sceneShader.ts`),
drawn with a small hand-written toolkit (`src/gl/program.ts`) instead of a 3D
library.

- **Nebula:** domain-warped fractal noise (fbm of fbm), masked by a second noise field.
- **Stars:** two hashed grid layers with parallax and twinkle.
- **Planet:** a signed-distance sphere displaced by fractal terrain. It is
  ray-marched only inside an analytic bounding sphere, so pixels of empty sky
  skip the march entirely. Normals use the tetrahedron technique (4 samples, not 6).
- **Rings:** one analytic ray-plane hit per pixel, banded with noise and
  shadowed by casting a second ray toward the light.
- **Atmosphere:** a fresnel rim plus a halo based on how close each ray passes to the planet.
- **Grade:** exponential tone mapping, vignette, and dithering to stop banding.

### Generative identity

`identity(seed)` deterministically produces the palette and every scene
parameter. A tiny inline script resolves the seed and applies the palette's
CSS variables **before first paint**, so there's never a flash of the wrong
colours. A unit test runs that inline script and checks it agrees with the
TypeScript implementation.

### Audio-reactive

Turn on sound and the scene listens:

- **Bass** swells the atmosphere and rings.
- **Mids** churn the nebula.
- **Highs** make the stars flicker.

There are two sources:

- **Synth:** a generative ambient loop built from Web Audio oscillators and
  noise, so there are no audio files to license.
- **Mic:** your microphone, analysed in the browser and never recorded or sent.

Band extraction and the fast-attack, slow-release envelope are pure functions with tests.

### Page transitions through the scene

The canvas lives in the root layout, so it survives navigation. `WarpLink`
animates a `uWarp` uniform: the sky zooms and streaks into hyperspace, the
route changes underneath, then it settles. Your seed travels with you.

### The Lab

`/lab` exposes every parameter as a live control. The URL always reflects the
current state, so any planet is a shareable link. Untrusted URL values are
clamped and repaired. Live readouts show fps, frame time, quality tier and
march steps.

### Performance and resilience

- **Adaptive quality:** a governor watches frame times and steps between
  three tiers of resolution and march steps. Hysteresis and cooldowns keep it
  from flickering between tiers, and it ignores outlier frames such as tab switches.
- **Idle cost:** the render loop pauses when the tab is hidden.
- **Reduced motion:** the scene stops idling but still responds to the
  pointer and to sound, and the warp transition is skipped.
- **No WebGL, or a lost context:** the page falls back to a CSS nebula. All
  content is real HTML on top.
- **Scroll motion:** the manifesto and card reveals are CSS scroll-driven
  animations (`animation-timeline: view()`), with no scroll listeners.

## Stack

Next.js 16 · React 19 · TypeScript (strict) · Tailwind CSS 4 · WebGL2 · GLSL ES 3.0 · Web Audio · Vitest

## Develop

```bash
npm install
npm run dev
npm run check   # typecheck, lint, tests
```
