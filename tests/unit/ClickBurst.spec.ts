import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, afterEach } from 'vitest'
import ClickBurst from '../../src/components/VueCursor/ClickBurst.vue'

describe('ClickBurst', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders eight radiating lines', () => {
    const wrapper = mount(ClickBurst, {
      props: { color: '#22c55e', strokeWidth: 2 },
    })
    expect(wrapper.findAll('line')).toHaveLength(8)
    expect(wrapper.find('line').attributes('stroke')).toBe('#22c55e')
    wrapper.unmount()
  })

  it('emits done after the animation duration', async () => {
    vi.useFakeTimers()
    const wrapper = mount(ClickBurst, {
      props: { durationMs: 200 },
    })
    expect(wrapper.emitted('done')).toBeFalsy()
    await vi.advanceTimersByTimeAsync(200)
    expect(wrapper.emitted('done')).toHaveLength(1)
    wrapper.unmount()
  })
})
