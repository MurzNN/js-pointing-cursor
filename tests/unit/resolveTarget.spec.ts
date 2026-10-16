import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  resolveElementCenter,
  resolveMoveTarget,
  TargetResolutionError,
} from '../../src/utils/resolveTarget'

describe('resolveMoveTarget', () => {
  it('resolves numeric coordinates', () => {
    expect(resolveMoveTarget(10, 20)).toEqual({ x: 10, y: 20 })
  })

  it('throws when y is missing for numeric x', () => {
    expect(() => resolveMoveTarget(10)).toThrow(TargetResolutionError)
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
