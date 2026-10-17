import { expect, test } from '@playwright/test'

test.describe('vue-cursor playground', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('vue-cursor')).toBeVisible()
  })

  test('hides and shows the cursor', async ({ page }) => {
    await page.getByTestId('btn-hide').click()
    await expect(page.getByTestId('vue-cursor')).toHaveCSS('opacity', '0')
    await page.getByTestId('btn-show').click()
    await expect(page.getByTestId('vue-cursor')).toHaveCSS('opacity', '1')
  })

  test('moves toward a coordinate marker', async ({ page }) => {
    const cursor = page.getByTestId('vue-cursor')
    const before = await cursor.boundingBox()
    expect(before).toBeTruthy()

    await page.getByTestId('btn-move-a').click()
    await page.waitForTimeout(1000)

    const after = await cursor.boundingBox()
    expect(after).toBeTruthy()
    const marker = page.locator('[data-marker="a"]')
    const markerBox = await marker.boundingBox()
    expect(markerBox).toBeTruthy()

    // Cursor hotspot should land near the marker center (arrow hotspot ~0.14, 0.10)
    const cx = after!.x + after!.width * 0.14
    const cy = after!.y + after!.height * 0.1
    const mx = markerBox!.x + markerBox!.width / 2
    const my = markerBox!.y + markerBox!.height / 2
    expect(Math.hypot(cx - mx, cy - my)).toBeLessThan(40)
  })

  test('moves to an element via CSS selector', async ({ page }) => {
    await page.getByTestId('btn-move-selector').click()
    await page.waitForTimeout(1100)

    const cursor = page.getByTestId('vue-cursor')
    const button = page.getByTestId('demo-button')
    const c = await cursor.boundingBox()
    const b = await button.boundingBox()
    expect(c && b).toBeTruthy()

    const cx = c!.x + c!.width * 0.14
    const cy = c!.y + c!.height * 0.1
    const bx = b!.x + b!.width / 2
    const by = b!.y + b!.height / 2
    expect(Math.hypot(cx - bx, cy - by)).toBeLessThan(45)
  })

  test('can switch shapes', async ({ page }) => {
    await page.getByTestId('shape-select').getByLabel('hand', { exact: true }).check()
    await expect(page.locator('.pointing-cursor-shape--hand')).toBeVisible()
    await page.getByTestId('shape-select').getByLabel('pointer', { exact: true }).check()
    await expect(page.locator('.pointing-cursor-shape--pointer')).toBeVisible()
  })

  test('follow mode can be toggled', async ({ page }) => {
    await page.getByTestId('btn-follow').click()
    await expect(page.getByTestId('btn-follow')).toContainText('Stop follow')
    await page.mouse.move(200, 200)
    await page.waitForTimeout(100)
    await page.getByTestId('btn-follow').click()
    await expect(page.getByTestId('btn-follow')).toContainText('Follow mouse')
  })
})
