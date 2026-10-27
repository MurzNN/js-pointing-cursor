import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { PointingCursor } from '../src'

function cursorRoot(): HTMLElement {
  const el = document.querySelector('.pointing-cursor')
  expect(el).toBeTruthy()
  return el as HTMLElement
}

describe('PointingCursor', () => {
  it('renders the default arrow shape', () => {
    const wrapper = mount(PointingCursor, {
      props: { x: 100, y: 100 },
      attachTo: document.body,
    })
    expect(document.querySelector('.pointing-cursor')).toBeTruthy()
    expect(document.querySelector('.pointing-cursor-shape--arrow')).toBeTruthy()
    wrapper.unmount()
  })

  it('forwards fallthrough attrs to the cursor root', () => {
    const wrapper = mount(PointingCursor, {
      props: { x: 100, y: 100 },
      attrs: { 'data-testid': 'vue-cursor' },
      attachTo: document.body,
    })
    expect(cursorRoot().getAttribute('data-testid')).toBe('vue-cursor')
    wrapper.unmount()
  })

  it('teleports the overlay to document.body by default', () => {
    const wrapper = mount(PointingCursor, {
      props: { x: 100, y: 100 },
      attachTo: document.body,
    })
    expect(cursorRoot().parentElement).toBe(document.body)
    wrapper.unmount()
  })

  it('keeps the overlay in-place when teleportTo is false', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const wrapper = mount(PointingCursor, {
      props: { x: 100, y: 100, teleportTo: false },
      attachTo: host,
    })
    const root = cursorRoot()
    expect(host.contains(root)).toBe(true)
    expect(root.parentElement).not.toBe(document.body)
    wrapper.unmount()
    host.remove()
  })

  it('exposes show/hide and toggles visibility class', async () => {
    const wrapper = mount(PointingCursor, {
      props: { x: 10, y: 10, visible: true },
      attachTo: document.body,
    })
    const api = wrapper.vm as unknown as {
      hide: () => void
      show: () => void
    }
    api.hide()
    await wrapper.vm.$nextTick()
    expect(cursorRoot().classList.contains('pointing-cursor--hidden')).toBe(true)
    api.show()
    await wrapper.vm.$nextTick()
    expect(cursorRoot().classList.contains('pointing-cursor--hidden')).toBe(false)
    wrapper.unmount()
  })

  it('moveTo jumps without animation when animate is false', async () => {
    const wrapper = mount(PointingCursor, {
      props: { x: 0, y: 0 },
      attachTo: document.body,
    })
    const api = wrapper.vm as unknown as {
      moveTo: (
        x: number,
        y: number,
        opts?: { animate?: boolean },
      ) => Promise<void>
      getPosition: () => { x: number; y: number }
    }
    await api.moveTo(200, 150, { animate: false })
    expect(api.getPosition()).toEqual({ x: 200, y: 150 })
    const root = cursorRoot()
    expect(root.style.transform).toContain('200px')
    expect(root.style.transform).toContain('150px')
    wrapper.unmount()
  })

  it('emits move only at boundaries by default during moveTo', async () => {
    const wrapper = mount(PointingCursor, {
      props: { x: 0, y: 0, motionStyle: 'standard' },
      attachTo: document.body,
    })
    const api = wrapper.vm as unknown as {
      moveTo: (
        x: number,
        y: number,
        opts?: { animate?: boolean; duration?: number },
      ) => Promise<void>
    }

    const before = (wrapper.emitted('move') ?? []).length

    let now = 0
    vi.stubGlobal('performance', { now: () => now })
    const callbacks: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      callbacks.push(cb)
      return callbacks.length
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const pending = api.moveTo(100, 0, { duration: 100 })
    now = 50
    callbacks[0]?.(now)
    now = 100
    callbacks[1]?.(now)
    await pending

    const moves = (wrapper.emitted('move') ?? []).slice(before)
    // start + end (no per-frame emits)
    expect(moves.length).toBe(2)
    expect(moves[0]).toEqual([{ x: 0, y: 0 }])
    expect(moves[1]).toEqual([{ x: 100, y: 0 }])

    vi.unstubAllGlobals()
    wrapper.unmount()
  })

  it('moveTo resolves a CSS selector to element center', async () => {
    const el = document.createElement('button')
    el.id = 'go-here'
    document.body.appendChild(el)
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 40,
      top: 60,
      width: 20,
      height: 10,
      right: 60,
      bottom: 70,
      x: 40,
      y: 60,
      toJSON: () => ({}),
    })

    const wrapper = mount(PointingCursor, {
      props: { x: 0, y: 0 },
      attachTo: document.body,
    })
    const api = wrapper.vm as unknown as {
      moveTo: (sel: string, opts?: { animate?: boolean }) => Promise<void>
      getPosition: () => { x: number; y: number }
    }
    await api.moveTo('#go-here', { animate: false })
    expect(api.getPosition()).toEqual({ x: 50, y: 65 })
    wrapper.unmount()
    el.remove()
  })

  it('switches bundled shapes', async () => {
    const wrapper = mount(PointingCursor, {
      props: { shape: 'hand', x: 1, y: 1 },
      attachTo: document.body,
    })
    expect(document.querySelector('.pointing-cursor-shape--hand')).toBeTruthy()
    await wrapper.setProps({ shape: 'pointer' })
    expect(document.querySelector('.pointing-cursor-shape--pointer')).toBeTruthy()
    wrapper.unmount()
  })

  it('exposes click and clickAt', async () => {
    vi.useFakeTimers()
    const wrapper = mount(PointingCursor, {
      props: { x: 10, y: 10, clickAnimationDuration: 50 },
      attachTo: document.body,
    })
    const api = wrapper.vm as unknown as {
      leftClick: (o?: { real?: boolean }) => Promise<void>
      clickAt: (x: number, y: number, o?: { animate?: boolean; real?: boolean }) => Promise<void>
      getPosition: () => { x: number; y: number }
    }
    const pending = api.leftClick({ real: false })
    await vi.advanceTimersByTimeAsync(50)
    await pending

    const pendingMove = api.clickAt(80, 90, { animate: false, real: false })
    await vi.advanceTimersByTimeAsync(50)
    await pendingMove
    expect(api.getPosition()).toEqual({ x: 80, y: 90 })
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('spawns a green burst on left click and red on right', async () => {
    vi.useFakeTimers()
    const wrapper = mount(PointingCursor, {
      props: {
        x: 40,
        y: 50,
        clickAnimationDuration: 40,
        clickBurstDurationMs: 200,
      },
      attachTo: document.body,
    })
    const api = wrapper.vm as unknown as {
      leftClick: (o?: { real?: boolean }) => Promise<void>
      rightClick: (o?: { real?: boolean }) => Promise<void>
    }

    const leftPending = api.leftClick({ real: false })
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.pointing-cursor-burst')).toBeTruthy()
    expect(
      document.querySelector('.pointing-cursor-burst line')?.getAttribute('stroke'),
    ).toBe('#22c55e')
    await vi.advanceTimersByTimeAsync(40)
    await leftPending

    const rightPending = api.rightClick({ real: false })
    await wrapper.vm.$nextTick()
    const strokes = [
      ...document.querySelectorAll('.pointing-cursor-burst line'),
    ].map((l) => l.getAttribute('stroke'))
    expect(strokes).toContain('#ef4444')
    await vi.advanceTimersByTimeAsync(40)
    await rightPending

    wrapper.unmount()
    vi.useRealTimers()
  })
})
