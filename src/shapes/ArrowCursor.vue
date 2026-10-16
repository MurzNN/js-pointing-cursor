<script setup lang="ts">
withDefaults(
  defineProps<{
    stroke?: string
    fill?: string
    strokeWidth?: number | string
    pressed?: boolean
    button?: 'left' | 'right' | null
  }>(),
  {
    stroke: '#111111',
    fill: '#ffffff',
    strokeWidth: 1.25,
    pressed: false,
    button: null,
  },
)
</script>

<template>
  <!--
    Classic arrow with stem — solid silhouette along the midline between the
    source SVG’s outer and inner (evenodd outline) contours.
  -->
  <svg
    class="vue-cursor-shape vue-cursor-shape--arrow"
    viewBox="-1 6 13.5 20.5"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    :data-pressed="pressed ? 'true' : 'false'"
    :data-button="button ?? undefined"
    :style="{ transform: pressed ? 'scale(0.92)' : undefined }"
  >
    <path
      d="M1.1 8L1.56 8.1L10.16 16.73L10.2 17L10.07 17.24L8 18.14L7.31 19.41L8.88 23.24L8.9 23.46L8.66 23.78L6.96 24.5L6.49 24.4L4.85 20.54L3.74 19.9L1.36 20.84L1.08 20.81L0.89 20.63L0.84 8.38L0.96 8.09L1.1 8Z"
      :fill="fill"
      :stroke="stroke"
      :stroke-width="strokeWidth"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
</template>

<style scoped>
.vue-cursor-shape {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  transition: transform 80ms ease-out;
}
</style>
