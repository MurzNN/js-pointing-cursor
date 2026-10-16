export type ShapeName = 'arrow' | 'pointer' | 'hand'

export type MotionStyle = 'standard' | 'dangling'

export type MouseButton = 'left' | 'right'

export type CursorInteractionState = 'idle' | 'pressing' | 'pressed'

export interface Point {
  x: number
  y: number
}

export interface MotionFrame extends Point {
  vx: number
  vy: number
  headingRad: number
  progress: number
}

export interface MoveToOptions {
  animate?: boolean
  duration?: number
}

export interface ClickOptions {
  button?: MouseButton
  real?: boolean
  animate?: boolean
  move?: boolean
  delayMs?: number
  /** Show the radiating-lines burst at the click point (default: component `clickBurst` prop). */
  burst?: boolean
}

export interface ClickBurstInstance {
  id: number
  x: number
  y: number
  color: string
}

export type MoveTarget = string | Element | Point
