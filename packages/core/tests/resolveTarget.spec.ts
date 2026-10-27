import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  localToViewport,
  resolveElementCenter,
  resolveMoveTarget,
  TargetResolutionError,
} from '../src/resolveTarget'

describe('resolveMoveTarget', () => {
  it('resolves numeric coordinates as viewport when no coordinateRoot', () => {
    expect(resolveMoveTarget(10, 20)).toEqual({ x: 10, y: 20 })
  })

  it('throws when y is missing for numeric x', () => {
    expect(() => resolveMoveTarget(10)).toThrow(TargetResolutionError)
  })

  it('maps numeric coordinates through coordinateRoot local space', () => {
    const stage = document.createElement('div')
    stage.id = 'stage'
    document.body.appendChild(stage)
    Object.defineProperty(stage, 'getBoundingClientRect', {
      value: () => ({
        left: 40,
        top: 80,
        width: 200,
        height: 100,
        right: 240,
        bottom: 180,
        x: 40,
        y: 80,
        toJSON: () => ({}),
      }),
    })
    vi.spyOn(window, 'getComputedStyle').mockImplementation(((el: Element) => {
      if (el === stage) {
        return { width: '400px', height: '200px' } as CSSStyleDeclaration
      }
      return {
        width: '0px',
        height: '0px',
      } as CSSStyleDeclaration
    }) as typeof getComputedStyle)

    // scaleX = 200/400 = 0.5, scaleY = 100/200 = 0.5
    expect(resolveMoveTarget(0, 0, '#stage')).toEqual({ x: 40, y: 80 })
    expect(resolveMoveTarget(100, 50, stage)).toEqual({ x: 90, y: 105 })
    expect(localToViewport(stage, { x: 400, y: 200 })).toEqual({
      x: 240,
      y: 180,
    })

    stage.remove()
  })
})

describe('resolveElementCenter', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('returns the center of a matched element', () => {
    const el = document.createElement('div')
    el.id = 'target'
    document.body.appendChild(el)
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      width: 40,
      height: 20,
      right: 140,
      bottom: 70,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    })

    expect(resolveElementCenter('#target')).toEqual({ x: 120, y: 60 })
    expect(resolveElementCenter(el)).toEqual({ x: 120, y: 60 })
  })

  it('warns and throws when selector matches nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    expect(() => resolveElementCenter('#missing')).toThrow(TargetResolutionError)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
