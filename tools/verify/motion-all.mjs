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
await page.getByRole('button', { name: '运动' }).click()
await page.waitForTimeout(1800)

const queries = [
  ['深蹲', 'squat'],
  ['站姿推举', 'ohp'],
  ['引体向上', 'pullup'],
  ['俯卧撑', 'pushup'],
  ['硬拉', 'deadlift'],
  ['杠铃弯举', 'curl'],
  ['腿举', 'legpress'],
  ['平板支撑', 'plank'],
]
const search = page.getByPlaceholder('输入动作，如：卧推 / 深蹲 / 划船')
for (const [query, name] of queries) {
  await search.fill(query)
  await page.waitForTimeout(250)
  await page.locator('.exercise-item', { hasText: query }).first().click()
  await page.waitForTimeout(1100)
  await page.screenshot({ path: `/tmp/atlas-motion-${name}.png` })
}
console.log(JSON.stringify({ errors }))
await browser.close()
