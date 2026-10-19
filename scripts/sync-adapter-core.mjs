#!/usr/bin/env node
/**
 * Copy packages/core/src into each adapter's pointing-cursor/ folder and
 * generate a local `./core` barrel. Adapters import from `./core` so shadcn
 * installs work without publishing js-pointing-cursor to npm.
 *
 * Edit packages/core, then run: pnpm registry:sync
 */
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const coreSrc = join(root, 'packages/core/src')

const CORE_ENTRIES = [
  'types.ts',
  'motion.ts',
  'motionStyle.ts',
  'interaction.ts',
  'resolveTarget.ts',
  'clickBurst.ts',
  'createCursorController.ts',
  'env.d.ts',
  'shapes',
]

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

  for (const name of CORE_ENTRIES) {
    const to = join(adapter.dir, name)
    rmSync(to, { recursive: true, force: true })
    cpSync(join(coreSrc, name), to, { recursive: true })
  }

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
