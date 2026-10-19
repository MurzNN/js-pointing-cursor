import type { ShapeName } from './types'

/** Inlined SVG markup for each bundled shape. */
export const SHAPE_SVGS: Record<ShapeName, string> = {
  arrow: `<svg
  class="pointing-cursor-shape pointing-cursor-shape--arrow"
  viewBox="-1 6 13.5 20.5"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <path
    d="M1.1 8L1.56 8.1L10.16 16.73L10.2 17L10.07 17.24L8 18.14L7.31 19.41L8.88 23.24L8.9 23.46L8.66 23.78L6.96 24.5L6.49 24.4L4.85 20.54L3.74 19.9L1.36 20.84L1.08 20.81L0.89 20.63L0.84 8.38L0.96 8.09L1.1 8Z"
    fill="var(--pointing-cursor-fill)"
    stroke="var(--pointing-cursor-stroke)"
    stroke-width="var(--pointing-cursor-stroke-width)"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
</svg>
`,
  pointer: `<svg
  class="pointing-cursor-shape pointing-cursor-shape--pointer"
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <g transform="matrix(-1 0 0 1 24 0)">
    <path
      d="M19.54,3.1,3.62,10.31A1.17,1.17,0,0,0,4,12.5l6.23,1.26L11.5,20a1.17,1.17,0,0,0,2.19.39L20.9,4.46A1,1,0,0,0,19.54,3.1Z"
      fill="var(--pointing-cursor-fill)"
      stroke="var(--pointing-cursor-stroke)"
      stroke-width="var(--pointing-cursor-stroke-width)"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </g>
</svg>
`,
  hand: `<svg
  class="pointing-cursor-shape pointing-cursor-shape--hand"
  viewBox="0 0 256 256"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <path
    d="M79.1 215L86.8 220.9L94.9 225.5L103.2 228.7L112.8 230.9L123.6 231.9L134.6 231.7L145.2 230.1L155.3 227.2L164.6 223.1L173 218.1L180.8 212L188 204.8L194.1 197L199.4 188L203.4 178.7L206.1 169.2L208 154.7L208 112L207.2 106.4L205.2 101.8L200.5 96.4L194.6 93.1L190.8 92.2L186.7 92L182.3 92.8L178.2 94.6L166.1 91.5L162.2 85.9L156.3 81.8L151.8 80.4L147.6 80L143.8 80.5L139.5 81.9L128 74.1L127.8 33.3L125.6 26.5L121.4 21.1L117.2 18.2L112.7 16.6L107.7 16L102.7 16.7L98.3 18.5L94.2 21.5L91 25.5L89 29.8L88 35.7L88 127.4L72.8 131L65.6 118.5L62.1 114.4L56.6 110.9L49.4 109.3L42.9 110.2L36.8 113.2L32.1 118.2L29.3 124.7L28.8 130.6L30.1 136.4L48.3 172.7L56.2 186.3L63.9 197.8L71.5 207.3L78.6 214.5L79.1 215Z"
    fill="var(--pointing-cursor-fill)"
    stroke="var(--pointing-cursor-stroke)"
    stroke-width="var(--pointing-cursor-stroke-width)"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
</svg>
`,
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
