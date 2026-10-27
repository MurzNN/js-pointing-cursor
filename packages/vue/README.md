# vue-pointing-cursor

Vue 3 oversized pointing cursor with curved motion, follow mode, and click burst.

Repository: [github.com/MurzNN/js-pointing-cursor](https://github.com/MurzNN/js-pointing-cursor) · Demo: [https://murznn.github.io/js-pointing-cursor/vue/](https://murznn.github.io/js-pointing-cursor/vue/)

- Curved, human-like `moveTo` (coords or CSS selector)
- Follow mode, dangling aim, click press + radiating burst
- Bundled arrow / pointer / hand SVG shapes

![js-pointing-cursor demo](https://raw.githubusercontent.com/MurzNN/js-pointing-cursor/main/demo/pointing-cursor-demo.gif)

Interactive demos: 
[Vue playground](https://murznn.github.io/js-pointing-cursor/vue/) 
| [React playground](https://murznn.github.io/js-pointing-cursor/react/)

## Install

```bash
pnpm add vue-pointing-cursor
```

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

## Overlay mounting (`teleportTo`)

By default the cursor DOM is portaled to `document.body` so `position: fixed` tracks the **viewport**. That keeps `moveTo`, follow mode, and clicks correct under CSS-transformed ancestors (for example Slidev’s `scale()`).

| Value | Behavior |
| --- | --- |
| `'body'` (default) | Portal to `document.body` |
| CSS selector / `HTMLElement` | Portal to that node |
| `false` | Keep the node in the component tree (needs a non-transformed containing block) |

To match a scaled stage’s visual size while still aiming in viewport space, scale the `size` prop (Slidev exposes `--slidev-slide-scale` on `:root`):

```vue
<PointingCursor size="calc(3em * var(--slidev-slide-scale, 1))" />
```

After `moveTo(selector | Element)`, the cursor **re-aims on window resize** (and `visualViewport` resize) so it stays on the target when a deck reflows/scales. Disable with `retargetOnResize={false}`, or call `retarget()` manually.

### Local coordinates (`coordinateRoot`)

By default numeric `moveTo(x, y)` is in **viewport** pixels. Set `coordinateRoot` to an element (or selector) to treat numeric coords as that element’s **local CSS pixels** (layout size before CSS transforms) — e.g. Slidev’s design canvas:

```vue
<PointingCursor coordinate-root="#slide-content" />
<!-- moveTo(0, 0) → top-left of the slide, not the browser window -->
```

Local numeric targets are also re-mapped on resize. Selectors/`Element` targets always use viewport bounding boxes.

## Imperative API (via ref)

The component exposes these methods on its ref. All motion and click helpers return a `Promise` that resolves when the animation (and optional real DOM event) finishes.

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
| `retarget()` | Re-resolve the last selector/Element/local target and jump |

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

```ts
await cursor.value?.moveTo('#submit')
await cursor.value?.moveTo('.card button.primary')
await cursor.value?.moveTo('#submit', { animate: false })
await cursor.value?.moveTo('#submit', { duration: 800 })
```

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

```ts
await cursor.value?.leftClick({ real: false })
await cursor.value?.rightClick({ real: false })
```

Move to a control and fire a real click:

```ts
await cursor.value?.clickAt('#submit', { real: true })
await cursor.value?.clickAt('#submit', { real: true, button: 'right' })
await cursor.value?.clickAt(120, 180, { real: true, move: false })
```

Or click where the cursor already is:

```ts
await cursor.value?.moveTo('#submit')
await cursor.value?.click({ real: true, button: 'left' })
```

### Visibility, follow, position, motion style

```ts
cursor.value?.show()
cursor.value?.hide()
cursor.value?.setFollow(true)
cursor.value?.setMotionStyle('standard')
const { x, y } = cursor.value?.getPosition() ?? { x: 0, y: 0 }
```

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

Replace a bundled shape via the default slot, or swap the SVG strings in `SHAPE_SVGS` after a shadcn install. When editing files under `packages/core/src/shapes/`, run `pnpm shapes:sync` so adapters pick up the change.

## License

MIT

