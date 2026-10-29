import { chromium } from 'playwright-core'

const EXE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const URL = process.env.APP_URL ?? 'http://127.0.0.1:5173/'

const browser = await chromium.launch({
  executablePath: EXE,
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const errors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
})
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForFunction(
  () => !!document.querySelector('canvas') && !document.querySelector('.status-overlay'),
  { timeout: 30000 },
)
await page.waitForTimeout(1500)

const errorOverlay = await page.locator('.status-overlay.error').count()
if (errorOverlay) {
  console.log('ERROR_OVERLAY', await page.locator('.status-overlay.error').innerText())
  process.exit(1)
}

await page.screenshot({ path: '/tmp/atlas-1-bench.png' })

await page.getByRole('button', { name: '重置视角' }).click()
await page.waitForTimeout(1400)
await page.screenshot({ path: '/tmp/atlas-2-body.png' })

const fps = await page.evaluate(
  () =>
    new Promise((resolve) => {
      let frames = 0
      const start = performance.now()
      const tick = () => {
        frames += 1
        if (performance.now() - start < 1000) requestAnimationFrame(tick)
        else resolve(frames)
      }
      requestAnimationFrame(tick)
    }),
)

const searchInput = page.getByPlaceholder('输入动作，如：卧推 / 深蹲 / 划船')
await searchInput.fill('深蹲')
await page.waitForTimeout(300)
await page.locator('.exercise-item', { hasText: '深蹲' }).first().click()
await page.waitForTimeout(1600)
await page.screenshot({ path: '/tmp/atlas-3-squat.png' })

await page.getByRole('button', { name: '仅显示参与' }).click()
await page.waitForTimeout(900)
await page.screenshot({ path: '/tmp/atlas-4-isolate.png' })
await page.getByRole('button', { name: '仅显示参与' }).click()
await page.waitForTimeout(600)

await searchInput.fill('卧推')
await page.waitForTimeout(300)
await page.locator('.exercise-item', { hasText: '杠铃卧推' }).first().click()
await page.waitForTimeout(1600)

const canvas = page.locator('canvas').first()
const box = await canvas.boundingBox()
if (box) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.52)
  await page.waitForTimeout(500)
}
const tooltipCount = await page.locator('.tooltip').count()
await page.screenshot({ path: '/tmp/atlas-5-hover.png' })

const jointLabels = await page.locator('.joint-label').allInnerTexts()

await page.locator('.layer-toggle', { hasText: '骨骼' }).click()
await page.waitForTimeout(700)
await page.screenshot({ path: '/tmp/atlas-6-terrain.png' })
await page.locator('.layer-toggle', { hasText: '骨骼' }).click()
await page.waitForTimeout(500)

await searchInput.fill('不存在的动作')
await page.waitForTimeout(300)
const emptyState = await page.locator('.empty-state').count()
await page.screenshot({ path: '/tmp/atlas-7-empty.png' })

await searchInput.fill('')
await page.getByRole('button', { name: '模型来源与许可' }).click()
await page.waitForTimeout(300)
const modalVisible = await page.locator('.modal').count()
await page.screenshot({ path: '/tmp/atlas-8-about.png' })
await page.getByRole('button', { name: '知道了' }).click()

await page.setViewportSize({ width: 430, height: 900 })
await page.waitForTimeout(800)
await page.screenshot({ path: '/tmp/atlas-9-mobile.png', fullPage: true })

console.log(
  JSON.stringify(
    {
      fps,
      tooltipCount,
      jointLabels,
      emptyState,
      modalVisible,
      errors,
    },
    null,
    2,
  ),
)

await browser.close()
