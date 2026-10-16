import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
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
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback) => {
        cb(0)
        return 1
      },
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

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
    api.beginTravel({ x: 200, y: 100 }, { x: 40, y: 100 })

    api.onFrame(frame({ headingRad: 0, vx: 50, vy: 0, progress: 0.2 }))
    expect(api.rotationDeg.value).toBeLessThan(0)

    api.onFrame(frame({ headingRad: Math.PI / 2, vx: 0, vy: 40, progress: 0.5 }))
    expect(api.rotationDeg.value).toBeLessThan(0)
  })

  it('dangles from live velocity when following (no beginTravel)', () => {
    const style = ref<'standard' | 'dangling'>('dangling')
    const api = useCursorMotionStyle(style, { spring: 1, maxTiltDeg: 60 })
    api.onFrame(frame({ vx: -30, vy: 0, headingRad: Math.PI, progress: 0 }))
    expect(api.rotationDeg.value).toBeLessThan(0)
  })

  it('settles back to rest after motion stops', () => {
    const style = ref<'standard' | 'dangling'>('dangling')
    const api = useCursorMotionStyle(style, { spring: 1, maxTiltDeg: 60 })
    api.beginTravel({ x: 0, y: 0 }, { x: 100, y: 0 })
    api.onFrame(frame({ progress: 0.4 }))
    expect(api.rotationDeg.value).not.toBe(0)

    api.onSettle()
    expect(api.rotationDeg.value).toBe(0)
  })
})
