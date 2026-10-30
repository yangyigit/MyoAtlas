import { EXERCISES } from './exercises'
import type { Exercise, ExerciseCategory } from './types'

export const normalize = (value: string): string =>
  value.toLowerCase().replace(/[\s\-_·/]+/g, '').trim()

export function searchExercises(
  query: string,
  category: ExerciseCategory | 'all' = 'all',
  pool: readonly Exercise[] = EXERCISES,
): Exercise[] {
  const q = normalize(query)
  const filtered = category === 'all' ? [...pool] : pool.filter((e) => e.category === category)
  if (!q) return filtered

  const scored = filtered
    .map((exercise) => {
      const candidates = [exercise.nameZh, exercise.nameEn, ...exercise.aliases]
      let score = 0
      for (const candidate of candidates) {
        const name = normalize(candidate)
        if (name === q) score = Math.max(score, 100)
        else if (name.startsWith(q)) score = Math.max(score, 80)
        else if (name.includes(q)) score = Math.max(score, 50)
      }
      return { exercise, score }
    })
    .filter((entry) => entry.score > 0)

  scored.sort((a, b) => b.score - a.score)
  return scored.map((entry) => entry.exercise)
}
