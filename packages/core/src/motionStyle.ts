import type { MotionFrame, MotionStyle, Point } from './types'

export interface CreateMotionStyleOptions {
  /**
   * Tip orientation at CSS rotate(0), as offset from pointing **up** (degrees).
   * Hand (finger up) = 0; arrow/pointer (tip up-left) ≈ -45.
   */
  getDefaultAngle?: () => number
  defaultAngle?: number
  /** How quickly rotation chases the travel heading (0–1). */
  spring?: number
  /** Resting CSS rotation when idle (usually 0). */
  restDeg?: number
  /** Speed (px/frame-ish) below which follow motion settles upright. */
  settleSpeed?: number
  /** Called whenever rotation changes (for imperative paint). */
  onRotation?: (deg: number) => void
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

/** Normalize to (-180, 180] so spring lerp takes the shortest turn. */
export function normalizeDeg(deg: number): number {
  return ((deg + 540) % 360) - 180
}

function lerpAngle(from: number, to: number, t: number): number {
  const diff = ((to - from + 540) % 360) - 180
  return from + diff * t
}

/**
 * CSS rotation that aims the tip along `headingRad` (screen atan2: 0=east, 90=down).
 */
export function headingToRotation(
  headingRad: number,
  defaultAngle = 0,
): number {
  return normalizeDeg(radToDeg(headingRad) + 90 - defaultAngle)
}

/** @deprecated Use headingToRotation */
export function headingToTilt(
  headingRad: number,
  _maxTilt: number,
  defaultAngle = 0,
): number {
  return headingToRotation(headingRad, defaultAngle)
}

/**
 * `standard` keeps rotation at restDeg (0).
 * `dangling` rotates so the tip points along travel.
 */
export function createMotionStyle(
  getStyle: () => MotionStyle,
  options: CreateMotionStyleOptions = {},
) {
  const spring = options.spring ?? 0.22
  const restDeg = options.restDeg ?? 0
  const settleSpeed = options.settleSpeed ?? 1.2

  let rotationDeg = restDeg
  let settling = false
  let travelHeadingRad: number | null = null
  let settleRaf = 0

  function getDefaultAngle(): number {
    if (options.getDefaultAngle) return options.getDefaultAngle()
    return options.defaultAngle ?? 0
  }

  function setRotation(deg: number): void {
    rotationDeg = deg
    options.onRotation?.(deg)
  }

  function cancelSettleLoop() {
    if (settleRaf) {
      cancelAnimationFrame(settleRaf)
      settleRaf = 0
    }
  }

  function angleError(from: number, to: number): number {
    return ((from - to + 540) % 360) - 180
  }

  function startSettleLoop(): void {
    if (getStyle() !== 'dangling') {
      setRotation(restDeg)
      travelHeadingRad = null
      settling = false
      return
    }
    settling = true
    travelHeadingRad = null
    cancelSettleLoop()

    const tick = () => {
      if (!settling || getStyle() !== 'dangling') {
        settleRaf = 0
        return
      }
      const next = lerpAngle(rotationDeg, restDeg, Math.min(1, spring * 1.6))
      setRotation(next)
      if (Math.abs(angleError(rotationDeg, restDeg)) < 0.4) {
        setRotation(restDeg)
        settling = false
        settleRaf = 0
        return
      }
      settleRaf = requestAnimationFrame(tick)
    }
    settleRaf = requestAnimationFrame(tick)
  }

  function beginTravel(from: Point, to: Point): void {
    cancelSettleLoop()
    settling = false
    const dx = to.x - from.x
    const dy = to.y - from.y
    if (Math.hypot(dx, dy) > 1) {
      travelHeadingRad = Math.atan2(dy, dx)
    } else {
      travelHeadingRad = null
    }
  }

  function hasLockedTravel(): boolean {
    return travelHeadingRad != null
  }

  function isSettled(): boolean {
    return !settling && Math.abs(angleError(rotationDeg, restDeg)) < 0.4
  }

  function chaseHeading(headingRad: number): void {
    const target = headingToRotation(headingRad, getDefaultAngle())
    setRotation(lerpAngle(rotationDeg, target, spring))
  }

  function onFrame(frame: MotionFrame): void {
    if (getStyle() !== 'dangling') {
      cancelSettleLoop()
      if (rotationDeg !== restDeg) setRotation(restDeg)
      settling = false
      travelHeadingRad = null
      return
    }

    if (travelHeadingRad != null) {
      if (frame.progress >= 0.97) {
        startSettleLoop()
        return
      }
      if (settling) cancelSettleLoop()
      settling = false
      chaseHeading(travelHeadingRad)
      return
    }

    const speed = Math.hypot(frame.vx, frame.vy)
    if (speed > settleSpeed) {
      if (settling) cancelSettleLoop()
      settling = false
      chaseHeading(Math.atan2(frame.vy, frame.vx))
      return
    }

    if (!settling && Math.abs(angleError(rotationDeg, restDeg)) > 0.4) {
      startSettleLoop()
    }
  }

  function onSettle(): void {
    startSettleLoop()
  }

  function reset(): void {
    cancelSettleLoop()
    setRotation(restDeg)
    settling = false
    travelHeadingRad = null
  }

  function getRotation(): number {
    return rotationDeg
  }

  return {
    getRotation,
    hasLockedTravel,
    isSettled,
    beginTravel,
    onFrame,
    onSettle,
    reset,
  }
}

/** @deprecated Use createMotionStyle */
export const useCursorMotionStyle = createMotionStyle
