import type { ClickOptions, CursorInteractionState, MouseButton } from './types'

export interface CreateCursorInteractionOptions {
  pressedScale?: number
  animationDuration?: number
  onChange?: (snapshot: CursorInteractionSnapshot) => void
}

export interface CursorInteractionSnapshot {
  state: CursorInteractionState
  button: MouseButton | null
  pressScale: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buttonCode(button: MouseButton): number {
  return button === 'right' ? 2 : 0
}

function buttonsMask(button: MouseButton): number {
  return button === 'right' ? 2 : 1
}

/**
 * Dispatch a synthetic pointer/mouse click sequence at viewport coordinates.
 */
export function dispatchRealClick(
  clientX: number,
  clientY: number,
  button: MouseButton,
): void {
  const target = document.elementFromPoint(clientX, clientY)
  if (!target) {
    console.warn('pointing-cursor: no element under hotspot for real click')
    return
  }

  const down: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    button: buttonCode(button),
    buttons: buttonsMask(button),
  }

  if (typeof PointerEvent !== 'undefined') {
    const pointerDown: PointerEventInit = {
      ...down,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
    }
    target.dispatchEvent(new PointerEvent('pointerdown', pointerDown))
  }
  target.dispatchEvent(new MouseEvent('mousedown', down))

  const up: MouseEventInit = { ...down, buttons: 0 }
  if (typeof PointerEvent !== 'undefined') {
    target.dispatchEvent(
      new PointerEvent('pointerup', {
        ...up,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      }),
    )
  }
  target.dispatchEvent(new MouseEvent('mouseup', up))

  if (button === 'left') {
    target.dispatchEvent(new MouseEvent('click', up))
  } else {
    target.dispatchEvent(new MouseEvent('contextmenu', up))
  }
}

export function createCursorInteraction(
  options: CreateCursorInteractionOptions = {},
) {
  const pressedScaleAmount = options.pressedScale ?? 0.9
  const defaultDuration = () => options.animationDuration ?? 120

  let state: CursorInteractionState = 'idle'
  let button: MouseButton | null = null
  let pressScale = 1
  let pressToken = 0

  function notify(): void {
    options.onChange?.({ state, button, pressScale })
  }

  async function press(
    btn: MouseButton = 'left',
    delayMs = defaultDuration(),
  ): Promise<void> {
    const token = ++pressToken
    state = 'pressing'
    button = btn
    pressScale = pressedScaleAmount
    notify()
    await sleep(Math.max(40, delayMs))
    if (token !== pressToken) return
    state = 'pressed'
    notify()
  }

  async function release(): Promise<void> {
    pressToken += 1
    state = 'idle'
    button = null
    pressScale = 1
    notify()
  }

  async function click(
    opts: ClickOptions & { clientX?: number; clientY?: number } = {},
  ): Promise<void> {
    const btn = opts.button ?? 'left'
    const animate = opts.animate !== false
    const delayMs = opts.delayMs ?? defaultDuration()

    if (animate) {
      await press(btn, delayMs)
    } else {
      button = btn
      state = 'pressed'
      notify()
    }

    if (
      opts.real &&
      typeof opts.clientX === 'number' &&
      typeof opts.clientY === 'number'
    ) {
      dispatchRealClick(opts.clientX, opts.clientY, btn)
    }

    await release()
  }

  return {
    getState: () => state,
    getButton: () => button,
    getPressScale: () => pressScale,
    press,
    release,
    click,
  }
}

/** @deprecated Use createCursorInteraction */
export const useCursorInteraction = createCursorInteraction
