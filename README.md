# Forge: a 3D scroll-driven product showcase

Forge is a single-page, fully 3D storefront. One continuous WebGL scene plays as you scroll: a particle galaxy collapses into the product, the product explodes into labelled parts, morphs through colourways, flies through a warp tunnel into a 3D collection carousel, rains down as physics objects, and lands on a glowing checkout pedestal with a working cart.

It is built as a **reusable template**. Brand, product, copy, colourways, features, collection and scene lengths all live in one file: [`src/config/site.config.ts`](src/config/site.config.ts). Swap that file (and optionally drop in a GLB model) to get a new store page or client site.

## The scroll story

| # | Section | What happens in 3D |
|---|---------|--------------------|
| 1 | Hero | 42k GPU particles in a spiral galaxy morph into the product's surface (custom GLSL), then the real model fades in |
| 2 | Engineering | The product explodes into its parts with staggered timing and floating feature labels; the camera orbits |
| 3 | Configurator | Scrolling morphs the product through every colourway (colour, metalness, roughness, background); orbiting colour orbs and swatch buttons stay in sync |
| 4 | Portal | The product shrinks into a glowing ring with a swirling event-horizon shader, then the camera flies through a neon warp tunnel with light streaks and scroll-reactive chromatic aberration |
| 5 | Collection | A scroll-driven 3D carousel of every model on glowing pedestals; click a product (or its chip) to add it to the cart |
| 6 | Drop | Branded boxes and orbs rain onto a stage with real rigid-body physics (Rapier); a chrome ball follows your cursor so you can shove them |
| 7 | Checkout | The colourway you picked spins on a pedestal with halo rings, a light beam and heavy bloom; add to cart, open the cart drawer |

## Stack

| Layer | Library |
|-------|---------|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Geist fonts |
| 3D engine | Three.js via React Three Fiber |
| 3D helpers | @react-three/drei (Html labels, Float, Sparkles, Stars, Environment + Lightformers, PerformanceMonitor) |
| Post-processing | @react-three/postprocessing (Bloom, Chromatic Aberration, Vignette, Noise, AgX tone mapping) |
| Physics | @react-three/rapier (Rapier WASM) |
| Scroll | Lenis smooth scroll, driven by the GSAP ticker |
| Scroll animation | GSAP + ScrollTrigger (text reveals, counters, pinned panels) |
| UI animation | Motion (cart drawer, toasts, loader, buttons) |
| Text splitting | SplitType (character-by-character 3D heading reveals) |
| Shaders | Custom GLSL: particle morph, portal disc, warp tunnel, light beam, stage floor |
| State | Zustand (cart, selected colourway, active section) |
| Debug | Leva (add `?debug` to the URL to tweak bloom, aberration and grain live) |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck
```

Node 20+ is recommended.

## Make it yours

Everything a client cares about is in **`src/config/site.config.ts`**:

- `brand`: name, tagline, currency
- `product`: name, price and which model to render
- `colorways`: each has primary, accent, soft colour, metalness, roughness and a background tint. Add or remove as many as you like; the configurator, orbs, swatches and physics drop all adapt.
- `features`: the labels shown in the exploded view, each attached to a named part
- `collection`: the products in the carousel (name, price, colourway, optional tag)
- `sections`: the copy for each scroll section, its alignment, and its **length in viewport heights**. Longer sections make that scene play slower. The camera path and every scene timeline are keyed to these sections, so they stay in sync automatically.

### Using your own 3D model

The template ships with procedural headphones built from primitives, so there are no binary assets to license. To use a real product:

1. Export a GLB (Blender, Spline, or a free-licensed model from Poly Haven / Sketchfab CC0). Keep it under ~5 MB and use Draco or Meshopt compression if possible.
2. Put it in `public/models/`, e.g. `public/models/sneaker.glb`.
3. In the config set `product.model: "/models/sneaker.glb"`.
4. Name the materials you want recoloured by the configurator in `glbColorMaterials` (body) and `glbAccentMaterials` (trim/glow).

Every mesh in the GLB becomes an explodable part, and the hero particle galaxy samples the GLB's surface automatically.

### Tuning scenes

- Camera path: `src/components/canvas/CameraRig.tsx` (keyframes are `[section, progress]`, so they move with your section lengths)
- Each scene: `src/components/canvas/scenes/*`
- Shaders: `src/shaders/*`
- Post-processing defaults: `src/components/canvas/Effects.tsx` (or live with `?debug`)

## How it works

- **One canvas, one scroll source.** Lenis smooths the native scroll and is driven by the GSAP ticker, so ScrollTrigger and Lenis share one clock. On every scroll it writes a plain mutable object (`src/lib/scroll.ts`) with the position in viewport heights.
- **No React re-renders on scroll.** Every 3D scene reads that object inside `useFrame` and derives its own local 0 to 1 progress from the section ranges in the config.
- **DOM over WebGL.** Each section is a tall `<section>` with a CSS-sticky panel, so text is real, selectable, accessible HTML layered above the fixed canvas.
- **Only what is on screen runs.** Scenes hide themselves outside their range, physics only simulates while visible, and `PerformanceMonitor` lowers the pixel ratio on slower GPUs. Mobile gets fewer particles and a wider camera.

## Deploy

The easiest path is Vercel: push this repo to GitHub, then import it at [vercel.com/new](https://vercel.com/new). No environment variables are needed.

For any static host, build a static export:

```bash
STATIC_EXPORT=1 npm run build   # outputs ./out
```

## Turning it into revenue

- **Ecommerce:** the cart lives in Zustand (`src/lib/store.ts`). Point the Checkout button at Shopify's Storefront API, Stripe Checkout or WooCommerce to make it a real store.
- **Client work:** sell it as a premium "3D launch page" package. Each new client is mostly a config file and a GLB.
- **Templates:** package variants (sneakers, watches, cars, furniture) and sell them on marketplaces, or use them as portfolio pieces that show off WebGL skills.

## Project structure

```
src/
  app/                  Next.js app router (layout, page, global CSS)
  config/site.config.ts All brand, product, copy and scene settings
  lib/                  Scroll state, Zustand store, HTML overlay layer
  shaders/              GLSL for particles and the tunnel
  components/
    ClientRoot.tsx      Mounts canvas, scroll, sections and UI
    canvas/             Everything WebGL
      Experience.tsx    Canvas, lighting, scenes, effects
      CameraRig.tsx     Scroll-driven camera spline
      Effects.tsx       Post-processing
      product/          Procedural model, GLB loader, live colour "look"
      scenes/           Hero, explode, configurator, portal, collection, physics, checkout
    dom/                Lenis bridge, sections, SplitType headings, nav, cart, cursor, loader
```
