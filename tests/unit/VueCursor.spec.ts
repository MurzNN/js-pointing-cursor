import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { VueCursor } from '../../src/components/VueCursor'

describe('VueCursor', () => {
  it('renders the default arrow shape', () => {
    const wrapper = mount(VueCursor, {
      props: { x: 100, y: 100 },
      attachTo: document.body,
    })
    expect(wrapper.find('.vue-cursor').exists()).toBe(true)
    expect(wrapper.find('.vue-cursor-shape--arrow').exists()).toBe(true)
    wrapper.unmount()
  })

  it('forwards fallthrough attrs to the cursor root (multi-root template)', () => {
    const wrapper = mount(VueCursor, {
      props: { x: 100, y: 100 },
      attrs: { 'data-testid': 'vue-cursor' },
      attachTo: document.body,
    })
    expect(wrapper.find('.vue-cursor').attributes('data-testid')).toBe(
      'vue-cursor',
    )
    wrapper.unmount()
  })

  it('exposes show/hide and toggles visibility', async () => {
    const wrapper = mount(VueCursor, {
      props: { x: 10, y: 10, visible: true },
      attachTo: document.body,
    })
    const api = wrapper.vm as unknown as {
      hide: () => void
      show: () => void
    }
    api.hide()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.vue-cursor').attributes('style')).toContain('opacity: 0')
    api.show()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.vue-cursor').attributes('style')).toContain('opacity: 1')
    wrapper.unmount()
  })

  it('moveTo jumps without animation when animate is false', async () => {
    const wrapper = mount(VueCursor, {
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

    const wrapper = mount(VueCursor, {
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
    const wrapper = mount(VueCursor, {
      props: { shape: 'hand', x: 1, y: 1 },
      attachTo: document.body,
    })
    expect(wrapper.find('.vue-cursor-shape--hand').exists()).toBe(true)
    await wrapper.setProps({ shape: 'pointer' })
    expect(wrapper.find('.vue-cursor-shape--pointer').exists()).toBe(true)
    wrapper.unmount()
  })

  it('exposes click and clickAt', async () => {
    vi.useFakeTimers()
    const wrapper = mount(VueCursor, {
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
    const wrapper = mount(VueCursor, {
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
    expect(wrapper.find('.vue-cursor-burst').exists()).toBe(true)
    expect(wrapper.find('.vue-cursor-burst line').attributes('stroke')).toBe(
      '#22c55e',
    )
    await vi.advanceTimersByTimeAsync(40)
    await leftPending

    const rightPending = api.rightClick({ real: false })
    await wrapper.vm.$nextTick()
    const strokes = wrapper
      .findAll('.vue-cursor-burst line')
      .map((l) => l.attributes('stroke'))
    expect(strokes).toContain('#ef4444')
    await vi.advanceTimersByTimeAsync(40)
    await rightPending

    wrapper.unmount()
    vi.useRealTimers()
  })
})
