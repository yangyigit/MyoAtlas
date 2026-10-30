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

const detail = page.locator('.detail')
await detail.evaluate((el) => {
  el.scrollTop = el.scrollHeight
})
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/atlas-knowledge-bottom.png' })

await page.locator('.red-flags summary').click()
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/atlas-knowledge-redflags.png' })

const cues = await page.locator('.tip-list li').count()
const riskItems = await page.locator('.risk-list li').count()
const subs = await page.locator('.sub').count()
const redFlags = await page.locator('.red-flags li').count()

await page.locator('.sub.linked', { hasText: '哑铃卧推' }).click()
await page.waitForTimeout(900)
const title = await page.locator('.detail-head h2').innerText()

await page.setViewportSize({ width: 430, height: 900 })
await page.waitForTimeout(800)
await page.screenshot({ path: '/tmp/atlas-knowledge-mobile.png', fullPage: true })

console.log(JSON.stringify({ cues, riskItems, subs, redFlags, title, errors }))
await browser.close()
