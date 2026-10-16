import { ref, type Ref } from 'vue'
import type { CursorInteractionState, MouseButton } from '../types'

/**
 * Phase 1 stub — full click animation + real DOM dispatch lands in phase 2.
 * Keeps interaction state composable so VueCursor does not grow a monolith.
 */
export interface UseCursorInteractionOptions {
  pressedScale?: number
}

export function useCursorInteraction(_options: UseCursorInteractionOptions = {}) {
  const state: Ref<CursorInteractionState> = ref('idle')
  const button: Ref<MouseButton | null> = ref(null)
  const pressScale: Ref<number> = ref(1)

  async function press(_btn: MouseButton = 'left', _delayMs = 80): Promise<void> {
    // Phase 2: animate press + optional event dispatch
  }

  async function release(): Promise<void> {
    state.value = 'idle'
    button.value = null
    pressScale.value = 1
  }

  async function click(_opts?: {
    button?: MouseButton
    real?: boolean
    animate?: boolean
    delayMs?: number
    clientX?: number
    clientY?: number
  }): Promise<void> {
    // Phase 2
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
