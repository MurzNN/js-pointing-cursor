<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from 'vue'
import { createCursorController } from './core'
import type {
  ClickOptions,
  MotionStyle,
  MouseButton,
  MoveToOptions,
  Point,
  ShapeName,
} from './core'

defineOptions({ name: 'PointingCursor', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    size?: string
    shape?: ShapeName
    stroke?: string
    fill?: string
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
    defaultAngle?: number
    mirrorNativeClicks?: boolean
    clickAnimationDuration?: number
    clickBurst?: boolean
    clickBurstStrokeWidth?: number | string
    clickBurstSize?: string
    clickBurstDurationMs?: number
    clickBurstLeftColor?: string
    clickBurstRightColor?: string
    clickBurstColor?: string
    emitMoveFrames?: boolean
  }>(),
  {
    size: '3em',
    shape: 'arrow',
    stroke: '#000000',
    fill: '#ffffff',
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
const pressed = ref(false)
const button = ref<MouseButton | null>(null)
const shapeMarkup = ref('')
const shapePaintStyle = ref<Record<string, string>>({})

function configFromProps() {
  return {
    size: props.size,
    shape: props.shape,
    stroke: props.stroke,
    fill: props.fill,
    visible: props.visible,
    followMouse: props.followMouse,
    hideNativeCursor: props.hideNativeCursor,
    x: props.x,
    y: props.y,
    hotspotX: props.hotspotX,
    hotspotY: props.hotspotY,
    zIndex: props.zIndex,
    minDuration: props.minDuration,
    maxDuration: props.maxDuration,
    motionStyle: props.motionStyle,
    defaultAngle: props.defaultAngle,
    mirrorNativeClicks: props.mirrorNativeClicks,
    clickAnimationDuration: props.clickAnimationDuration,
    clickBurst: props.clickBurst,
    clickBurstStrokeWidth: props.clickBurstStrokeWidth,
    clickBurstSize: props.clickBurstSize,
    clickBurstDurationMs: props.clickBurstDurationMs,
    clickBurstLeftColor: props.clickBurstLeftColor,
    clickBurstRightColor: props.clickBurstRightColor,
    clickBurstColor: props.clickBurstColor,
    emitMoveFrames: props.emitMoveFrames,
  }
}

const controller = createCursorController(
  {
    getRootEl: () => rootEl.value,
    getInnerEl: () => innerEl.value,
    onMove: (point) => emit('move', point),
    onShow: () => emit('show'),
    onHide: () => emit('hide'),
    onVisibilityChange: (v) => {
      isVisible.value = v
    },
    onInteractionChange: (snap) => {
      pressed.value = snap.pressed
      button.value = snap.button
    },
  },
  configFromProps(),
)

function syncShapeUi() {
  shapeMarkup.value = controller.getShapeMarkup()
  shapePaintStyle.value = controller.getShapePaintStyle()
}
syncShapeUi()

const outerStyle = computed((): CSSProperties => ({
  position: 'fixed',
  left: '0',
  top: '0',
  width: props.size,
  height: props.size,
  zIndex: props.zIndex,
  pointerEvents: 'none',
}))

onMounted(() => {
  controller.mount()
  syncShapeUi()
})

onBeforeUnmount(() => {
  controller.destroy()
})

watch(
  () => configFromProps(),
  (next) => {
    controller.setOptions(next)
    syncShapeUi()
  },
  { deep: true },
)

defineExpose({
  show: () => controller.show(),
  hide: () => controller.hide(),
  moveTo: (
    target: number | string | Element,
    yOrOptions?: number | MoveToOptions,
    maybeOptions?: MoveToOptions,
  ) => controller.moveTo(target, yOrOptions, maybeOptions),
  setFollow: (enabled: boolean) => controller.setFollow(enabled),
  getPosition: (): Point => controller.getPosition(),
  click: (options?: ClickOptions) => controller.click(options),
  clickAt: (
    target: number | string | Element,
    yOrOptions?: number | ClickOptions,
    maybeOptions?: ClickOptions,
  ) => controller.clickAt(target, yOrOptions, maybeOptions),
  leftClick: (options?: Omit<ClickOptions, 'button'>) =>
    controller.leftClick(options),
  rightClick: (options?: Omit<ClickOptions, 'button'>) =>
    controller.rightClick(options),
  setMotionStyle: (style: MotionStyle) => controller.setMotionStyle(style),
})
</script>

<template>
  <div
    ref="rootEl"
    class="pointing-cursor"
    v-bind="$attrs"
    :class="[
      `pointing-cursor--${shape}`,
      { 'pointing-cursor--hidden': !isVisible },
    ]"
    :style="outerStyle"
    aria-hidden="true"
  >
    <div ref="innerEl" class="pointing-cursor__inner">
      <slot
        :pressed="pressed"
        :button="button"
        :stroke="stroke"
        :fill="fill"
      >
        <div
          class="pointing-cursor__shape"
          :data-pressed="pressed ? 'true' : 'false'"
          :data-button="button ?? undefined"
          :style="shapePaintStyle"
          v-html="shapeMarkup"
        />
      </slot>
    </div>
  </div>
</template>

<style scoped>
.pointing-cursor {
  will-change: transform;
  contain: layout style;
}

.pointing-cursor__inner {
  display: block;
  width: 100%;
  height: 100%;
}

.pointing-cursor__shape {
  display: block;
  width: 100%;
  height: 100%;
}

.pointing-cursor__shape :deep(.pointing-cursor-shape) {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.pointing-cursor--hidden {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 120ms ease,
    visibility 120ms ease;
}

.pointing-cursor:not(.pointing-cursor--hidden) {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 120ms ease,
    visibility 120ms ease;
}
</style>
