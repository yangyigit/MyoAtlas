import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { EXERCISE_BY_ID } from '../data/exercises'
import { MUSCLE_BY_ID } from '../data/muscles'
import { ROLE_WEIGHTS, volumeGuideFor } from '../data/hypertrophy'

export interface TrainingEntry {
  id: string
  date: string
  exerciseId: string
  sets: number
  reps: number
  weight: number
  rpe: number
  pain: boolean
  note: string
}

export interface HypertrophyProfile {
  painRegionIds: string[]
  equipment: 'gym' | 'home' | 'bodyweight'
  experience: 'beginner' | 'intermediate' | 'advanced'
}

const ENTRIES_KEY = 'kinesis-training-log'
const PROFILE_KEY = 'kinesis-hypertrophy-profile'

const DEFAULT_PROFILE: HypertrophyProfile = {
  painRegionIds: [],
  equipment: 'gym',
  experience: 'intermediate',
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 本地存储不可用时静默降级
  }
}

function localDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const useTrainingStore = defineStore('training', () => {
  const entries = ref<TrainingEntry[]>(readStorage(ENTRIES_KEY, []))
  const profile = ref<HypertrophyProfile>({
    ...DEFAULT_PROFILE,
    ...readStorage(PROFILE_KEY, DEFAULT_PROFILE),
  })

  const weeklyVolume = computed(() => {
    const cutoff = new Date()
    cutoff.setHours(0, 0, 0, 0)
    cutoff.setDate(cutoff.getDate() - 6)
    const volume = new Map<string, number>()

    for (const entry of entries.value) {
      const date = new Date(`${entry.date}T00:00:00`)
      if (Number.isNaN(date.getTime()) || date < cutoff) continue
      const exercise = EXERCISE_BY_ID[entry.exerciseId]
      if (!exercise) continue
      for (const muscle of exercise.muscles) {
        volume.set(muscle.id, (volume.get(muscle.id) ?? 0) + entry.sets * ROLE_WEIGHTS[muscle.role])
      }
    }

    return [...volume.entries()]
      .map(([muscleId, sets]) => {
        const muscle = MUSCLE_BY_ID[muscleId as keyof typeof MUSCLE_BY_ID]
        return {
          muscle,
          sets: Math.round(sets * 10) / 10,
          guide: muscle ? volumeGuideFor(muscle) : null,
        }
      })
      .filter((item) => item.muscle && item.sets > 0)
      .sort((a, b) => b.sets - a.sets)
  })

  const weeklyTotalSets = computed(() => weeklyVolume.value.reduce((sum, item) => sum + item.sets, 0))

  function addEntry(input: Omit<TrainingEntry, 'id'>) {
    const entry: TrainingEntry = {
      ...input,
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sets: Math.min(20, Math.max(1, Math.round(input.sets))),
      reps: Math.min(100, Math.max(1, Math.round(input.reps))),
      rpe: Math.min(10, Math.max(1, Math.round(input.rpe))),
      weight: Math.max(0, input.weight),
    }
    entries.value = [entry, ...entries.value].slice(0, 200)
    writeStorage(ENTRIES_KEY, entries.value)
  }

  function removeEntry(id: string) {
    entries.value = entries.value.filter((entry) => entry.id !== id)
    writeStorage(ENTRIES_KEY, entries.value)
  }

  function saveProfile(next: HypertrophyProfile) {
    profile.value = { ...next }
    writeStorage(PROFILE_KEY, profile.value)
  }

  return {
    entries,
    profile,
    weeklyVolume,
    weeklyTotalSets,
    addEntry,
    removeEntry,
    saveProfile,
    localDateString,
  }
})
