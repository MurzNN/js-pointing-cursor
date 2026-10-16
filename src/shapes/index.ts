export { default as ArrowCursor } from './ArrowCursor.vue'
export { default as PointerCursor } from './PointerCursor.vue'
export { default as HandCursor } from './HandCursor.vue'

import type { ShapeName } from '../types'
import ArrowCursor from './ArrowCursor.vue'
import PointerCursor from './PointerCursor.vue'
import HandCursor from './HandCursor.vue'
import type { Component } from 'vue'

export const SHAPE_COMPONENTS: Record<ShapeName, Component> = {
  arrow: ArrowCursor,
  pointer: PointerCursor,
  hand: HandCursor,
}

/** Default hotspot as fractions of the shape box (origin top-left). */
/**
 * Hotspots as fractions of each shape’s viewBox (tip of the cursor).
 * Arrow viewBox: -1 6 13.5 20.5 — tip ≈ (0.9, 8.1), box tight to glyph
 * Pointer viewBox: 0 0 24 24 — tip ≈ (4.5, 3.1) after flip
 * Hand viewBox: 0 0 256 256 — index tip ≈ (107.7, 16) after midline
 */
export const SHAPE_HOTSPOTS: Record<ShapeName, { x: number; y: number }> = {
  arrow: { x: 0.14, y: 0.1 },
  pointer: { x: 0.19, y: 0.13 },
  hand: { x: 0.42, y: 0.06 },
}
