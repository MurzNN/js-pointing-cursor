import { computed, ref, type Ref } from 'vue'
import type { MotionFrame, MotionStyle, Point } from '../types'

export interface UseCursorMotionStyleOptions {
  /** Max absolute tilt in degrees while dangling. */
  maxTiltDeg?: number
  /** How quickly rotation chases target heading (0–1 per frame-ish). */
  spring?: number
  /** Resting angle in degrees (0 keeps SVG as drawn). */
  restDeg?: number
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

function lerpAngle(from: number, to: number, t: number): number {
  const diff = ((to - from + 540) % 360) - 180
  return from + diff * t
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/**
 * Tip is held; body trails behind travel so the tip leads.
 * CSS +rotation is clockwise — moving left (heading π) → CCW (negative)
 * so the bottom swings to the right of the tip.
 */
export function headingToTilt(headingRad: number, maxTilt: number): number {
  const deg = 90 - radToDeg(headingRad)
  return clamp(deg, -maxTilt, maxTilt)
}

/**
 * `standard` keeps rotation at 0.
 * `dangling` tilts from the **overall** travel direction (not the Bézier tangent),
 * so curved paths do not flip the cursor mid-move.
 */
export function useCursorMotionStyle(
  style: Ref<MotionStyle> | (() => MotionStyle),
  options: UseCursorMotionStyleOptions = {},
) {
  const maxTilt = options.maxTiltDeg ?? 55
  const spring = options.spring ?? 0.22
  const restDeg = options.restDeg ?? 0

  const rotationDeg = ref(restDeg)
  let settling = false
  /** Locked heading for the current scripted move (atan2 of to − from). */
  let travelHeadingRad: number | null = null

  function getStyle(): MotionStyle {
    return typeof style === 'function' ? style() : style.value
  }

  /** Call when a scripted moveTo starts so tilt follows intent, not path curvature. */
  function beginTravel(from: Point, to: Point): void {
    settling = false
    const dx = to.x - from.x
    const dy = to.y - from.y
    if (Math.hypot(dx, dy) > 1) {
      travelHeadingRad = Math.atan2(dy, dx)
    } else {
      travelHeadingRad = null
    }
  }

  function onFrame(frame: MotionFrame): void {
    if (getStyle() !== 'dangling') {
      rotationDeg.value = restDeg
      settling = false
      travelHeadingRad = null
      return
    }

    // Only settle at the end of the move — do not use Bézier speed (it dips mid-curve).
    if (frame.progress >= 0.97) {
      settling = true
    }

    if (settling) {
      rotationDeg.value = lerpAngle(rotationDeg.value, restDeg, Math.min(1, spring * 1.5))
      const err = ((rotationDeg.value - restDeg + 540) % 360) - 180
      if (Math.abs(err) < 0.5) {
        rotationDeg.value = restDeg
        settling = false
        travelHeadingRad = null
      }
      return
    }

    if (travelHeadingRad == null) {
      return
    }

    const target = headingToTilt(travelHeadingRad, maxTilt)
    rotationDeg.value = lerpAngle(rotationDeg.value, target, spring)
  }

  function onSettle(): void {
    if (getStyle() !== 'dangling') {
      rotationDeg.value = restDeg
      travelHeadingRad = null
      return
    }
    settling = true
  }

  function reset(): void {
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
