<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  VuePointingCursor,
  type MotionStyle,
  type ShapeName,
} from 'vue-pointing-cursor'

const cursorRef = ref<InstanceType<typeof VuePointingCursor> | null>(null)

const visible = ref(true)
const followMouse = ref(false)
const hideNativeCursor = ref(true)
const shape = ref<ShapeName>('arrow')
const stroke = ref('#111111')
const fill = ref('#ffffff')
const strokeWidth = ref(2)
const size = ref('3em')
const motionStyle = ref<MotionStyle>('dangling')
const clickBurst = ref(true)

const shapeOptions: ShapeName[] = ['arrow', 'pointer', 'hand']
const sizeOptions = ['1em', '2em', '3em', '5em'] as const
const motionStyleOptions: MotionStyle[] = ['standard', 'dangling']

const clickCount = ref(0)

const stageRef = ref<HTMLElement | null>(null)
const markers = ref<{ id: string; x: number; y: number; label: string }[]>([])

function refreshMarkers() {
  const stage = stageRef.value
  if (!stage) return
  const rect = stage.getBoundingClientRect()
  markers.value = [
    { id: 'a', x: rect.left + rect.width * 0.18, y: rect.top + rect.height * 0.28, label: 'A' },
    { id: 'b', x: rect.left + rect.width * 0.82, y: rect.top + rect.height * 0.22, label: 'B' },
    { id: 'c', x: rect.left + rect.width * 0.75, y: rect.top + rect.height * 0.78, label: 'C' },
  ]
}

onMounted(() => {
  refreshMarkers()
  window.addEventListener('resize', refreshMarkers)
})

const markerStyle = computed(() => {
  const stage = stageRef.value
  if (!stage) return []
  const rect = stage.getBoundingClientRect()
  return markers.value.map((m) => ({
    id: m.id,
    label: m.label,
    left: `${((m.x - rect.left) / rect.width) * 100}%`,
    top: `${((m.y - rect.top) / rect.height) * 100}%`,
  }))
})

async function goToMarker(id: string) {
  refreshMarkers()
  const m = markers.value.find((item) => item.id === id)
  if (!m || !cursorRef.value) return
  visible.value = true
  followMouse.value = false
  await cursorRef.value.moveTo(m.x, m.y)
}

async function goToDemoButton() {
  if (!cursorRef.value) return
  visible.value = true
  followMouse.value = false
  await cursorRef.value.moveTo('#demo-button')
}

function toggleFollow() {
  followMouse.value = !followMouse.value
  cursorRef.value?.setFollow(followMouse.value)
}

function onShow() {
  visible.value = true
  cursorRef.value?.show()
}

function onHide() {
  visible.value = false
  cursorRef.value?.hide()
}

function onDemoClick() {
  clickCount.value += 1
}

async function visualClickDemo() {
  if (!cursorRef.value) return
  visible.value = true
  followMouse.value = false
  await cursorRef.value.leftClick({ real: false })
}

async function realClickDemo() {
  if (!cursorRef.value) return
  visible.value = true
  followMouse.value = false
  await cursorRef.value.clickAt('#demo-button', { real: true, button: 'left' })
}

async function rightClickDemo() {
  if (!cursorRef.value) return
  visible.value = true
  followMouse.value = false
  await cursorRef.value.rightClick({ real: false })
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <p class="nav-demos"><strong>Vue demo</strong> · <a href="../react/">React demo</a></p>
      <h1>vue-pointing-cursor</h1>
      <p>
        An oversized Vue&nbsp;3 cursor with curved human-like motion, follow mode,
        replaceable SVG shapes, and a shadcn-vue registry item. Move to coordinates
        or to the center of any element via a CSS selector.
      </p>
    </header>

    <VuePointingCursor
      ref="cursorRef"
      :visible="visible"
      :follow-mouse="followMouse"
      :hide-native-cursor="hideNativeCursor && followMouse"
      :shape="shape"
      :stroke="stroke"
      :fill="fill"
      :stroke-width="strokeWidth"
      :size="size"
      :motion-style="motionStyle"
      :click-burst="clickBurst"
      data-testid="vue-cursor"
    />

    <section class="panel">
      <h2>Playground</h2>
      <div class="controls">
        <div class="row">
          <button
            type="button"
            class="primary"
            data-testid="btn-show"
            @click="onShow"
          >
            Show
          </button>
          <button type="button" data-testid="btn-hide" @click="onHide">
            Hide
          </button>
          <button
            type="button"
            data-testid="btn-follow"
            :class="{ active: followMouse }"
            @click="toggleFollow"
          >
            {{ followMouse ? 'Stop follow' : 'Follow mouse' }}
          </button>
          <label>
            <input v-model="hideNativeCursor" type="checkbox" />
            Hide native cursor while following
          </label>
        </div>

        <fieldset class="radio-group" data-testid="shape-select">
          <legend>Shape</legend>
          <label v-for="option in shapeOptions" :key="option" class="radio">
            <input v-model="shape" type="radio" name="shape" :value="option" />
            {{ option }}
          </label>
        </fieldset>

        <fieldset class="radio-group" data-testid="size-select">
          <legend>Size</legend>
          <label v-for="option in sizeOptions" :key="option" class="radio">
            <input v-model="size" type="radio" name="size" :value="option" />
            {{ option }}
          </label>
        </fieldset>

        <div class="row">
          <label>
            Stroke
            <input v-model="stroke" type="color" />
          </label>
          <label>
            Fill
            <input v-model="fill" type="color" />
          </label>
          <label>
            Stroke width
            <input
              v-model.number="strokeWidth"
              type="range"
              min="0.5"
              max="2"
              step="0.5"
            />
            {{ strokeWidth }}
          </label>
        </div>

        <fieldset class="radio-group" data-testid="motion-style">
          <legend>Motion style</legend>
          <label
            v-for="option in motionStyleOptions"
            :key="option"
            class="radio"
          >
            <input
              v-model="motionStyle"
              type="radio"
              name="motion-style"
              :value="option"
            />
            {{ option }}
          </label>
        </fieldset>
        <p class="hint">
          <code>dangling</code> rotates the cursor toward travel (first-pass
          spring; tune after testing).
        </p>

        <div class="row">
          <button
            type="button"
            data-testid="btn-move-a"
            @click="goToMarker('a')"
          >
            Move to A
          </button>
          <button
            type="button"
            data-testid="btn-move-b"
            @click="goToMarker('b')"
          >
            Move to B
          </button>
          <button
            type="button"
            data-testid="btn-move-c"
            @click="goToMarker('c')"
          >
            Move to C
          </button>
          <button
            type="button"
            class="primary"
            data-testid="btn-move-selector"
            @click="goToDemoButton"
          >
            Move to #demo-button
          </button>
        </div>

        <div class="row">
          <label>
            <input
              v-model="clickBurst"
              type="checkbox"
              data-testid="click-burst-toggle"
            />
            Click burst
          </label>
          <button
            type="button"
            data-testid="btn-click-visual"
            @click="visualClickDemo"
          >
            Left click (visual, green burst)
          </button>
          <button
            type="button"
            data-testid="btn-click-real"
            @click="realClickDemo"
          >
            Left click (real) on #demo-button
          </button>
          <button
            type="button"
            data-testid="btn-click-right"
            @click="rightClickDemo"
          >
            Right click (visual, red burst)
          </button>
        </div>
      </div>

      <div ref="stageRef" class="stage" data-testid="stage">
        <div
          v-for="m in markerStyle"
          :key="m.id"
          class="marker"
          :style="{ left: m.left, top: m.top }"
          :data-marker="m.id"
        >
          <span class="marker-label">{{ m.label }}</span>
        </div>
        <button
          id="demo-button"
          type="button"
          data-testid="demo-button"
          @click="onDemoClick"
        >
          Demo target
          <template v-if="clickCount"> ({{ clickCount }})</template>
        </button>
      </div>
      <p class="hint">
        Markers A–C use viewport coordinates. The center button uses
        <code>moveTo('#demo-button')</code>.
      </p>
    </section>

    <section class="panel install">
      <h2>Install</h2>
      <p class="hint">NPM</p>
      <pre>pnpm add vue-pointing-cursor</pre>
      <p class="hint">shadcn-vue (GitHub registry)</p>
      <pre>pnpm dlx shadcn-vue@latest add MurzNN/js-pointing-cursor/vue-pointing-cursor</pre>
      <p class="hint">Hosted registry (GitHub Pages)</p>
      <pre>{
  "registries": {
    "@pointing-cursor": "https://murznn.github.io/js-pointing-cursor/r/{name}.json"
  }
}</pre>
      <pre>pnpm dlx shadcn-vue@latest add @pointing-cursor/vue-pointing-cursor</pre>
    </section>

    <section class="panel">
      <h2>API</h2>
      <table class="api-table">
        <thead>
          <tr>
            <th>Surface</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>show()</code> / <code>hide()</code></td>
            <td>Toggle cursor visibility</td>
          </tr>
          <tr>
            <td><code>moveTo(x, y)</code></td>
            <td>Animate along a randomized curved path to viewport coords</td>
          </tr>
          <tr>
            <td><code>moveTo(selector | Element)</code></td>
            <td>Move to the center of a DOM element</td>
          </tr>
          <tr>
            <td><code>setFollow(boolean)</code></td>
            <td>Follow the real pointer</td>
          </tr>
          <tr>
            <td><code>click</code> / <code>clickAt</code></td>
            <td>
              Press animation; <code>real: true</code> dispatches DOM events
              (synthetic events may not open native menus)
            </td>
          </tr>
          <tr>
            <td><code>shape</code> / <code>stroke</code> / <code>fill</code></td>
            <td>Bundled arrow, pointer, hand shapes with SVG styling</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
