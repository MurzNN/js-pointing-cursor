import type { Point } from './types'

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
        ? `pointing-cursor: no element matches selector "${target}"`
        : 'pointing-cursor: target element is null'
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
 * Resolve a coordinate-root selector/Element used for local numeric coords.
 */
export function resolveCoordinateRoot(
  root: string | Element | null | undefined,
): Element | null {
  if (root == null) return null
  if (typeof root !== 'string') return root
  if (typeof document === 'undefined') return null
  return document.querySelector(root)
}

/**
 * Map a point from an element's local CSS pixel space (pre-transform layout
 * size) into viewport coordinates. Handles CSS `scale()` / Slidev stages:
 * `local (0,0)` → top-left of the element's border box on screen.
 */
export function localToViewport(root: Element, local: Point): Point {
  const rect = root.getBoundingClientRect()
  const style = getComputedStyle(root)
  const width = parseFloat(style.width) || 0
  const height = parseFloat(style.height) || 0
  const scaleX = width ? rect.width / width : 1
  const scaleY = height ? rect.height / height : 1
  return {
    x: rect.left + local.x * scaleX,
    y: rect.top + local.y * scaleY,
  }
}

/**
 * Normalize move targets: numbers as coordinates, or selector/Element as center.
 * When `coordinateRoot` is set, numeric x/y are treated as local to that root
 * and converted to viewport pixels.
 */
export function resolveMoveTarget(
  target: number | string | Element,
  y?: number,
  coordinateRoot?: string | Element | null,
): Point {
  if (typeof target === 'number') {
    if (typeof y !== 'number' || Number.isNaN(y)) {
      throw new TargetResolutionError(
        'pointing-cursor: moveTo(x, y) requires numeric y when x is a number',
      )
    }
    const local = { x: target, y }
    const root = resolveCoordinateRoot(coordinateRoot)
    if (root) return localToViewport(root, local)
    return local
  }
  return resolveElementCenter(target)
}
