import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCursorController } from '../src/createCursorController'

describe('retargetOnResize', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('re-resolves a pinned selector after window resize', async () => {
    const el = document.createElement('button')
    el.id = 'pin-me'
    document.body.appendChild(el)

    const rect = {
      left: 100,
      top: 50,
      width: 40,
      height: 20,
      right: 140,
      bottom: 70,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    }
    const rectSpy = vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect as DOMRect)

    const root = document.createElement('div')
    const inner = document.createElement('div')
    document.body.appendChild(root)
    root.appendChild(inner)

    const controller = createCursorController({
      getRootEl: () => root,
      getInnerEl: () => inner,
    })
    controller.mount()

    await controller.moveTo('#pin-me', { animate: false })
    expect(controller.getPosition()).toEqual({ x: 120, y: 60 })

    rectSpy.mockReturnValue({
      ...rect,
      left: 200,
      top: 150,
      right: 240,
      bottom: 170,
      x: 200,
      y: 150,
    } as DOMRect)

    const callbacks: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      callbacks.push(cb)
      return callbacks.length
    })

    window.dispatchEvent(new Event('resize'))
    expect(callbacks.length).toBe(1)
    callbacks[0]?.(0)

    expect(controller.getPosition()).toEqual({ x: 220, y: 160 })

    controller.destroy()
    vi.unstubAllGlobals()
  })

  it('does not pin bare viewport numeric coordinates for resize', async () => {
    const root = document.createElement('div')
    const inner = document.createElement('div')
    document.body.appendChild(root)
    root.appendChild(inner)

    const controller = createCursorController({
      getRootEl: () => root,
      getInnerEl: () => inner,
    })
    controller.mount()

    await controller.moveTo(10, 20, { animate: false })
    expect(controller.getPosition()).toEqual({ x: 10, y: 20 })

    const callbacks: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      callbacks.push(cb)
      return callbacks.length
    })

    window.dispatchEvent(new Event('resize'))
    expect(callbacks.length).toBe(0)
    expect(controller.getPosition()).toEqual({ x: 10, y: 20 })

    controller.destroy()
    vi.unstubAllGlobals()
  })

  it('retargets local numeric coordinates when coordinateRoot is set', async () => {
    const stage = document.createElement('div')
    stage.id = 'stage'
    document.body.appendChild(stage)

    const rect = {
      left: 10,
      top: 20,
      width: 100,
      height: 50,
      right: 110,
      bottom: 70,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    }
    const rectSpy = vi
      .spyOn(stage, 'getBoundingClientRect')
      .mockReturnValue(rect as DOMRect)
    vi.spyOn(window, 'getComputedStyle').mockImplementation(((el: Element) => {
      if (el === stage) {
        return { width: '200px', height: '100px' } as CSSStyleDeclaration
      }
      return { width: '0px', height: '0px' } as CSSStyleDeclaration
    }) as typeof getComputedStyle)

    const root = document.createElement('div')
    const inner = document.createElement('div')
    document.body.appendChild(root)
    root.appendChild(inner)

    const controller = createCursorController(
      { getRootEl: () => root, getInnerEl: () => inner },
      { coordinateRoot: '#stage' },
    )
    controller.mount()

    // local (0,0) → viewport (10, 20) with scale 0.5
    await controller.moveTo(0, 0, { animate: false })
    expect(controller.getPosition()).toEqual({ x: 10, y: 20 })

    rectSpy.mockReturnValue({
      ...rect,
      left: 30,
      top: 40,
      width: 150,
      height: 75,
      right: 180,
      bottom: 115,
      x: 30,
      y: 40,
    } as DOMRect)
    vi.spyOn(window, 'getComputedStyle').mockImplementation(((el: Element) => {
      if (el === stage) {
        return { width: '200px', height: '100px' } as CSSStyleDeclaration
      }
      return { width: '0px', height: '0px' } as CSSStyleDeclaration
    }) as typeof getComputedStyle)

    const callbacks: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      callbacks.push(cb)
      return callbacks.length
    })

    window.dispatchEvent(new Event('resize'))
    callbacks[0]?.(0)

    // local (0,0) → new top-left (30, 40); scale now 150/200 and 75/100
    expect(controller.getPosition()).toEqual({ x: 30, y: 40 })

    controller.destroy()
    vi.unstubAllGlobals()
  })
})
