<script setup lang="ts">
import { computed } from 'vue'
import { useAnatomyStore } from '../stores/anatomy'
import { CATEGORIES } from '../data/exercises'
import { PALETTE } from '../three/materials'
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
</script>

<template>
  <div class="detail">
    <header class="detail-head">
      <p class="eyebrow">当前动作 · {{ categoryLabel }}</p>
      <h2>{{ store.selectedExercise.nameZh }}</h2>
      <p class="en">{{ store.selectedExercise.nameEn }}</p>
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
          <span
            v-for="muscle in row.muscles"
            :key="muscle.id"
            class="muscle-chip"
            :style="{ borderColor: `${ROLE_COLORS[row.role]}44`, color: ROLE_COLORS[row.role] }"
          >
            {{ muscle.nameZh }}
          </span>
        </div>
      </div>
    </section>

    <section class="block">
      <div class="block-head">
        <h3>关节运动</h3>
        <span>{{ store.jointRows.length }} 处</span>
      </div>
      <ul class="joint-list">
        <li v-for="row in store.jointRows" :key="row.joint.id">
          <span class="joint-dot" />
          <div>
            <strong>{{ row.joint.nameZh }}</strong>
            <span class="motion">{{ row.motion.motionZh }}</span>
          </div>
          <em>{{ row.joint.type === 'pseudo' ? '稳定' : '活动' }}</em>
        </li>
      </ul>
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
  margin: 4px 0 12px;
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.04em;
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
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.joint-dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 10px rgba(56, 217, 232, 0.7);
  animation: pulse 2.4s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.joint-list strong {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
}

.motion {
  font-size: 11px;
  color: var(--muted);
}

.joint-list em {
  margin-left: auto;
  font-style: normal;
  font-size: 10px;
  color: var(--faint);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 1px 5px;
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
