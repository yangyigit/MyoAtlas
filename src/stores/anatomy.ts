import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { BONE_BY_ID } from '../data/bones'
import { CATEGORIES, DEFAULT_EXERCISE_ID, EXERCISE_BY_ID, EXERCISES, MOTION_SUPPORTED } from '../data/exercises'
import { JOINT_BY_ID } from '../data/joints'
import { MUSCLE_BY_ID } from '../data/muscles'
import { searchExercises } from '../data/search'
import type { ExerciseCategory, LayerName, MuscleRole } from '../data/types'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
export type HoverKind = '肌肉' | '骨骼' | '关节'

export const useAnatomyStore = defineStore('anatomy', () => {
  const query = ref('')
  const category = ref<ExerciseCategory | 'all'>('all')
  const selectedExerciseId = ref(DEFAULT_EXERCISE_ID)
  const layers = reactive<Record<LayerName, boolean>>({ muscles: true, bones: true, joints: true })
  const isolateActive = ref(false)
  const autoFocus = ref(true)
  const motionMode = ref(false)
  const status = ref<LoadStatus>('idle')
  const progress = ref(0)
  const errorMessage = ref<string | null>(null)
  const hovered = ref<{ nameZh: string; kind: HoverKind } | null>(null)

  const selectedExercise = computed(
    () => EXERCISE_BY_ID[selectedExerciseId.value] ?? EXERCISES[0],
  )

  const results = computed(() => searchExercises(query.value, category.value))

  const muscleRows = computed(() => {
    const order: MuscleRole[] = ['primary', 'secondary', 'stabilizer']
    const labels: Record<MuscleRole, string> = {
      primary: '主责',
      secondary: '协同',
      stabilizer: '稳定',
    }
    return order.map((role) => ({
      role,
      label: labels[role],
      muscles: selectedExercise.value.muscles
        .filter((m) => m.role === role)
        .map((m) => MUSCLE_BY_ID[m.id]),
    }))
  })

  const boneRows = computed(() => selectedExercise.value.bones.map((id) => BONE_BY_ID[id]))

  const motionAvailable = computed(() => MOTION_SUPPORTED.has(selectedExercise.value.id))

  const jointRows = computed(() =>
    selectedExercise.value.joints.map((motion) => ({
      joint: JOINT_BY_ID[motion.id],
      motion,
    })),
  )

  function selectExercise(id: string) {
    if (EXERCISE_BY_ID[id]) selectedExerciseId.value = id
  }

  function setQuery(value: string) {
    query.value = value
  }

  function setCategory(value: ExerciseCategory | 'all') {
    category.value = value
  }

  function toggleLayer(layer: LayerName) {
    const active = Object.values(layers).filter(Boolean).length
    if (active === 1 && layers[layer]) return
    layers[layer] = !layers[layer]
  }

  function toggleIsolate() {
    isolateActive.value = !isolateActive.value
  }

  function toggleAutoFocus() {
    autoFocus.value = !autoFocus.value
  }

  function toggleMotion() {
    if (!motionAvailable.value) {
      motionMode.value = false
      return
    }
    motionMode.value = !motionMode.value
  }

  watch(selectedExerciseId, () => {
    if (!MOTION_SUPPORTED.has(selectedExercise.value.id)) motionMode.value = false
  })

  function setStatus(value: LoadStatus) {
    status.value = value
  }

  function setProgress(value: number) {
    progress.value = Math.max(0, Math.min(1, value))
  }

  function setError(message: string | null) {
    errorMessage.value = message
    status.value = message ? 'error' : 'loading'
  }

  function setHovered(value: { nameZh: string; kind: HoverKind } | null) {
    hovered.value = value
  }

  return {
    query,
    category,
    categories: CATEGORIES,
    selectedExerciseId,
    selectedExercise,
    layers,
    isolateActive,
    autoFocus,
    motionMode,
    motionAvailable,
    status,
    progress,
    errorMessage,
    hovered,
    results,
    muscleRows,
    boneRows,
    jointRows,
    selectExercise,
    setQuery,
    setCategory,
    toggleLayer,
    toggleIsolate,
    toggleAutoFocus,
    toggleMotion,
    setStatus,
    setProgress,
    setError,
    setHovered,
  }
})
