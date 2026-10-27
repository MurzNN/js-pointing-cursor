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
  resolveCoordinateRoot,
  localToViewport,
  TargetResolutionError,
  mountClickBurst,
  createMotionStyle,
  createCursorInteraction,
  dispatchRealClick,
  headingToRotation,
} from './core'

export { PointingCursor } from './PointingCursor'
export type {
  PointingCursorProps,
  PointingCursorHandle,
  PointingCursorTeleportTo,
} from './PointingCursor'
export { PointingCursor as default } from './PointingCursor'
