<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAnatomyStore } from '../stores/anatomy'
import { useTrainingStore, type HypertrophyProfile } from '../stores/training'
import { EXERCISES, EXERCISE_BY_ID } from '../data/exercises'
import { MUSCLES, MUSCLE_BY_ID } from '../data/muscles'
import { EXERCISE_KNOWLEDGE, MUSCLE_KNOWLEDGE, STRESS_COLORS, STRESS_LABELS } from '../data/knowledge'
import {
  DEMAND_LABELS,
  EXERCISE_STIMULUS,
  HYPERTROPHY_DISCLAIMER,
  RESISTANCE_LABELS,
  volumeGuideFor,
} from '../data/hypertrophy'
import { PAIN_REGIONS, PAIN_REGION_BY_ID } from '../data/pain'
import { PALETTE } from '../three/materials'
import type { MuscleId, MuscleRole, Region, StressLevel } from '../data/types'

const emit = defineEmits<{ close: []; selectExercise: [id: string] }>()

const anatomy = useAnatomyStore()
const training = useTrainingStore()

const tab = ref<'coverage' | 'log' | 'profile'>('coverage')
const selectedMuscleId = ref<MuscleId>('pectoralis-major')
const primaryOnly = ref(false)
const onlyAvailable = ref(false)

const REGION_LABELS: Record<Region, string> = {
  chest: '胸',
  back: '背',
  shoulder: '肩',
  arm: '臂',
  leg: '腿',
  core: '核心',
  head: '头颈',
}

const ROLE_LABELS: Record<MuscleRole, string> = {
  primary: '主责',
  secondary: '协同',
  stabilizer: '稳定',
}

const ROLE_COLORS: Record<MuscleRole, string> = {
  primary: PALETTE.primary,
  secondary: PALETTE.secondary,
  stabilizer: PALETTE.stabilizer,
}

const ROLE_ORDER: Record<MuscleRole, number> = {
  primary: 0,
  secondary: 1,
  stabilizer: 2,
}

const QUICK_MUSCLES: MuscleId[] = [
  'pectoralis-major',
  'latissimus-dorsi',
  'deltoid-lateral',
  'biceps-brachii',
  'triceps-brachii',
  'quadriceps',
  'gluteus-maximus',
  'hamstrings',
  'rectus-abdominis',
]

const muscleGroups = computed(() =>
  (Object.keys(REGION_LABELS) as Region[])
    .map((region) => ({
      region,
      label: REGION_LABELS[region],
      muscles: MUSCLES.filter((muscle) => muscle.region === region),
    }))
    .filter((group) => group.muscles.length > 0),
)

const selectedMuscle = computed(() => MUSCLE_BY_ID[selectedMuscleId.value])
const selectedKnowledge = computed(() => MUSCLE_KNOWLEDGE[selectedMuscleId.value])
const selectedGuide = computed(() => volumeGuideFor(selectedMuscle.value))
const selectedWeekly = computed(
  () => training.weeklyVolume.find((item) => item.muscle?.id === selectedMuscleId.value)?.sets ?? 0,
)

interface CoverageRow {
  exerciseId: string
  nameZh: string
  equipment: string
  role: MuscleRole
  stimulus: (typeof EXERCISE_STIMULUS)[string]
  stress: { level: StressLevel; label: string; color: string }
  painRegions: string[]
  noteZh: string
  available: boolean
  skillWarning: boolean
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

function painRegionsForExercise(exerciseId: string): string[] {
  return training.profile.painRegionIds
    .map((id) => PAIN_REGION_BY_ID[id])
    .filter((region) => region?.exerciseIds.includes(exerciseId))
    .map((region) => region!.nameZh)
}

function equipmentAvailable(equipment: string): boolean {
  if (training.profile.equipment === 'gym') return true
  if (training.profile.equipment === 'bodyweight') return equipment.trim() === '自重'
  return (
    equipment.includes('自重') ||
    equipment.includes('哑铃') ||
    equipment.includes('单杠')
  )
}

const coverageRows = computed<CoverageRow[]>(() => {
  const rows = EXERCISES.flatMap((exercise) => {
    const activation = exercise.muscles.find((item) => item.id === selectedMuscleId.value)
    if (!activation) return []
    if (primaryOnly.value && activation.role !== 'primary') return []
    const stimulus = EXERCISE_STIMULUS[exercise.id]
    const available = equipmentAvailable(exercise.equipment)
    if (onlyAvailable.value && !available) return []
    return [
      {
        exerciseId: exercise.id,
        nameZh: exercise.nameZh,
        equipment: exercise.equipment,
        role: activation.role,
        stimulus,
        stress: maxStress(exercise.id),
        painRegions: painRegionsForExercise(exercise.id),
        noteZh: stimulus?.noteZh ?? '',
        available,
        skillWarning: training.profile.experience === 'beginner' && stimulus?.skill === 'high',
      },
    ]
  })
  return rows.sort((a, b) => {
    const roleDiff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
    return roleDiff !== 0 ? roleDiff : a.nameZh.localeCompare(b.nameZh, 'zh-CN')
  })
})

const primaryCount = computed(
  () =>
    EXERCISES.filter((exercise) =>
      exercise.muscles.some(
        (item) => item.id === selectedMuscleId.value && item.role === 'primary',
      ),
    ).length,
)

const visiblePrimaryCount = computed(
  () => coverageRows.value.filter((row) => row.role === 'primary').length,
)

const volumePct = computed(() => {
  const guide = selectedGuide.value
  if (!guide || guide.max <= 0) return 0
  return Math.min(100, Math.round((selectedWeekly.value / guide.max) * 100))
})

const volumeStatus = computed(() => {
  const guide = selectedGuide.value
  if (!guide) return null
  if (selectedWeekly.value < guide.min) return { label: '低于目标', color: '#f2b84b' }
  if (selectedWeekly.value > guide.max) return { label: '高于目标', color: '#ff6b5a' }
  return { label: '达标区间', color: '#4fd6a0' }
})

// 训练日志
const logExerciseId = ref(anatomy.selectedExerciseId || 'barbell-bench-press')
const logDate = ref(training.localDateString())
const logSets = ref(3)
const logReps = ref(10)
const logWeight = ref(20)
const logRpe = ref(8)
const logPain = ref(false)
const logNote = ref('')
const logSaved = ref(false)

function addTrainingEntry() {
  if (!EXERCISE_BY_ID[logExerciseId.value]) return
  training.addEntry({
    date: logDate.value,
    exerciseId: logExerciseId.value,
    sets: logSets.value,
    reps: logReps.value,
    weight: logWeight.value,
    rpe: logRpe.value,
    pain: logPain.value,
    note: logNote.value.trim(),
  })
  logNote.value = ''
  logSaved.value = true
  window.setTimeout(() => {
    logSaved.value = false
  }, 1600)
}

const recentEntries = computed(() =>
  training.entries.slice(0, 12).map((entry) => ({
    ...entry,
    exercise: EXERCISE_BY_ID[entry.exerciseId],
  })),
)

const weeklyRows = computed(() =>
  training.weeklyVolume.map((item) => {
    const guide = item.guide
    let status = { label: '未设目标', color: '#6b7280' }
    if (guide) {
      if (item.sets < guide.min) status = { label: '低于目标', color: '#f2b84b' }
      else if (item.sets > guide.max) status = { label: '高于目标', color: '#ff6b5a' }
      else status = { label: '达标区间', color: '#4fd6a0' }
    }
    const pct = guide && guide.max > 0 ? Math.min(100, Math.round((item.sets / guide.max) * 100)) : 0
    return { ...item, status, pct }
  }),
)

// 个人档案
const profileForm = ref<HypertrophyProfile>({
  ...training.profile,
  painRegionIds: [...training.profile.painRegionIds],
})
const profileSaved = ref(false)

function toggleProfilePain(regionId: string) {
  const set = new Set(profileForm.value.painRegionIds)
  if (set.has(regionId)) set.delete(regionId)
  else set.add(regionId)
  profileForm.value.painRegionIds = [...set]
}

function saveProfile() {
  training.saveProfile({ ...profileForm.value, painRegionIds: [...profileForm.value.painRegionIds] })
  profileSaved.value = true
  window.setTimeout(() => {
    profileSaved.value = false
  }, 1600)
}

const painRegionsGrouped = computed(() => [
  { view: 'front' as const, label: '正面', regions: PAIN_REGIONS.filter((r) => r.view === 'front') },
  { view: 'back' as const, label: '背面', regions: PAIN_REGIONS.filter((r) => r.view === 'back') },
])

function selectExercise(id: string) {
  emit('selectExercise', id)
}
</script>

<template>
  <Teleport to="body">
    <div class="hyper-backdrop" @click.self="emit('close')">
      <div class="hyper-modal" role="dialog" aria-modal="true" aria-labelledby="hyper-title">
        <header class="hyper-header">
          <div>
            <p class="eyebrow">Hypertrophy Console · 增肌决策</p>
            <h2 id="hyper-title">增肌面板</h2>
            <p class="subtitle">按肌群查看动作覆盖与刺激画像，记录训练量，并与疼痛区域联动。</p>
          </div>
          <button class="close" aria-label="关闭" @click="emit('close')">×</button>
        </header>

        <nav class="tabs">
          <button :class="{ active: tab === 'coverage' }" @click="tab = 'coverage'">肌群覆盖</button>
          <button :class="{ active: tab === 'log' }" @click="tab = 'log'">训练日志</button>
          <button :class="{ active: tab === 'profile' }" @click="tab = 'profile'">个人档案</button>
        </nav>

        <div class="hyper-content">
          <template v-if="tab === 'coverage'">
            <section class="muscle-picker">
              <label class="muscle-select">
                <span>选择肌群</span>
                <select
                  :value="selectedMuscleId"
                  @change="selectedMuscleId = ($event.target as HTMLSelectElement).value as MuscleId"
                >
                  <optgroup v-for="group in muscleGroups" :key="group.region" :label="group.label">
                    <option v-for="muscle in group.muscles" :key="muscle.id" :value="muscle.id">
                      {{ muscle.nameZh }}
                    </option>
                  </optgroup>
                </select>
              </label>
              <div class="quick-muscles">
                <button
                  v-for="id in QUICK_MUSCLES"
                  :key="id"
                  class="quick-muscle"
                  :class="{ active: selectedMuscleId === id }"
                  @click="selectedMuscleId = id"
                >
                  {{ MUSCLE_BY_ID[id].nameZh }}
                </button>
              </div>
            </section>

            <section class="muscle-summary">
              <div class="summary-main">
                <h3>{{ selectedMuscle.nameZh }}</h3>
                <p>{{ selectedKnowledge.functionZh }}</p>
                <p v-if="selectedKnowledge.commonIssueZh" class="issue">{{ selectedKnowledge.commonIssueZh }}</p>
              </div>
              <div v-if="selectedGuide" class="volume-card">
                <div class="volume-head">
                  <span>本周有效组数</span>
                  <strong :style="{ color: volumeStatus?.color }">{{ selectedWeekly }}</strong>
                </div>
                <div class="volume-bar">
                  <span :style="{ width: `${volumePct}%`, background: volumeStatus?.color }" />
                  <i :style="{ left: `${(selectedGuide.min / selectedGuide.max) * 100}%` }" />
                </div>
                <div class="volume-meta">
                  <span>目标 {{ selectedGuide.min }}–{{ selectedGuide.max }} 组 / 周</span>
                  <span :style="{ color: volumeStatus?.color }">{{ volumeStatus?.label }}</span>
                </div>
                <p class="volume-note">{{ selectedGuide.noteZh }}</p>
              </div>
            </section>

            <div class="coverage-head">
              <div>
                <h4>动作覆盖</h4>
                <span>主责 {{ visiblePrimaryCount }} 个 · 共 {{ coverageRows.length }} 个动作</span>
              </div>
              <div class="coverage-filters">
                <label class="primary-toggle">
                  <input v-model="primaryOnly" type="checkbox" />
                  只看主责
                </label>
                <label class="primary-toggle">
                  <input v-model="onlyAvailable" type="checkbox" />
                  只看器械可用
                </label>
              </div>
            </div>

            <p v-if="primaryCount < 2" class="gap-warning">
              主责动作偏少，建议从其他角度/器械补充 1–2 个主责动作。
            </p>

            <div class="coverage-list">
              <article v-for="row in coverageRows" :key="row.exerciseId" class="coverage-item">
                <div class="coverage-top">
                  <div class="coverage-name">
                    <strong>{{ row.nameZh }}</strong>
                    <span
                      class="role-badge"
                      :style="{ color: ROLE_COLORS[row.role], borderColor: `${ROLE_COLORS[row.role]}55` }"
                    >
                      {{ ROLE_LABELS[row.role] }}
                    </span>
                  </div>
                  <div class="coverage-badges">
                    <span
                      class="stress-badge"
                      :style="{ color: row.stress.color, borderColor: `${row.stress.color}55` }"
                    >
                      关节负荷 {{ row.stress.label }}
                    </span>
                    <span v-if="!row.available" class="unavailable-badge">器械不可用</span>
                    <span v-if="row.skillWarning" class="skill-badge">技能门槛高</span>
                    <button class="view-button" @click="selectExercise(row.exerciseId)">查看解剖</button>
                  </div>
                </div>

                <div class="stimulus-chips">
                  <span>{{ RESISTANCE_LABELS[row.stimulus.resistanceProfile] }}</span>
                  <span>稳定性 {{ DEMAND_LABELS[row.stimulus.stability] }}</span>
                  <span>技能门槛 {{ DEMAND_LABELS[row.stimulus.skill] }}</span>
                  <span>{{ row.equipment }}</span>
                </div>

                <p class="emphasis">{{ row.stimulus.emphasisZh }}</p>
                <p v-if="row.noteZh" class="stimulus-note">{{ row.noteZh }}</p>
                <p v-if="row.painRegions.length" class="pain-warning">
                  与你的疼痛区域相关：{{ row.painRegions.join('、') }}
                </p>
                <p v-if="!row.available" class="equipment-warning">
                  当前档案器械不可用；可切换档案或选择替代动作。
                </p>
              </article>
              <p v-if="!coverageRows.length" class="empty">该肌群暂无可展示的动作。</p>
            </div>
          </template>

          <template v-else-if="tab === 'log'">
            <section class="log-form">
              <div class="block-head">
                <h4>记录一组训练</h4>
                <span>保存到本机</span>
              </div>
              <div class="form-grid">
                <label>
                  <span>动作</span>
                  <select v-model="logExerciseId">
                    <option v-for="exercise in EXERCISES" :key="exercise.id" :value="exercise.id">
                      {{ exercise.nameZh }}
                    </option>
                  </select>
                </label>
                <label>
                  <span>日期</span>
                  <input v-model="logDate" type="date" />
                </label>
                <label>
                  <span>组数</span>
                  <input v-model.number="logSets" type="number" min="1" max="20" />
                </label>
                <label>
                  <span>次数 / 组</span>
                  <input v-model.number="logReps" type="number" min="1" max="100" />
                </label>
                <label>
                  <span>重量 kg</span>
                  <input v-model.number="logWeight" type="number" min="0" max="500" step="0.5" />
                </label>
                <label>
                  <span>RPE</span>
                  <input v-model.number="logRpe" type="number" min="1" max="10" />
                </label>
              </div>
              <div class="form-row">
                <label class="pain-check">
                  <input v-model="logPain" type="checkbox" />
                  本次训练出现疼痛
                </label>
                <input v-model="logNote" class="note-input" type="text" maxlength="60" placeholder="备注（可选）" />
                <button class="primary-button" @click="addTrainingEntry">添加记录</button>
                <span v-if="logSaved" class="saved">已记录</span>
              </div>
            </section>

            <section class="volume-section">
              <div class="block-head">
                <h4>近 7 天有效组数</h4>
                <span>主责 ×1 · 协同 ×0.5 · 稳定 ×0.25</span>
              </div>
              <p v-if="!weeklyRows.length" class="empty">还没有训练记录。记录后这里会按肌群汇总本周容量。</p>
              <div v-else class="volume-list">
                <div v-for="row in weeklyRows" :key="row.muscle.id" class="volume-row">
                  <div class="volume-label">
                    <strong>{{ row.muscle.nameZh }}</strong>
                    <span :style="{ color: row.status.color }">{{ row.status.label }}</span>
                  </div>
                  <div class="volume-track">
                    <span :style="{ width: `${row.pct}%`, background: row.status.color }" />
                    <i
                      v-if="row.guide"
                      :style="{ left: `${(row.guide.min / row.guide.max) * 100}%` }"
                    />
                  </div>
                  <span class="volume-value">
                    {{ row.sets }}<em v-if="row.guide"> / {{ row.guide.min }}–{{ row.guide.max }}</em>
                  </span>
                </div>
              </div>
              <p class="total-sets">本周累计有效组数：{{ training.weeklyTotalSets }}</p>
            </section>

            <section class="recent-section">
              <div class="block-head">
                <h4>最近记录</h4>
                <span>{{ recentEntries.length }} 条</span>
              </div>
              <p v-if="!recentEntries.length" class="empty">暂无记录。</p>
              <ul v-else class="entry-list">
                <li v-for="entry in recentEntries" :key="entry.id">
                  <div>
                    <strong>{{ entry.exercise?.nameZh ?? entry.exerciseId }}</strong>
                    <span>
                      {{ entry.date }} · {{ entry.sets }}×{{ entry.reps }} @ {{ entry.weight }}kg · RPE
                      {{ entry.rpe }}
                      <em v-if="entry.pain" class="pain-tag">疼痛</em>
                    </span>
                    <p v-if="entry.note">{{ entry.note }}</p>
                  </div>
                  <button class="remove" @click="training.removeEntry(entry.id)">×</button>
                </li>
              </ul>
            </section>
          </template>

          <template v-else>
            <section class="profile-section">
              <div class="block-head">
                <h4>个人档案</h4>
                <span>仅保存在本机</span>
              </div>
              <p class="profile-note">
                标记你目前有疼痛或不适的区域，覆盖列表会提示相关动作；器械可用性与技能门槛也会在动作列表中提示。
              </p>

              <div class="profile-field">
                <span>疼痛 / 不适区域</span>
                <div v-for="group in painRegionsGrouped" :key="group.view" class="pain-group">
                  <em>{{ group.label }}</em>
                  <div class="pain-chips">
                    <button
                      v-for="region in group.regions"
                      :key="region.id"
                      class="pain-chip"
                      :class="{ active: profileForm.painRegionIds.includes(region.id) }"
                      @click="toggleProfilePain(region.id)"
                    >
                      {{ region.nameZh }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="profile-grid">
                <label>
                  <span>可用器械</span>
                  <select v-model="profileForm.equipment">
                    <option value="gym">健身房 / 全套器械</option>
                    <option value="home">家庭 / 哑铃+单杠</option>
                    <option value="bodyweight">自重</option>
                  </select>
                </label>
                <label>
                  <span>训练经验</span>
                  <select v-model="profileForm.experience">
                    <option value="beginner">初级（&lt;1 年）</option>
                    <option value="intermediate">中级（1–3 年）</option>
                    <option value="advanced">高级（&gt;3 年）</option>
                  </select>
                </label>
              </div>

              <div class="profile-actions">
                <button class="primary-button" @click="saveProfile">保存档案</button>
                <span v-if="profileSaved" class="saved">已保存</span>
              </div>
            </section>
          </template>

          <p class="disclaimer">{{ HYPERTROPHY_DISCLAIMER }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.hyper-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 22px;
  background: rgba(4, 6, 9, 0.72);
  backdrop-filter: blur(10px);
}

.hyper-modal {
  width: min(1120px, 96vw);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: #0d1118;
  box-shadow: 0 30px 100px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}

.hyper-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 14px;
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cyan);
}

.hyper-header h2 {
  margin: 0;
  font-size: 22px;
}

.subtitle {
  margin: 5px 0 0;
  font-size: 11.5px;
  color: var(--muted);
}

.close {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 8px;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 8px 24px 0;
  border-bottom: 1px solid var(--line);
}

.tabs button {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 11.5px;
  padding: 7px 12px;
  border-radius: 7px 7px 0 0;
  cursor: pointer;
}

.tabs button.active {
  color: var(--cyan);
  background: rgba(56, 217, 232, 0.08);
  box-shadow: inset 0 -2px 0 var(--cyan);
}

.hyper-content {
  padding: 16px 24px 24px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.muscle-picker {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.muscle-select {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 11px;
  color: var(--muted);
}

.muscle-select select {
  background: #0a0f14;
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 7px 10px;
  font-size: 12px;
  min-width: 220px;
  outline: none;
}

.quick-muscles {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.quick-muscle {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 10.5px;
  cursor: pointer;
}

.quick-muscle.active {
  border-color: rgba(56, 217, 232, 0.35);
  background: rgba(56, 217, 232, 0.1);
  color: var(--cyan);
}

.muscle-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 16px;
  padding: 14px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.025);
}

.summary-main h3 {
  margin: 0 0 5px;
  font-size: 20px;
}

.summary-main p {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
}

.summary-main p.issue {
  margin-top: 5px;
  color: #c58b6f;
}

.volume-card {
  border-left: 1px solid var(--line);
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.volume-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted);
}

.volume-head strong {
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}

.volume-bar,
.volume-track {
  position: relative;
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.07);
  overflow: hidden;
}

.volume-bar span,
.volume-track span {
  display: block;
  height: 100%;
  border-radius: 3px;
}

.volume-bar i,
.volume-track i {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 1px;
  background: rgba(255, 255, 255, 0.35);
}

.volume-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 9.5px;
  color: var(--faint);
}

.volume-note {
  margin: 2px 0 0;
  font-size: 9.5px;
  line-height: 1.5;
  color: var(--faint);
}

.coverage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.coverage-head h4 {
  margin: 0 0 3px;
  font-size: 13px;
}

.coverage-head span {
  font-size: 10px;
  color: var(--faint);
}

.primary-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--muted);
  cursor: pointer;
}

.primary-toggle input {
  accent-color: #38d9e8;
}

.coverage-filters {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unavailable-badge {
  font-size: 9px;
  color: #b8a06a;
  border: 1px solid rgba(184, 160, 106, 0.35);
  border-radius: 4px;
  padding: 0 5px;
  line-height: 15px;
}

.skill-badge {
  font-size: 9px;
  color: #e0b96f;
  border: 1px solid rgba(224, 185, 111, 0.3);
  border-radius: 4px;
  padding: 0 5px;
  line-height: 15px;
}

.equipment-warning {
  margin: 0;
  font-size: 9.5px;
  color: #b8a06a;
}

.gap-warning {
  margin: 0;
  padding: 8px 10px;
  border-radius: 7px;
  border: 1px solid rgba(242, 184, 75, 0.28);
  background: rgba(242, 184, 75, 0.07);
  font-size: 10.5px;
  color: #e0b96f;
}

.coverage-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.coverage-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 12px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.coverage-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.coverage-name {
  display: flex;
  align-items: center;
  gap: 7px;
}

.coverage-name strong {
  font-size: 12.5px;
}

.role-badge,
.stress-badge {
  font-size: 9px;
  border: 1px solid;
  border-radius: 4px;
  padding: 0 5px;
  line-height: 15px;
}

.coverage-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.view-button {
  border: 1px solid rgba(56, 217, 232, 0.25);
  background: rgba(56, 217, 232, 0.08);
  color: var(--cyan);
  border-radius: 5px;
  font-size: 9.5px;
  padding: 3px 7px;
  cursor: pointer;
}

.stimulus-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.stimulus-chips span {
  font-size: 9.5px;
  color: var(--faint);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 4px;
  padding: 1px 5px;
}

.emphasis {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--muted);
}

.stimulus-note {
  margin: 0;
  font-size: 10px;
  line-height: 1.55;
  color: var(--faint);
}

.pain-warning {
  margin: 2px 0 0;
  font-size: 10px;
  color: #ff9b8c;
}

.empty {
  margin: 0;
  font-size: 11px;
  color: var(--faint);
}

.log-form,
.volume-section,
.recent-section,
.profile-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 13px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.02);
}

.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.block-head h4 {
  margin: 0;
  font-size: 12.5px;
}

.block-head span {
  font-size: 9.5px;
  color: var(--faint);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.form-grid label,
.profile-grid label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 9.5px;
  color: var(--muted);
}

.form-grid input,
.form-grid select,
.profile-grid select {
  background: #0a0f14;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  padding: 6px 7px;
  font-size: 10.5px;
  outline: none;
  min-width: 0;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pain-check {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--muted);
}

.pain-check input {
  accent-color: #ff6b5a;
}

.note-input {
  flex: 1;
  min-width: 140px;
  background: #0a0f14;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text);
  padding: 6px 8px;
  font-size: 10.5px;
  outline: none;
}

.primary-button {
  border: 1px solid rgba(56, 217, 232, 0.35);
  background: rgba(56, 217, 232, 0.12);
  color: var(--cyan);
  border-radius: 7px;
  padding: 6px 14px;
  font-size: 10.5px;
  cursor: pointer;
}

.saved {
  font-size: 10px;
  color: #4fd6a0;
}

.volume-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.volume-row {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr) 90px;
  align-items: center;
  gap: 9px;
}

.volume-label {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.volume-label strong {
  font-size: 10.5px;
}

.volume-label span {
  font-size: 8.5px;
}

.volume-value {
  font-size: 10px;
  color: var(--muted);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.volume-value em {
  font-style: normal;
  color: var(--faint);
}

.total-sets {
  margin: 2px 0 0;
  font-size: 10px;
  color: var(--faint);
}

.entry-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 220px;
  overflow: auto;
}

.entry-list li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
}

.entry-list strong {
  display: block;
  font-size: 10.5px;
}

.entry-list span {
  font-size: 9px;
  color: var(--faint);
}

.entry-list p {
  margin: 2px 0 0;
  font-size: 9.5px;
  color: var(--muted);
}

.pain-tag {
  font-style: normal;
  color: #ff8a7a;
  margin-left: 5px;
}

.remove {
  border: 0;
  background: transparent;
  color: var(--faint);
  font-size: 14px;
  cursor: pointer;
}

.profile-note {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--muted);
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-field > span {
  font-size: 10.5px;
  color: var(--muted);
}

.pain-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pain-group em {
  font-style: normal;
  font-size: 9px;
  color: var(--faint);
}

.pain-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.pain-chip {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 9.5px;
  cursor: pointer;
}

.pain-chip.active {
  border-color: rgba(255, 107, 90, 0.45);
  background: rgba(255, 107, 90, 0.12);
  color: #ff9b8c;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.profile-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.disclaimer {
  margin: 0;
  font-size: 9.5px;
  line-height: 1.6;
  color: var(--faint);
}

@media (max-width: 900px) {
  .hyper-backdrop {
    padding: 8px;
  }

  .hyper-modal {
    width: 100%;
    max-height: 96vh;
  }

  .hyper-header {
    padding: 14px 16px 12px;
  }

  .tabs {
    padding: 6px 16px 0;
  }

  .hyper-content {
    padding: 12px 16px 20px;
  }

  .muscle-summary {
    grid-template-columns: 1fr;
  }

  .volume-card {
    border-left: 0;
    border-top: 1px solid var(--line);
    padding-left: 0;
    padding-top: 10px;
  }

  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .volume-row {
    grid-template-columns: 86px minmax(0, 1fr) 80px;
  }

  .coverage-top {
    flex-wrap: wrap;
  }
}
</style>
