/**
 * Record a short 850×300 demo GIF of the Vue playground:
 * for each shape (arrow, pointer, hand): A → B → C → #demo-button + burst click.
 *
 * Usage: node scripts/record-demo-gif.mjs [baseUrl]
 */
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const OUT_DIR = join(ROOT, 'tmp/gif-record')
const GIF_PATH = join(ROOT, 'demo/pointing-cursor-demo.gif')
const WIDTH = 850
const HEIGHT = 300
const BASE = process.argv[2] || 'http://127.0.0.1:5173/'
const SHAPES = ['arrow', 'pointer', 'hand']

const FRAME_CSS = `
  .hero,
  .controls,
  .hint,
  .install,
  .panel > h2,
  .nav-demos {
    display: none !important;
  }
  body, html, #app {
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: #f3efe6 !important;
  }
  .page {
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .panel {
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    background: transparent !important;
  }
  .stage {
    min-height: ${HEIGHT}px !important;
    height: ${HEIGHT}px !important;
    width: ${WIDTH}px !important;
    border: none !important;
    border-radius: 0 !important;
  }
  /* Hide non-stage panels (Install / API) without relying on :has() */
  .panel.install,
  .panel:last-of-type {
    display: none !important;
  }
  #shape-caption {
    position: fixed;
    left: 16px;
    bottom: 12px;
    z-index: 2147483000;
    font: 600 14px/1.2 "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: #57534e;
    background: rgb(255 252 247 / 88%);
    border: 1px solid #d6d3d1;
    border-radius: 8px;
    padding: 6px 10px;
    pointer-events: none;
  }
`

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })
mkdirSync(join(ROOT, 'demo'), { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: OUT_DIR,
    size: { width: WIDTH, height: HEIGHT },
  },
})
const page = await context.newPage()

// Bake framing CSS into the document HTML so it applies on first paint.
await page.route('**/*', async (route) => {
  const request = route.request()
  if (request.resourceType() !== 'document') {
    await route.continue()
    return
  }
  const response = await route.fetch()
  const html = await response.text()
  const injected = html.includes('demo-gif-frame')
    ? html
    : html.replace(
        /<head([^>]*)>/i,
        `<head$1><style id="demo-gif-frame">${FRAME_CSS}</style>`,
      )
  await route.fulfill({
    response,
    body: injected,
    headers: {
      ...response.headers(),
      'content-type': 'text/html; charset=utf-8',
    },
  })
})

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForSelector('[data-testid="stage"]')

const framed = await page.evaluate(() => {
  const hero = document.querySelector('.hero')
  const stage = document.querySelector('.stage')
  return {
    heroDisplay: hero ? getComputedStyle(hero).display : null,
    stageHeight: stage?.getBoundingClientRect().height ?? null,
    hasStyle: Boolean(document.getElementById('demo-gif-frame')),
  }
})
if (!framed.hasStyle || framed.heroDisplay !== 'none') {
  throw new Error(
    `Framing CSS failed: ${JSON.stringify(framed)}. Aborting so the GIF does not include the header.`,
  )
}

await page.evaluate(() => {
  const el = document.createElement('div')
  el.id = 'shape-caption'
  el.textContent = 'shape: arrow'
  document.body.appendChild(el)
  window.dispatchEvent(new Event('resize'))
})
await page.evaluate(() => {
  const motion = document.querySelector(
    '[data-testid="motion-style"] input[value="dangling"]',
  )
  if (motion instanceof HTMLInputElement) {
    motion.checked = true
    motion.dispatchEvent(new Event('change', { bubbles: true }))
    motion.click()
  }
  const burst = document.querySelector('[data-testid="click-burst-toggle"]')
  if (burst instanceof HTMLInputElement && !burst.checked) burst.click()
  const shape = document.querySelector(
    '[data-testid="shape-select"] input[value="arrow"]',
  )
  if (shape instanceof HTMLInputElement) {
    shape.checked = true
    shape.dispatchEvent(new Event('change', { bubbles: true }))
    shape.click()
  }
})

// Park on A before the visible sequence (trim drops this settle).
await page.evaluate(() => {
  document.querySelector('[data-testid="btn-move-a"]')?.click()
})
await page.waitForTimeout(1600)

async function setShape(name) {
  await page.evaluate((shapeName) => {
    const input = document.querySelector(
      `[data-testid="shape-select"] input[value="${shapeName}"]`,
    )
    if (input instanceof HTMLInputElement) {
      input.checked = true
      input.dispatchEvent(new Event('change', { bubbles: true }))
      input.click()
    }
    const caption = document.getElementById('shape-caption')
    if (caption) caption.textContent = `shape: ${shapeName}`
  }, name)
}

async function clickTestId(testId) {
  await page.evaluate((id) => {
    document.querySelector(`[data-testid="${id}"]`)?.click()
  }, testId)
}

for (const shape of SHAPES) {
  await setShape(shape)

  await clickTestId('btn-move-a')
  await page.waitForTimeout(1400)
  await clickTestId('btn-move-b')
  await page.waitForTimeout(1500)
  await clickTestId('btn-move-c')
  await page.waitForTimeout(1500)
  await clickTestId('btn-move-selector')
  await page.waitForTimeout(1500)
  await clickTestId('btn-click-visual')
  await page.waitForTimeout(900)
}

await page.waitForTimeout(350)
await page.close()
await context.close()
await browser.close()

const webm = readdirSync(OUT_DIR)
  .filter((f) => f.endsWith('.webm'))
  .map((f) => join(OUT_DIR, f))
  .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]

if (!webm) {
  throw new Error('Playwright did not produce a .webm recording')
}

// Skip settle-on-A so the GIF opens mid-demo on the framed stage.
const leadInSec = '1.7'
const palette = join(OUT_DIR, 'palette.png')
execFileSync(
  'ffmpeg',
  [
    '-y',
    '-ss',
    leadInSec,
    '-i',
    webm,
    '-update',
    '1',
    '-vf',
    `fps=18,scale=${WIDTH}:${HEIGHT}:flags=lanczos,palettegen=max_colors=160:stats_mode=diff`,
    palette,
  ],
  { stdio: 'inherit' },
)
execFileSync(
  'ffmpeg',
  [
    '-y',
    '-ss',
    leadInSec,
    '-i',
    webm,
    '-i',
    palette,
    '-lavfi',
    `fps=18,scale=${WIDTH}:${HEIGHT}:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
    '-loop',
    '0',
    GIF_PATH,
  ],
  { stdio: 'inherit' },
)

const bytes = statSync(GIF_PATH).size
console.log(`Wrote ${GIF_PATH} (${(bytes / 1024).toFixed(1)} KiB)`)
