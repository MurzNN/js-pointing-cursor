# Agent guide for vue-cursor

Instructions for humans and coding agents working in this repository.

## Source of truth

- Canonical implementation lives under `src/`.
- Do **not** create a parallel component tree under `registry/`.
- `registry.json` lists files under `src/`; keep `files[]` in sync when adding or moving modules.
- Run `pnpm registry:build` after registry catalog changes (output: `playground/public/r`).

## Architecture

```
wrapper  translate3d(x,y) + hotspot offset   → position
  inner  rotate(deg) scale(press)            → motion style + click
    shape SVG / slot
```

| Concern | Module |
| --- | --- |
| Path + rAF | `src/composables/useCursorMotion.ts` |
| Click press + optional real events | `src/composables/useCursorInteraction.ts` |
| `standard` / `dangling` rotation | `src/composables/useCursorMotionStyle.ts` |
| Coords / selector → point | `src/utils/resolveTarget.ts` |
| Public component | `src/components/VueCursor/VueCursor.vue` |

## Rules

- TypeScript only; types are generated into `dist/` by `unplugin-dts` — do not hand-maintain a parallel `index.d.ts` in `src/`.
- No Tailwind / UnoCSS as a library dependency.
- `moveTo` must keep **curved, randomized** Bézier motion (not linear CSS transitions).
- Overlay stays `pointer-events: none`; real clicks use `elementFromPoint` + `dispatchEvent`.
- Dangling physics belongs only in `useCursorMotionStyle` so path generation stays untouched.
- Keep README and playground snippets aligned with the real API.

## Commits

Prefer one logical commit per feature step (scaffold, shapes, motion, component API, registry, playground, docs/CI, clicks, dangling). Follow the repo’s git safety rules (HEREDOC messages, no force-push, no config changes).

## Done checklist

Before claiming work complete:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm build:playground
# when UI behavior changed:
pnpm test:e2e
```
