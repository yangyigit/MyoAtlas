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
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (error) => errors.push(error.message))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForFunction(
  () => !!document.querySelector('canvas') && !document.querySelector('.status-overlay'),
  { timeout: 30000 },
)
await page.waitForTimeout(1200)

const motionButton = page.getByRole('button', { name: '运动' })
const disabled = await motionButton.isDisabled()
if (!disabled) {
  await motionButton.click()
}
await page.waitForTimeout(600)
await page.screenshot({ path: '/tmp/atlas-motion-1.png' })
await page.waitForTimeout(1200)
await page.screenshot({ path: '/tmp/atlas-motion-2.png' })

const active = await motionButton.getAttribute('aria-pressed')

await motionButton.click()
await page.waitForTimeout(1200)
await page.screenshot({ path: '/tmp/atlas-motion-off.png' })
const offState = await motionButton.getAttribute('aria-pressed')

const search = page.getByPlaceholder('输入动作，如：卧推 / 深蹲 / 划船')
await search.fill('深蹲')
await page.waitForTimeout(300)
await page.locator('.exercise-item', { hasText: '深蹲' }).first().click()
await page.waitForTimeout(800)
const squatDisabled = await motionButton.isDisabled()
const squatState = await motionButton.getAttribute('aria-pressed')

console.log(JSON.stringify({ disabled, active, offState, squatDisabled, squatState, errors }))
await browser.close()