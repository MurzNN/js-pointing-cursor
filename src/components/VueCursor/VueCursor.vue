<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from 'vue'
import { SHAPE_COMPONENTS, SHAPE_HOTSPOTS } from '../../shapes'
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
import type {
  MotionStyle,
  MoveToOptions,
  Point,
  ShapeName,
} from '../../types'

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
  }>(),
  {
    size: '2em',
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
    motionStyle: 'standard',
  },
)

const emit = defineEmits<{
  move: [point: Point]
  show: []
  hide: []
}>()

const pos = ref<Point>({ x: 0, y: 0 })
const isVisible = ref(props.visible)
const isFollowing = ref(props.followMouse)
const headingRad = ref(0)

const interaction = useCursorInteraction()
const motionStyleRef = computed(() => props.motionStyle)
const motionStyleApi = useCursorMotionStyle(motionStyleRef)

let motionHandle: AnimateHandle | null = null
let followRaf = 0
let followTarget: Point | null = null
let nativeCursorBackup = ''

const shapeComponent = computed(() => SHAPE_COMPONENTS[props.shape])

const hotspot = computed(() => {
  const defaults = SHAPE_HOTSPOTS[props.shape]
  return {
    x: props.hotspotX ?? defaults.x,
    y: props.hotspotY ?? defaults.y,
  }
})

const outerStyle = computed((): CSSProperties => ({
  position: 'fixed',
  left: '0',
  top: '0',
  width: props.size,
  height: props.size,
  zIndex: props.zIndex,
  pointerEvents: 'none',
  // Place hotspot on (x,y): translate to point, then pull back by hotspot fraction of box
  transform: `translate3d(${pos.value.x}px, ${pos.value.y}px, 0) translate(-${hotspot.value.x * 100}%, -${hotspot.value.y * 100}%)`,
  opacity: isVisible.value ? 1 : 0,
  visibility: isVisible.value ? 'visible' : 'hidden',
  transition: 'opacity 120ms ease',
  willChange: 'transform',
}))

const innerStyle = computed((): CSSProperties => ({
  width: '100%',
  height: '100%',
  transformOrigin: `${hotspot.value.x * 100}% ${hotspot.value.y * 100}%`,
  transform: `rotate(${motionStyleApi.rotationDeg.value}deg) scale(${interaction.pressScale.value})`,
  display: 'block',
}))

function applyFrame(frame: { x: number; y: number; headingRad: number; vx: number; vy: number; progress: number }) {
  pos.value = { x: frame.x, y: frame.y }
  headingRad.value = frame.headingRad
  motionStyleApi.onFrame(frame)
  emit('move', { x: frame.x, y: frame.y })
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
    jumpTo(point, applyFrame)
    motionStyleApi.onSettle()
    return
  }

  const from = { ...pos.value }
  const dist = Math.hypot(point.x - from.x, point.y - from.y)
  const duration =
    options.duration ??
    durationForDistance(dist, props.minDuration, props.maxDuration)
  const path = createCurvedPath(from, point)

  motionHandle = animateAlong(path, {
    duration,
    onFrame: applyFrame,
  })
  await motionHandle.finished
  motionHandle = null
  motionStyleApi.onSettle()
}

function setFollow(enabled: boolean) {
  isFollowing.value = enabled
  if (!enabled) {
    stopFollowLoop()
    restoreNativeCursor()
  } else {
    startFollowLoop()
    applyNativeCursorHide()
  }
}

function getPosition(): Point {
  return { ...pos.value }
}

function onMouseMove(event: MouseEvent) {
  if (!isFollowing.value) return
  followTarget = { x: event.clientX, y: event.clientY }
}

function followTick() {
  if (!isFollowing.value) return
  if (followTarget) {
    // Light smoothing toward pointer
    const dx = followTarget.x - pos.value.x
    const dy = followTarget.y - pos.value.y
    pos.value = {
      x: pos.value.x + dx * 0.45,
      y: pos.value.y + dy * 0.45,
    }
    headingRad.value = Math.atan2(dy, dx)
    motionStyleApi.onFrame({
      x: pos.value.x,
      y: pos.value.y,
      vx: dx,
      vy: dy,
      headingRad: headingRad.value,
      progress: 0,
    })
    emit('move', { ...pos.value })
  }
  followRaf = requestAnimationFrame(followTick)
}

function startFollowLoop() {
  if (followRaf) return
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  followRaf = requestAnimationFrame(followTick)
}

function stopFollowLoop() {
  window.removeEventListener('mousemove', onMouseMove)
  if (followRaf) {
    cancelAnimationFrame(followRaf)
    followRaf = 0
  }
  followTarget = null
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

onMounted(() => {
  // Start near viewport center if no coords provided
  if (typeof props.x === 'number' && typeof props.y === 'number') {
    jumpTo({ x: props.x, y: props.y }, applyFrame)
  } else if (typeof window !== 'undefined') {
    jumpTo(
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      applyFrame,
    )
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

defineExpose({
  show,
  hide,
  moveTo,
  setFollow,
  getPosition,
})
</script>

<template>
  <div
    class="vue-cursor"
    :class="[`vue-cursor--${shape}`, { 'vue-cursor--hidden': !isVisible }]"
    :style="outerStyle"
    aria-hidden="true"
  >
    <div class="vue-cursor__inner" :style="innerStyle">
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
</template>
