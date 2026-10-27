export {
  PointingCursor,
  PointingCursor as default,
} from './pointing-cursor'

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
} from './pointing-cursor'

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
} from './pointing-cursor'
