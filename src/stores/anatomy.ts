import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { BONE_BY_ID } from '../data/bones'
import { CATEGORIES, DEFAULT_EXERCISE_ID, EXERCISE_BY_ID, EXERCISES } from '../data/exercises'
import { JOINT_BY_ID } from '../data/joints'
import { MUSCLE_BY_ID } from '../data/muscles'
import { searchExercises } from '../data/search'
import {
  EXERCISE_KNOWLEDGE,
  GLOBAL_RED_FLAGS,
  JOINT_GUIDE,
  MUSCLE_KNOWLEDGE,
  type ExerciseKnowledge,
} from '../data/knowledge'
import type { ExerciseCategory, LayerName, MuscleRole, StressLevel } from '../data/types'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
export type HoverKind = '肌肉' | '骨骼' | '关节'

export const useAnatomyStore = defineStore('anatomy', () => {
  const query = ref('')
  const category = ref<ExerciseCategory | 'all'>('all')
  const selectedExerciseId = ref(DEFAULT_EXERCISE_ID)
  const layers = reactive<Record<LayerName, boolean>>({ muscles: true, bones: true, joints: true })
  const isolateActive = ref(false)
  const autoFocus = ref(true)
  const sagittalPlane = ref(false)
  const coronalPlane = ref(false)
  const guideLines = ref(false)
  const focusedMuscleId = ref<string | null>(null)
  const status = ref<LoadStatus>('idle')
  const progress = ref(0)
  const errorMessage = ref<string | null>(null)
  const hovered = ref<{ nameZh: string; kind: HoverKind } | null>(null)

  const selectedExercise = computed(
    () => EXERCISE_BY_ID[selectedExerciseId.value] ?? EXERCISES[0],
  )

  const knowledge = computed<ExerciseKnowledge>(() => {
    return (
      EXERCISE_KNOWLEDGE[selectedExercise.value.id] ?? {
        summaryZh: '',
        jointStress: {},
        cues: [],
        errors: [],
        risks: [],
        substitutions: [],
      }
    )
  })

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
        .map((m) => ({ ...MUSCLE_BY_ID[m.id], ...MUSCLE_KNOWLEDGE[m.id] })),
    }))
  })

  const boneRows = computed(() => selectedExercise.value.bones.map((id) => BONE_BY_ID[id]))

  const jointRows = computed(() =>
    selectedExercise.value.joints.map((motion) => {
      const guide = JOINT_GUIDE[motion.id]
      const stress = knowledge.value.jointStress[motion.id] ?? {
        level: 'low' as StressLevel,
        noteZh: '该动作对此关节的相对要求较低，但仍需保持控制。',
      }
      return { joint: JOINT_BY_ID[motion.id], motion, guide, stress }
    }),
  )

  const substitutions = computed(() => knowledge.value.substitutions)
  const redFlags = computed(() => GLOBAL_RED_FLAGS)

  function selectExercise(id: string) {
    if (EXERCISE_BY_ID[id]) {
      selectedExerciseId.value = id
      focusedMuscleId.value = null
    }
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

  function togglePlane(plane: 'sagittal' | 'coronal') {
    if (plane === 'sagittal') sagittalPlane.value = !sagittalPlane.value
    else coronalPlane.value = !coronalPlane.value
  }

  function toggleAutoFocus() {
    autoFocus.value = !autoFocus.value
  }

  function toggleGuideLines() {
    guideLines.value = !guideLines.value
    if (!guideLines.value) focusedMuscleId.value = null
  }

  function toggleFocusedMuscle(id: string) {
    focusedMuscleId.value = focusedMuscleId.value === id ? null : id
  }

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
    knowledge,
    layers,
    isolateActive,
    autoFocus,
    sagittalPlane,
    coronalPlane,
    guideLines,
    focusedMuscleId,
    status,
    progress,
    errorMessage,
    hovered,
    results,
    muscleRows,
    boneRows,
    jointRows,
    substitutions,
    redFlags,
    selectExercise,
    setQuery,
    setCategory,
    toggleLayer,
    toggleIsolate,
    togglePlane,
    toggleAutoFocus,
    toggleGuideLines,
    toggleFocusedMuscle,
    setStatus,
    setProgress,
    setError,
    setHovered,
  }
})
