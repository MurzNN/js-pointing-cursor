import type { App, Plugin } from 'vue'
import PointingCursor from './PointingCursor.vue'

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

export { PointingCursor }
export { PointingCursor as default }

export interface PointingCursorPluginOptions {
  name?: string
}

export const PointingCursorPlugin: Plugin = {
  install(app: App, options: PointingCursorPluginOptions = {}) {
    app.component(options.name ?? 'PointingCursor', PointingCursor)
  },
}
