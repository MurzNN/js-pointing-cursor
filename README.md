# js-pointing-cursor

Framework-agnostic oversized pointing cursor with **Vue** and **React** adapters.

Repository: [github.com/MurzNN/js-pointing-cursor](https://github.com/MurzNN/js-pointing-cursor)

<!-- pkg:all -->
- Curved, human-like `moveTo` (coords or CSS selector)
- Follow mode, dangling aim, click press + radiating burst
- Bundled arrow / pointer / hand SVG shapes

![js-pointing-cursor demo](https://raw.githubusercontent.com/MurzNN/js-pointing-cursor/main/demo/pointing-cursor-demo.gif)

Interactive demos: 
[Vue playground](https://murznn.github.io/js-pointing-cursor/vue/) 
| [React playground](https://murznn.github.io/js-pointing-cursor/react/)
<!-- /pkg:all -->

## Packages

| Package | Role |
| --- | --- |
| [`js-pointing-cursor`](packages/core) | Core controller (no framework) |
| [`vue-pointing-cursor`](packages/vue) | Vue 3 component |
| [`react-pointing-cursor`](packages/react) | React component |

<!-- pkg:vue
## Install

```bash
pnpm add vue-pointing-cursor
```
-->

<!-- pkg:react
## Install

```bash
pnpm add react-pointing-cursor
```
-->

<!-- pkg:omit -->
## Install (npm)

```bash
pnpm add vue-pointing-cursor
# or
pnpm add react-pointing-cursor
```

Core alone (headless / custom UI):

```bash
pnpm add js-pointing-cursor
```
<!-- /pkg:omit -->

<!-- pkg:vue
## Install via shadcn-vue

From the GitHub registry (copies sources into `components/ui/pointing-cursor`):

```bash
pnpm dlx shadcn-vue@latest add MurzNN/js-pointing-cursor/vue-pointing-cursor
```

```ts
import { PointingCursor } from '@/components/ui/pointing-cursor'
```

Or point `components.json` at the hosted registry on GitHub Pages:

```json
{
  "registries": {
    "@pointing-cursor": "https://murznn.github.io/js-pointing-cursor/r/{name}.json"
  }
}
```

```bash
pnpm dlx shadcn-vue@latest add @pointing-cursor/vue-pointing-cursor
```
-->

<!-- pkg:react
## Install via shadcn

From the GitHub registry (copies sources into `components/ui/pointing-cursor`):

```bash
pnpm dlx shadcn@latest add MurzNN/js-pointing-cursor/react-pointing-cursor
```

```ts
import { PointingCursor } from '@/components/ui/pointing-cursor'
```

Or with a hosted registry entry on GitHub Pages:

```json
{
  "registries": {
    "@pointing-cursor": "https://murznn.github.io/js-pointing-cursor/r/{name}.json"
  }
}
```

```bash
pnpm dlx shadcn@latest add @pointing-cursor/react-pointing-cursor
```
-->

<!-- pkg:omit -->
## Install via shadcn-vue (Vue)

From the GitHub registry (copies sources into `components/ui/pointing-cursor`):

```bash
pnpm dlx shadcn-vue@latest add MurzNN/js-pointing-cursor/vue-pointing-cursor
```

```ts
import { PointingCursor } from '@/components/ui/pointing-cursor'
```

Or point `components.json` at the hosted registry on GitHub Pages:

```json
{
  "registries": {
    "@pointing-cursor": "https://murznn.github.io/js-pointing-cursor/r/{name}.json"
  }
}
```

```bash
pnpm dlx shadcn-vue@latest add @pointing-cursor/vue-pointing-cursor
```

## Install via shadcn (React)

From the GitHub registry (copies sources into `components/ui/pointing-cursor`):

```bash
pnpm dlx shadcn@latest add MurzNN/js-pointing-cursor/react-pointing-cursor
```

```ts
import { PointingCursor } from '@/components/ui/pointing-cursor'
```

Or with a hosted registry entry (same Pages `/r` base as Vue):

```json
{
  "registries": {
    "@pointing-cursor": "https://murznn.github.io/js-pointing-cursor/r/{name}.json"
  }
}
```

```bash
pnpm dlx shadcn@latest add @pointing-cursor/react-pointing-cursor
```

> Prefer the npm packages when you want a dependency instead of vendored source. Registry installs are best for apps already using the shadcn / shadcn-vue workflow.
<!-- /pkg:omit -->

<!-- pkg:vue
## Quick start

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { PointingCursor } from 'vue-pointing-cursor'

const cursor = ref<InstanceType<typeof PointingCursor> | null>(null)
</script>

<template>
  <PointingCursor ref="cursor" shape="arrow" />
  <button type="button" @click="cursor?.moveTo(120, 180)">Move</button>
</template>
```
-->

<!-- pkg:react
## Quick start

```tsx
import { useRef } from 'react'
import { PointingCursor, type PointingCursorHandle } from 'react-pointing-cursor'

export function Demo() {
  const cursor = useRef<PointingCursorHandle>(null)
  return (
    <>
      <PointingCursor ref={cursor} shape="arrow" />
      <button type="button" onClick={() => void cursor.current?.moveTo(120, 180)}>
        Move
      </button>
    </>
  )
}
```
-->

<!-- pkg:omit -->
## Vue quick start

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { PointingCursor } from 'vue-pointing-cursor'

const cursor = ref<InstanceType<typeof PointingCursor> | null>(null)
</script>

<template>
  <PointingCursor ref="cursor" shape="arrow" />
  <button type="button" @click="cursor?.moveTo(120, 180)">Move</button>
</template>
```

## React quick start

```tsx
import { useRef } from 'react'
import { PointingCursor, type PointingCursorHandle } from 'react-pointing-cursor'

export function Demo() {
  const cursor = useRef<PointingCursorHandle>(null)
  return (
    <>
      <PointingCursor ref={cursor} shape="arrow" />
      <button type="button" onClick={() => void cursor.current?.moveTo(120, 180)}>
        Move
      </button>
    </>
  )
}
```
<!-- /pkg:omit -->

<!-- pkg:all -->
## Imperative API (via ref)

<!-- pkg:vue
The component exposes these methods on its ref. All motion and click helpers return a `Promise` that resolves when the animation (and optional real DOM event) finishes.
-->
<!-- pkg:react
The component exposes these methods on its `PointingCursorHandle` ref. All motion and click helpers return a `Promise` that resolves when the animation (and optional real DOM event) finishes.
-->
<!-- pkg:omit -->
The component exposes these methods on its ref (Vue instance / React `PointingCursorHandle`). All motion and click helpers return a `Promise` that resolves when the animation (and optional real DOM event) finishes.
<!-- /pkg:omit -->

| Method | Role |
| --- | --- |
| `moveTo(target, …)` | Curved move to coords, a CSS selector, or an `Element` |
| `click(options?)` | Press animation (+ optional real click) at the **current** position |
| `clickAt(target, …)` | Move (optional) then `click` at a target |
| `leftClick(options?)` | Shortcut for `click({ …options, button: 'left' })` |
| `rightClick(options?)` | Shortcut for `click({ …options, button: 'right' })` |
| `show()` / `hide()` | Toggle visibility (same as the `visible` prop) |
| `setFollow(enabled)` | Start/stop follow-mouse mode |
| `getPosition()` | Current hotspot `{ x, y }` in viewport pixels |
| `setMotionStyle(style)` | `'dangling'` (default) or `'standard'` rotation |

### `moveTo`

```ts
moveTo(x: number, y: number, options?: MoveToOptions): Promise<void>
moveTo(selectorOrElement: string | Element, options?: MoveToOptions): Promise<void>
```

| Option | Default | Role |
| --- | --- | --- |
| `animate` | `true` | `false` jumps instantly |
| `duration` | distance-based (`minDuration`…`maxDuration`) | Fixed travel time in ms |

Pass a CSS selector (or an `Element`) instead of coordinates — the cursor moves to the center of the matched element’s bounding box:

<!-- pkg:vue
```ts
await cursor.value?.moveTo('#submit')
await cursor.value?.moveTo('.card button.primary')
await cursor.value?.moveTo('#submit', { animate: false })
await cursor.value?.moveTo('#submit', { duration: 800 })
```
-->

<!-- pkg:react
```ts
await cursor.current?.moveTo('#submit')
await cursor.current?.moveTo('[data-testid="demo-button"]')
await cursor.current?.moveTo('#submit', { animate: false })
await cursor.current?.moveTo('#submit', { duration: 800 })
```
-->

<!-- pkg:omit -->
```ts
// Vue
await cursor.value?.moveTo('#submit')
await cursor.value?.moveTo('.card button.primary')
await cursor.value?.moveTo('#submit', { animate: false })
await cursor.value?.moveTo('#submit', { duration: 800 })

// React
await cursor.current?.moveTo('#submit')
await cursor.current?.moveTo('[data-testid="demo-button"]')
await cursor.current?.moveTo('#submit', { animate: false })
await cursor.current?.moveTo('#submit', { duration: 800 })
```
<!-- /pkg:omit -->

### `click` / `clickAt` / `leftClick` / `rightClick`

```ts
click(options?: ClickOptions): Promise<void>
leftClick(options?: Omit<ClickOptions, 'button'>): Promise<void>
rightClick(options?: Omit<ClickOptions, 'button'>): Promise<void>

clickAt(x: number, y: number, options?: ClickOptions): Promise<void>
clickAt(selectorOrElement: string | Element, options?: ClickOptions): Promise<void>
```

`click` plays the press scale at the **current** hotspot. `clickAt` resolves a target the same way as `moveTo`, optionally moves there, then clicks.

| Option | Default | Role |
| --- | --- | --- |
| `button` | `'left'` | `'left'` or `'right'` (ignored by `leftClick` / `rightClick`) |
| `real` | `false` | When `true`, dispatches pointer/mouse events on the element under the hotspot (`elementFromPoint`) |
| `animate` | `true` | Press-scale animation; also controls whether `clickAt` travels with a curve (`false` jumps) |
| `burst` | prop `clickBurst` | Radiating-lines overlay at the click point |
| `delayMs` | prop `clickAnimationDuration` | Press hold duration in ms |
| `move` | `true` (`clickAt` only) | When `false`, teleports to the target (no travel) before clicking |

Visual-only press (no DOM events):

<!-- pkg:vue
```ts
await cursor.value?.leftClick({ real: false })
await cursor.value?.rightClick({ real: false })
```
-->

<!-- pkg:react
```ts
await cursor.current?.leftClick({ real: false })
await cursor.current?.rightClick({ real: false })
```
-->

<!-- pkg:omit -->
```ts
// Vue
await cursor.value?.leftClick({ real: false })
await cursor.value?.rightClick({ real: false })

// React
await cursor.current?.leftClick({ real: false })
await cursor.current?.rightClick({ real: false })
```
<!-- /pkg:omit -->

Move to a control and fire a real click:

<!-- pkg:vue
```ts
await cursor.value?.clickAt('#submit', { real: true })
await cursor.value?.clickAt('#submit', { real: true, button: 'right' })
await cursor.value?.clickAt(120, 180, { real: true, move: false })
```
-->

<!-- pkg:react
```ts
await cursor.current?.clickAt('#submit', { real: true })
await cursor.current?.clickAt('#submit', { real: true, button: 'right' })
await cursor.current?.clickAt(120, 180, { real: true, move: false })
```
-->

<!-- pkg:omit -->
```ts
// Vue
await cursor.value?.clickAt('#submit', { real: true })
await cursor.value?.clickAt('#submit', { real: true, button: 'right' })
await cursor.value?.clickAt(120, 180, { real: true, move: false })

// React
await cursor.current?.clickAt('#submit', { real: true })
await cursor.current?.clickAt('#submit', { real: true, button: 'right' })
await cursor.current?.clickAt(120, 180, { real: true, move: false })
```
<!-- /pkg:omit -->

Or click where the cursor already is:

<!-- pkg:vue
```ts
await cursor.value?.moveTo('#submit')
await cursor.value?.click({ real: true, button: 'left' })
```
-->

<!-- pkg:react
```ts
await cursor.current?.moveTo('#submit')
await cursor.current?.click({ real: true, button: 'left' })
```
-->

<!-- pkg:omit -->
```ts
await cursor.value?.moveTo('#submit')
await cursor.value?.click({ real: true, button: 'left' })
```
<!-- /pkg:omit -->

### Visibility, follow, position, motion style

<!-- pkg:vue
```ts
cursor.value?.show()
cursor.value?.hide()
cursor.value?.setFollow(true)
cursor.value?.setMotionStyle('standard')
const { x, y } = cursor.value?.getPosition() ?? { x: 0, y: 0 }
```
-->

<!-- pkg:react
```ts
cursor.current?.show()
cursor.current?.hide()
cursor.current?.setFollow(true)
cursor.current?.setMotionStyle('standard')
const { x, y } = cursor.current?.getPosition() ?? { x: 0, y: 0 }
```
-->

<!-- pkg:omit -->
```ts
// Vue
cursor.value?.show()
cursor.value?.hide()
cursor.value?.setFollow(true)
cursor.value?.setMotionStyle('standard')
const { x, y } = cursor.value?.getPosition() ?? { x: 0, y: 0 }

// React
cursor.current?.show()
cursor.current?.hide()
cursor.current?.setFollow(true)
cursor.current?.setMotionStyle('standard')
const { x, y } = cursor.current?.getPosition() ?? { x: 0, y: 0 }
```
<!-- /pkg:omit -->

`setFollow(true)` tracks the native pointer (and can hide it via `hideNativeCursor`). While following, `mirrorNativeClicks` mirrors real mouse downs as press + burst on the oversized cursor.

## Custom SVG shapes

The component paints shapes with two CSS variables (defaults match a classic white cursor with a black outline):

| Variable | Prop | Default | Role |
| --- | --- | --- | --- |
| `--pointing-cursor-fill` | `fill` | `#ffffff` | Interior / body |
| `--pointing-cursor-stroke` | `stroke` | `#000000` | Outline |

Always declare **fallbacks** in the SVG so the shape still looks correct if the variables are unset:

```svg
fill="var(--pointing-cursor-fill, #ffffff)"
stroke="var(--pointing-cursor-stroke, #000000)"
```

### Pattern A — stroked silhouette (like `pointer`)

One closed path: interior via `fill`, outline via `stroke` (bake `stroke-width` into the SVG; there is no runtime stroke-width prop).

```svg
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path
    d="…"
    fill="var(--pointing-cursor-fill, #ffffff)"
    stroke="var(--pointing-cursor-stroke, #000000)"
    stroke-width="2"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
</svg>
```

### Pattern B — baked outline ring (like `arrow` / `hand`)

Many icon SVGs fake a stroke with an **outer path + inner hole** (`fill-rule="evenodd"`). To theme them:

1. Draw the **outer** silhouette with `fill="var(--pointing-cursor-fill, #ffffff)"` (interior).
2. On top, draw the full **evenodd** path (outer + inner) with `fill="var(--pointing-cursor-stroke, #000000)"` (outline ring).

```svg
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Interior -->
  <path d="M…Z" fill="var(--pointing-cursor-fill, #ffffff)" />
  <!-- Outline ring (outer + inner hole) -->
  <path
    fill-rule="evenodd"
    d="M…Z M…Z"
    fill="var(--pointing-cursor-stroke, #000000)"
  />
</svg>
```

Do **not** hard-code `#000` / `#fff` (or `currentColor`) on themed paths — those won’t follow the `fill` / `stroke` props. Tip of the cursor should sit near the hotspot for your shape (see `SHAPE_HOTSPOTS` in core).

<!-- pkg:vue
Replace a bundled shape via the default slot, or swap the SVG strings in `SHAPE_SVGS` after a shadcn install. When editing files under `packages/core/src/shapes/`, run `pnpm shapes:sync` so adapters pick up the change.
-->

<!-- pkg:react
Replace a bundled shape via the `children` render prop, or swap the SVG strings in `SHAPE_SVGS` after a shadcn install. When editing files under `packages/core/src/shapes/`, run `pnpm shapes:sync` so adapters pick up the change.
-->

<!-- pkg:omit -->
Replace a bundled shape via the default slot (Vue) / `children` render prop (React), or swap the SVG strings in `SHAPE_SVGS` after a shadcn install. When editing files under `packages/core/src/shapes/`, run `pnpm shapes:sync` so adapters pick up the change.
<!-- /pkg:omit -->
<!-- /pkg:all -->

## Development

```bash
pnpm install
pnpm dev:vue          # Vue playground
pnpm dev:react        # React playground
pnpm test
pnpm build
pnpm build:playground
```

Monorepo layout: `packages/{core,vue,react}`, `demo/playground-{vue,react}`.

<!-- pkg:omit -->
> Package READMEs on npm are generated from this file via `pnpm readme:packages`.
> Visible regions: `<!-- pkg:all|omit -->` … `<!-- /pkg:… -->`.
> Hidden package-only blocks (whole comment, must not contain `-->`): `<!-- pkg:vue|react|core` … `-->`.
<!-- /pkg:omit -->

## Publishing (npm)

`vue-pointing-cursor` and `react-pointing-cursor` publish from GitHub Actions via [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC). Workflow file: [`.github/workflows/publish.yml`](.github/workflows/publish.yml).

```bash
pnpm release          # patch bump, refresh package READMEs, commit, tag, push
pnpm release minor    # or: major | 0.2.0
pnpm release --dry-run
pnpm release --no-push   # local commit + tag only
```

Pushing a `v*` tag runs tests, builds, and publishes both packages. The trusted-publisher workflow filename on npmjs.com must be exactly `publish.yml`.

## License

MIT
