import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { headingToRotation, createMotionStyle } from '../src/motionStyle'
import type { MotionFrame, MotionStyle } from '../src/types'

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

describe('headingToRotation', () => {
  it('aims hand (defaultAngle 0) straight down when traveling down', () => {
    expect(Math.abs(headingToRotation(Math.PI / 2, 0))).toBeCloseTo(180, 5)
  })

  it('aims hand left when traveling left', () => {
    expect(headingToRotation(Math.PI, 0)).toBeCloseTo(-90, 5)
  })

  it('compensates arrow defaultAngle (-22.5) when traveling down', () => {
    expect(headingToRotation(Math.PI / 2, -22.5)).toBeCloseTo(-157.5, 5)
  })

  it('aims arrow tip straight east / west for horizontal travel', () => {
    expect(headingToRotation(0, -22.5)).toBeCloseTo(112.5, 5)
    expect(headingToRotation(Math.PI, -22.5)).toBeCloseTo(-67.5, 5)
  })
})

describe('createMotionStyle', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps rotation at 0 for standard', () => {
    const style: MotionStyle = 'standard'
    const api = createMotionStyle(() => style, { defaultAngle: -45 })
    api.beginTravel({ x: 0, y: 0 }, { x: -100, y: 0 })
    api.onFrame(frame({ headingRad: Math.PI / 2, vx: 0, vy: 10 }))
    expect(api.getRotation()).toBe(0)
  })

  it('points along overall travel including down; ignores tangent flips', () => {
    const style: MotionStyle = 'dangling'
    const defaultAngle = -45
    const api = createMotionStyle(() => style, {
      spring: 1,
      getDefaultAngle: () => defaultAngle,
    })

    api.beginTravel({ x: 100, y: 0 }, { x: 100, y: 200 })
    api.onFrame(frame({ headingRad: 0, vx: 50, vy: 0, progress: 0.3 }))
    expect(api.getRotation()).toBeCloseTo(-135, 0)

    api.beginTravel({ x: 200, y: 100 }, { x: 40, y: 100 })
    api.onFrame(frame({ headingRad: Math.PI / 2, vx: 0, vy: 40, progress: 0.5 }))
    expect(api.getRotation()).toBeCloseTo(-45, 0)
  })

  it('dangles from live velocity when following (no beginTravel)', () => {
    const api = createMotionStyle(() => 'dangling', {
      spring: 1,
      defaultAngle: 0,
    })
    api.onFrame(frame({ vx: 0, vy: 30, headingRad: Math.PI / 2, progress: 0 }))
    expect(Math.abs(api.getRotation())).toBeCloseTo(180, 0)
  })

  it('settles back to rest after motion stops', () => {
    const api = createMotionStyle(() => 'dangling', {
      spring: 1,
      defaultAngle: -45,
    })
    api.beginTravel({ x: 0, y: 0 }, { x: 100, y: 0 })
    api.onFrame(frame({ progress: 0.4 }))
    expect(api.getRotation()).not.toBe(0)

    api.onSettle()
    expect(api.getRotation()).toBe(0)
  })

  it('hasLockedTravel after beginTravel with distance', () => {
    const api = createMotionStyle(() => 'dangling')
    expect(api.hasLockedTravel()).toBe(false)
    api.beginTravel({ x: 0, y: 0 }, { x: 50, y: 0 })
    expect(api.hasLockedTravel()).toBe(true)
  })
})
