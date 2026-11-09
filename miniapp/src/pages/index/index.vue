<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MiniBody3D from '@/components/MiniBody3D.vue'
import { CATEGORIES, DEFAULT_EXERCISE_ID, EXERCISE_BY_ID, EXERCISES } from '@/data/exercises'
import { searchExercises } from '@/data/search'
import { MUSCLE_BY_ID, MUSCLES } from '@/data/muscles'
import { BONE_BY_ID } from '@/data/bones'
import { JOINT_BY_ID } from '@/data/joints'
import {
  EXERCISE_KNOWLEDGE,
  GLOBAL_RED_FLAGS,
  JOINT_GUIDE,
  MUSCLE_KNOWLEDGE,
  STRESS_COLORS,
  STRESS_LABELS,
  type ExerciseKnowledge,
} from '@/data/knowledge'
import {
  DEFAULT_PAIN_ANSWERS,
  PAIN_DISCLAIMER,
  PAIN_REGIONS,
  PAIN_REGION_BY_ID,
  triagePain,
  type PainAnswers,
  type PainDiaryEntry,
} from '@/data/pain'
import {
  DEMAND_LABELS,
  EXERCISE_STIMULUS,
  HYPERTROPHY_DISCLAIMER,
  RESISTANCE_LABELS,
  ROLE_WEIGHTS,
  volumeGuideFor,
} from '@/data/hypertrophy'
import type {
  Exercise,
  ExerciseCategory,
  MuscleId,
  MuscleRole,
  StressLevel,
} from '@/data/types'

definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '肌谱',
    backgroundColor: '#0a0d12',
  },
})

type TabId = 'anatomy' | 'pain' | 'hyper'
type BodyView = 'front' | 'back'

const statusBarHeight = ref(0)
const tab = ref<TabId>('anatomy')
const query = ref('')
const category = ref<ExerciseCategory | 'all'>('all')
const selectedId = ref(DEFAULT_EXERCISE_ID)
const bodyView = ref<BodyView>('front')
const layers = reactive({ muscles: true, bones: false, joints: true })
const isolate = ref(false)
const selectedMuscleId = ref<MuscleId | null>(null)
const showMuscleDetails = ref(false)
const showRedFlags = ref(false)

const results = computed(() => searchExercises(query.value, category.value))
const selectedExercise = computed<Exercise>(
  () => EXERCISE_BY_ID[selectedId.value] ?? EXERCISES[0],
)
const knowledge = computed<ExerciseKnowledge>(
  () =>
    EXERCISE_KNOWLEDGE[selectedExercise.value.id] ?? {
      summaryZh: '',
      jointStress: {},
      cues: [],
      errors: [],
      risks: [],
      substitutions: [],
    },
)

const ROLE_DEFS: { role: MuscleRole; label: string; color: string }[] = [
  { role: 'primary', label: '主责', color: '#ff5a4e' },
  { role: 'secondary', label: '协同', color: '#ff9f43' },
  { role: 'stabilizer', label: '稳定', color: '#ffd166' },
]

const roleRows = computed(() =>
  ROLE_DEFS.map((def) => ({
    ...def,
    muscles: selectedExercise.value.muscles
      .filter((m) => m.role === def.role)
      .map((m) => ({
        id: m.id,
        nameZh: MUSCLE_BY_ID[m.id].nameZh,
        functionZh: MUSCLE_KNOWLEDGE[m.id].functionZh,
        commonIssueZh: MUSCLE_KNOWLEDGE[m.id].commonIssueZh,
      })),
  })),
)

const selectedMuscleInfo = computed(() => {
  if (!selectedMuscleId.value) return null
  const muscle = MUSCLE_BY_ID[selectedMuscleId.value]
  const info = MUSCLE_KNOWLEDGE[selectedMuscleId.value]
  return {
    id: muscle.id,
    nameZh: muscle.nameZh,
    functionZh: info.functionZh,
    commonIssueZh: info.commonIssueZh,
  }
})

const jointRows = computed(() =>
  selectedExercise.value.joints.map((motion) => {
    const guide = JOINT_GUIDE[motion.id]
    const stress = knowledge.value.jointStress[motion.id] ?? {
      level: 'low' as StressLevel,
      noteZh: guide.cautionZh,
    }
    return { joint: JOINT_BY_ID[motion.id], motion, guide, stress }
  }),
)

const boneRows = computed(() => selectedExercise.value.bones.map((id) => BONE_BY_ID[id]))
const substitutions = computed(() => knowledge.value.substitutions)
const redFlags = computed(() => GLOBAL_RED_FLAGS)
const selectedCategoryLabel = computed(
  () => CATEGORIES.find((c) => c.id === selectedExercise.value.category)?.label ?? '',
)

function chooseExercise(id: string) {
  const exercise = EXERCISE_BY_ID[id]
  if (!exercise) return
  selectedId.value = id
  selectedMuscleId.value = null
  bodyView.value = exercise.category === 'back' ? 'back' : 'front'
  tab.value = 'anatomy'
  uni.pageScrollTo({ scrollTop: 0, duration: 0 })
}

function chooseSubstitution(id?: string) {
  if (id) chooseExercise(id)
}

function setBodyView(view: BodyView) {
  bodyView.value = view
}

function pickMuscle(id: MuscleId) {
  selectedMuscleId.value = selectedMuscleId.value === id ? null : id
}

// 疼痛排查
const painView = ref<BodyView>('front')
const painRegionId = ref('')
const painRegion = computed(() => PAIN_REGION_BY_ID[painRegionId.value] ?? null)
const painRegions = computed(() => PAIN_REGIONS.filter((region) => region.view === painView.value))
const painAnswers = reactive<PainAnswers>({ ...DEFAULT_PAIN_ANSWERS })
const painTriage = computed(() => triagePain(painAnswers))
const painTriageMeta = computed(() => {
  const map = {
    'self-care': { label: '观察调整', color: '#4fd6a0' },
    caution: { label: '谨慎处理', color: '#f2b84b' },
    urgent: { label: '尽快就医', color: '#ff6b5a' },
  }
  return map[painTriage.value.level]
})
const painRelatedExercises = computed(() => {
  if (!painRegion.value) return []
  return painRegion.value.exerciseIds
    .map((id) => EXERCISE_BY_ID[id])
    .filter((exercise): exercise is Exercise => Boolean(exercise))
})

const onsetOptions = [
  { value: 'during', label: '训练中' },
  { value: 'after', label: '训练后' },
  { value: 'rest', label: '休息时' },
  { value: 'night', label: '夜间' },
] as const
const durationOptions = [
  { value: 'lt1w', label: '少于 1 周' },
  { value: '1to4w', label: '1–4 周' },
  { value: 'gt4w', label: '超过 1 个月' },
] as const
const onsetIndex = computed(() => onsetOptions.findIndex((item) => item.value === painAnswers.onset))
const durationIndex = computed(() =>
  durationOptions.findIndex((item) => item.value === painAnswers.duration),
)

const painFlags = [
  { key: 'swelling', label: '明显肿胀/发热' },
  { key: 'locking', label: '关节交锁/卡住' },
  { key: 'instability', label: '打软腿/不稳' },
  { key: 'numbness', label: '麻木/放射痛' },
  { key: 'weakness', label: '肌力下降' },
  { key: 'trauma', label: '近期外伤' },
  { key: 'nightPain', label: '夜间痛' },
  { key: 'cantBearWeight', label: '无法负重' },
] as const
type PainFlagKey = (typeof painFlags)[number]['key']

function setPainView(view: BodyView) {
  painView.value = view
  if (painRegion.value && painRegion.value.view !== view) painRegionId.value = ''
}

function selectPainRegion(id: string) {
  painRegionId.value = id
}

function togglePainFlag(key: PainFlagKey) {
  painAnswers[key] = !painAnswers[key]
}

function onIntensityChange(event: { detail: { value: number } }) {
  painAnswers.intensity = Number(event.detail.value)
}

function onOnsetChange(event: { detail: { value: number | string } }) {
  const item = onsetOptions[Number(event.detail.value)]
  if (item) painAnswers.onset = item.value
}

function onDurationChange(event: { detail: { value: number | string } }) {
  const item = durationOptions[Number(event.detail.value)]
  if (item) painAnswers.duration = item.value
}

const painNote = ref('')
const painDiary = ref<PainDiaryEntry[]>([])

function loadPainDiary() {
  try {
    const stored = uni.getStorageSync('mini-pain-diary')
    painDiary.value = Array.isArray(stored) ? stored : []
  } catch {
    painDiary.value = []
  }
}

function savePainEntry() {
  if (!painRegion.value) return
  const entry: PainDiaryEntry = {
    id: `${Date.now()}`,
    date: new Date().toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    regionId: painRegion.value.id,
    regionName: painRegion.value.nameZh,
    intensity: painAnswers.intensity,
    level: painTriage.value.level,
    note: painNote.value.trim(),
  }
  painDiary.value = [entry, ...painDiary.value].slice(0, 20)
  painNote.value = ''
  uni.setStorageSync('mini-pain-diary', painDiary.value)
  uni.showToast({ title: '已记录', icon: 'none' })
}

function removePainEntry(id: string) {
  painDiary.value = painDiary.value.filter((entry) => entry.id !== id)
  uni.setStorageSync('mini-pain-diary', painDiary.value)
}

// 增肌
const muscleOptions = MUSCLES.filter((muscle) => muscle.id !== 'other-muscles')
const muscleNames = muscleOptions.map((muscle) => muscle.nameZh)
const hyperMuscleIndex = ref(
  Math.max(
    0,
    muscleOptions.findIndex((muscle) => muscle.id === 'pectoralis-major'),
  ),
)
const hyperMuscle = computed(() => muscleOptions[hyperMuscleIndex.value] ?? muscleOptions[0])
const hyperGuide = computed(() => volumeGuideFor(hyperMuscle.value))

const QUICK_MUSCLES: MuscleId[] = [
  'pectoralis-major',
  'latissimus-dorsi',
  'deltoid-lateral',
  'biceps-brachii',
  'quadriceps',
  'gluteus-maximus',
  'hamstrings',
  'rectus-abdominis',
]

function onMusclePickerChange(event: { detail: { value: number | string } }) {
  hyperMuscleIndex.value = Number(event.detail.value)
}

function selectHyperMuscle(id: MuscleId) {
  const index = muscleOptions.findIndex((muscle) => muscle.id === id)
  if (index >= 0) hyperMuscleIndex.value = index
}

const STRESS_RANK: Record<StressLevel, number> = { low: 0, medium: 1, high: 2 }
function maxStress(exerciseId: string) {
  const stress = EXERCISE_KNOWLEDGE[exerciseId]?.jointStress ?? {}
  const levels = Object.values(stress)
    .map((item) => item?.level)
    .filter((level): level is StressLevel => Boolean(level))
  const level = levels.reduce<StressLevel>(
    (current, next) => (STRESS_RANK[next] > STRESS_RANK[current] ? next : current),
    'low',
  )
  return { level, label: STRESS_LABELS[level], color: STRESS_COLORS[level] }
}

const ROLE_ORDER: Record<MuscleRole, number> = { primary: 0, secondary: 1, stabilizer: 2 }
const ROLE_LABELS: Record<MuscleRole, string> = { primary: '主责', secondary: '协同', stabilizer: '稳定' }
const ROLE_COLORS: Record<MuscleRole, string> = { primary: '#ff5a4e', secondary: '#ff9f43', stabilizer: '#ffd166' }

const hyperRows = computed(() =>
  EXERCISES.flatMap((exercise) => {
    const activation = exercise.muscles.find((item) => item.id === hyperMuscle.value.id)
    if (!activation) return []
    const stimulus = EXERCISE_STIMULUS[exercise.id]
    return [
      {
        exercise,
        role: activation.role,
        stimulus,
        stress: maxStress(exercise.id),
        note: stimulus?.noteZh ?? '',
      },
    ]
  }).sort((a, b) => {
    const roleDiff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
    return roleDiff !== 0 ? roleDiff : a.exercise.nameZh.localeCompare(b.exercise.nameZh, 'zh-CN')
  }),
)

interface MiniTrainingEntry {
  id: string
  date: string
  exerciseId: string
  sets: number
}

const trainingLog = ref<MiniTrainingEntry[]>([])
const logExerciseIndex = ref(
  Math.max(
    0,
    EXERCISES.findIndex((exercise) => exercise.id === DEFAULT_EXERCISE_ID),
  ),
)
const logSets = ref(3)

function localDate(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function loadTrainingLog() {
  try {
    const stored = uni.getStorageSync('mini-training-log')
    trainingLog.value = Array.isArray(stored) ? stored : []
  } catch {
    trainingLog.value = []
  }
}

function addTrainingEntry() {
  const exercise = EXERCISES[logExerciseIndex.value]
  if (!exercise) return
  trainingLog.value = [
    {
      id: `${Date.now()}`,
      date: localDate(),
      exerciseId: exercise.id,
      sets: Math.max(1, Math.min(20, Math.round(Number(logSets.value) || 1))),
    },
    ...trainingLog.value,
  ].slice(0, 100)
  uni.setStorageSync('mini-training-log', trainingLog.value)
  uni.showToast({ title: '已记录', icon: 'none' })
}

function removeTrainingEntry(id: string) {
  trainingLog.value = trainingLog.value.filter((entry) => entry.id !== id)
  uni.setStorageSync('mini-training-log', trainingLog.value)
}

const weeklyVolume = computed(() => {
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - 6)
  const volume = new Map<string, number>()
  for (const entry of trainingLog.value) {
    const date = new Date(`${entry.date}T00:00:00`)
    if (Number.isNaN(date.getTime()) || date < cutoff) continue
    const exercise = EXERCISE_BY_ID[entry.exerciseId]
    if (!exercise) continue
    for (const muscle of exercise.muscles) {
      volume.set(muscle.id, (volume.get(muscle.id) ?? 0) + entry.sets * ROLE_WEIGHTS[muscle.role])
    }
  }
  return Array.from(volume.entries())
    .map(([muscleId, sets]) => ({
      muscle: MUSCLE_BY_ID[muscleId as keyof typeof MUSCLE_BY_ID],
      sets: Math.round(sets * 10) / 10,
      guide: MUSCLE_BY_ID[muscleId as keyof typeof MUSCLE_BY_ID]
        ? volumeGuideFor(MUSCLE_BY_ID[muscleId as keyof typeof MUSCLE_BY_ID])
        : null,
    }))
    .filter((item) => item.muscle && item.sets > 0)
    .sort((a, b) => b.sets - a.sets)
})

const hyperWeekly = computed(
  () => weeklyVolume.value.find((item) => item.muscle?.id === hyperMuscle.value.id)?.sets ?? 0,
)

const hyperVolumeStatus = computed(() => {
  const guide = hyperGuide.value
  if (!guide) return null
  if (hyperWeekly.value < guide.min) return { label: '低于目标', color: '#f2b84b' }
  if (hyperWeekly.value > guide.max) return { label: '高于目标', color: '#ff6b5a' }
  return { label: '达标区间', color: '#4fd6a0' }
})

const recentLogs = computed(() =>
  trainingLog.value.slice(0, 6).map((entry) => ({
    ...entry,
    exercise: EXERCISE_BY_ID[entry.exerciseId],
  })),
)

function onMountedInit() {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0
  loadPainDiary()
  loadTrainingLog()
}

onMounted(onMountedInit)
</script>

<template>
  <view class="page" :style="{ paddingTop: `${statusBarHeight + 16}px` }">
    <view class="topbar">
      <view class="brand">
        <view class="mark">肌</view>
        <view class="brand-text">
          <text class="title">肌谱</text>
          <text class="subtitle">MyoAtlas · Mini</text>
        </view>
      </view>
      <view class="version">轻量版</view>
    </view>

    <view class="tabs">
      <view class="tab" :class="{ active: tab === 'anatomy' }" @click="tab = 'anatomy'">动作解剖</view>
      <view class="tab" :class="{ active: tab === 'pain' }" @click="tab = 'pain'">疼痛排查</view>
      <view class="tab" :class="{ active: tab === 'hyper' }" @click="tab = 'hyper'">增肌</view>
    </view>

    <!-- 动作解剖 -->
    <view v-show="tab === 'anatomy'" class="tab-body">
      <view class="search-row">
        <input
          v-model="query"
          class="search"
          placeholder="输入动作，如：卧推 / 深蹲 / 划船"
          placeholder-class="ph"
          confirm-type="search"
        />
      </view>

      <scroll-view scroll-x class="chips-scroll" :show-scrollbar="false">
        <view class="chip-row">
          <view
            v-for="item in CATEGORIES"
            :key="item.id"
            class="chip"
            :class="{ active: category === item.id }"
            @click="category = item.id"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>

      <scroll-view v-if="results.length" scroll-x class="exercise-scroll" :show-scrollbar="false">
        <view class="exercise-row">
          <view
            v-for="exercise in results"
            :key="exercise.id"
            class="exercise-card"
            :class="{ active: selectedId === exercise.id }"
            @click="chooseExercise(exercise.id)"
          >
            <text class="exercise-name">{{ exercise.nameZh }}</text>
            <text class="exercise-meta">{{ exercise.nameEn }}</text>
            <view class="exercise-tag">{{ exercise.equipment }}</view>
          </view>
        </view>
      </scroll-view>
      <view v-else class="empty">
        <text>没有找到「{{ query }}」</text>
        <view class="quick-row">
          <view class="chip" @click="query = '卧推'">卧推</view>
          <view class="chip" @click="query = '深蹲'">深蹲</view>
          <view class="chip" @click="query = '引体'">引体</view>
        </view>
      </view>

      <view class="anatomy-layout">
        <view class="anatomy-visual">
          <view class="body-card">
            <view class="body-head">
              <view>
                <text class="section-title">肌肉参与</text>
                <text class="section-sub">3D 解剖 · 拖动旋转 · 双指缩放</text>
              </view>
              <view class="seg">
                <view class="seg-item" :class="{ active: bodyView === 'front' }" @click="setBodyView('front')">正面</view>
                <view class="seg-item" :class="{ active: bodyView === 'back' }" @click="setBodyView('back')">背面</view>
              </view>
            </view>
            <MiniBody3D
              :exercise="selectedExercise"
              :view="bodyView"
              :layers="layers"
              :isolate="isolate"
              :active="tab === 'anatomy'"
            />
            <view class="legend">
              <view class="legend-item"><view class="dot" style="background:#e2503f" /><text>主责</text></view>
              <view class="legend-item"><view class="dot" style="background:#d08644" /><text>协同</text></view>
              <view class="legend-item"><view class="dot" style="background:#d4b066" /><text>稳定</text></view>
              <view class="legend-item"><view class="dot" style="background:#4a2c28" /><text>未参与</text></view>
            </view>
            <view class="viewer-layers">
              <view class="layer-chip" :class="{ active: layers.muscles }" @click="layers.muscles = !layers.muscles">
                <view class="dot" style="background:#7e3a33" /><text>肌肉</text>
              </view>
              <view class="layer-chip" :class="{ active: layers.bones }" @click="layers.bones = !layers.bones">
                <view class="dot" style="background:#d8c8ae" /><text>骨骼</text>
              </view>
              <view class="layer-chip" :class="{ active: layers.joints }" @click="layers.joints = !layers.joints">
                <view class="dot" style="background:#4fd6e0" /><text>关节</text>
              </view>
              <view class="layer-chip isolate" :class="{ active: isolate }" @click="isolate = !isolate">
                <text>仅参与</text>
              </view>
            </view>
          </view>
        </view>

        <view class="anatomy-detail">
          <view class="detail-head">
            <view class="detail-title-row">
              <text class="detail-title">{{ selectedExercise.nameZh }}</text>
              <text class="detail-cat">{{ selectedCategoryLabel }}</text>
            </view>
            <text class="detail-en">{{ selectedExercise.nameEn }}</text>
            <text class="summary">{{ knowledge.summaryZh }}</text>
            <view class="meta-row">
              <text class="meta">{{ selectedExercise.equipment }}</text>
              <text class="meta">{{ selectedExercise.muscles.length }} 块肌肉</text>
              <text class="meta">{{ selectedExercise.joints.length }} 个关节</text>
            </view>
          </view>

          <view class="card">
            <view class="section-head">
              <text class="section-title">目标肌群</text>
              <text class="section-sub">主责 / 协同 / 稳定</text>
            </view>
            <view v-for="row in roleRows" :key="row.role" class="role-row">
              <view class="role-label">
                <view class="dot" :style="{ background: row.color }" />
                <text>{{ row.label }}</text>
                <text class="count">{{ row.muscles.length }}</text>
              </view>
              <view class="muscle-chips">
                <view
                  v-for="muscle in row.muscles"
                  :key="muscle.id"
                  class="muscle-chip"
                  :style="{ color: row.color, borderColor: `${row.color}66` }"
                  @click="pickMuscle(muscle.id)"
                >
                  {{ muscle.nameZh }}
                </view>
              </view>
            </view>
            <view v-if="selectedMuscleInfo" class="muscle-info">
              <text class="muscle-info-title">{{ selectedMuscleInfo.nameZh }}</text>
              <text class="muscle-info-text">{{ selectedMuscleInfo.functionZh }}</text>
              <text v-if="selectedMuscleInfo.commonIssueZh" class="muscle-info-issue">{{ selectedMuscleInfo.commonIssueZh }}</text>
            </view>
            <view class="fold" @click="showMuscleDetails = !showMuscleDetails">
              <text>{{ showMuscleDetails ? '收起' : '查看每块肌肉的功能' }}</text>
              <text class="fold-icon">{{ showMuscleDetails ? '−' : '+' }}</text>
            </view>
            <view v-if="showMuscleDetails" class="muscle-functions">
              <view v-for="row in roleRows" :key="`fn-${row.role}`">
                <view v-for="muscle in row.muscles" :key="muscle.id" class="fn-item">
                  <text class="fn-name">{{ muscle.nameZh }}</text>
                  <text class="fn-text">{{ muscle.functionZh }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="card">
            <view class="section-head">
              <text class="section-title">关节负担</text>
              <text class="section-sub">相对要求，不是受伤概率</text>
            </view>
            <view v-for="row in jointRows" :key="row.joint.id" class="joint-row">
              <view class="stress-dot" :style="{ background: STRESS_COLORS[row.stress.level] }" />
              <view class="joint-main">
                <view class="joint-title">
                  <text class="joint-name">{{ row.joint.nameZh }}</text>
                  <text class="stress-badge" :style="{ color: STRESS_COLORS[row.stress.level], borderColor: `${STRESS_COLORS[row.stress.level]}66` }">
                    {{ STRESS_LABELS[row.stress.level] }}
                  </text>
                </view>
                <text class="joint-motion">{{ row.motion.motionZh }} · {{ row.guide.planeZh }}</text>
                <text class="joint-rom">活动范围：{{ row.guide.romZh }}</text>
                <text class="joint-note">{{ row.stress.noteZh }}</text>
              </view>
            </view>
          </view>

          <view class="card">
            <view class="section-head">
              <text class="section-title">技术要点</text>
              <text class="section-sub">{{ knowledge.cues.length }} 条</text>
            </view>
            <view v-for="cue in knowledge.cues" :key="cue" class="bullet"><view class="bullet-dot" /><text>{{ cue }}</text></view>
          </view>

          <view class="card">
            <view class="section-head">
              <text class="section-title">常见错误</text>
              <text class="section-sub">{{ knowledge.errors.length }} 条</text>
            </view>
            <view v-for="error in knowledge.errors" :key="error" class="bullet"><view class="bullet-dot error" /><text>{{ error }}</text></view>
          </view>

          <view class="card">
            <view class="section-head">
              <text class="section-title">风险提示</text>
            </view>
            <view v-for="risk in knowledge.risks" :key="risk" class="bullet"><view class="bullet-dot warn" /><text>{{ risk }}</text></view>
            <view class="fold red" @click="showRedFlags = !showRedFlags">
              <text>红旗信号：出现以下情况请停止训练并就医</text>
              <text class="fold-icon">{{ showRedFlags ? '−' : '+' }}</text>
            </view>
            <view v-if="showRedFlags" class="red-flags">
              <view v-for="flag in redFlags" :key="flag" class="red-flag"><text>!</text><text>{{ flag }}</text></view>
              <text class="disclaimer">本工具用于学习与辅助排查，不构成医疗诊断或治疗建议。</text>
            </view>
          </view>

          <view v-if="substitutions.length" class="card">
            <view class="section-head">
              <text class="section-title">低风险替代</text>
            </view>
            <view
              v-for="item in substitutions"
              :key="item.label"
              class="sub-item"
              :class="{ linked: !!item.exerciseId }"
              @click="chooseSubstitution(item.exerciseId)"
            >
              <text class="sub-title">{{ item.label }}</text>
              <text class="sub-note">{{ item.note }}</text>
            </view>
          </view>

          <view class="card">
            <view class="section-head"><text class="section-title">参与骨骼</text></view>
            <view class="bone-chips">
              <view v-for="bone in boneRows" :key="bone.id" class="bone-chip">{{ bone.nameZh }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 疼痛排查 -->
    <view v-if="tab === 'pain'" class="tab-body">
      <view class="card">
        <view class="section-head">
          <text class="section-title">选择疼痛区域</text>
          <view class="seg">
            <view class="seg-item" :class="{ active: painView === 'front' }" @click="setPainView('front')">正面</view>
            <view class="seg-item" :class="{ active: painView === 'back' }" @click="setPainView('back')">背面</view>
          </view>
        </view>
        <view class="region-chips">
          <view
            v-for="region in painRegions"
            :key="region.id"
            class="region-chip"
            :class="{ active: painRegionId === region.id }"
            @click="selectPainRegion(region.id)"
          >
            {{ region.nameZh }}
          </view>
        </view>
      </view>

      <view v-if="painRegion" class="card">
        <view class="pain-head">
          <view>
            <text class="detail-title">{{ painRegion.nameZh }}</text>
            <text class="pain-advice">{{ painRegion.adviceZh }}</text>
          </view>
          <view class="triage-status" :style="{ borderColor: `${painTriageMeta.color}66` }">
            <view class="dot" :style="{ background: painTriageMeta.color }" />
            <text :style="{ color: painTriageMeta.color }">{{ painTriageMeta.label }}</text>
          </view>
        </view>

        <view class="section-head"><text class="section-title">可能相关结构</text><text class="section-sub">仅供排查参考</text></view>
        <view v-for="structure in painRegion.structures" :key="structure.nameZh" class="structure">
          <text class="structure-type">{{ structure.type }}</text>
          <view class="structure-main">
            <text class="structure-name">{{ structure.nameZh }}</text>
            <text class="structure-note">{{ structure.noteZh }}</text>
          </view>
        </view>

        <view class="section-head"><text class="section-title">相关训练动作</text><text class="section-sub">点击查看解剖</text></view>
        <scroll-view scroll-x class="exercise-scroll" :show-scrollbar="false">
          <view class="exercise-row">
            <view
              v-for="exercise in painRelatedExercises"
              :key="exercise.id"
              class="exercise-card compact"
              @click="chooseExercise(exercise.id)"
            >
              <text class="exercise-name">{{ exercise.nameZh }}</text>
              <text class="exercise-meta">{{ exercise.equipment }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="card">
        <view class="section-head"><text class="section-title">症状问卷</text></view>
        <view class="slider-row">
          <text class="field-label">疼痛强度</text>
          <text class="slider-value">{{ painAnswers.intensity }} / 10</text>
        </view>
        <slider
          :value="painAnswers.intensity"
          :min="0"
          :max="10"
          activeColor="#38d9e8"
          backgroundColor="rgba(255,255,255,0.08)"
          block-color="#38d9e8"
          @change="onIntensityChange"
        />
        <view class="picker-row">
          <picker mode="selector" :range="onsetOptions.map((item) => item.label)" :value="onsetIndex" @change="onOnsetChange">
            <view class="picker">
              <text class="picker-label">出现时机</text>
              <text class="picker-value">{{ onsetOptions[onsetIndex]?.label }} ▾</text>
            </view>
          </picker>
          <picker mode="selector" :range="durationOptions.map((item) => item.label)" :value="durationIndex" @change="onDurationChange">
            <view class="picker">
              <text class="picker-label">持续时间</text>
              <text class="picker-value">{{ durationOptions[durationIndex]?.label }} ▾</text>
            </view>
          </picker>
        </view>
        <view class="flag-row">
          <view
            v-for="flag in painFlags"
            :key="flag.key"
            class="flag"
            :class="{ active: painAnswers[flag.key] }"
            @click="togglePainFlag(flag.key)"
          >
            {{ flag.label }}
          </view>
        </view>
        <view class="triage-card" :style="{ borderColor: `${painTriageMeta.color}55` }">
          <view class="triage-head">
            <text class="triage-badge" :style="{ color: painTriageMeta.color }">{{ painTriageMeta.label }}</text>
            <text class="triage-title">{{ painTriage.titleZh }}</text>
          </view>
          <view v-for="reason in painTriage.reasons" :key="reason" class="triage-reason">· {{ reason }}</view>
          <text class="triage-advice">{{ painTriage.adviceZh }}</text>
          <text class="disclaimer">{{ PAIN_DISCLAIMER }}</text>
        </view>
      </view>

      <view class="card">
        <view class="section-head"><text class="section-title">疼痛日记</text><text class="section-sub">仅保存在本机</text></view>
        <view class="diary-form">
          <input v-model="painNote" class="diary-input" placeholder="备注：动作、训练量、变化…" placeholder-class="ph" :maxlength="60" />
          <view class="btn primary" @click="savePainEntry">记录</view>
        </view>
        <view v-if="painDiary.length" class="diary-list">
          <view v-for="entry in painDiary" :key="entry.id" class="diary-item">
            <view>
              <text class="diary-title">{{ entry.regionName }} · {{ entry.intensity }}/10</text>
              <text class="diary-meta">{{ entry.date }} · {{ entry.note || '无备注' }}</text>
            </view>
            <text class="diary-remove" @click="removePainEntry(entry.id)">删除</text>
          </view>
        </view>
        <text v-else class="empty-text">还没有记录。记录位置与强度，便于观察变化。</text>
      </view>
    </view>

    <!-- 增肌 -->
    <view v-if="tab === 'hyper'" class="tab-body">
      <view class="card">
        <view class="section-head"><text class="section-title">选择肌群</text><text class="section-sub">动作覆盖与刺激</text></view>
        <picker mode="selector" :range="muscleNames" :value="hyperMuscleIndex" @change="onMusclePickerChange">
          <view class="picker wide">
            <text class="picker-value">{{ hyperMuscle.nameZh }}</text>
            <text class="picker-arrow">▾</text>
          </view>
        </picker>
        <scroll-view scroll-x class="chips-scroll" :show-scrollbar="false">
          <view class="chip-row">
            <view
              v-for="id in QUICK_MUSCLES"
              :key="id"
              class="chip"
              :class="{ active: hyperMuscle.id === id }"
              @click="selectHyperMuscle(id)"
            >
              {{ MUSCLE_BY_ID[id].nameZh }}
            </view>
          </view>
        </scroll-view>
        <view class="muscle-summary">
          <text class="muscle-summary-name">{{ hyperMuscle.nameZh }}</text>
          <text class="muscle-summary-text">{{ MUSCLE_KNOWLEDGE[hyperMuscle.id].functionZh }}</text>
        </view>
        <view v-if="hyperGuide" class="volume-card">
          <view class="volume-head">
            <text>本周有效组数</text>
            <text class="volume-number" :style="{ color: hyperVolumeStatus?.color }">{{ hyperWeekly }}</text>
          </view>
          <view class="volume-track">
            <view class="volume-fill" :style="{ width: `${Math.min(100, Math.round((hyperWeekly / hyperGuide.max) * 100))}%`, background: hyperVolumeStatus?.color }" />
          </view>
          <view class="volume-meta">
            <text>目标 {{ hyperGuide.min }}–{{ hyperGuide.max }} 组 / 周</text>
            <text :style="{ color: hyperVolumeStatus?.color }">{{ hyperVolumeStatus?.label }}</text>
          </view>
          <text class="volume-note">{{ hyperGuide.noteZh }}</text>
        </view>
      </view>

      <view class="card">
        <view class="section-head"><text class="section-title">动作覆盖</text><text class="section-sub">主责 {{ hyperRows.filter((row) => row.role === 'primary').length }} 个</text></view>
        <view v-for="row in hyperRows" :key="row.exercise.id" class="coverage-item">
          <view class="coverage-top">
            <view class="coverage-name">
              <text class="coverage-title">{{ row.exercise.nameZh }}</text>
              <text class="role-badge" :style="{ color: ROLE_COLORS[row.role], borderColor: `${ROLE_COLORS[row.role]}66` }">{{ ROLE_LABELS[row.role] }}</text>
            </view>
            <view class="stress-badge" :style="{ color: row.stress.color, borderColor: `${row.stress.color}66` }">关节 {{ row.stress.label }}</view>
          </view>
          <view class="stimulus-row">
            <text>{{ RESISTANCE_LABELS[row.stimulus.resistanceProfile] }}</text>
            <text>稳定性 {{ DEMAND_LABELS[row.stimulus.stability] }}</text>
            <text>技能 {{ DEMAND_LABELS[row.stimulus.skill] }}</text>
          </view>
          <text class="coverage-note">{{ row.stimulus.emphasisZh }}</text>
          <view class="coverage-actions">
            <text class="link" @click="chooseExercise(row.exercise.id)">查看解剖</text>
          </view>
        </view>
        <text v-if="!hyperRows.length" class="empty-text">暂无覆盖动作。</text>
      </view>

      <view class="card">
        <view class="section-head"><text class="section-title">训练日志</text><text class="section-sub">本地保存</text></view>
        <view class="log-form">
          <picker mode="selector" :range="EXERCISES.map((exercise) => exercise.nameZh)" :value="logExerciseIndex" @change="logExerciseIndex = Number($event.detail.value)">
            <view class="picker wide">
              <text class="picker-value">{{ EXERCISES[logExerciseIndex]?.nameZh }}</text>
              <text class="picker-arrow">▾</text>
            </view>
          </picker>
          <view class="log-row">
            <input v-model.number="logSets" class="sets-input" type="number" placeholder="组数" placeholder-class="ph" />
            <view class="btn primary" @click="addTrainingEntry">记录</view>
          </view>
        </view>
        <view v-if="recentLogs.length" class="diary-list">
          <view v-for="entry in recentLogs" :key="entry.id" class="diary-item">
            <view>
              <text class="diary-title">{{ entry.exercise?.nameZh ?? entry.exerciseId }} · {{ entry.sets }} 组</text>
              <text class="diary-meta">{{ entry.date }}</text>
            </view>
            <text class="diary-remove" @click="removeTrainingEntry(entry.id)">删除</text>
          </view>
        </view>
        <text v-else class="empty-text">还没有训练记录。</text>
      </view>

      <view class="card">
        <view class="section-head"><text class="section-title">近 7 天容量</text><text class="section-sub">主责 ×1 · 协同 ×0.5 · 稳定 ×0.25</text></view>
        <view v-if="weeklyVolume.length" class="volume-list">
          <view v-for="row in weeklyVolume" :key="row.muscle.id" class="volume-row">
            <text class="volume-name">{{ row.muscle.nameZh }}</text>
            <view class="volume-track">
              <view class="volume-fill" :style="{ width: `${row.guide ? Math.min(100, Math.round((row.sets / row.guide.max) * 100)) : 0}%`, background: '#38d9e8' }" />
            </view>
            <text class="volume-value">{{ row.sets }}<text v-if="row.guide"> / {{ row.guide.min }}–{{ row.guide.max }}</text></text>
          </view>
        </view>
        <text v-else class="empty-text">记录训练后，这里会按肌群汇总近 7 天有效组数。</text>
      </view>

      <text class="disclaimer block-disclaimer">{{ HYPERTROPHY_DISCLAIMER }}</text>
    </view>

    <view class="footer">
      <text>Z-Anatomy · BodyParts3D · CC BY-SA</text>
      <text>教育用途，不构成医疗建议</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 16px) 14px 36px;
  background: radial-gradient(80% 50% at 50% 0%, #14202a 0%, #0a0d12 60%);
  color: #e8e3d9;
  box-sizing: border-box;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
}

.mark {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #243641, #101820);
  border: 1px solid rgba(56, 217, 232, 0.35);
  color: #38d9e8;
  font-size: 15px;
  font-weight: 700;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.title {
  font-size: 16px;
  font-weight: 650;
  letter-spacing: 0.06em;
}

.subtitle {
  font-size: 9px;
  color: #6f6a61;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.version {
  font-size: 10px;
  color: #38d9e8;
  border: 1px solid rgba(56, 217, 232, 0.3);
  border-radius: 999px;
  padding: 3px 8px;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 11px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(17, 21, 28, 0.8);
  margin-bottom: 14px;
}

.tab {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #8b877e;
  padding: 8px 0;
  border-radius: 8px;
}

.tab.active {
  color: #38d9e8;
  background: rgba(56, 217, 232, 0.1);
  font-weight: 600;
}

.tab-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-row {
  display: flex;
}

.search {
  flex: 1;
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(7, 10, 14, 0.75);
  color: #e8e3d9;
  padding: 0 12px;
  font-size: 12px;
  box-sizing: border-box;
}

.ph {
  color: #5c5850;
}

.chips-scroll {
  width: 100%;
  white-space: nowrap;
}

.chip-row {
  display: inline-flex;
  gap: 6px;
  padding: 1px 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 5px 11px;
  font-size: 11px;
  color: #8b877e;
  white-space: nowrap;
}

.chip.active {
  background: #38d9e8;
  border-color: #38d9e8;
  color: #062225;
  font-weight: 600;
}

.exercise-scroll {
  width: 100%;
  white-space: nowrap;
}

.exercise-row {
  display: inline-flex;
  gap: 8px;
  padding: 1px 0 3px;
}

.exercise-card {
  display: inline-flex;
  flex-direction: column;
  gap: 3px;
  width: 150px;
  padding: 9px 10px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(17, 21, 28, 0.8);
  white-space: normal;
}

.exercise-card.active {
  border-color: rgba(56, 217, 232, 0.45);
  background: rgba(56, 217, 232, 0.08);
}

.exercise-card.compact {
  width: 136px;
}

.exercise-name {
  font-size: 12.5px;
  font-weight: 600;
}

.exercise-meta {
  font-size: 9px;
  color: #6f6a61;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exercise-tag {
  align-self: flex-start;
  font-size: 9px;
  color: #38d9e8;
  border: 1px solid rgba(56, 217, 232, 0.25);
  border-radius: 4px;
  padding: 0 4px;
  margin-top: 2px;
}

.anatomy-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.body-card,
.card {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(17, 21, 28, 0.82);
  padding: 12px;
}

.body-head,
.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.section-sub {
  display: block;
  font-size: 9px;
  color: #6f6a61;
  margin-top: 2px;
}

.seg {
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 7px;
  overflow: hidden;
  background: rgba(10, 15, 20, 0.8);
}

.seg-item {
  font-size: 10px;
  color: #8b877e;
  padding: 4px 9px;
}

.seg-item.active {
  color: #38d9e8;
  background: rgba(56, 217, 232, 0.12);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9.5px;
  color: #8b877e;
}

.viewer-layers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.layer-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(10, 15, 20, 0.75);
  font-size: 9.5px;
  color: #8b877e;
}

.layer-chip.active {
  color: #dfe6ea;
  border-color: rgba(56, 217, 232, 0.35);
  background: rgba(56, 217, 232, 0.1);
}

.layer-chip.isolate.active {
  color: #0b1015;
  background: #38d9e8;
  border-color: #38d9e8;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.detail-head {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-title {
  font-size: 23px;
  font-weight: 650;
}

.detail-cat {
  font-size: 9px;
  color: #38d9e8;
  border: 1px solid rgba(56, 217, 232, 0.3);
  border-radius: 4px;
  padding: 1px 5px;
}

.detail-en {
  font-size: 10px;
  color: #6f6a61;
}

.summary {
  font-size: 11.5px;
  line-height: 1.65;
  color: #b6b0a6;
  margin-top: 4px;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
}

.meta {
  font-size: 9px;
  color: #8b877e;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 1px 6px;
}

.role-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 8px;
}

.role-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
}

.count {
  color: #6f6a61;
  font-size: 9px;
}

.muscle-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding-left: 12px;
}

.muscle-chip {
  font-size: 10.5px;
  border: 1px solid;
  border-radius: 999px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.02);
}

.muscle-info {
  border-radius: 8px;
  border: 1px solid rgba(56, 217, 232, 0.25);
  background: rgba(56, 217, 232, 0.06);
  padding: 8px 9px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
}

.muscle-info-title {
  font-size: 11.5px;
  font-weight: 600;
  color: #38d9e8;
}

.muscle-info-text,
.muscle-info-issue {
  font-size: 10.5px;
  line-height: 1.55;
  color: #b6b0a6;
}

.muscle-info-issue {
  color: #c58b6f;
}

.fold {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 10.5px;
  color: #38d9e8;
}

.fold.red {
  color: #ff8a7a;
  border-top-color: rgba(255, 107, 90, 0.2);
  border: 1px solid rgba(255, 107, 90, 0.25);
  border-radius: 7px;
  padding: 7px 9px;
}

.fold-icon {
  color: #6f6a61;
}

.muscle-functions {
  margin-top: 7px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fn-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.fn-name {
  font-size: 10.5px;
  font-weight: 600;
}

.fn-text {
  font-size: 10px;
  color: #8b877e;
  line-height: 1.5;
}

.joint-row {
  display: flex;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stress-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-top: 4px;
  flex: none;
}

.joint-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.joint-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.joint-name {
  font-size: 11.5px;
  font-weight: 600;
}

.stress-badge {
  font-size: 8.5px;
  border: 1px solid;
  border-radius: 3px;
  padding: 0 4px;
  line-height: 14px;
}

.joint-motion,
.joint-rom,
.joint-note {
  font-size: 9.5px;
  color: #8b877e;
  line-height: 1.5;
}

.joint-note {
  color: #b6b0a6;
  margin-top: 2px;
}

.bullet {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 3px 0;
  font-size: 10.5px;
  line-height: 1.55;
  color: #b6b0a6;
}

.bullet-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #38d9e8;
  margin-top: 6px;
  flex: none;
}

.bullet-dot.error {
  background: #d9825f;
}

.bullet-dot.warn {
  background: #ff6b5a;
}

.red-flags {
  margin-top: 7px;
}

.red-flag {
  display: flex;
  gap: 5px;
  font-size: 10px;
  line-height: 1.5;
  color: #b6b0a6;
  padding: 2px 0;
}

.red-flag text:first-child {
  color: #ff6b5a;
}

.disclaimer {
  display: block;
  margin-top: 7px;
  font-size: 9px;
  line-height: 1.55;
  color: #6f6a61;
}

.block-disclaimer {
  padding: 0 4px;
}

.sub-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 9px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.02);
  margin-bottom: 5px;
}

.sub-item.linked {
  border-color: rgba(56, 217, 232, 0.25);
}

.sub-title {
  font-size: 11px;
  font-weight: 600;
}

.sub-note {
  font-size: 9.5px;
  color: #8b877e;
}

.bone-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.bone-chip {
  font-size: 10px;
  color: #d9cbb3;
  border: 1px solid rgba(217, 203, 179, 0.22);
  background: rgba(217, 203, 179, 0.05);
  border-radius: 5px;
  padding: 3px 8px;
}

.pain-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 9px;
}

.pain-advice {
  display: block;
  font-size: 10.5px;
  line-height: 1.6;
  color: #8b877e;
  margin-top: 4px;
}

.triage-status {
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 9px;
  flex: none;
}

.region-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.region-chip {
  font-size: 10.5px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 5px 10px;
  color: #8b877e;
}

.region-chip.active {
  border-color: rgba(255, 107, 90, 0.45);
  background: rgba(255, 107, 90, 0.12);
  color: #ff9b8c;
}

.structure {
  display: flex;
  gap: 7px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.structure-type {
  flex: none;
  font-size: 8.5px;
  color: #38d9e8;
  border: 1px solid rgba(56, 217, 232, 0.3);
  border-radius: 3px;
  padding: 0 4px;
  line-height: 14px;
  height: 16px;
  box-sizing: border-box;
}

.structure-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.structure-name {
  font-size: 11px;
  font-weight: 600;
}

.structure-note {
  font-size: 9.5px;
  color: #8b877e;
  line-height: 1.5;
}

.slider-row {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: #8b877e;
  margin-top: 5px;
}

.slider-value {
  color: #38d9e8;
}

.picker-row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.picker-row picker {
  flex: 1;
}

.picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 7px;
  background: rgba(10, 15, 20, 0.8);
  padding: 8px 9px;
  font-size: 10.5px;
}

.picker.wide {
  width: 100%;
  box-sizing: border-box;
}

.picker-label {
  color: #6f6a61;
  display: block;
  font-size: 9px;
}

.picker-value {
  color: #e8e3d9;
}

.picker-arrow {
  color: #6f6a61;
}

.flag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 9px;
}

.flag {
  font-size: 10px;
  color: #8b877e;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 4px 9px;
}

.flag.active {
  color: #ff9b8c;
  border-color: rgba(255, 107, 90, 0.5);
  background: rgba(255, 107, 90, 0.14);
}

.triage-card {
  margin-top: 10px;
  border: 1px solid;
  border-radius: 9px;
  padding: 9px 10px;
  background: rgba(255, 255, 255, 0.025);
}

.triage-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.triage-badge {
  font-size: 8.5px;
  border: 1px solid currentColor;
  border-radius: 3px;
  padding: 0 5px;
  line-height: 15px;
}

.triage-title {
  font-size: 11.5px;
  font-weight: 600;
}

.triage-reason {
  font-size: 9.5px;
  color: #8b877e;
  line-height: 1.5;
  margin-top: 3px;
}

.triage-advice {
  display: block;
  font-size: 10px;
  line-height: 1.55;
  color: #b6b0a6;
  margin-top: 7px;
}

.diary-form {
  display: flex;
  gap: 6px;
  align-items: center;
}

.diary-input {
  flex: 1;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 7px;
  background: rgba(10, 15, 20, 0.8);
  color: #e8e3d9;
  padding: 0 9px;
  font-size: 10.5px;
  box-sizing: border-box;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  padding: 8px 14px;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e8e3d9;
  background: rgba(255, 255, 255, 0.04);
}

.btn.primary {
  color: #062225;
  background: #38d9e8;
  border-color: #38d9e8;
  font-weight: 600;
}

.diary-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 8px;
}

.diary-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.025);
}

.diary-title {
  display: block;
  font-size: 10.5px;
  font-weight: 600;
}

.diary-meta {
  display: block;
  font-size: 9px;
  color: #6f6a61;
  margin-top: 2px;
}

.diary-remove {
  font-size: 9px;
  color: #8b877e;
  flex: none;
}

.empty-text {
  display: block;
  font-size: 10px;
  color: #6f6a61;
  line-height: 1.6;
  margin-top: 6px;
}

.empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
  color: #8b877e;
}

.quick-row {
  display: flex;
  gap: 5px;
}

.muscle-summary {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 8px;
}

.muscle-summary-name {
  font-size: 17px;
  font-weight: 650;
}

.muscle-summary-text {
  font-size: 10.5px;
  color: #8b877e;
  line-height: 1.55;
}

.volume-card {
  margin-top: 9px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  padding: 9px;
  background: rgba(255, 255, 255, 0.02);
}

.volume-head {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: #8b877e;
}

.volume-number {
  font-size: 19px;
  font-weight: 650;
  color: #38d9e8;
}

.volume-track {
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.07);
  overflow: hidden;
  margin: 6px 0 4px;
  flex: 1;
}

.volume-fill {
  height: 100%;
  border-radius: 3px;
  background: #38d9e8;
}

.volume-meta {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #6f6a61;
}

.volume-note {
  display: block;
  font-size: 9px;
  color: #6f6a61;
  line-height: 1.5;
  margin-top: 5px;
}

.coverage-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.coverage-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.coverage-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.coverage-title {
  font-size: 11.5px;
  font-weight: 600;
}

.role-badge {
  font-size: 8.5px;
  border: 1px solid;
  border-radius: 3px;
  padding: 0 4px;
  line-height: 14px;
}

.stimulus-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 9px;
  margin-top: 4px;
  font-size: 9px;
  color: #6f6a61;
}

.coverage-note {
  display: block;
  font-size: 9.5px;
  color: #8b877e;
  line-height: 1.5;
  margin-top: 3px;
}

.coverage-actions {
  margin-top: 5px;
}

.link {
  font-size: 9.5px;
  color: #38d9e8;
  margin-right: 12px;
}

.log-form {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.log-row {
  display: flex;
  gap: 7px;
  align-items: center;
}

.sets-input {
  flex: 1;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 7px;
  background: rgba(10, 15, 20, 0.8);
  color: #e8e3d9;
  padding: 0 9px;
  font-size: 10.5px;
  box-sizing: border-box;
}

.volume-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.volume-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.volume-name {
  width: 72px;
  font-size: 9.5px;
  color: #b6b0a6;
  flex: none;
}

.volume-value {
  width: 74px;
  text-align: right;
  font-size: 9px;
  color: #8b877e;
  flex: none;
}

.footer {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  margin-top: 22px;
  font-size: 9px;
  color: #4f4b45;
  text-align: center;
}

@media (min-width: 900px) {
  .page {
    max-width: 1080px;
    margin: 0 auto;
    padding-left: 24px;
    padding-right: 24px;
  }

  .anatomy-layout {
    flex-direction: row;
    align-items: flex-start;
  }

  .anatomy-visual {
    width: 420px;
    flex: none;
  }

  .anatomy-detail {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .exercise-card {
    width: 168px;
  }
}
</style>
