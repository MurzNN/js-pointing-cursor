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
    strokeWidth: 2,
    pressed: false,
    button: null,
  },
)
</script>

<template>
  <!--
    Arrowhead / pointer without stem (tip top-left after horizontal flip).
    Source path mirrored with transform to match the usual OS tip orientation.
  -->
  <svg
    class="vue-cursor-shape vue-cursor-shape--pointer"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    :data-pressed="pressed ? 'true' : 'false'"
    :data-button="button ?? undefined"
    :style="{ transform: pressed ? 'scale(0.92)' : undefined }"
  >
    <g transform="matrix(-1 0 0 1 24 0)">
      <path
        d="M19.54,3.1,3.62,10.31A1.17,1.17,0,0,0,4,12.5l6.23,1.26L11.5,20a1.17,1.17,0,0,0,2.19.39L20.9,4.46A1,1,0,0,0,19.54,3.1Z"
        :fill="fill"
        :stroke="stroke"
        :stroke-width="strokeWidth"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </g>
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
