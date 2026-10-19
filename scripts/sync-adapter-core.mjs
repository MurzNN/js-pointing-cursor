#!/usr/bin/env node
/**
 * Copy packages/core/src into each adapter's pointing-cursor/ folder and
 * generate a local `./core` barrel. Adapters import from `./core` so shadcn
 * installs work without publishing js-pointing-cursor to npm.
 *
 * Shape SVGs are copied as `*.svg.txt` (flat, beside the TS files). shadcn-vue
 * only skips transforms for .md/.mdx/.txt — raw `.svg` crashes the installer
 * with "Unexpected token". Content is still plain SVG; Vite loads via `?raw`.
 *
 * Edit packages/core, then run: pnpm registry:sync
 */
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const coreSrc = join(root, 'packages/core/src')
const coreShapes = join(coreSrc, 'shapes')

const CORE_TS = [
  'types.ts',
  'motion.ts',
  'motionStyle.ts',
  'interaction.ts',
  'resolveTarget.ts',
  'clickBurst.ts',
  'createCursorController.ts',
]

const SHAPE_SVGS = ['arrow', 'pointer', 'hand']

const CORE_BARREL = `export type {
  ShapeName,
  MotionStyle,
  MouseButton,
  CursorInteractionState,
  Point,
  MotionFrame,
  MoveToOptions,
  ClickOptions,
  MoveTarget,
} from './types'

export {
  SHAPE_SVGS,
  SHAPE_STROKE_SCALE,
  SHAPE_HOTSPOTS,
  SHAPE_DEFAULT_ANGLES,
} from './shapes'

export {
  createCurvedPath,
  animateAlong,
  jumpTo,
  durationForDistance,
  samplePath,
} from './motion'

export {
  createMotionStyle,
  headingToRotation,
} from './motionStyle'

export {
  createCursorInteraction,
  dispatchRealClick,
} from './interaction'

export {
  resolveElementCenter,
  resolveMoveTarget,
  TargetResolutionError,
} from './resolveTarget'

export { mountClickBurst } from './clickBurst'

export {
  createCursorController,
  DEFAULT_CURSOR_CONFIG,
} from './createCursorController'
export type {
  CursorController,
  CursorControllerConfig,
  CursorControllerOptions,
} from './createCursorController'
`

const SHAPES_MODULE = `import type { ShapeName } from './types'
import arrowSvg from './arrow.svg.txt?raw'
import pointerSvg from './pointer.svg.txt?raw'
import handSvg from './hand.svg.txt?raw'

/** SVG markup for each bundled shape (files are \`*.svg.txt\` for shadcn-vue). */
export const SHAPE_SVGS: Record<ShapeName, string> = {
  arrow: arrowSvg,
  pointer: pointerSvg,
  hand: handSvg,
}

/**
 * Multiplier applied to \`strokeWidth\` so strokes look similar across viewBoxes.
 * Hand uses a 256×256 box vs ~24 for arrow/pointer.
 */
export const SHAPE_STROKE_SCALE: Record<ShapeName, number> = {
  arrow: 1,
  pointer: 1,
  hand: 256 / 24,
}

/**
 * Hotspots as fractions of each shape’s viewBox (tip of the cursor).
 */
export const SHAPE_HOTSPOTS: Record<ShapeName, { x: number; y: number }> = {
  arrow: { x: 0.14, y: 0.1 },
  pointer: { x: 0.19, y: 0.13 },
  hand: { x: 0.42, y: 0.06 },
}

/**
 * Tip offset from pointing **up** at CSS rotate(0), in degrees.
 * Hand index points up → 0. Arrow/pointer tips point up-left → -45.
 */
export const SHAPE_DEFAULT_ANGLES: Record<ShapeName, number> = {
  arrow: -45,
  pointer: -45,
  hand: 0,
}
`

const ENV_D_TS = `/// <reference types="vite/client" />

declare module '*.svg.txt?raw' {
  const content: string
  export default content
}
`

const adapters = [
  {
    dir: join(root, 'packages/vue/src/pointing-cursor'),
    index: `import type { App, Plugin } from 'vue'
import VuePointingCursor from './VuePointingCursor.vue'

export type {
  ShapeName,
  MotionStyle,
  MouseButton,
  CursorInteractionState,
  Point,
  MotionFrame,
  MoveToOptions,
  ClickOptions,
  MoveTarget,
  CursorController,
  CursorControllerConfig,
} from './core'

export {
  SHAPE_SVGS,
  SHAPE_STROKE_SCALE,
  SHAPE_HOTSPOTS,
  SHAPE_DEFAULT_ANGLES,
  createCursorController,
  createCurvedPath,
  animateAlong,
  jumpTo,
  durationForDistance,
  samplePath,
  resolveElementCenter,
  resolveMoveTarget,
  TargetResolutionError,
  mountClickBurst,
  createMotionStyle,
  createCursorInteraction,
  dispatchRealClick,
  headingToRotation,
} from './core'

export { VuePointingCursor }
export { VuePointingCursor as default }

export interface VuePointingCursorPluginOptions {
  name?: string
}

export const VuePointingCursorPlugin: Plugin = {
  install(app: App, options: VuePointingCursorPluginOptions = {}) {
    app.component(options.name ?? 'VuePointingCursor', VuePointingCursor)
  },
}
`,
  },
  {
    dir: join(root, 'packages/react/src/pointing-cursor'),
    index: `import './styles.css'

export type {
  ShapeName,
  MotionStyle,
  MouseButton,
  CursorInteractionState,
  Point,
  MotionFrame,
  MoveToOptions,
  ClickOptions,
  MoveTarget,
  CursorController,
  CursorControllerConfig,
} from './core'

export {
  SHAPE_SVGS,
  SHAPE_STROKE_SCALE,
  SHAPE_HOTSPOTS,
  SHAPE_DEFAULT_ANGLES,
  createCursorController,
  createCurvedPath,
  animateAlong,
  jumpTo,
  durationForDistance,
  samplePath,
  resolveElementCenter,
  resolveMoveTarget,
  TargetResolutionError,
  mountClickBurst,
  createMotionStyle,
  createCursorInteraction,
  dispatchRealClick,
  headingToRotation,
} from './core'

export { ReactPointingCursor } from './ReactPointingCursor'
export type {
  ReactPointingCursorProps,
  ReactPointingCursorHandle,
} from './ReactPointingCursor'
export { ReactPointingCursor as default } from './ReactPointingCursor'
`,
  },
]

for (const adapter of adapters) {
  mkdirSync(adapter.dir, { recursive: true })

  // Drop legacy layouts from older syncs.
  rmSync(join(adapter.dir, 'shapes'), { recursive: true, force: true })
  rmSync(join(adapter.dir, 'shapes.ts'), { force: true })
  for (const name of SHAPE_SVGS) {
    rmSync(join(adapter.dir, `${name}.svg`), { force: true })
    rmSync(join(adapter.dir, `${name}.svg.txt`), { force: true })
  }

  for (const name of CORE_TS) {
    const to = join(adapter.dir, name)
    rmSync(to, { recursive: true, force: true })
    cpSync(join(coreSrc, name), to, { recursive: true })
  }

  // Flat SVG assets as *.svg.txt so shadcn-vue skips its JS transform pipeline.
  for (const name of SHAPE_SVGS) {
    const svg = readFileSync(join(coreShapes, `${name}.svg`), 'utf8')
    writeFileSync(join(adapter.dir, `${name}.svg.txt`), svg)
  }

  writeFileSync(join(adapter.dir, 'shapes.ts'), SHAPES_MODULE)
  writeFileSync(join(adapter.dir, 'env.d.ts'), ENV_D_TS)
  writeFileSync(join(adapter.dir, 'core.ts'), CORE_BARREL)
  writeFileSync(join(adapter.dir, 'index.ts'), adapter.index)

  console.log(
    `Synced core → ${adapter.dir} (${listFiles(adapter.dir).length} files)`,
  )
}

function listFiles(dir) {
  const out = []
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) out.push(...listFiles(p))
    else out.push(p)
  }
  return out
}
