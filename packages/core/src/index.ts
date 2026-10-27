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
  SHAPE_HOTSPOTS,
  SHAPE_DEFAULT_ANGLES,
} from './shapes'

export {
  createCurvedPath,
  animateAlong,
  jumpTo,
  durationForDistance,
  samplePath,
  easeInOutCubic,
  bezierPoint,
  bezierPointInto,
  bezierDerivative,
  useCursorMotion,
} from './motion'
export type {
  CubicBezierPath,
  SamplePathOptions,
  AnimateAlongOptions,
  AnimateHandle,
} from './motion'

export {
  createMotionStyle,
  useCursorMotionStyle,
  headingToRotation,
  headingToTilt,
  normalizeDeg,
} from './motionStyle'
export type { CreateMotionStyleOptions } from './motionStyle'

export {
  createCursorInteraction,
  useCursorInteraction,
  dispatchRealClick,
} from './interaction'
export type {
  CreateCursorInteractionOptions,
  CursorInteractionSnapshot,
} from './interaction'

export {
  resolveElementCenter,
  resolveMoveTarget,
  resolveCoordinateRoot,
  localToViewport,
  TargetResolutionError,
} from './resolveTarget'

export { mountClickBurst, computeBurstRays } from './clickBurst'
export type { MountClickBurstOptions, ClickBurstRay } from './clickBurst'

export {
  createCursorController,
  DEFAULT_CURSOR_CONFIG,
} from './createCursorController'
export type {
  CursorController,
  CursorControllerOptions,
  CursorControllerConfig,
} from './createCursorController'
