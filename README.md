# 4IM/Flux

**A real-time GPU fluid playground.**

A React + TypeScript port of [Pavel Dobryakov's WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)
(MIT), extended with a particle layer, a preset system, image sources and capture. This is the
standalone project repo: one route, one canvas, everything exposed.

```bash
npm install
npm run dev        # http://localhost:3000
```

## What it is

The solver is faithful to upstream — advection, vorticity confinement, divergence, Jacobi
pressure projection, dye and velocity fields on renderable float textures. It is not a
domain-warp fake. On top of that:

- **98 presets** — 14 house families (champagne, old gold, vellum, ink wash, brass, platinum,
  sepia, copper leaf…) and 12 classic families (neon, lava, toxic, cyber, ultraviolet…), each in
  four intensities — Subtle, Balanced, Intense, Wild — plus two signatures.
- **Save your own** — any state can be named and stored in `localStorage` (key
  `aimirah.fluid.presets.v1`), grouped under the *Saved* tab.
- **Particles** — a GPGPU layer, 4k–65k points whose positions live in a float texture and are
  advected by the velocity field each frame, tinted by the dye they swim through.
- **Multitouch** — pointer events with per-pointer tracking; every finger splats independently.
- **Images** — load a file as a backdrop, or dissolve it into the field as a grid of
  pixel-coloured splats ("Use as fluid source").
- **Capture** — pause, PNG stills at any resolution, webm recording via `MediaRecorder`.
  Keyboard: **Space** pauses, **R** throws splats, **S** saves a still.
- **Four quality tiers** — Low / Medium / High / Ultra remap sim and dye resolution, pressure
  iterations, bloom, sunrays and particle count. Every underlying key is also a slider.
- **Palette windows** — `COLOR_HUE_MIN` / `COLOR_HUE_MAX` / `COLOR_SATURATION` / `COLOR_VALUE`
  narrow `generateColor()`, which is how the house presets stay gold.
- **Ambient splats** — `AUTO_SPLATS` throws a gentle splat on an interval so an unattended
  canvas keeps moving.

## Using the component in your own app

`FluxCanvas` is self-contained — drop it in and drive it through the ref.

```tsx
"use client";
import { useRef } from "react";
import FluxCanvas, { type FluxCanvasHandle } from "@/components/flux/FluxCanvas";

export default function Backdrop() {
  const flux = useRef<FluxCanvasHandle>(null);

  return (
    <div className="relative h-[26rem] w-full">
      <FluxCanvas
        ref={flux}
        config={{ DENSITY_DISSIPATION: 0.92, PARTICLE_COUNT: 4096, AUTO_SPLATS: 2 }}
        adaptiveQuality
      />
      <button onClick={() => flux.current?.randomSplats(14)}>Splat</button>
    </div>
  );
}
```

Props: `config` (applied once on mount), `className`, `interactive`, `backgroundImage`
(forces the canvas transparent and sits the image behind it), `pauseWhenOffscreen` (default
`true`), `adaptiveQuality` (default `false`), `onReady`.

Handle: `sim()`, `setConfig()`, `randomSplats()`, `clear()`, `imageSplats()`, `screenshot()`,
`screenshotDataURL()`, `startRecording()`, `stopRecording()`, `isRecording()`, `info()`.

## Layout

```
src/lib/fluid/
  fluid.core.js            factory-wrapped upstream solver + particles, capture, palettes
  fluid.core.d.ts          types for the above
  defaults.ts              every config key with its default
  presets.ts               98 presets, 4 quality tiers, showcase config
  index.ts                 public exports
  LICENSE-fluid-simulation.txt
src/components/flux/
  FluxCanvas.tsx           React wrapper: pointer input, resize, lifecycle, imperative handle
  FluxStudio.tsx           the control panel
  controls.tsx             house-styled slider / toggle / choice primitives
src/app/                   the studio route (this app's only page)
fluid-src/
  build-core.mjs           regenerates src/lib/fluid/fluid.core.js from upstream script.js
  script.js                upstream source, verbatim
  LICENSE                  upstream MIT licence
```

**Never hand-edit `fluid.core.js`.** It is generated. To pick up upstream changes, replace
`fluid-src/script.js` and run `npm run core`; the transform re-applies every local extension and
fails loudly if an anchor it depends on has moved.

## Performance

- **Nothing renders offscreen.** The solver parks itself via an `IntersectionObserver` and on
  `visibilitychange`.
- **High-DPI is clamped** — `MAX_PIXEL_RATIO` caps the drawing buffer (1.5 for the showcase
  band). A soft fluid field does not need 2×.
- **No forced layout per frame** — the core only re-measures the canvas when the `ResizeObserver`
  reports a change, not on every frame.
- **Adaptive quality** — with `adaptiveQuality`, two consecutive slow two-second windows below
  30fps drop internal quality in two steps (dye 512→256, sunrays off, then bloom/shading off and
  fewer particles). Each step is logged to the console. Leave it off when you want quality to be
  your call.

## Provenance

The solver is Pavel Dobryakov's WebGL-Fluid-Simulation, MIT, © 2017. The upstream licence is
kept at `fluid-src/LICENSE` and `src/lib/fluid/LICENSE-fluid-simulation.txt`, and the upstream
header is preserved at the top of `fluid.core.js`. Upstream ships no particle system, no preset
system and no image UI — those were written here, in the transform's appended API block.

## Hosting

Fully client-side, so it exports to static files:

```bash
STATIC_EXPORT=1 npm run build   # emits out/ — drop it on any host
```
