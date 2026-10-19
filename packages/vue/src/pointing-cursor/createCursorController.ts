import {
  animateAlong,
  createCurvedPath,
  durationForDistance,
  jumpTo,
  type AnimateHandle,
} from './motion'
import { createMotionStyle } from './motionStyle'
import { createCursorInteraction } from './interaction'
import { resolveMoveTarget } from './resolveTarget'
import { mountClickBurst } from './clickBurst'
import {
  SHAPE_DEFAULT_ANGLES,
  SHAPE_HOTSPOTS,
  SHAPE_SVGS,
} from './shapes'
import type {
  ClickOptions,
  MotionFrame,
  MotionStyle,
  MouseButton,
  MoveToOptions,
  Point,
  ShapeName,
} from './types'

export interface CursorControllerOptions {
  getRootEl: () => HTMLElement | null
  getInnerEl: () => HTMLElement | null
  /** Host for click-burst overlays (default: document.body). */
  getBurstParent?: () => HTMLElement | null
  onMove?: (point: Point, kind: 'frame' | 'boundary') => void
  onShow?: () => void
  onHide?: () => void
  onVisibilityChange?: (visible: boolean) => void
  onInteractionChange?: (snapshot: {
    state: string
    button: MouseButton | null
    pressScale: number
    pressed: boolean
  }) => void
}

export interface CursorControllerConfig {
  size: string
  shape: ShapeName
  stroke: string
  fill: string
  visible: boolean
  followMouse: boolean
  hideNativeCursor: boolean
  x?: number
  y?: number
  hotspotX?: number
  hotspotY?: number
  zIndex: number
  minDuration: number
  maxDuration: number
  motionStyle: MotionStyle
  defaultAngle?: number
  mirrorNativeClicks: boolean
  clickAnimationDuration: number
  clickBurst: boolean
  clickBurstStrokeWidth: number | string
  clickBurstSize: string
  clickBurstDurationMs: number
  clickBurstLeftColor: string
  clickBurstRightColor: string
  clickBurstColor: string
  emitMoveFrames: boolean
}

export const DEFAULT_CURSOR_CONFIG: CursorControllerConfig = {
  size: '3em',
  shape: 'arrow',
  stroke: '#000000',
  fill: '#ffffff',
  visible: true,
  followMouse: false,
  hideNativeCursor: false,
  zIndex: 9999,
  minDuration: 280,
  maxDuration: 900,
  motionStyle: 'dangling',
  mirrorNativeClicks: true,
  clickAnimationDuration: 120,
  clickBurst: true,
  clickBurstStrokeWidth: 2,
  clickBurstSize: '2.25em',
  clickBurstDurationMs: 420,
  clickBurstLeftColor: '#22c55e',
  clickBurstRightColor: '#ef4444',
  clickBurstColor: '#111111',
  emitMoveFrames: false,
}

const MOVE_EMIT_INTERVAL_MS = 30
const FOLLOW_IDLE_MS = 100
const SUBPIXEL = 0.05

export interface CursorController {
  show(): void
  hide(): void
  isVisible(): boolean
  moveTo(
    target: number | string | Element,
    yOrOptions?: number | MoveToOptions,
    maybeOptions?: MoveToOptions,
  ): Promise<void>
  setFollow(enabled: boolean): void
  isFollowing(): boolean
  getPosition(): Point
  click(options?: ClickOptions): Promise<void>
  clickAt(
    target: number | string | Element,
    yOrOptions?: number | ClickOptions,
    maybeOptions?: ClickOptions,
  ): Promise<void>
  leftClick(options?: Omit<ClickOptions, 'button'>): Promise<void>
  rightClick(options?: Omit<ClickOptions, 'button'>): Promise<void>
  setMotionStyle(style: MotionStyle): void
  getShapeMarkup(): string
  getShapePaintStyle(): Record<string, string>
  getInteraction(): {
    pressed: boolean
    button: MouseButton | null
    pressScale: number
  }
  mount(): void
  destroy(): void
  setOptions(partial: Partial<CursorControllerConfig>): void
  getOptions(): CursorControllerConfig
  paint(): void
}

export function createCursorController(
  hooks: CursorControllerOptions,
  initial: Partial<CursorControllerConfig> = {},
): CursorController {
  let config: CursorControllerConfig = {
    ...DEFAULT_CURSOR_CONFIG,
    ...initial,
  }

  let posX = 0
  let posY = 0
  let rotationDeg = 0
  let pressScale = 1
  let visible = config.visible
  let following = false

  let motionHandle: AnimateHandle | null = null
  let followRaf = 0
  let followTarget: Point | null = null
  let lastMouseMoveAt = 0
  let nativeCursorBackup = ''
  let lastMoveEmitAt = 0
  const activeBursts: Array<{ destroy(): void }> = []

  let motionStyleValue: MotionStyle = config.motionStyle

  const motionStyleApi = createMotionStyle(() => motionStyleValue, {
    getDefaultAngle: () =>
      config.defaultAngle ?? SHAPE_DEFAULT_ANGLES[config.shape],
    onRotation(deg) {
      rotationDeg = deg
      paintInner()
    },
  })

  const interaction = createCursorInteraction({
    animationDuration: config.clickAnimationDuration,
    onChange(snapshot) {
      pressScale = snapshot.pressScale
      paintInner()
      hooks.onInteractionChange?.({
        ...snapshot,
        pressed: snapshot.state !== 'idle',
      })
    },
  })

  function hotspotFractions(): { x: number; y: number } {
    const defaults = SHAPE_HOTSPOTS[config.shape]
    return {
      x: config.hotspotX ?? defaults.x,
      y: config.hotspotY ?? defaults.y,
    }
  }

  function paintOuter(): void {
    const el = hooks.getRootEl()
    if (!el) return
    const h = hotspotFractions()
    el.style.transform = `translate3d(${posX}px, ${posY}px, 0) translate(-${h.x * 100}%, -${h.y * 100}%)`
  }

  function paintInner(): void {
    const el = hooks.getInnerEl()
    if (!el) return
    const h = hotspotFractions()
    el.style.transformOrigin = `${h.x * 100}% ${h.y * 100}%`
    el.style.transform = `rotate(${rotationDeg}deg) scale(${pressScale})`
  }

  function paint(): void {
    paintOuter()
    paintInner()
  }

  function emitMove(kind: 'frame' | 'boundary'): void {
    if (kind === 'frame') {
      if (!config.emitMoveFrames) return
      const now = performance.now()
      if (now - lastMoveEmitAt < MOVE_EMIT_INTERVAL_MS) return
      lastMoveEmitAt = now
    }
    hooks.onMove?.({ x: posX, y: posY }, kind)
  }

  function applyFrame(
    frame: MotionFrame,
    opts?: { emitBoundary?: boolean },
  ): void {
    posX = frame.x
    posY = frame.y
    motionStyleApi.onFrame(frame)
    paint()
    if (opts?.emitBoundary) emitMove('boundary')
    else emitMove('frame')
  }

  function cancelMotion() {
    motionHandle?.cancel()
    motionHandle = null
  }

  function burstColorFor(button: MouseButton): string {
    if (button === 'right') return config.clickBurstRightColor
    if (button === 'left') return config.clickBurstLeftColor
    return config.clickBurstColor
  }

  function spawnBurst(button: MouseButton, at?: Point) {
    if (!config.clickBurst) return
    const parent =
      hooks.getBurstParent?.() ??
      (typeof document !== 'undefined' ? document.body : null)
    if (!parent) return
    const handle = mountClickBurst(parent, {
      x: at?.x ?? posX,
      y: at?.y ?? posY,
      color: burstColorFor(button),
      strokeWidth: config.clickBurstStrokeWidth,
      size: config.clickBurstSize,
      durationMs: config.clickBurstDurationMs,
      zIndex: config.zIndex - 1,
      onDone: () => {
        const i = activeBursts.indexOf(handle)
        if (i >= 0) activeBursts.splice(i, 1)
      },
    })
    activeBursts.push(handle)
  }

  function show() {
    visible = true
    hooks.onVisibilityChange?.(true)
    hooks.onShow?.()
  }

  function hide() {
    visible = false
    hooks.onVisibilityChange?.(false)
    hooks.onHide?.()
  }

  async function moveTo(
    target: number | string | Element,
    yOrOptions?: number | MoveToOptions,
    maybeOptions?: MoveToOptions,
  ): Promise<void> {
    let point: Point
    let options: MoveToOptions = {}

    if (typeof target === 'number') {
      point = resolveMoveTarget(target, yOrOptions as number)
      options = maybeOptions ?? {}
    } else {
      point = resolveMoveTarget(target)
      options = (yOrOptions as MoveToOptions | undefined) ?? {}
    }

    cancelMotion()

    const animate = options.animate !== false
    if (!animate) {
      jumpTo(point, (f) => applyFrame(f, { emitBoundary: true }))
      motionStyleApi.onSettle()
      return
    }

    const from = { x: posX, y: posY }
    const dist = Math.hypot(point.x - from.x, point.y - from.y)
    const duration =
      options.duration ??
      durationForDistance(dist, config.minDuration, config.maxDuration)
    const path = createCurvedPath(from, point)

    motionStyleApi.beginTravel(from, point)
    emitMove('boundary')

    const needHeading =
      motionStyleValue !== 'dangling' || !motionStyleApi.hasLockedTravel()

    motionHandle = animateAlong(path, {
      duration,
      needHeading,
      onFrame: applyFrame,
    })
    await motionHandle.finished
    motionHandle = null
    motionStyleApi.onSettle()
    emitMove('boundary')
  }

  function onNativeMouseDown(event: MouseEvent) {
    if (!config.mirrorNativeClicks || !following) return
    if (event.button !== 0 && event.button !== 2) return
    const button: MouseButton = event.button === 2 ? 'right' : 'left'
    spawnBurst(button, { x: event.clientX, y: event.clientY })
    void interaction.press(button, config.clickAnimationDuration)
  }

  function onNativeMouseUp() {
    if (!config.mirrorNativeClicks || !following) return
    void interaction.release()
  }

  function onMouseMove(event: MouseEvent) {
    if (!following) return
    followTarget = { x: event.clientX, y: event.clientY }
    lastMouseMoveAt = performance.now()
    if (!followRaf) {
      followRaf = requestAnimationFrame(followTick)
    }
  }

  function followTick() {
    if (!following) {
      followRaf = 0
      return
    }

    const now = performance.now()
    const idle = now - lastMouseMoveAt > FOLLOW_IDLE_MS

    if (followTarget) {
      const dx = followTarget.x - posX
      const dy = followTarget.y - posY
      const moved = Math.abs(dx) > SUBPIXEL || Math.abs(dy) > SUBPIXEL

      if (moved) {
        posX += dx * 0.45
        posY += dy * 0.45
        motionStyleApi.onFrame({
          x: posX,
          y: posY,
          vx: dx,
          vy: dy,
          headingRad: Math.atan2(dy, dx),
          progress: 0,
        })
        paint()
        emitMove('frame')
      } else if (!idle) {
        motionStyleApi.onFrame({
          x: posX,
          y: posY,
          vx: 0,
          vy: 0,
          headingRad: 0,
          progress: 0,
        })
      }
    }

    if (idle && motionStyleApi.isSettled()) {
      followRaf = 0
      return
    }

    followRaf = requestAnimationFrame(followTick)
  }

  function startFollowLoop() {
    lastMouseMoveAt = performance.now()
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mousedown', onNativeMouseDown, true)
    window.addEventListener('mouseup', onNativeMouseUp, true)
    if (!followRaf) {
      followRaf = requestAnimationFrame(followTick)
    }
  }

  function stopFollowLoop() {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mousedown', onNativeMouseDown, true)
    window.removeEventListener('mouseup', onNativeMouseUp, true)
    if (followRaf) {
      cancelAnimationFrame(followRaf)
      followRaf = 0
    }
    followTarget = null
    void interaction.release()
  }

  function applyNativeCursorHide() {
    if (!config.hideNativeCursor || typeof document === 'undefined') return
    if (!nativeCursorBackup) {
      nativeCursorBackup = document.documentElement.style.cursor
    }
    document.documentElement.style.cursor = 'none'
  }

  function restoreNativeCursor() {
    if (typeof document === 'undefined') return
    if (
      nativeCursorBackup !== '' ||
      document.documentElement.style.cursor === 'none'
    ) {
      document.documentElement.style.cursor = nativeCursorBackup
      nativeCursorBackup = ''
    }
  }

  function setFollow(enabled: boolean) {
    following = enabled
    if (!enabled) {
      stopFollowLoop()
      restoreNativeCursor()
      motionStyleApi.onSettle()
    } else {
      startFollowLoop()
      applyNativeCursorHide()
    }
  }

  async function click(options: ClickOptions = {}): Promise<void> {
    const button = options.button ?? 'left'
    const showBurst = options.burst ?? config.clickBurst
    if (showBurst) spawnBurst(button)

    await interaction.click({
      ...options,
      button,
      delayMs: options.delayMs ?? config.clickAnimationDuration,
      clientX: posX,
      clientY: posY,
    })
  }

  async function clickAt(
    target: number | string | Element,
    yOrOptions?: number | ClickOptions,
    maybeOptions?: ClickOptions,
  ): Promise<void> {
    let point: Point
    let options: ClickOptions = {}

    if (typeof target === 'number') {
      point = resolveMoveTarget(target, yOrOptions as number)
      options = maybeOptions ?? {}
    } else {
      point = resolveMoveTarget(target)
      options = (yOrOptions as ClickOptions | undefined) ?? {}
    }

    if (options.move !== false) {
      await moveTo(point.x, point.y, { animate: options.animate !== false })
    } else {
      jumpTo(point, (f) => applyFrame(f, { emitBoundary: true }))
    }

    await click(options)
  }

  function setMotionStyle(style: MotionStyle) {
    motionStyleValue = style
    config = { ...config, motionStyle: style }
    if (style === 'standard') motionStyleApi.reset()
  }

  function setOptions(partial: Partial<CursorControllerConfig>): void {
    const prev = config
    config = { ...config, ...partial }

    if (
      partial.clickAnimationDuration != null &&
      partial.clickAnimationDuration !== prev.clickAnimationDuration
    ) {
      // duration is read via closure on each press; config is enough
    }

    if (partial.motionStyle != null && partial.motionStyle !== motionStyleValue) {
      setMotionStyle(partial.motionStyle)
    }

    if (partial.visible != null && partial.visible !== visible) {
      if (partial.visible) show()
      else hide()
    }

    if (partial.followMouse != null && partial.followMouse !== following) {
      setFollow(partial.followMouse)
    } else if (partial.hideNativeCursor != null) {
      if (partial.hideNativeCursor && following) applyNativeCursorHide()
      else if (!partial.hideNativeCursor) restoreNativeCursor()
    }

    if (
      typeof partial.x === 'number' &&
      typeof partial.y === 'number' &&
      !following &&
      (partial.x !== prev.x || partial.y !== prev.y)
    ) {
      void moveTo(partial.x, partial.y)
    }

    paint()
  }

  function mount(): void {
    if (typeof config.x === 'number' && typeof config.y === 'number') {
      jumpTo({ x: config.x, y: config.y }, (f) =>
        applyFrame(f, { emitBoundary: true }),
      )
    } else if (typeof window !== 'undefined') {
      jumpTo(
        { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        (f) => applyFrame(f, { emitBoundary: true }),
      )
    } else {
      paint()
    }
    if (config.followMouse) {
      setFollow(true)
    }
    hooks.onVisibilityChange?.(visible)
  }

  function destroy(): void {
    cancelMotion()
    stopFollowLoop()
    restoreNativeCursor()
    for (const b of activeBursts.splice(0)) b.destroy()
  }

  return {
    show,
    hide,
    isVisible: () => visible,
    moveTo,
    setFollow,
    isFollowing: () => following,
    getPosition: () => ({ x: posX, y: posY }),
    click,
    clickAt,
    leftClick: (o) => click({ ...o, button: 'left' }),
    rightClick: (o) => click({ ...o, button: 'right' }),
    setMotionStyle,
    getShapeMarkup: () => SHAPE_SVGS[config.shape],
    getShapePaintStyle: () => ({
      '--pointing-cursor-fill': config.fill,
      '--pointing-cursor-stroke': config.stroke,
    }),
    getInteraction: () => ({
      pressed: interaction.getState() !== 'idle',
      button: interaction.getButton(),
      pressScale: interaction.getPressScale(),
    }),
    mount,
    destroy,
    setOptions,
    getOptions: () => ({ ...config }),
    paint,
  }
}
