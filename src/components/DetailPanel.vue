<script setup lang="ts">
import { computed } from 'vue'
import { useAnatomyStore } from '../stores/anatomy'
import { CATEGORIES } from '../data/exercises'
import { PALETTE } from '../three/materials'
import { STRESS_COLORS, STRESS_LABELS } from '../data/knowledge'
import { ElTooltip } from 'element-plus'
import type { MuscleRole } from '../data/types'

const store = useAnatomyStore()

const categoryLabel = computed(
  () =>
    CATEGORIES.find((item) => item.id === store.selectedExercise.category)?.label ??
    store.selectedExercise.category,
)

const ROLE_COLORS: Record<MuscleRole, string> = {
  primary: PALETTE.primary,
  secondary: PALETTE.secondary,
  stabilizer: PALETTE.stabilizer,
}

const ROLE_WIDTH: Record<MuscleRole, string> = {
  primary: '100%',
  secondary: '64%',
  stabilizer: '36%',
}

const muscleList = computed(() =>
  store.muscleRows.flatMap((row) =>
    row.muscles.map((muscle) => ({
      ...muscle,
      roleLabel: row.label,
      roleColor: ROLE_COLORS[row.role],
    })),
  ),
)

function chooseSubstitution(exerciseId?: string) {
  if (exerciseId) store.selectExercise(exerciseId)
}
</script>

<template>
  <div class="detail">
    <header class="detail-head">
      <p class="eyebrow">当前动作 · {{ categoryLabel }}</p>
      <h2>{{ store.selectedExercise.nameZh }}</h2>
      <p class="en">{{ store.selectedExercise.nameEn }}</p>
      <p class="summary">{{ store.knowledge.summaryZh }}</p>
      <p class="edu-note">负荷等级为相对要求；内容用于学习与辅助排查，不构成医疗诊断。</p>
      <div class="meta">
        <span>{{ store.selectedExercise.equipment }}</span>
        <span>{{ store.selectedExercise.muscles.length }} 块肌肉</span>
        <span>{{ store.selectedExercise.joints.length }} 个关节</span>
      </div>
    </header>

    <section class="block">
      <div class="block-head">
        <h3>目标肌群</h3>
        <span>主责 / 协同 / 稳定</span>
      </div>
      <div v-for="row in store.muscleRows" :key="row.role" class="role-row">
        <div class="role-line">
          <span class="role-name">
            <i :style="{ background: ROLE_COLORS[row.role] }" />
            {{ row.label }}
            <em>{{ row.muscles.length }}</em>
          </span>
          <span class="role-bar">
            <span :style="{ width: ROLE_WIDTH[row.role], background: ROLE_COLORS[row.role] }" />
          </span>
        </div>
        <div class="muscle-chips">
          <el-tooltip
            v-for="muscle in row.muscles"
            :key="muscle.id"
            placement="top"
            :show-after="200"
            popper-class="muscle-tooltip"
            :content="`${muscle.functionZh}${muscle.commonIssueZh ? ` ｜ ${muscle.commonIssueZh}` : ''}`"
          >
            <span
              class="muscle-chip"
              :style="{ borderColor: `${ROLE_COLORS[row.role]}44`, color: ROLE_COLORS[row.role] }"
            >
              {{ muscle.nameZh }}
            </span>
          </el-tooltip>
        </div>
      </div>

      <details class="fold">
        <summary>肌肉功能与常见问题</summary>
        <ul class="muscle-functions">
          <li v-for="muscle in muscleList" :key="muscle.id">
            <div class="fn-head">
              <i :style="{ background: muscle.roleColor }" />
              <strong>{{ muscle.nameZh }}</strong>
              <em>{{ muscle.roleLabel }}</em>
            </div>
            <p>{{ muscle.functionZh }}</p>
            <p v-if="muscle.commonIssueZh" class="issue">{{ muscle.commonIssueZh }}</p>
          </li>
        </ul>
      </details>
    </section>

    <section class="block">
      <div class="block-head">
        <h3>关节负担</h3>
        <span>相对负荷</span>
      </div>
      <ul class="joint-list">
        <li v-for="row in store.jointRows" :key="row.joint.id">
          <span
            class="stress-dot"
            :style="{ background: STRESS_COLORS[row.stress.level] }"
          />
          <div class="joint-main">
            <div class="joint-title">
              <strong>{{ row.joint.nameZh }}</strong>
              <em
                class="stress-badge"
                :style="{
                  color: STRESS_COLORS[row.stress.level],
                  borderColor: `${STRESS_COLORS[row.stress.level]}66`,
                }"
              >
                {{ STRESS_LABELS[row.stress.level] }}
              </em>
            </div>
            <span class="motion">{{ row.motion.motionZh }} · {{ row.guide.planeZh }}</span>
            <span class="rom">活动范围：{{ row.guide.romZh }}</span>
            <p class="stress-note">{{ row.stress.noteZh }}</p>
          </div>
        </li>
      </ul>
      <p class="load-note">负荷等级表示动作对关节的相对要求，不是受伤概率。</p>
    </section>

    <section class="block">
      <div class="block-head">
        <h3>技术要点</h3>
        <span>{{ store.knowledge.cues.length }} 条</span>
      </div>
      <ul class="tip-list">
        <li v-for="cue in store.knowledge.cues" :key="cue">{{ cue }}</li>
      </ul>
    </section>

    <section class="block">
      <div class="block-head">
        <h3>常见错误</h3>
        <span>{{ store.knowledge.errors.length }} 条</span>
      </div>
      <ul class="tip-list error-list">
        <li v-for="error in store.knowledge.errors" :key="error">{{ error }}</li>
      </ul>
    </section>

    <section class="block">
      <div class="block-head">
        <h3>风险提示</h3>
        <span>预防优先</span>
      </div>
      <ul class="risk-list">
        <li v-for="risk in store.knowledge.risks" :key="risk">{{ risk }}</li>
      </ul>
      <details class="fold red-flags">
        <summary>红旗信号：出现以下情况请停止训练并就医</summary>
        <ul>
          <li v-for="flag in store.redFlags" :key="flag">{{ flag }}</li>
        </ul>
        <p class="disclaimer">
          本工具用于运动解剖学习与辅助排查，不构成医疗诊断或治疗建议。疼痛持续、加重或伴随红旗信号时，请咨询医生或物理治疗师。
        </p>
      </details>
    </section>

    <section class="block">
      <div class="block-head">
        <h3>低风险替代</h3>
        <span>同肌群 / 不同关节压力</span>
      </div>
      <div class="subs">
        <button
          v-for="item in store.substitutions"
          :key="item.label"
          class="sub"
          :class="{ linked: item.exerciseId }"
          :disabled="!item.exerciseId"
          @click="chooseSubstitution(item.exerciseId)"
        >
          <strong>{{ item.label }}</strong>
          <span>{{ item.note }}</span>
        </button>
      </div>
    </section>

    <section class="block">
      <div class="block-head">
        <h3>参与骨骼</h3>
        <span>{{ store.boneRows.length }} 块</span>
      </div>
      <div class="bone-chips">
        <span v-for="bone in store.boneRows" :key="bone.id" class="bone-chip">
          {{ bone.nameZh }}
        </span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 22px;
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}

.detail-head {
  border-bottom: 1px solid var(--line);
  padding-bottom: 18px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--cyan);
}

.detail-head h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 650;
  letter-spacing: 0.02em;
}

.en {
  margin: 4px 0 10px;
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.summary {
  margin: 0 0 12px;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--muted);
}

.edu-note {
  margin: -6px 0 12px;
  font-size: 10px;
  line-height: 1.6;
  color: var(--faint);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta span {
  font-size: 11px;
  color: var(--muted);
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 2px 7px;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.block-head h3 {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--text);
}

.block-head span {
  font-size: 10.5px;
  color: var(--faint);
}

.role-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-line {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 74px;
  font-size: 12px;
  color: var(--text);
}

.role-name i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.role-name em {
  font-style: normal;
  color: var(--faint);
  font-size: 10px;
}

.role-bar {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.role-bar span {
  display: block;
  height: 100%;
  border-radius: 2px;
}

.muscle-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding-left: 13px;
}

.muscle-chip {
  font-size: 11.5px;
  border: 1px solid;
  border-radius: 999px;
  padding: 3px 9px;
  background: rgba(255, 255, 255, 0.02);
}

.fold {
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 9px 11px;
  background: rgba(255, 255, 255, 0.02);
}

.fold summary {
  cursor: pointer;
  font-size: 11.5px;
  color: var(--cyan);
  list-style: none;
}

.fold summary::-webkit-details-marker {
  display: none;
}

.fold summary::before {
  content: '+';
  display: inline-block;
  width: 14px;
  color: var(--faint);
}

.fold[open] summary::before {
  content: '−';
}

.muscle-functions {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.muscle-functions li {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 8px;
}

.fn-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.fn-head i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.fn-head strong {
  font-weight: 600;
}

.fn-head em {
  font-style: normal;
  font-size: 10px;
  color: var(--faint);
}

.muscle-functions p {
  margin: 4px 0 0 12px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
}

.muscle-functions p.issue {
  color: #c58b6f;
}

.joint-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.joint-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 11px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stress-dot {
  width: 8px;
  height: 8px;
  flex: none;
  margin-top: 4px;
  border-radius: 50%;
  box-shadow: 0 0 10px currentColor;
}

.joint-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.joint-title {
  display: flex;
  align-items: center;
  gap: 7px;
}

.joint-title strong {
  font-size: 12.5px;
  font-weight: 600;
}

.stress-badge {
  font-style: normal;
  font-size: 9.5px;
  border: 1px solid;
  border-radius: 4px;
  padding: 0 5px;
  line-height: 15px;
}

.motion {
  font-size: 11px;
  color: var(--muted);
}

.rom {
  font-size: 10.5px;
  color: var(--faint);
}

.stress-note {
  margin: 5px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
}

.load-note {
  margin: 0;
  font-size: 10px;
  color: var(--faint);
}

.tip-list,
.risk-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tip-list li,
.risk-list li {
  position: relative;
  padding-left: 13px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--muted);
}

.tip-list li::before,
.risk-list li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 7px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--cyan);
}

.error-list li::before {
  background: #d9825f;
}

.risk-list li::before {
  background: #ff6b5a;
}

.red-flags {
  margin-top: 2px;
  border-color: rgba(255, 107, 90, 0.28);
}

.red-flags summary {
  color: #ff8a7a;
}

.red-flags ul {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.red-flags li {
  position: relative;
  padding-left: 12px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
}

.red-flags li::before {
  content: '!';
  position: absolute;
  left: 0;
  color: #ff6b5a;
  font-size: 10px;
}

.disclaimer {
  margin: 10px 0 0;
  font-size: 10px;
  line-height: 1.65;
  color: var(--faint);
}

.subs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.025);
  padding: 8px 10px;
  color: var(--text);
  cursor: default;
}

.sub.linked {
  cursor: pointer;
  border-color: rgba(56, 217, 232, 0.25);
}

.sub.linked:hover {
  background: rgba(56, 217, 232, 0.07);
}

.sub strong {
  font-size: 11.5px;
  font-weight: 600;
}

.sub span {
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--faint);
}

.bone-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bone-chip {
  font-size: 11.5px;
  color: var(--bone);
  border: 1px solid rgba(217, 203, 179, 0.22);
  background: rgba(217, 203, 179, 0.05);
  border-radius: 6px;
  padding: 4px 9px;
}
</style>
