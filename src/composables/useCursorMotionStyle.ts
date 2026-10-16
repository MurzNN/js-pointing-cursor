import { computed, ref, type Ref } from 'vue'
import type { MotionFrame, MotionStyle } from '../types'

export interface UseCursorMotionStyleOptions {
  /** Max absolute tilt in degrees while dangling. */
  maxTiltDeg?: number
  /** How quickly rotation chases target heading (0–1 per frame-ish). */
  spring?: number
  /** Resting angle in degrees (classic pointer points up-left ≈ -45° visually for some shapes; 0 keeps SVG as drawn). */
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
 * Maps travel heading to a dangling tilt.
 * Tip is held (transform-origin); body trails behind travel so the tip leads.
 * CSS positive rotation is clockwise — moving left (heading π) needs CCW (negative)
 * so the bottom swings to the right of the tip.
 */
export function headingToTilt(headingRad: number, maxTilt: number): number {
  const deg = 90 - radToDeg(headingRad)
  return clamp(deg, -maxTilt, maxTilt)
}

/**
 * `standard` keeps rotation at 0.
 * `dangling` springs rotation toward travel heading with a capped tilt, then settles.
 */
export function useCursorMotionStyle(
  style: Ref<MotionStyle> | (() => MotionStyle),
  options: UseCursorMotionStyleOptions = {},
) {
  const maxTilt = options.maxTiltDeg ?? 55
  const spring = options.spring ?? 0.18
  const restDeg = options.restDeg ?? 0

  const rotationDeg = ref(restDeg)
  let settling = false

  function getStyle(): MotionStyle {
    return typeof style === 'function' ? style() : style.value
  }

  function onFrame(frame: MotionFrame): void {
    if (getStyle() !== 'dangling') {
      rotationDeg.value = restDeg
      settling = false
      return
    }

    const speed = Math.hypot(frame.vx, frame.vy)
    if (frame.progress >= 1 || speed < 0.5) {
      // Near end or nearly stopped — begin settle toward rest
      settling = true
    }

    if (settling) {
      rotationDeg.value = lerpAngle(rotationDeg.value, restDeg, Math.min(1, spring * 1.4))
      if (Math.abs(rotationDeg.value - restDeg) < 0.4) {
        rotationDeg.value = restDeg
        settling = false
      }
      return
    }

    const target = headingToTilt(frame.headingRad, maxTilt)
    rotationDeg.value = lerpAngle(rotationDeg.value, target, spring)
  }

  function onSettle(): void {
    if (getStyle() !== 'dangling') {
      rotationDeg.value = restDeg
      return
    }
    settling = true
  }

  function reset(): void {
    rotationDeg.value = restDeg
    settling = false
  }

  return {
    rotationDeg: computed(() => rotationDeg.value),
    onFrame,
    onSettle,
    reset,
  }
}
