import type { MotionFrame, Point } from '../types'

export interface CubicBezierPath {
  p0: Point
  p1: Point
  p2: Point
  p3: Point
}

export interface SamplePathOptions {
  /** When false, skip derivative + atan2 (dangling with locked travel heading). */
  needHeading?: boolean
  /** Reuse this object instead of allocating a new MotionFrame. */
  out?: MotionFrame
}

export interface AnimateAlongOptions {
  duration: number
  /** Called every frame with sample data. */
  onFrame: (frame: MotionFrame) => void
  /** Easing function mapping linear t ∈ [0,1] → eased t. Default ease-in-out. */
  ease?: (t: number) => number
  needHeading?: boolean
  /** Optional now() for tests. */
  now?: () => number
  /** Optional rAF / cancel for tests. */
  raf?: (cb: FrameRequestCallback) => number
  caf?: (id: number) => void
}

export interface AnimateHandle {
  cancel: () => void
  finished: Promise<void>
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Smoothstep-ish ease-in-out. */
export function easeInOutCubic(t: number): number {
  const x = clamp(t, 0, 1)
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

function distance(a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.hypot(dx, dy)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Evaluate cubic Bézier position at t ∈ [0,1]. */
export function bezierPoint(path: CubicBezierPath, t: number): Point {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t
  return {
    x: uuu * path.p0.x + 3 * uu * t * path.p1.x + 3 * u * tt * path.p2.x + ttt * path.p3.x,
    y: uuu * path.p0.y + 3 * uu * t * path.p1.y + 3 * u * tt * path.p2.y + ttt * path.p3.y,
  }
}

/** Write cubic Bézier position into `out` (no allocation). */
export function bezierPointInto(
  path: CubicBezierPath,
  t: number,
  out: Point,
): void {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t
  out.x = uuu * path.p0.x + 3 * uu * t * path.p1.x + 3 * u * tt * path.p2.x + ttt * path.p3.x
  out.y = uuu * path.p0.y + 3 * uu * t * path.p1.y + 3 * u * tt * path.p2.y + ttt * path.p3.y
}

/** First derivative of cubic Bézier (velocity direction). */
export function bezierDerivative(path: CubicBezierPath, t: number): Point {
  const u = 1 - t
  return {
    x:
      3 * u * u * (path.p1.x - path.p0.x) +
      6 * u * t * (path.p2.x - path.p1.x) +
      3 * t * t * (path.p3.x - path.p2.x),
    y:
      3 * u * u * (path.p1.y - path.p0.y) +
      6 * u * t * (path.p2.y - path.p1.y) +
      3 * t * t * (path.p3.y - path.p2.y),
  }
}

/**
 * Build a cubic Bézier from `from` → `to` with slightly randomized control
 * points so motion feels like a human hand rather than a straight line.
 */
export function createCurvedPath(
  from: Point,
  to: Point,
  random: () => number = Math.random,
): CubicBezierPath {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.hypot(dx, dy) || 1
  const nx = -dy / dist
  const ny = dx / dist

  const jitterScale = dist * (0.15 + random() * 0.2)
  const side = random() < 0.5 ? -1 : 1
  const j1 = side * jitterScale * (0.6 + random() * 0.4)
  const j2 = side * jitterScale * (0.4 + random() * 0.5) * (random() < 0.5 ? -1 : 1)

  const t1 = 0.25 + random() * 0.15
  const t2 = 0.6 + random() * 0.2

  return {
    p0: { x: from.x, y: from.y },
    p1: {
      x: from.x + dx * t1 + nx * j1,
      y: from.y + dy * t1 + ny * j1,
    },
    p2: {
      x: from.x + dx * t2 + nx * j2,
      y: from.y + dy * t2 + ny * j2,
    },
    p3: { x: to.x, y: to.y },
  }
}

/** Duration in ms from distance, clamped. */
export function durationForDistance(
  dist: number,
  minDuration = 280,
  maxDuration = 900,
  pxPerMs = 1.1,
): number {
  return clamp(dist / pxPerMs, minDuration, maxDuration)
}

const sharedFrame: MotionFrame = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  headingRad: 0,
  progress: 0,
}

export function samplePath(
  path: CubicBezierPath,
  t: number,
  progress: number,
  options: SamplePathOptions = {},
): MotionFrame {
  const out = options.out ?? sharedFrame
  const needHeading = options.needHeading !== false

  bezierPointInto(path, t, out)
  out.progress = progress

  if (needHeading) {
    const deriv = bezierDerivative(path, t)
    out.vx = deriv.x
    out.vy = deriv.y
    out.headingRad = Math.atan2(deriv.y, deriv.x)
  } else {
    out.vx = 0
    out.vy = 0
    out.headingRad = 0
  }

  return out
}

/**
 * Animate along a cubic path with rAF. Returns a cancelable handle.
 */
export function animateAlong(path: CubicBezierPath, options: AnimateAlongOptions): AnimateHandle {
  const ease = options.ease ?? easeInOutCubic
  const now = options.now ?? (() => performance.now())
  const raf = options.raf ?? ((cb) => requestAnimationFrame(cb))
  const caf = options.caf ?? ((id) => cancelAnimationFrame(id))
  const needHeading = options.needHeading !== false
  const frame = sharedFrame

  let cancelled = false
  let frameId = 0
  const start = now()

  let resolveFinished!: () => void
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve
  })

  const tick = (time: number) => {
    if (cancelled) {
      resolveFinished()
      return
    }
    const elapsed = time - start
    const linear = options.duration <= 0 ? 1 : clamp(elapsed / options.duration, 0, 1)
    const eased = ease(linear)
    options.onFrame(samplePath(path, eased, linear, { needHeading, out: frame }))

    if (linear < 1) {
      frameId = raf(tick)
    } else {
      resolveFinished()
    }
  }

  // Seed first frame immediately at t=0
  options.onFrame(samplePath(path, 0, 0, { needHeading, out: frame }))
  frameId = raf(tick)

  return {
    cancel() {
      if (cancelled) return
      cancelled = true
      caf(frameId)
      resolveFinished()
    },
    finished,
  }
}

/** Instant jump (no animation). */
export function jumpTo(to: Point, onFrame: (frame: MotionFrame) => void): void {
  sharedFrame.x = to.x
  sharedFrame.y = to.y
  sharedFrame.vx = 0
  sharedFrame.vy = 0
  sharedFrame.headingRad = 0
  sharedFrame.progress = 1
  onFrame(sharedFrame)
}

export function useCursorMotion() {
  return {
    createCurvedPath,
    animateAlong,
    jumpTo,
    durationForDistance,
    samplePath,
    easeInOutCubic,
    distance,
    lerp,
  }
}
