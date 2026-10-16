<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    color?: string
    strokeWidth?: number | string
    /** Outer diameter of the burst graphic. */
    size?: string
    durationMs?: number
  }>(),
  {
    color: '#111111',
    strokeWidth: 2,
    size: '2.25em',
    durationMs: 420,
  },
)

const emit = defineEmits<{
  done: []
}>()

/** Eight rays at 45° steps; gap in the center like the reference spark. */
const RAY_COUNT = 8
const VIEW = 32
const CX = VIEW / 2
const INNER = 5
const OUTER = 13

const rays = computed(() =>
  Array.from({ length: RAY_COUNT }, (_, i) => {
    const rad = (i * Math.PI) / 4
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return {
      x1: CX + cos * INNER,
      y1: CX + sin * INNER,
      x2: CX + cos * OUTER,
      y2: CX + sin * OUTER,
    }
  }),
)

const rootStyle = computed(() => ({
  width: props.size,
  height: props.size,
  ['--vue-cursor-burst-ms' as string]: `${props.durationMs}ms`,
}))

let doneTimer = 0

onMounted(() => {
  doneTimer = window.setTimeout(() => emit('done'), props.durationMs)
})

onBeforeUnmount(() => {
  window.clearTimeout(doneTimer)
})
</script>

<template>
  <svg
    class="vue-cursor-burst__svg"
    :viewBox="`0 0 ${VIEW} ${VIEW}`"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    :style="rootStyle"
  >
    <line
      v-for="(ray, i) in rays"
      :key="i"
      :x1="ray.x1"
      :y1="ray.y1"
      :x2="ray.x2"
      :y2="ray.y2"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
    />
  </svg>
</template>

<style scoped>
.vue-cursor-burst__svg {
  display: block;
  overflow: visible;
  transform-origin: 50% 50%;
  animation: vue-cursor-burst-expand var(--vue-cursor-burst-ms, 420ms) ease-out forwards;
}

@keyframes vue-cursor-burst-expand {
  0% {
    opacity: 1;
    transform: scale(0.35);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}
</style>
