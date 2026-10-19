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
