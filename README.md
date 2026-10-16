# vue-cursor

An oversized Vue 3 cursor with curved, human-like motion, follow mode, replaceable SVG shapes, click animation, and a [shadcn-vue](https://www.shadcn-vue.com/) registry item.

**[Live demo](https://murznn.github.io/vue-cursor/)**

## Features

- Configurable size (default `2em`) with bundled **arrow**, **pointer**, and **hand** shapes
- `stroke`, `fill`, and `strokeWidth` for bundled SVGs
- `show()` / `hide()` and programmatic `moveTo`
- Move to viewport coordinates **or** a CSS selector / `Element` (element center)
- Randomized cubic Bézier paths for natural travel
- Optional follow-the-real-mouse mode
- Click press animation with visual-only or real DOM event dispatch
- Motion styles: `standard` (no rotation) and `dangling` (rotates toward travel)
- Ships as ESM + CJS, generated TypeScript types, and a shadcn-vue registry item

## Installation

```bash
pnpm add vue-cursor
# or: npm install vue-cursor
```

Vue `^3.5` is a peer dependency.

### shadcn-vue

```bash
pnpm dlx shadcn-vue@latest add MurzNN/vue-cursor/vue-cursor
```

Or register the hosted registry from the demo site:

```json
{
  "registries": {
    "@vue-cursor": "https://murznn.github.io/vue-cursor/r/{name}.json"
  }
}
```

```bash
pnpm dlx shadcn-vue@latest add @vue-cursor/vue-cursor
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueCursor } from 'vue-cursor'

const cursor = ref<InstanceType<typeof VueCursor> | null>(null)

async function tour() {
  await cursor.value?.moveTo(120, 180)
  await cursor.value?.moveTo('#signup')
  await cursor.value?.leftClick({ real: true })
}
</script>

<template>
  <VueCursor
    ref="cursor"
    shape="arrow"
    size="2.5em"
    stroke="#111"
    fill="#fff"
    :stroke-width="2"
    motion-style="standard"
  />
  <button id="signup" type="button" @click="tour">Tour</button>
</template>
```

### Plugin (optional)

```ts
import { createApp } from 'vue'
import { VueCursorPlugin } from 'vue-cursor'
import App from './App.vue'

createApp(App).use(VueCursorPlugin).mount('#app')
```

## API

### Props

| Prop | Default | Description |
| --- | --- | --- |
| `size` | `'2em'` | CSS length for the cursor box |
| `shape` | `'arrow'` | `'arrow' \| 'pointer' \| 'hand'` |
| `stroke` / `fill` / `strokeWidth` | black / white / `2` | Bundled SVG styling |
| `visible` | `true` | Show the cursor |
| `followMouse` | `false` | Track the real pointer |
| `hideNativeCursor` | `false` | Set `cursor: none` on `<html>` while following |
| `x` / `y` | — | Controlled viewport position (animates when not following) |
| `hotspotX` / `hotspotY` | per shape | Hotspot as 0–1 fractions of the box |
| `zIndex` | `9999` | Stacking order |
| `minDuration` / `maxDuration` | `280` / `900` | Motion duration clamps (ms) |
| `motionStyle` | `'standard'` | `'standard'` or `'dangling'` |
| `defaultAngle` | per shape | Tip offset from pointing up at rest (`arrow`/`pointer` −45°, `hand` 0°); used by dangling aiming |
| `mirrorNativeClicks` | `true` while following | Mirror real button presses visually |
| `clickAnimationDuration` | `120` | Press animation duration (ms) |

### Methods (`ref`)

| Method | Description |
| --- | --- |
| `show()` / `hide()` | Toggle visibility |
| `moveTo(x, y, options?)` | Animate to viewport coordinates |
| `moveTo(selector \| Element, options?)` | Animate to element center |
| `setFollow(boolean)` | Enable / disable follow mode |
| `getPosition()` | Current `{ x, y }` |
| `click(options?)` / `clickAt(...)` | Press animation; `real: true` dispatches DOM events |
| `leftClick` / `rightClick` | Convenience wrappers |
| `setMotionStyle(style)` | Switch `standard` / `dangling` |

`moveTo` / `click` options include `animate?: boolean`. Click options also include `button`, `real` (default `false`), `delayMs`, and for `clickAt`, `move`.

### Slot

Use the default slot to replace the bundled shape. The parent applies rotation and press scale; honor `data-pressed` if you want shape-level feedback.

## Development

```bash
pnpm install
pnpm dev                 # playground
pnpm test                # unit (Vitest)
pnpm test:e2e            # Playwright against playground
pnpm build               # library → dist/
pnpm build:playground    # registry + demo → playground-dist/
pnpm typecheck
pnpm lint
```

Enable **GitHub Pages** with source **GitHub Actions** after the first successful deploy workflow on `main`.

## License

MIT © Alexey Murz Korepov
