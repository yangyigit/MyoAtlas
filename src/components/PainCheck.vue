<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { EXERCISE_BY_ID } from '../data/exercises'
import {
  DEFAULT_PAIN_ANSWERS,
  PAIN_DISCLAIMER,
  PAIN_REGIONS,
  PAIN_REGION_BY_ID,
  triagePain,
  type PainAnswers,
  type PainDiaryEntry,
  type PainRegion,
  type TriageLevel,
} from '../data/pain'
import type { Exercise } from '../data/types'
import {
  ElButton,
  ElCheckTag,
  ElInput,
  ElMessage,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElSlider,
} from 'element-plus'

const emit = defineEmits<{ close: []; selectExercise: [id: string] }>()

const view = ref<'front' | 'back'>('front')
const selectedId = ref('')
const answers = ref<PainAnswers>({ ...DEFAULT_PAIN_ANSWERS })
const note = ref('')
const diary = ref<PainDiaryEntry[]>([])
const triageRef = ref<HTMLElement | null>(null)

const STORAGE_KEY = 'kinesis-pain-diary'
const MAX_DIARY = 20

const viewRegions = computed(() => PAIN_REGIONS.filter((region) => region.view === view.value))
const selectedRegion = computed<PainRegion | null>(() =>
  selectedId.value ? PAIN_REGION_BY_ID[selectedId.value] ?? null : null,
)
const triage = computed(() => triagePain(answers.value))
const triageMeta = computed(() => {
  const meta: Record<TriageLevel, { label: string; color: string }> = {
    'self-care': { label: '观察调整', color: '#4fd6a0' },
    caution: { label: '谨慎处理', color: '#f2b84b' },
    urgent: { label: '尽快就医', color: '#ff6b5a' },
  }
  return meta[triage.value.level]
})
const relatedExercises = computed<Exercise[]>(() => {
  if (!selectedRegion.value) return []
  return selectedRegion.value.exerciseIds
    .map((id) => EXERCISE_BY_ID[id])
    .filter((exercise): exercise is Exercise => Boolean(exercise))
})

const flagOptions = [
  { key: 'swelling', label: '明显肿胀/发热' },
  { key: 'locking', label: '关节交锁/卡住' },
  { key: 'instability', label: '打软腿/关节不稳' },
  { key: 'numbness', label: '麻木/放射痛' },
  { key: 'weakness', label: '肌力明显下降' },
  { key: 'trauma', label: '近期外伤' },
  { key: 'nightPain', label: '夜间静息痛' },
  { key: 'cantBearWeight', label: '无法负重' },
] as const

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

function selectRegion(region: PainRegion) {
  selectedId.value = region.id
}

function switchView(next: 'front' | 'back') {
  if (view.value === next) return
  view.value = next
  selectedId.value = ''
}

function onViewChange(value: string | number | boolean | undefined) {
  switchView(value === 'back' ? 'back' : 'front')
}

function scrollToTriage() {
  nextTick(() => {
    const triage = triageRef.value
    if (!triage) return
    const container = triage.closest('.pain-content') as HTMLElement | null
    if (!container) return
    const top =
      triage.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      70
    container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  })
}

function toggleFlag(key: (typeof flagOptions)[number]['key']) {
  answers.value[key] = !answers.value[key]
  scrollToTriage()
}

function flagStyle(key: (typeof flagOptions)[number]['key']) {
  if (!answers.value[key]) return undefined
  return {
    background: 'rgba(255, 107, 90, 0.15)',
    borderColor: 'rgba(255, 107, 90, 0.5)',
    color: '#ff9b8c',
  }
}

function resetAnswers() {
  answers.value = { ...DEFAULT_PAIN_ANSWERS }
}

function loadDiary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) diary.value = JSON.parse(raw) as PainDiaryEntry[]
  } catch {
    diary.value = []
  }
}

function persistDiary() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diary.value))
  } catch {
    // 本地存储不可用时静默降级
  }
}

function saveEntry() {
  if (!selectedRegion.value) return
  const entry: PainDiaryEntry = {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`,
    date: new Date().toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    regionId: selectedRegion.value.id,
    regionName: selectedRegion.value.nameZh,
    intensity: answers.value.intensity,
    level: triage.value.level,
    note: note.value.trim(),
  }
  diary.value = [entry, ...diary.value].slice(0, MAX_DIARY)
  note.value = ''
  persistDiary()
  ElMessage.success('已记录到疼痛日记')
}

function removeEntry(id: string) {
  diary.value = diary.value.filter((entry) => entry.id !== id)
  persistDiary()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  loadDiary()
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div class="pain-backdrop" @click.self="emit('close')">
      <div class="pain-modal" role="dialog" aria-modal="true" aria-labelledby="pain-title">
        <header class="pain-header">
          <div>
            <p class="eyebrow">Pain Check · 辅助排查</p>
            <h2 id="pain-title">疼痛排查</h2>
            <p class="subtitle">选择疼痛区域，查看可能相关结构与常见诱因动作；不替代医疗诊断。</p>
          </div>
          <button class="close" aria-label="关闭" @click="emit('close')">×</button>
        </header>

        <div class="pain-content">
          <section class="map-panel">
            <div class="map-head">
              <el-radio-group :model-value="view" size="small" @update:model-value="onViewChange">
                <el-radio-button value="front">正面</el-radio-button>
                <el-radio-button value="back">背面</el-radio-button>
              </el-radio-group>
              <span class="map-hint">点击身体区域</span>
            </div>

            <svg class="body-map" viewBox="0 0 260 560" role="img" aria-label="疼痛区域人体图">
              <g class="silhouette">
                <circle cx="130" cy="40" r="27" />
                <rect x="117" y="63" width="26" height="25" rx="8" />
                <path d="M96 92 Q130 78 164 92 L168 150 Q166 205 130 212 Q94 205 92 150 Z" />
                <path d="M94 100 L64 112 L56 190 L70 196 L84 140 Z" />
                <path d="M166 100 L196 112 L204 190 L190 196 L176 140 Z" />
                <path d="M58 190 L52 262 L76 266 L78 196 Z" />
                <path d="M202 190 L208 262 L184 266 L182 196 Z" />
                <path d="M96 208 Q130 220 164 208 L170 260 L90 260 Z" />
                <path d="M90 260 L86 340 L118 340 L120 260 Z" />
                <path d="M170 260 L174 340 L142 340 L140 260 Z" />
                <path d="M86 340 L90 440 L116 440 L118 340 Z" />
                <path d="M174 340 L170 440 L144 440 L142 340 Z" />
                <path d="M84 440 L88 480 L120 480 L118 440 Z" />
                <path d="M176 440 L172 480 L140 480 L142 440 Z" />
              </g>
              <g class="regions">
                <template v-for="region in viewRegions" :key="region.id">
                  <rect
                    v-for="(shape, index) in region.shapes"
                    :key="`${region.id}-${index}`"
                    class="region-shape"
                    :class="{ selected: selectedId === region.id }"
                    :x="shape.x"
                    :y="shape.y"
                    :width="shape.w"
                    :height="shape.h"
                    :rx="shape.rx ?? 8"
                    :data-region="region.id"
                    @click="selectRegion(region)"
                  >
                    <title>{{ region.nameZh }}</title>
                  </rect>
                </template>
              </g>
            </svg>

            <div class="region-labels">
              <button
                v-for="region in viewRegions"
                :key="region.id"
                class="region-chip"
                :class="{ active: selectedId === region.id }"
                :data-region="region.id"
                @click="selectRegion(region)"
              >
                {{ region.nameZh }}
              </button>
            </div>
          </section>

          <section class="result-panel">
            <template v-if="selectedRegion">
              <div class="triage-status" :style="{ borderColor: `${triageMeta.color}55` }">
                <span class="triage-status-dot" :style="{ background: triageMeta.color }" />
                <strong :style="{ color: triageMeta.color }">{{ triageMeta.label }}</strong>
                <span>{{ triage.titleZh }}</span>
              </div>
              <div class="region-head">
                <h3>{{ selectedRegion.nameZh }}</h3>
                <span>{{ view === 'front' ? '正面' : '背面' }}</span>
              </div>
              <p class="region-advice">{{ selectedRegion.adviceZh }}</p>

              <div class="block">
                <div class="block-head">
                  <h4>可能相关结构</h4>
                  <span>仅供排查参考</span>
                </div>
                <ul class="structure-list">
                  <li v-for="structure in selectedRegion.structures" :key="structure.nameZh">
                    <span class="type">{{ structure.type }}</span>
                    <div>
                      <strong>{{ structure.nameZh }}</strong>
                      <p>{{ structure.noteZh }}</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div class="block">
                <div class="block-head">
                  <h4>相关训练动作</h4>
                  <span>点击查看解剖</span>
                </div>
                <div class="exercise-list">
                  <button
                    v-for="exercise in relatedExercises"
                    :key="exercise.id"
                    class="exercise-item"
                    @click="emit('selectExercise', exercise.id)"
                  >
                    <span>{{ exercise.nameZh }}</span>
                    <em>{{ exercise.equipment }}</em>
                  </button>
                </div>
              </div>

              <div class="block">
                <div class="block-head">
                  <h4>症状问卷</h4>
                  <button class="reset" @click="resetAnswers">重置</button>
                </div>

                <div class="field">
                  <span>疼痛强度 <em>{{ answers.intensity }} / 10</em></span>
                  <el-slider v-model="answers.intensity" :min="0" :max="10" :step="1" />
                </div>

                <div class="select-row">
                  <label class="select-field">
                    <span>出现时机</span>
                    <el-select v-model="answers.onset" size="small">
                      <el-option v-for="item in onsetOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </label>
                  <label class="select-field">
                    <span>持续时间</span>
                    <el-select v-model="answers.duration" size="small">
                      <el-option v-for="item in durationOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </label>
                </div>

                <div class="flags">
                  <el-check-tag
                    v-for="flag in flagOptions"
                    :key="flag.key"
                    class="flag"
                    :checked="answers[flag.key]"
                    :style="flagStyle(flag.key)"
                    @change="toggleFlag(flag.key)"
                  >
                    {{ flag.label }}
                  </el-check-tag>
                </div>
              </div>

              <div ref="triageRef" class="triage" :style="{ borderColor: `${triageMeta.color}55` }">
                <div class="triage-head">
                  <span class="triage-badge" :style="{ color: triageMeta.color }">{{ triageMeta.label }}</span>
                  <h4>{{ triage.titleZh }}</h4>
                </div>
                <ul>
                  <li v-for="reason in triage.reasons" :key="reason">{{ reason }}</li>
                </ul>
                <p>{{ triage.adviceZh }}</p>
                <p class="disclaimer">{{ PAIN_DISCLAIMER }}</p>
              </div>

              <div class="block">
                <div class="block-head">
                  <h4>疼痛日记</h4>
                  <span>仅保存在本机</span>
                </div>
                <div class="diary-form">
                  <el-input v-model="note" size="small" maxlength="60" placeholder="备注：动作、训练量、变化…" />
                  <el-button type="primary" size="small" :disabled="!selectedRegion" @click="saveEntry">
                    记录
                  </el-button>
                </div>
                <ul v-if="diary.length" class="diary-list">
                  <li v-for="entry in diary" :key="entry.id">
                    <div>
                      <strong>{{ entry.regionName }} · {{ entry.intensity }}/10</strong>
                      <span>{{ entry.date }} · {{ entry.note || '无备注' }}</span>
                    </div>
                    <el-button
                      class="remove"
                      link
                      type="danger"
                      size="small"
                      aria-label="删除记录"
                      @click="removeEntry(entry.id)"
                    >
                      删除
                    </el-button>
                  </li>
                </ul>
                <p v-else class="empty-diary">还没有记录。记录疼痛位置与强度，便于观察变化。</p>
              </div>
            </template>

            <div v-else class="empty-state">
              <strong>先选择疼痛区域</strong>
              <p>点击左侧人体图上的区域，查看可能相关结构、常见诱因动作和红旗分诊。</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pain-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 22px;
  background: rgba(4, 6, 9, 0.72);
  backdrop-filter: blur(10px);
}

.pain-modal {
  width: min(1080px, 96vw);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: #0d1118;
  box-shadow: 0 30px 100px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}

.pain-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cyan);
}

.pain-header h2 {
  margin: 0;
  font-size: 22px;
  letter-spacing: 0.02em;
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

.pain-content {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 20px;
  padding: 18px 24px 24px;
  overflow: auto;
}

.map-panel {
  position: sticky;
  top: 0;
  align-self: start;
}

.map-head :deep(.el-radio-group) {
  background: transparent;
}

.map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.view-toggle {
  display: flex;
  padding: 3px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line);
}

.view-toggle button {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.view-toggle button.active {
  background: rgba(56, 217, 232, 0.14);
  color: var(--cyan);
}

.map-hint {
  font-size: 10px;
  color: var(--faint);
}

.body-map {
  width: 100%;
  height: auto;
  max-height: 58vh;
  display: block;
  border-radius: 12px;
  background: radial-gradient(60% 60% at 50% 35%, #121b24 0%, #0a0d12 78%);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.silhouette {
  fill: #172029;
  stroke: rgba(255, 255, 255, 0.12);
  stroke-width: 1.2;
}

.region-shape {
  fill: rgba(255, 255, 255, 0.035);
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1;
  cursor: pointer;
  transition: fill 140ms ease, stroke 140ms ease;
}

.region-shape:hover {
  fill: rgba(56, 217, 232, 0.2);
  stroke: rgba(56, 217, 232, 0.65);
}

.region-shape.selected {
  fill: rgba(255, 107, 90, 0.26);
  stroke: #ff6b5a;
}

.region-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 10px;
}

.region-chip {
  background: transparent;
  font-size: 10px;
  color: var(--faint);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
}

.region-chip:hover {
  color: var(--text);
  border-color: rgba(255, 255, 255, 0.2);
}

.region-chip.active {
  color: #ff8a7a;
  border-color: rgba(255, 107, 90, 0.35);
  background: rgba(255, 107, 90, 0.08);
}

.result-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
}

.triage-status {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  margin-bottom: -4px;
  border: 1px solid;
  border-radius: 8px;
  background: #0d1118;
  font-size: 11px;
  color: var(--muted);
}

.triage-status strong {
  font-size: 10px;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 0 5px;
  line-height: 15px;
}

.triage-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.region-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 12px;
}

.region-head h3 {
  margin: 0;
  font-size: 22px;
}

.region-head span {
  font-size: 10px;
  color: var(--faint);
}

.region-advice {
  margin: -6px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
}

.block {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  letter-spacing: 0.06em;
}

.block-head span {
  font-size: 10px;
  color: var(--faint);
}

.reset {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--faint);
  border-radius: 5px;
  font-size: 10px;
  padding: 2px 7px;
  cursor: pointer;
}

.structure-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.structure-list li {
  transition: border-color 140ms ease, background 140ms ease;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 9px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.structure-list .type {
  flex: none;
  font-size: 9px;
  color: var(--cyan);
  border: 1px solid rgba(56, 217, 232, 0.3);
  border-radius: 4px;
  padding: 1px 4px;
  line-height: 14px;
  margin-top: 1px;
}

.structure-list strong {
  font-size: 12px;
  font-weight: 600;
}

.structure-list p {
  margin: 3px 0 0;
  font-size: 10.5px;
  line-height: 1.55;
  color: var(--muted);
}

.exercise-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.exercise-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.02);
  color: var(--text);
  padding: 7px 9px;
  cursor: pointer;
}

.exercise-item:hover {
  border-color: rgba(56, 217, 232, 0.3);
  background: rgba(56, 217, 232, 0.06);
}

.exercise-item span {
  font-size: 11.5px;
}

.exercise-item em {
  font-style: normal;
  font-size: 9.5px;
  color: var(--faint);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field > span {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted);
}

.field em {
  font-style: normal;
  color: var(--cyan);
}

.field :deep(.el-slider) {
  padding: 0 6px;
}

.select-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.select-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 10.5px;
  color: var(--muted);
}

.select-field :deep(.el-select) {
  width: 100%;
}

.flags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.flags :deep(.el-check-tag.is-checked) {
  background: rgba(255, 107, 90, 0.15);
  border-color: rgba(255, 107, 90, 0.5);
  color: #ff9b8c;
}

.flag {
  font-size: 10.5px;
  border-radius: 999px !important;
}

.triage {
  border: 1px solid;
  border-radius: 10px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.025);
}

.triage-head {
  display: flex;
  align-items: center;
  gap: 9px;
}

.triage-badge {
  font-size: 9.5px;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 1px 6px;
  line-height: 15px;
}

.triage-head h4 {
  margin: 0;
  font-size: 13px;
}

.triage ul {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.triage li {
  position: relative;
  padding-left: 10px;
  font-size: 10.5px;
  color: var(--muted);
}

.triage li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}

.triage > p {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
}

.triage .disclaimer {
  margin-top: 10px;
  font-size: 9.5px;
  color: var(--faint);
}

.diary-form {
  display: flex;
  gap: 6px;
}

.diary-form :deep(.el-input) {
  flex: 1;
  min-width: 0;
}

.diary-list {
  list-style: none;
  margin: 9px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 150px;
  overflow: auto;
}

.diary-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
}

.diary-list strong {
  display: block;
  font-size: 10.5px;
}

.diary-list span {
  font-size: 9.5px;
  color: var(--faint);
}

.remove {
  flex: none;
}

.empty-diary {
  margin: 0;
  font-size: 10px;
  color: var(--faint);
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  padding: 30px;
  border: 1px dashed var(--line);
  border-radius: 12px;
  color: var(--muted);
}

.empty-state strong {
  color: var(--text);
  font-size: 15px;
}

.empty-state p {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
}

@media (max-width: 860px) {
  .pain-backdrop {
    padding: 8px;
  }

  .pain-modal {
    width: 100%;
    max-height: 96vh;
  }

  .pain-header {
    padding: 14px 16px 12px;
  }

  .pain-content {
    grid-template-columns: 1fr;
    padding: 12px 16px 20px;
  }

  .map-panel {
    position: static;
  }

  .body-map {
    max-height: 42vh;
  }

  .exercise-list {
    grid-template-columns: 1fr;
  }
}
</style>
