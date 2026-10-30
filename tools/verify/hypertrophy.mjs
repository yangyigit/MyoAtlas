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
await page.getByRole('button', { name: '增肌面板' }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/atlas-hyper-coverage.png' })

await page.locator('.quick-muscle', { hasText: '股四头肌' }).click()
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/atlas-hyper-quads.png' })

await page.getByRole('button', { name: '训练日志' }).click()
await page.waitForTimeout(300)
const numberInputs = page.locator('.log-form .form-grid input[type="number"]')
await numberInputs.nth(0).fill('4')
await numberInputs.nth(1).fill('8')
await numberInputs.nth(2).fill('60')
await numberInputs.nth(3).fill('8')
await page.getByRole('button', { name: '添加记录' }).click()
await page.waitForTimeout(400)
const weeklyRows = await page.locator('.volume-row').count()
const entryRows = await page.locator('.entry-list li').count()
await page.screenshot({ path: '/tmp/atlas-hyper-log.png' })

await page.getByRole('button', { name: '个人档案' }).click()
await page.locator('.pain-chip', { hasText: '肩部' }).click()
await page.getByRole('button', { name: '保存档案' }).click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: '肌群覆盖' }).click()
await page.waitForTimeout(300)
const painWarnings = await page.locator('.pain-warning').count()

await page.locator('.view-button').first().click()
await page.waitForTimeout(700)
const closed = (await page.locator('.hyper-modal').count()) === 0
const title = await page.locator('.detail-head h2').innerText()

await page.getByRole('button', { name: '增肌面板' }).click()
await page.setViewportSize({ width: 430, height: 900 })
await page.waitForTimeout(600)
await page.screenshot({ path: '/tmp/atlas-hyper-mobile.png', fullPage: false })

console.log(JSON.stringify({ weeklyRows, entryRows, painWarnings, closed, title, errors }))
await browser.close()
