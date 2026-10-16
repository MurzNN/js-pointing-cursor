import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import {
  headingToTilt,
  useCursorMotionStyle,
} from '../../src/composables/useCursorMotionStyle'
import type { MotionFrame } from '../../src/types'

function frame(partial: Partial<MotionFrame>): MotionFrame {
  return {
    x: 0,
    y: 0,
    vx: 10,
    vy: 0,
    headingRad: 0,
    progress: 0.5,
    ...partial,
  }
}

describe('useCursorMotionStyle', () => {
  it('keeps rotation at 0 for standard', () => {
    const style = ref<'standard' | 'dangling'>('standard')
    const api = useCursorMotionStyle(style)
    api.beginTravel({ x: 0, y: 0 }, { x: -100, y: 0 })
    api.onFrame(frame({ headingRad: Math.PI / 2, vx: 0, vy: 10 }))
    expect(api.rotationDeg.value).toBe(0)
  })

  it('tilts from overall travel so tip leads; ignores tangent flips', () => {
    expect(headingToTilt(Math.PI, 60)).toBeLessThan(0)
    expect(headingToTilt(0, 60)).toBeGreaterThan(0)

    const style = ref<'standard' | 'dangling'>('dangling')
    const api = useCursorMotionStyle(style, { spring: 1, maxTiltDeg: 60 })
    api.beginTravel({ x: 200, y: 100 }, { x: 40, y: 100 }) // leftward

    // Bézier tangent may point the "wrong" way mid-curve — tilt must stay left-leading.
    api.onFrame(frame({ headingRad: 0, vx: 50, vy: 0, progress: 0.2 }))
    expect(api.rotationDeg.value).toBeLessThan(0)

    api.onFrame(frame({ headingRad: Math.PI / 2, vx: 0, vy: 40, progress: 0.5 }))
    expect(api.rotationDeg.value).toBeLessThan(0)
  })

  it('settles back toward rest on completion', () => {
    const style = ref<'standard' | 'dangling'>('dangling')
    const api = useCursorMotionStyle(style, { spring: 1, maxTiltDeg: 60 })
    api.beginTravel({ x: 0, y: 0 }, { x: 100, y: 0 })
    api.onFrame(frame({ progress: 0.4 }))
    const mid = api.rotationDeg.value
    api.onSettle()
    api.onFrame(frame({ progress: 1 }))
    api.onFrame(frame({ progress: 1 }))
    expect(Math.abs(api.rotationDeg.value)).toBeLessThan(Math.abs(mid) + 0.01)
    expect(Math.abs(api.rotationDeg.value)).toBeLessThan(1)
  })
})
