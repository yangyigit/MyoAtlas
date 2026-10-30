<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElInput } from 'element-plus'
import { useAnatomyStore } from '../stores/anatomy'
import { CATEGORIES } from '../data/exercises'
import type { ExerciseCategory } from '../data/types'

const store = useAnatomyStore()
const activeIndex = ref(0)

const results = computed(() => store.results)
const recommended = ['卧推', '深蹲', '引体向上', '平板支撑']

const categoryLabel = (category: ExerciseCategory) =>
  CATEGORIES.find((item) => item.id === category)?.label ?? category

watch(results, () => {
  activeIndex.value = 0
})

function pick(id: string) {
  store.selectExercise(id)
}

function onKeydown(event: KeyboardEvent | Event) {
  if (!(event instanceof KeyboardEvent)) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (event.key === 'Enter') {
    const exercise = results.value[activeIndex.value]
    if (exercise) pick(exercise.id)
  } else if (event.key === 'Escape') {
    store.setQuery('')
  }
}

</script>

<template>
  <div class="search-panel">
    <div class="panel-head">
      <h2>选择动作</h2>
      <span class="count">{{ results.length }}</span>
    </div>

    <el-input
      class="search-input"
      :model-value="store.query"
      size="large"
      placeholder="输入动作，如：卧推 / 深蹲 / 划船"
      clearable
      :prefix-icon="Search"
      @update:model-value="store.setQuery"
      @keydown="onKeydown"
    />

    <div class="chips" role="tablist" aria-label="动作分类">
      <button
        v-for="category in CATEGORIES"
        :key="category.id"
        class="chip"
        :class="{ active: store.category === category.id }"
        role="tab"
        :aria-selected="store.category === category.id"
        @click="store.setCategory(category.id)"
      >
        {{ category.label }}
      </button>
    </div>

    <div v-if="results.length" class="exercise-list">
      <button
        v-for="(exercise, index) in results"
        :key="exercise.id"
        class="exercise-item"
        :class="{
          selected: store.selectedExerciseId === exercise.id,
          focused: index === activeIndex,
        }"
        @click="pick(exercise.id)"
        @mouseenter="activeIndex = index"
      >
        <span class="item-main">
          <strong>{{ exercise.nameZh }}</strong>
          <span class="item-en">{{ exercise.nameEn }}</span>
        </span>
        <span class="item-meta">
          <span class="tag">{{ categoryLabel(exercise.category) }}</span>
          <span class="equipment">{{ exercise.equipment }}</span>
        </span>
      </button>
    </div>

    <div v-else class="empty-state">
      <p>没有找到「{{ store.query }}」</p>
      <span>试试这些动作：</span>
      <div class="chips">
        <button v-for="name in recommended" :key="name" class="chip" @click="store.setQuery(name)">
          {{ name }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.panel-head h2 {
  margin: 0;
  font-size: 15px;
  letter-spacing: 0.04em;
  color: var(--text);
}

.count {
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  background: rgba(7, 10, 14, 0.7);
  box-shadow: 0 0 0 1px var(--line) inset;
  padding: 0 12px;
}

.search-input :deep(.el-input__inner) {
  font-size: 13px;
  height: 42px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 42px;
  border-radius: 10px;
  background: rgba(7, 10, 14, 0.7);
  border: 1px solid var(--line);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.search-field:focus-within {
  border-color: rgba(56, 217, 232, 0.5);
  box-shadow: 0 0 0 3px rgba(56, 217, 232, 0.08);
}

.search-field svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--muted);
  stroke-width: 1.8;
  stroke-linecap: round;
  flex: none;
}

.search-field input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: 13px;
  outline: none;
}

.search-field input::placeholder {
  color: var(--faint);
}

.search-field input::-webkit-search-cancel-button {
  display: none;
}

.clear {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 4px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.chip {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 12px;
  cursor: pointer;
  transition: all 160ms ease;
}

.chip:hover {
  color: var(--text);
  border-color: rgba(255, 255, 255, 0.18);
}

.chip.active {
  color: #062225;
  background: var(--cyan);
  border-color: transparent;
  font-weight: 600;
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  min-height: 0;
  padding-right: 4px;
  margin-right: -4px;
}

.exercise-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  padding: 9px 10px;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}

.exercise-item:hover,
.exercise-item.focused {
  background: rgba(255, 255, 255, 0.035);
}

.exercise-item.selected {
  background: rgba(56, 217, 232, 0.07);
  border-color: rgba(56, 217, 232, 0.28);
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-main strong {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.item-en {
  font-size: 11px;
  color: var(--faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex: none;
}

.tag {
  font-size: 10px;
  color: var(--cyan);
  border: 1px solid rgba(56, 217, 232, 0.3);
  border-radius: 4px;
  padding: 0 5px;
  line-height: 16px;
}

.equipment {
  font-size: 10px;
  color: var(--faint);
  max-width: 92px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 16px;
  color: var(--muted);
  font-size: 12px;
}

.empty-state p {
  margin: 0 0 8px;
  color: var(--text);
  font-size: 13px;
}

.empty-state span {
  display: block;
  margin-bottom: 8px;
}
</style>
