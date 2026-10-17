import { describe, expect, it, vi } from 'vitest'
import {
  animateAlong,
  bezierPoint,
  createCurvedPath,
  durationForDistance,
  easeInOutCubic,
  jumpTo,
  samplePath,
} from '../src/motion'

describe('easeInOutCubic', () => {
  it('maps endpoints and midpoint', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5)
  })
})

describe('createCurvedPath', () => {
  it('starts and ends at the given points', () => {
    const path = createCurvedPath({ x: 0, y: 0 }, { x: 100, y: 50 }, () => 0.5)
    expect(path.p0).toEqual({ x: 0, y: 0 })
    expect(path.p3).toEqual({ x: 100, y: 50 })
    expect(bezierPoint(path, 0)).toEqual({ x: 0, y: 0 })
    expect(bezierPoint(path, 1).x).toBeCloseTo(100)
    expect(bezierPoint(path, 1).y).toBeCloseTo(50)
  })

  it('offsets control points off the straight line', () => {
    const path = createCurvedPath({ x: 0, y: 0 }, { x: 100, y: 0 }, () => 0.75)
    expect(path.p1.y).not.toBe(0)
    expect(path.p2.y).not.toBe(0)
  })
})

describe('samplePath', () => {
  it('includes velocity and heading', () => {
    const path = createCurvedPath({ x: 0, y: 0 }, { x: 100, y: 0 }, () => 0.5)
    const frame = samplePath(path, 0.5, 0.5)
    expect(frame.x).toBeTypeOf('number')
    expect(frame.y).toBeTypeOf('number')
    expect(frame.vx).toBeTypeOf('number')
    expect(frame.vy).toBeTypeOf('number')
    expect(frame.headingRad).toBeTypeOf('number')
    expect(frame.progress).toBe(0.5)
  })

  it('reuses an out frame and can skip heading', () => {
    const path = createCurvedPath({ x: 0, y: 0 }, { x: 100, y: 0 }, () => 0.5)
    const out = {
      x: 0,
      y: 0,
      vx: 99,
      vy: 99,
      headingRad: 99,
      progress: 0,
    }
    const frame = samplePath(path, 0.5, 0.5, { needHeading: false, out })
    expect(frame).toBe(out)
    expect(out.x).toBeTypeOf('number')
    expect(out.vx).toBe(0)
    expect(out.vy).toBe(0)
    expect(out.headingRad).toBe(0)
    expect(out.progress).toBe(0.5)
  })
})

describe('durationForDistance', () => {
  it('clamps to min and max', () => {
    expect(durationForDistance(1, 200, 800)).toBe(200)
    expect(durationForDistance(10000, 200, 800)).toBe(800)
  })
})

describe('animateAlong', () => {
  it('emits frames and resolves', async () => {
    const frames: number[] = []
    let now = 0
    const callbacks: FrameRequestCallback[] = []

    const handle = animateAlong(
      createCurvedPath({ x: 0, y: 0 }, { x: 10, y: 0 }, () => 0.5),
      {
        duration: 100,
        now: () => now,
        raf: (cb) => {
          callbacks.push(cb)
          return callbacks.length
        },
        caf: vi.fn(),
        onFrame: (f) => frames.push(f.progress),
      },
    )

    expect(frames[0]).toBe(0)

    now = 50
    callbacks[0]?.(now)
    now = 100
    callbacks[1]?.(now)

    await handle.finished
    expect(frames.at(-1)).toBe(1)
  })

  it('can be cancelled', async () => {
    const caf = vi.fn()
    const now = 0
    const callbacks: FrameRequestCallback[] = []
    const handle = animateAlong(
      createCurvedPath({ x: 0, y: 0 }, { x: 10, y: 0 }, () => 0.5),
      {
        duration: 1000,
        now: () => now,
        raf: (cb) => {
          callbacks.push(cb)
          return 1
        },
        caf,
        onFrame: () => undefined,
      },
    )
    handle.cancel()
    await handle.finished
    expect(caf).toHaveBeenCalled()
  })
})

describe('jumpTo', () => {
  it('emits a settled frame', () => {
    const onFrame = vi.fn()
    jumpTo({ x: 5, y: 7 }, onFrame)
    expect(onFrame).toHaveBeenCalledWith(
      expect.objectContaining({ x: 5, y: 7, progress: 1, vx: 0, vy: 0 }),
    )
  })
})
