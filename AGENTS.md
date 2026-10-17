# Agent guide for js-pointing-cursor

Instructions for humans and coding agents working in this monorepo.

## Source of truth

- **`packages/core`** (`js-pointing-cursor`) — framework-agnostic controller, motion, shapes, click burst
- **`packages/vue`** (`vue-pointing-cursor`) — thin Vue adapter
- **`packages/react`** (`react-pointing-cursor`) — thin React adapter
- **`apps/playground-vue`** / **`apps/playground-react`** — demos
- Do **not** recreate a parallel tree under the old root `src/`
- `registry/vue/registry.json` lists files for shadcn-vue; run `pnpm registry:build` after catalog changes

## Architecture

```
createCursorController (core)
  → imperative paint on root/inner elements
  → mountClickBurst on document.body
VuePointingCursor / ReactPointingCursor → props/lifecycle/refs only
```

| Concern | Module |
| --- | --- |
| Path + rAF | `packages/core/src/motion.ts` |
| Click press + real events | `packages/core/src/interaction.ts` |
| `standard` / `dangling` rotation | `packages/core/src/motionStyle.ts` |
| Coords / selector → point | `packages/core/src/resolveTarget.ts` |
| Click burst DOM | `packages/core/src/clickBurst.ts` |
| Orchestration | `packages/core/src/createCursorController.ts` |
| Vue shell | `packages/vue/src/VuePointingCursor.vue` |
| React shell | `packages/react/src/ReactPointingCursor.tsx` |

## Rules

- Core must have **zero** `vue` / `react` imports
- TypeScript only; package types come from each package’s Vite/`unplugin-dts` build
- No Tailwind / UnoCSS as a library dependency
- `moveTo` must keep **curved, randomized** Bézier motion
- Overlay stays `pointer-events: none`; real clicks use `elementFromPoint` + `dispatchEvent`
- Keep README and playground snippets aligned with the real API

## Done checklist

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm build:playground
# when UI behavior changed:
pnpm test:e2e
```
