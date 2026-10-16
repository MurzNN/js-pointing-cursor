import { computed, ref, type Ref } from 'vue'
import type { MotionFrame, MotionStyle, Point } from '../types'

export interface UseCursorMotionStyleOptions {
  /**
   * Tip orientation at CSS rotate(0), as offset from pointing **up** (degrees).
   * Hand (finger up) = 0; arrow/pointer (tip up-left) ≈ -45.
   * May be a ref/getter so it tracks the active shape.
   */
  defaultAngle?: number | Ref<number> | (() => number)
  /** How quickly rotation chases the travel heading (0–1). */
  spring?: number
  /** Resting CSS rotation when idle (usually 0). */
  restDeg?: number
  /** Speed (px/frame-ish) below which follow motion settles upright. */
  settleSpeed?: number
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

function resolveNumber(
  value: number | Ref<number> | (() => number) | undefined,
  fallback: number,
): number {
  if (value == null) return fallback
  if (typeof value === 'function') return value()
  if (typeof value === 'object' && 'value' in value) return value.value
  return value
}

/**
 * CSS rotation that aims the tip along `headingRad` (screen atan2: 0=east, 90=down).
 * `defaultAngle` is the tip’s offset from pointing up at rest.
 */
export function headingToRotation(
  headingRad: number,
  defaultAngle = 0,
): number {
  // Tip at rest points at (-90° + defaultAngle). Aim that at travel heading.
  return normalizeDeg(radToDeg(headingRad) + 90 - defaultAngle)
}

/** @deprecated Use headingToRotation — kept for call-site clarity in older tests. */
export function headingToTilt(
  headingRad: number,
  _maxTilt: number,
  defaultAngle = 0,
): number {
  return headingToRotation(headingRad, defaultAngle)
}

/**
 * `standard` keeps rotation at restDeg (0).
 * `dangling` rotates so the tip points along travel (full range, including up/down).
 */
export function useCursorMotionStyle(
  style: Ref<MotionStyle> | (() => MotionStyle),
  options: UseCursorMotionStyleOptions = {},
) {
  const spring = options.spring ?? 0.22
  const restDeg = options.restDeg ?? 0
  const settleSpeed = options.settleSpeed ?? 1.2

  const rotationDeg = ref(restDeg)
  let settling = false
  let travelHeadingRad: number | null = null
  let settleRaf = 0

  function getStyle(): MotionStyle {
    return typeof style === 'function' ? style() : style.value
  }

  function getDefaultAngle(): number {
    return resolveNumber(options.defaultAngle, 0)
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
      rotationDeg.value = restDeg
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
      rotationDeg.value = lerpAngle(
        rotationDeg.value,
        restDeg,
        Math.min(1, spring * 1.6),
      )
      if (Math.abs(angleError(rotationDeg.value, restDeg)) < 0.4) {
        rotationDeg.value = restDeg
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

  function chaseHeading(headingRad: number): void {
    const target = headingToRotation(headingRad, getDefaultAngle())
    rotationDeg.value = lerpAngle(rotationDeg.value, target, spring)
  }

  function onFrame(frame: MotionFrame): void {
    if (getStyle() !== 'dangling') {
      cancelSettleLoop()
      rotationDeg.value = restDeg
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

    if (!settling && Math.abs(angleError(rotationDeg.value, restDeg)) > 0.4) {
      startSettleLoop()
    }
  }

  function onSettle(): void {
    startSettleLoop()
  }

  function reset(): void {
    cancelSettleLoop()
    rotationDeg.value = restDeg
    settling = false
    travelHeadingRad = null
  }

  return {
    rotationDeg: computed(() => rotationDeg.value),
    beginTravel,
    onFrame,
    onSettle,
    reset,
  }
}
