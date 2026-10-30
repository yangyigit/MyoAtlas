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
await page.waitForTimeout(1000)
await page.getByRole('button', { name: '疼痛排查' }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/atlas-pain-empty.png' })

await page.locator('.region-chip[data-region="shoulder"]').click()
await page.waitForTimeout(400)
await page.screenshot({ path: '/tmp/atlas-pain-shoulder.png' })

const structureCount = await page.locator('.structure-list li').count()
const exerciseCount = await page.locator('.pain-modal .exercise-item').count()

await page.locator('.flag', { hasText: '明显肿胀/发热' }).click()
await page.waitForTimeout(300)
const triageTitle = await page.locator('.triage-head h4').innerText()
await page.screenshot({ path: '/tmp/atlas-pain-urgent.png' })

await page.locator('.diary-form input').fill('卧推后肩前侧不适')
await page.getByRole('button', { name: '记录', exact: true }).click()
await page.waitForTimeout(300)
const diaryCount = await page.locator('.diary-list li').count()

await page.locator('.el-radio-button', { hasText: '背面' }).click()
await page.locator('.region-chip[data-region="lower-back"]').click()
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/atlas-pain-back.png' })

await page.setViewportSize({ width: 430, height: 900 })
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/atlas-pain-mobile.png', fullPage: false })

console.log(JSON.stringify({ structureCount, exerciseCount, triageTitle, diaryCount, errors }))
await browser.close()
