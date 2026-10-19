import { describe, expect, it } from 'vitest'
import { createRef } from 'react'
import { render, act } from '@testing-library/react'
import { PointingCursor, type PointingCursorHandle } from '../src'

describe('PointingCursor', () => {
  it('renders the default arrow shape', () => {
    const { container, unmount } = render(
      <PointingCursor x={100} y={100} />,
    )
    expect(container.querySelector('.pointing-cursor')).toBeTruthy()
    expect(
      container.querySelector('.pointing-cursor-shape--arrow'),
    ).toBeTruthy()
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
