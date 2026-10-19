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
 * Hotspots as fractions of each shape’s viewBox (tip of the cursor).
 * Arrow viewBox: -10.5 0 32 32 — tip ≈ (0.2, 5.5)
 * Pointer viewBox: 0 0 24 24 — tip ≈ (4.5, 3.1) after flip
 * Hand viewBox: 0 0 256 256 — index tip ≈ (108, 8)
 */
export const SHAPE_HOTSPOTS: Record<ShapeName, { x: number; y: number }> = {
  arrow: { x: 0.33, y: 0.17 },
  pointer: { x: 0.19, y: 0.13 },
  hand: { x: 0.42, y: 0.03 },
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
