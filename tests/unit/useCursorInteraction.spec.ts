import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  dispatchRealClick,
  useCursorInteraction,
} from '../../src/composables/useCursorInteraction'

describe('useCursorInteraction', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('animates press scale then releases', async () => {
    const api = useCursorInteraction({ pressedScale: 0.88, animationDuration: 100 })
    const pending = api.click({ animate: true, real: false })
    expect(api.pressScale.value).toBe(0.88)
    expect(api.state.value).toBe('pressing')
    await vi.advanceTimersByTimeAsync(100)
    await pending
    expect(api.pressScale.value).toBe(1)
    expect(api.state.value).toBe('idle')
  })

  it('dispatches real events when real is true', async () => {
    const target = document.createElement('button')
    document.body.appendChild(target)
    document.elementFromPoint = () => target
    const click = vi.fn()
    target.addEventListener('click', click)

    const api = useCursorInteraction({ animationDuration: 50 })
    const pending = api.click({
      real: true,
      clientX: 10,
      clientY: 20,
      button: 'left',
    })
    await vi.advanceTimersByTimeAsync(50)
    await pending
    expect(click).toHaveBeenCalled()
    target.remove()
  })
})

describe('dispatchRealClick', () => {
  it('fires contextmenu for right button', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    document.elementFromPoint = () => target
    const ctx = vi.fn()
    target.addEventListener('contextmenu', ctx)
    dispatchRealClick(1, 2, 'right')
    expect(ctx).toHaveBeenCalled()
    target.remove()
  })
})
