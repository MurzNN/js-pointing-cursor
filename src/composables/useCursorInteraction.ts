import { ref, type Ref } from 'vue'
import type { ClickOptions, CursorInteractionState, MouseButton } from '../types'

export interface UseCursorInteractionOptions {
  pressedScale?: number
  animationDuration?: number
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
 * Browsers may still block some native behaviors (e.g. context menu).
 */
export function dispatchRealClick(
  clientX: number,
  clientY: number,
  button: MouseButton,
): void {
  const target = document.elementFromPoint(clientX, clientY)
  if (!target) {
    console.warn('vue-cursor: no element under hotspot for real click')
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

export function useCursorInteraction(options: UseCursorInteractionOptions = {}) {
  const pressedScaleAmount = options.pressedScale ?? 0.9
  const defaultDuration = () => options.animationDuration ?? 120

  const state: Ref<CursorInteractionState> = ref('idle')
  const button: Ref<MouseButton | null> = ref(null)
  const pressScale: Ref<number> = ref(1)

  let pressToken = 0

  async function press(
    btn: MouseButton = 'left',
    delayMs = defaultDuration(),
  ): Promise<void> {
    const token = ++pressToken
    state.value = 'pressing'
    button.value = btn
    pressScale.value = pressedScaleAmount
    await sleep(Math.max(40, delayMs))
    if (token !== pressToken) return
    state.value = 'pressed'
  }

  async function release(): Promise<void> {
    pressToken += 1
    state.value = 'idle'
    button.value = null
    pressScale.value = 1
  }

  async function click(opts: ClickOptions & { clientX?: number; clientY?: number } = {}): Promise<void> {
    const btn = opts.button ?? 'left'
    const animate = opts.animate !== false
    const delayMs = opts.delayMs ?? defaultDuration()

    if (animate) {
      await press(btn, delayMs)
    } else {
      button.value = btn
      state.value = 'pressed'
    }

    if (opts.real && typeof opts.clientX === 'number' && typeof opts.clientY === 'number') {
      dispatchRealClick(opts.clientX, opts.clientY, btn)
    }

    await release()
  }

  return {
    state,
    button,
    pressScale,
    press,
    release,
    click,
  }
}
