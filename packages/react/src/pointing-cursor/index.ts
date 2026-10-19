import './styles.css'

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
