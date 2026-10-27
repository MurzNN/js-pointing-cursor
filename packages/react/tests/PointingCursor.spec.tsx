import { describe, expect, it } from 'vitest'
import { createRef } from 'react'
import { render, act } from '@testing-library/react'
import { PointingCursor, type PointingCursorHandle } from '../src'

describe('PointingCursor', () => {
  it('renders the default arrow shape', () => {
    const { unmount } = render(<PointingCursor x={100} y={100} />)
    expect(document.querySelector('.pointing-cursor')).toBeTruthy()
    expect(
      document.querySelector('.pointing-cursor-shape--arrow'),
    ).toBeTruthy()
    unmount()
  })

  it('teleports the overlay to document.body by default', () => {
    const { unmount } = render(<PointingCursor x={100} y={100} />)
    const root = document.querySelector('.pointing-cursor')
    expect(root?.parentElement).toBe(document.body)
    unmount()
  })

  it('keeps the overlay in-place when teleportTo is false', () => {
    const { container, unmount } = render(
      <PointingCursor x={100} y={100} teleportTo={false} />,
    )
    expect(container.querySelector('.pointing-cursor')).toBeTruthy()
    expect(document.body.querySelector('.pointing-cursor')).toBe(
      container.querySelector('.pointing-cursor'),
    )
    unmount()
  })

  it('exposes moveTo and getPosition', async () => {
    const ref = createRef<PointingCursorHandle>()
    const { unmount } = render(<PointingCursor ref={ref} x={0} y={0} />)
    await act(async () => {
      await ref.current?.moveTo(200, 150, { animate: false })
    })
    expect(ref.current?.getPosition()).toEqual({ x: 200, y: 150 })
    unmount()
  })
})
