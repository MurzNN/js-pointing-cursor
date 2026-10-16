import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useCursorMotionStyle } from '../../src/composables/useCursorMotionStyle'
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
    api.onFrame(frame({ headingRad: Math.PI / 2, vx: 0, vy: 10 }))
    expect(api.rotationDeg.value).toBe(0)
  })

  it('tilts toward travel for dangling', () => {
    const style = ref<'standard' | 'dangling'>('dangling')
    const api = useCursorMotionStyle(style, { spring: 1, maxTiltDeg: 60 })
    // Move east → tilt toward -90 capped
    api.onFrame(frame({ headingRad: 0, vx: 20, vy: 0, progress: 0.3 }))
    expect(api.rotationDeg.value).not.toBe(0)
    expect(Math.abs(api.rotationDeg.value)).toBeLessThanOrEqual(60)
  })

  it('settles back toward rest on completion', () => {
    const style = ref<'standard' | 'dangling'>('dangling')
    const api = useCursorMotionStyle(style, { spring: 1, maxTiltDeg: 60 })
    api.onFrame(frame({ headingRad: 0, vx: 20, vy: 0, progress: 0.4 }))
    const mid = api.rotationDeg.value
    api.onSettle()
    api.onFrame(frame({ headingRad: 0, vx: 0, vy: 0, progress: 1 }))
    api.onFrame(frame({ headingRad: 0, vx: 0, vy: 0, progress: 1 }))
    expect(Math.abs(api.rotationDeg.value)).toBeLessThan(Math.abs(mid) + 0.01)
    expect(Math.abs(api.rotationDeg.value)).toBeLessThan(1)
  })
})
