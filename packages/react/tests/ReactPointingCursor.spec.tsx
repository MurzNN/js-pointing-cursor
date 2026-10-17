import { describe, expect, it } from 'vitest'
import { createRef } from 'react'
import { render, act } from '@testing-library/react'
import { ReactPointingCursor, type ReactPointingCursorHandle } from '../src'

describe('ReactPointingCursor', () => {
  it('renders the default arrow shape', () => {
    const { container, unmount } = render(
      <ReactPointingCursor x={100} y={100} />,
    )
    expect(container.querySelector('.pointing-cursor')).toBeTruthy()
    expect(
      container.querySelector('.pointing-cursor-shape--arrow'),
    ).toBeTruthy()
    unmount()
  })

  it('exposes moveTo and getPosition', async () => {
    const ref = createRef<ReactPointingCursorHandle>()
    const { unmount } = render(<ReactPointingCursor ref={ref} x={0} y={0} />)
    await act(async () => {
      await ref.current?.moveTo(200, 150, { animate: false })
    })
    expect(ref.current?.getPosition()).toEqual({ x: 200, y: 150 })
    unmount()
  })
})
