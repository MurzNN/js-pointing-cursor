# Agent guide for js-pointing-cursor

Instructions for humans and coding agents working in this monorepo.

- Repo: https://github.com/MurzNN/js-pointing-cursor
- Pages: https://murznn.github.io/js-pointing-cursor/

## Source of truth

- **`packages/core`** (`js-pointing-cursor`) — framework-agnostic controller, motion, shapes, click burst
- **`packages/vue`** (`vue-pointing-cursor`) — thin Vue adapter
- **`packages/react`** (`react-pointing-cursor`) — thin React adapter
- **`apps/playground-vue`** / **`apps/playground-react`** — demos
- Do **not** recreate a parallel tree under the old root `src/`
- `registry/vue/registry.json` / `registry/react/registry.json` — editable shadcn catalogs (paths point at `packages/*/src/pointing-cursor/`)
- Adapter `pointing-cursor/` folders vendor a copy of core (relative imports) for shadcn installs — edit `packages/core`, then run `pnpm shapes:sync` (alias: `pnpm registry:sync`) and commit
- Shape SVGs live as real `.svg` under `packages/core/src/shapes/`; sync **inlines** them into each adapter’s generated `shapes.ts` (no separate `.svg` / `.svg.txt` assets — avoids shadcn-vue choking on raw SVG)
- Root `registry.json` — generated for GitHub installs (`owner/repo/item`); run `pnpm registry:merge` (or `pnpm registry:build`) after catalog/core changes and commit the result

## Architecture

```
createCursorController (core)
  → imperative paint on root/inner elements
  → mountClickBurst on document.body
PointingCursor (Vue / React shells) → props/lifecycle/refs only
```

| Concern | Module |
| --- | --- |
| Path + rAF | `packages/core/src/motion.ts` |
| Click press + real events | `packages/core/src/interaction.ts` |
| `standard` / `dangling` rotation | `packages/core/src/motionStyle.ts` |
| Coords / selector → point | `packages/core/src/resolveTarget.ts` |
| Click burst DOM | `packages/core/src/clickBurst.ts` |
| Orchestration | `packages/core/src/createCursorController.ts` |
| Vue shell | `packages/vue/src/pointing-cursor/PointingCursor.vue` |
| React shell | `packages/react/src/pointing-cursor/PointingCursor.tsx` |

## Rules

- Core must have **zero** `vue` / `react` imports
- TypeScript only; package types come from each package’s Vite/`unplugin-dts` build
- No Tailwind / UnoCSS as a library dependency
- `moveTo` must keep **curved, randomized** Bézier motion
- Overlay stays `pointer-events: none`; real clicks use `elementFromPoint` + `dispatchEvent`
- Keep README and playground snippets aligned with the real API

## Publishing

- npm Trusted Publishing (OIDC): `.github/workflows/publish.yml` on `v*` tags
- Publishes `vue-pointing-cursor` + `react-pointing-cursor` only (not core)
- Trusted Publisher workflow filename on npmjs.com must match: `publish.yml`
- Release: bump both package versions → commit → `git tag vX.Y.Z && git push origin vX.Y.Z`

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
