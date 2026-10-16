<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from 'vue'
import {
  SHAPE_COMPONENTS,
  SHAPE_DEFAULT_ANGLES,
  SHAPE_HOTSPOTS,
} from '../../shapes'
import {
  animateAlong,
  createCurvedPath,
  durationForDistance,
  jumpTo,
  type AnimateHandle,
} from '../../composables/useCursorMotion'
import { useCursorInteraction } from '../../composables/useCursorInteraction'
import { useCursorMotionStyle } from '../../composables/useCursorMotionStyle'
import { resolveMoveTarget } from '../../utils/resolveTarget'
import ClickBurst from './ClickBurst.vue'
import type {
  ClickBurstInstance,
  ClickOptions,
  MotionFrame,
  MotionStyle,
  MouseButton,
  MoveToOptions,
  Point,
  ShapeName,
} from '../../types'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    size?: string
    shape?: ShapeName
    stroke?: string
    fill?: string
    strokeWidth?: number | string
    visible?: boolean
    followMouse?: boolean
    hideNativeCursor?: boolean
    x?: number
    y?: number
    hotspotX?: number
    hotspotY?: number
    zIndex?: number
    minDuration?: number
    maxDuration?: number
    motionStyle?: MotionStyle
    /**
     * Tip offset from pointing up at rest (degrees). When omitted, uses the
     * bundled shape default (arrow/pointer -45, hand 0).
     */
    defaultAngle?: number
    mirrorNativeClicks?: boolean
    clickAnimationDuration?: number
    /** Radiating-lines spark at the click hotspot. */
    clickBurst?: boolean
    clickBurstStrokeWidth?: number | string
    clickBurstSize?: string
    clickBurstDurationMs?: number
    /** Left-click burst color (default green). */
    clickBurstLeftColor?: string
    /** Right-click burst color (default red). */
    clickBurstRightColor?: string
    /** Fallback stroke color when a button-specific color is not used. */
    clickBurstColor?: string
    /**
     * When true, emit `move` while animating/following (throttled ~30ms).
     * Default false — only emit at move start/end to avoid parent re-renders.
     */
    emitMoveFrames?: boolean
  }>(),
  {
    size: '3em',
    shape: 'arrow',
    stroke: '#111111',
    fill: '#ffffff',
    strokeWidth: 2,
    visible: true,
    followMouse: false,
    hideNativeCursor: false,
    hotspotX: undefined,
    hotspotY: undefined,
    zIndex: 9999,
    minDuration: 280,
    maxDuration: 900,
    motionStyle: 'dangling',
    defaultAngle: undefined,
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
  },
)

const emit = defineEmits<{
  move: [point: Point]
  show: []
  hide: []
}>()

const rootEl = ref<HTMLElement | null>(null)
const innerEl = ref<HTMLElement | null>(null)

const isVisible = ref(props.visible)
const isFollowing = ref(props.followMouse)

/** Plain locals for the rAF hot path (not Vue refs). */
let posX = 0
let posY = 0
let rotationDeg = 0
let pressScale = 1

const interaction = useCursorInteraction({
  animationDuration: props.clickAnimationDuration,
})

const localMotionStyle = ref<MotionStyle>(props.motionStyle)
const effectiveDefaultAngle = computed(
  () => props.defaultAngle ?? SHAPE_DEFAULT_ANGLES[props.shape],
)

const motionStyleApi = useCursorMotionStyle(localMotionStyle, {
  defaultAngle: effectiveDefaultAngle,
  onRotation(deg) {
    rotationDeg = deg
    paintInner()
  },
})

watch(
  () => props.motionStyle,
  (value) => {
    localMotionStyle.value = value
    if (value === 'standard') motionStyleApi.reset()
  },
)

watch(
  () => interaction.pressScale.value,
  (value) => {
    pressScale = value
    paintInner()
  },
)

let motionHandle: AnimateHandle | null = null
let followRaf = 0
let followTarget: Point | null = null
let lastMouseMoveAt = 0
let nativeCursorBackup = ''
let burstSeq = 0
const bursts = ref<ClickBurstInstance[]>([])

let lastMoveEmitAt = 0
const MOVE_EMIT_INTERVAL_MS = 30
const FOLLOW_IDLE_MS = 100
const SUBPIXEL = 0.05

function burstColorFor(button: MouseButton): string {
  if (button === 'right') return props.clickBurstRightColor
  if (button === 'left') return props.clickBurstLeftColor
  return props.clickBurstColor
}

function spawnBurst(button: MouseButton, at?: Point) {
  if (!props.clickBurst) return
  const id = ++burstSeq
  bursts.value.push({
    id,
    x: at?.x ?? posX,
    y: at?.y ?? posY,
    color: burstColorFor(button),
  })
}

function removeBurst(id: number) {
  bursts.value = bursts.value.filter((b) => b.id !== id)
}

const shapeComponent = computed(() => SHAPE_COMPONENTS[props.shape])

const hotspot = computed(() => {
  const defaults = SHAPE_HOTSPOTS[props.shape]
  return {
    x: props.hotspotX ?? defaults.x,
    y: props.hotspotY ?? defaults.y,
  }
})

/** Static layout styles — transforms are applied imperatively in paint(). */
const outerStyle = computed((): CSSProperties => ({
  position: 'fixed',
  left: '0',
  top: '0',
  width: props.size,
  height: props.size,
  zIndex: props.zIndex,
  pointerEvents: 'none',
}))

function hotspotFractions(): { x: number; y: number } {
  return hotspot.value
}

function paintOuter(): void {
  const el = rootEl.value
  if (!el) return
  const h = hotspotFractions()
  el.style.transform = `translate3d(${posX}px, ${posY}px, 0) translate(-${h.x * 100}%, -${h.y * 100}%)`
}

function paintInner(): void {
  const el = innerEl.value
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
    if (!props.emitMoveFrames) return
    const now = performance.now()
    if (now - lastMoveEmitAt < MOVE_EMIT_INTERVAL_MS) return
    lastMoveEmitAt = now
  }
  emit('move', { x: posX, y: posY })
}

function applyFrame(frame: MotionFrame, opts?: { emitBoundary?: boolean }): void {
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

function show() {
  isVisible.value = true
  emit('show')
}

function hide() {
  isVisible.value = false
  emit('hide')
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
    durationForDistance(dist, props.minDuration, props.maxDuration)
  const path = createCurvedPath(from, point)

  motionStyleApi.beginTravel(from, point)
  emitMove('boundary')

  // Skip Bézier heading when dangling travel is locked.
  const needHeading =
    localMotionStyle.value !== 'dangling' || !motionStyleApi.hasLockedTravel()

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

function setFollow(enabled: boolean) {
  isFollowing.value = enabled
  if (!enabled) {
    stopFollowLoop()
    restoreNativeCursor()
    motionStyleApi.onSettle()
  } else {
    startFollowLoop()
    applyNativeCursorHide()
  }
}

function getPosition(): Point {
  return { x: posX, y: posY }
}

async function click(options: ClickOptions = {}): Promise<void> {
  const button = options.button ?? 'left'
  const showBurst = options.burst ?? props.clickBurst
  if (showBurst) spawnBurst(button)

  await interaction.click({
    ...options,
    button,
    delayMs: options.delayMs ?? props.clickAnimationDuration,
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

async function leftClick(options: Omit<ClickOptions, 'button'> = {}): Promise<void> {
  await click({ ...options, button: 'left' })
}

async function rightClick(options: Omit<ClickOptions, 'button'> = {}): Promise<void> {
  await click({ ...options, button: 'right' })
}

function onNativeMouseDown(event: MouseEvent) {
  if (!props.mirrorNativeClicks || !isFollowing.value) return
  if (event.button !== 0 && event.button !== 2) return
  const button: MouseButton = event.button === 2 ? 'right' : 'left'
  spawnBurst(button, { x: event.clientX, y: event.clientY })
  void interaction.press(button, props.clickAnimationDuration)
}

function onNativeMouseUp() {
  if (!props.mirrorNativeClicks || !isFollowing.value) return
  void interaction.release()
}

function onMouseMove(event: MouseEvent) {
  if (!isFollowing.value) return
  followTarget = { x: event.clientX, y: event.clientY }
  lastMouseMoveAt = performance.now()
  if (!followRaf) {
    followRaf = requestAnimationFrame(followTick)
  }
}

function followTick() {
  if (!isFollowing.value) {
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
  if (!props.hideNativeCursor || typeof document === 'undefined') return
  if (!nativeCursorBackup) {
    nativeCursorBackup = document.documentElement.style.cursor
  }
  document.documentElement.style.cursor = 'none'
}

function restoreNativeCursor() {
  if (typeof document === 'undefined') return
  if (nativeCursorBackup !== '' || document.documentElement.style.cursor === 'none') {
    document.documentElement.style.cursor = nativeCursorBackup
    nativeCursorBackup = ''
  }
}

watch(
  () => props.visible,
  (v) => {
    isVisible.value = v
  },
)

watch(
  () => props.followMouse,
  (v) => {
    setFollow(v)
  },
)

watch(
  () => props.hideNativeCursor,
  (v) => {
    if (v && isFollowing.value) applyNativeCursorHide()
    else if (!v) restoreNativeCursor()
  },
)

watch(
  () => [props.x, props.y] as const,
  ([x, y]) => {
    if (typeof x === 'number' && typeof y === 'number' && !isFollowing.value) {
      void moveTo(x, y)
    }
  },
)

watch(
  () => [props.size, props.shape, props.hotspotX, props.hotspotY] as const,
  () => {
    nextTick(() => paint())
  },
)

onMounted(() => {
  if (typeof props.x === 'number' && typeof props.y === 'number') {
    jumpTo({ x: props.x, y: props.y }, (f) => applyFrame(f, { emitBoundary: true }))
  } else if (typeof window !== 'undefined') {
    jumpTo(
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      (f) => applyFrame(f, { emitBoundary: true }),
    )
  } else {
    paint()
  }
  if (props.followMouse) {
    setFollow(true)
  }
})

onBeforeUnmount(() => {
  cancelMotion()
  stopFollowLoop()
  restoreNativeCursor()
})

function setMotionStyle(style: MotionStyle) {
  localMotionStyle.value = style
  if (style === 'standard') motionStyleApi.reset()
}

defineExpose({
  show,
  hide,
  moveTo,
  setFollow,
  getPosition,
  click,
  clickAt,
  leftClick,
  rightClick,
  setMotionStyle,
})
</script>

<template>
  <!-- Multi-root (cursor + bursts): fallthrough attrs must be bound explicitly. -->
  <div
    ref="rootEl"
    class="vue-cursor"
    v-bind="$attrs"
    :class="[
      `vue-cursor--${shape}`,
      { 'vue-cursor--hidden': !isVisible },
    ]"
    :style="outerStyle"
    aria-hidden="true"
  >
    <div ref="innerEl" class="vue-cursor__inner">
      <slot
        :pressed="interaction.state.value !== 'idle'"
        :button="interaction.button.value"
        :stroke="stroke"
        :fill="fill"
        :stroke-width="strokeWidth"
      >
        <component
          :is="shapeComponent"
          :stroke="stroke"
          :fill="fill"
          :stroke-width="strokeWidth"
          :pressed="interaction.state.value !== 'idle'"
          :button="interaction.button.value"
        />
      </slot>
    </div>
  </div>

  <div
    v-for="burst in bursts"
    :key="burst.id"
    class="vue-cursor-burst"
    aria-hidden="true"
    :style="{
      position: 'fixed',
      left: `${burst.x}px`,
      top: `${burst.y}px`,
      zIndex: zIndex - 1,
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%)',
    }"
  >
    <ClickBurst
      :color="burst.color"
      :stroke-width="clickBurstStrokeWidth"
      :size="clickBurstSize"
      :duration-ms="clickBurstDurationMs"
      @done="removeBurst(burst.id)"
    />
  </div>
</template>

<style scoped>
.vue-cursor {
  will-change: transform;
  contain: layout style;
}

.vue-cursor__inner {
  display: block;
  width: 100%;
  height: 100%;
}

/* Opacity/visibility only — never transition transform on the paint root. */
.vue-cursor--hidden {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 120ms ease,
    visibility 120ms ease;
}

.vue-cursor:not(.vue-cursor--hidden) {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 120ms ease,
    visibility 120ms ease;
}
</style>
