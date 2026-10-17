# js-pointing-cursor

Framework-agnostic oversized pointing cursor with **Vue** and **React** adapters.

Repository: [github.com/MurzNN/js-pointing-cursor](https://github.com/MurzNN/js-pointing-cursor)

- Curved, human-like `moveTo` (coords or CSS selector)
- Follow mode, dangling aim, click press + radiating burst
- Bundled arrow / pointer / hand SVG shapes

## Packages

| Package | Role |
| --- | --- |
| [`js-pointing-cursor`](packages/core) | Core controller (no framework) |
| [`vue-pointing-cursor`](packages/vue) | Vue 3 component |
| [`react-pointing-cursor`](packages/react) | React component |

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

## Install via shadcn-vue (Vue)

From the GitHub registry (copies sources into your project):

```bash
pnpm dlx shadcn-vue@latest add MurzNN/js-pointing-cursor/vue-pointing-cursor
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

From the GitHub registry:

```bash
pnpm dlx shadcn@latest add MurzNN/js-pointing-cursor/react-pointing-cursor
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

## Vue quick start

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VuePointingCursor } from 'vue-pointing-cursor'

const cursor = ref<InstanceType<typeof VuePointingCursor> | null>(null)
</script>

<template>
  <VuePointingCursor ref="cursor" shape="arrow" />
  <button type="button" @click="cursor?.moveTo(120, 180)">Move</button>
</template>
```

## React quick start

```tsx
import { useRef } from 'react'
import { ReactPointingCursor, type ReactPointingCursorHandle } from 'react-pointing-cursor'

export function Demo() {
  const cursor = useRef<ReactPointingCursorHandle>(null)
  return (
    <>
      <ReactPointingCursor ref={cursor} shape="arrow" />
      <button type="button" onClick={() => void cursor.current?.moveTo(120, 180)}>
        Move
      </button>
    </>
  )
}
```

## Demos

- [Vue playground](https://murznn.github.io/js-pointing-cursor/vue/)
- [React playground](https://murznn.github.io/js-pointing-cursor/react/)

## Development

```bash
pnpm install
pnpm dev:vue          # Vue playground
pnpm dev:react        # React playground
pnpm test
pnpm build
pnpm build:playground
```

Monorepo layout: `packages/{core,vue,react}`, `apps/playground-{vue,react}`.

## License

MIT
