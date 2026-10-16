import { computed, ref, type Ref } from 'vue'
import type { MotionFrame, MotionStyle, Point } from '../types'

export interface UseCursorMotionStyleOptions {
  /** Max absolute tilt in degrees while dangling. */
  maxTiltDeg?: number
  /** How quickly rotation chases target heading (0–1 per frame-ish). */
  spring?: number
  /** Resting angle in degrees (0 keeps SVG as drawn). */
  restDeg?: number
  /** Speed (px) below which follow / free motion settles upright. */
  settleSpeed?: number
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
 * `dangling` tilts from overall travel (scripted) or live velocity (follow),
 * then eases back to the resting angle when motion stops.
 */
export function useCursorMotionStyle(
  style: Ref<MotionStyle> | (() => MotionStyle),
  options: UseCursorMotionStyleOptions = {},
) {
  const maxTilt = options.maxTiltDeg ?? 55
  const spring = options.spring ?? 0.22
  const restDeg = options.restDeg ?? 0
  const settleSpeed = options.settleSpeed ?? 1.2

  const rotationDeg = ref(restDeg)
  let settling = false
  /** Locked heading for the current scripted move (atan2 of to − from). */
  let travelHeadingRad: number | null = null
  let settleRaf = 0

  function getStyle(): MotionStyle {
    return typeof style === 'function' ? style() : style.value
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

  /** Ease back to restDeg on its own rAF loop (works after moveTo ends). */
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

  /** Call when a scripted moveTo starts so tilt follows intent, not path curvature. */
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

  function chaseTilt(headingRad: number): void {
    const target = headingToTilt(headingRad, maxTilt)
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

    // Scripted move with locked overall direction
    if (travelHeadingRad != null) {
      if (frame.progress >= 0.97) {
        startSettleLoop()
        return
      }
      if (settling) cancelSettleLoop()
      settling = false
      chaseTilt(travelHeadingRad)
      return
    }

    // Follow / free motion: tilt from live velocity, settle when nearly still
    const speed = Math.hypot(frame.vx, frame.vy)
    if (speed > settleSpeed) {
      if (settling) cancelSettleLoop()
      settling = false
      chaseTilt(Math.atan2(frame.vy, frame.vx))
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
