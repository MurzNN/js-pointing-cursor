import type { Point } from '../types'

export class TargetResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TargetResolutionError'
  }
}

/**
 * Resolve a CSS selector or Element to the center of its bounding box
 * in viewport coordinates.
 */
export function resolveElementCenter(target: string | Element): Point {
  const el =
    typeof target === 'string' ? document.querySelector(target) : target

  if (!el) {
    const message =
      typeof target === 'string'
        ? `vue-cursor: no element matches selector "${target}"`
        : 'vue-cursor: target element is null'
    console.warn(message)
    throw new TargetResolutionError(message)
  }

  const rect = el.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

/**
 * Normalize move targets: numbers as coordinates, or selector/Element as center.
 */
export function resolveMoveTarget(
  target: number | string | Element,
  y?: number,
): Point {
  if (typeof target === 'number') {
    if (typeof y !== 'number' || Number.isNaN(y)) {
      throw new TargetResolutionError(
        'vue-cursor: moveTo(x, y) requires numeric y when x is a number',
      )
    }
    return { x: target, y }
  }
  return resolveElementCenter(target)
}
