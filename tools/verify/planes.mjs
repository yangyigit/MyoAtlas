import { chromium } from 'playwright-core'

const EXE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await chromium.launch({
  executablePath: EXE,
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await page.waitForFunction(
  () => !!document.querySelector('canvas') && !document.querySelector('.status-overlay'),
  { timeout: 30000 },
)
await page.waitForTimeout(1200)

await page.getByRole('button', { name: '矢状面' }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/atlas-plane-sagittal.png' })
const sagittalLabels = await page.locator('.plane-label').count()

await page.getByRole('button', { name: '冠状面' }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/atlas-plane-both.png' })
const bothLabels = await page.locator('.plane-label').count()

await page.getByRole('button', { name: '矢状面' }).click()
await page.getByRole('button', { name: '冠状面' }).click()
await page.waitForTimeout(300)
const offLabels = await page.locator('.plane-label:visible').count()

await page.getByRole('button', { name: '矢状面' }).click()
await page.getByRole('button', { name: '冠状面' }).click()
await page.setViewportSize({ width: 430, height: 900 })
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/atlas-plane-mobile.png' })

console.log(JSON.stringify({ sagittalLabels, bothLabels, offLabels, errors }))
await browser.close()
