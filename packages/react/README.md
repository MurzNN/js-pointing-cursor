# react-pointing-cursor

React oversized pointing cursor with curved motion, follow mode, and click burst.

Repository: [github.com/MurzNN/js-pointing-cursor](https://github.com/MurzNN/js-pointing-cursor) · Demo: [https://murznn.github.io/js-pointing-cursor/react/](https://murznn.github.io/js-pointing-cursor/react/)

- Curved, human-like `moveTo` (coords or CSS selector)
- Follow mode, dangling aim, click press + radiating burst
- Bundled arrow / pointer / hand SVG shapes

![js-pointing-cursor demo](https://raw.githubusercontent.com/MurzNN/js-pointing-cursor/main/docs/media/pointing-cursor-demo.gif)

## Install

```bash
pnpm add react-pointing-cursor
```

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

## `moveTo` with CSS selectors

Pass a CSS selector (or an `Element`) instead of coordinates — the cursor moves to the center of the matched element’s bounding box:

```ts
await cursor.current?.moveTo('#submit')
await cursor.current?.moveTo('[data-testid="demo-button"]')
```

Options work the same as with coordinates:

```ts
await cursor.current?.moveTo('#submit', { animate: false })
await cursor.current?.moveTo('#submit', { duration: 800 })
```

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

Replace a bundled shape via the `children` render prop, or swap the SVG strings in `SHAPE_SVGS` after a shadcn install. When editing files under `packages/core/src/shapes/`, run `pnpm shapes:sync` so adapters pick up the change.

## License

MIT

