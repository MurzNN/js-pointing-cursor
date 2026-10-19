import type { ShapeName } from '../types'
import arrowSvg from './arrow.svg?raw'
import pointerSvg from './pointer.svg?raw'
import handSvg from './hand.svg?raw'

/** Inlined SVG markup for each bundled shape. */
export const SHAPE_SVGS: Record<ShapeName, string> = {
  arrow: arrowSvg,
  pointer: pointerSvg,
  hand: handSvg,
}

/**
 * Multiplier applied to `strokeWidth` so strokes look similar across viewBoxes.
 * Hand uses a 256×256 box vs ~24 for arrow/pointer.
 */
export const SHAPE_STROKE_SCALE: Record<ShapeName, number> = {
  arrow: 1,
  pointer: 1,
  hand: 256 / 24,
}

/**
 * Hotspots as fractions of each shape’s viewBox (tip of the cursor).
 */
export const SHAPE_HOTSPOTS: Record<ShapeName, { x: number; y: number }> = {
  arrow: { x: 0.14, y: 0.1 },
  pointer: { x: 0.19, y: 0.13 },
  hand: { x: 0.42, y: 0.06 },
}

/**
 * Tip offset from pointing **up** at CSS rotate(0), in degrees.
 * Hand index points up → 0. Arrow/pointer tips point up-left → -45.
 */
export const SHAPE_DEFAULT_ANGLES: Record<ShapeName, number> = {
  arrow: -45,
  pointer: -45,
  hand: 0,
}
