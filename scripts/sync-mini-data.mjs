import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const target = join(root, 'miniapp', 'src', 'data')
const files = [
  'types.ts',
  'muscles.ts',
  'bones.ts',
  'joints.ts',
  'exercises.ts',
  'search.ts',
  'knowledge.ts',
  'pain.ts',
  'hypertrophy.ts',
]

mkdirSync(target, { recursive: true })
for (const file of files) {
  copyFileSync(join(root, 'src', 'data', file), join(target, file))
  console.log(`synced ${file}`)
}
