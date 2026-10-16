import type { App, Plugin } from 'vue'
import { VueCursor } from './components/VueCursor'

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
} from './types'

export {
  ArrowCursor,
  PointerCursor,
  HandCursor,
  SHAPE_COMPONENTS,
  SHAPE_HOTSPOTS,
} from './shapes'

export { VueCursor }
export { resolveElementCenter, resolveMoveTarget, TargetResolutionError } from './utils/resolveTarget'
export {
  createCurvedPath,
  animateAlong,
  jumpTo,
  durationForDistance,
  samplePath,
  useCursorMotion,
} from './composables/useCursorMotion'
export { useCursorInteraction } from './composables/useCursorInteraction'
export { useCursorMotionStyle } from './composables/useCursorMotionStyle'

export interface VueCursorPluginOptions {
  name?: string
}

export const VueCursorPlugin: Plugin = {
  install(app: App, options: VueCursorPluginOptions = {}) {
    app.component(options.name ?? 'VueCursor', VueCursor)
  },
}

export default VueCursorPlugin
