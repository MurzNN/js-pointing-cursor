import { computed, ref, type Ref } from 'vue'
import type { MotionFrame, MotionStyle } from '../types'

/**
 * Phase 1 stub — `standard` keeps rotation at 0.
 * Phase 3 wires `dangling` spring toward travel heading.
 */
export interface MotionStyleResult {
  rotationDeg: number
}

export function useCursorMotionStyle(style: Ref<MotionStyle> | (() => MotionStyle)) {
  const rotationDeg = ref(0)

  function getStyle(): MotionStyle {
    return typeof style === 'function' ? style() : style.value
  }

  function onFrame(_frame: MotionFrame): void {
    if (getStyle() === 'standard') {
      rotationDeg.value = 0
      return
    }
    // Phase 3: dangling — rotate toward heading with lag/spring
    rotationDeg.value = 0
  }

  function onSettle(): void {
    rotationDeg.value = 0
  }

  function reset(): void {
    rotationDeg.value = 0
  }

  return {
    rotationDeg: computed(() => rotationDeg.value),
    onFrame,
    onSettle,
    reset,
  }
}
