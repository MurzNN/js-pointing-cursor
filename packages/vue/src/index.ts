import type { App, Plugin } from 'vue'
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
} from 'js-pointing-cursor'

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
} from 'js-pointing-cursor'

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
