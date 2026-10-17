import { describe, expect, it, vi, afterEach } from 'vitest'
import { mountClickBurst, computeBurstRays } from '../src/clickBurst'

describe('computeBurstRays', () => {
  it('returns eight rays', () => {
    expect(computeBurstRays()).toHaveLength(8)
  })
})

describe('mountClickBurst', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.getElementById('pointing-cursor-burst-style')?.remove()
    document.querySelectorAll('.pointing-cursor-burst').forEach((n) => n.remove())
  })

  it('renders eight radiating lines', () => {
    mountClickBurst(document.body, {
      x: 10,
      y: 20,
      color: '#22c55e',
      strokeWidth: 2,
    })
    const lines = document.querySelectorAll('.pointing-cursor-burst line')
    expect(lines).toHaveLength(8)
    expect(lines[0]?.getAttribute('stroke')).toBe('#22c55e')
  })

  it('calls onDone after the animation duration', async () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    mountClickBurst(document.body, {
      x: 0,
      y: 0,
      color: '#111',
      durationMs: 200,
      onDone,
    })
    expect(onDone).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(200)
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
