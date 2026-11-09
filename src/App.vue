<script setup lang="ts">
import { ref } from 'vue'
import {
  Aim,
  Document,
  FirstAidKit,
  Grid,
  InfoFilled,
  RefreshLeft,
  Search,
  TrendCharts,
} from '@element-plus/icons-vue'
import { ElConfigProvider, ElIcon } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import ExerciseSearch from './components/ExerciseSearch.vue'
import AnatomyViewport from './components/AnatomyViewport.vue'
import DetailPanel from './components/DetailPanel.vue'
import AboutLicense from './components/AboutLicense.vue'
import PainCheck from './components/PainCheck.vue'
import HypertrophyPanel from './components/HypertrophyPanel.vue'
import LayerControls from './components/LayerControls.vue'
import LegendBar from './components/LegendBar.vue'
import { EXERCISES } from './data/exercises'
import { useAnatomyStore } from './stores/anatomy'

const showAbout = ref(false)
const showPain = ref(false)
const showHypertrophy = ref(false)
const pickerOpen = ref(false)
const detailOpen = ref(false)
const layersOpen = ref(false)
const viewportRef = ref<InstanceType<typeof AnatomyViewport> | null>(null)
const store = useAnatomyStore()

function openExerciseFromPain(id: string) {
  store.selectExercise(id)
  showPain.value = false
}

function openPain() {
  showHypertrophy.value = false
  showPain.value = true
  closeSheets()
}

function openHypertrophy() {
  showPain.value = false
  showHypertrophy.value = true
  closeSheets()
}

function openExerciseFromHypertrophy(id: string) {
  store.selectExercise(id)
  showHypertrophy.value = false
}

function closeSheets() {
  pickerOpen.value = false
  detailOpen.value = false
  layersOpen.value = false
}

function openPicker() {
  detailOpen.value = false
  layersOpen.value = false
  pickerOpen.value = !pickerOpen.value
}

function openDetails() {
  pickerOpen.value = false
  layersOpen.value = false
  detailOpen.value = !detailOpen.value
}

function openLayers() {
  pickerOpen.value = false
  detailOpen.value = false
  layersOpen.value = !layersOpen.value
}

function resetView() {
  viewportRef.value?.resetView()
}

function onPickExercise() {
  if (pickerOpen.value) {
    pickerOpen.value = false
    detailOpen.value = true
  }
}
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div class="app studio">
      <section class="stage">
        <AnatomyViewport ref="viewportRef" />
      </section>

      <header class="identity">
        <div class="eyebrow"><span class="status-dot" /> Interactive Anatomy</div>
        <h1>肌谱 <span class="edition">3D</span></h1>
        <p class="identity-meta">
          {{ EXERCISES.length }} 个动作 · 41 肌群 · 20 骨组
          <span>·</span>
          Z-Anatomy
        </p>
      </header>

      <nav class="top-actions" aria-label="功能面板">
        <button class="top-action pain" @click="openPain()">
          <el-icon><FirstAidKit /></el-icon>
          <span class="action-label">疼痛排查</span>
        </button>
        <button class="top-action hyper" @click="openHypertrophy()">
          <el-icon><TrendCharts /></el-icon>
          <span class="action-label">增肌面板</span>
        </button>
        <button class="top-action" @click="showAbout = true">
          <el-icon><InfoFilled /></el-icon>
          <span class="action-label">来源与许可</span>
        </button>
      </nav>

      <aside class="panel sidebar" :class="{ open: pickerOpen }">
        <div class="sheet-head mobile-only">
          <span>选择动作</span>
          <span class="sheet-count">{{ store.results.length }}</span>
          <button class="sheet-close" aria-label="关闭" @click="pickerOpen = false">×</button>
        </div>
        <div class="sidebar-body">
          <ExerciseSearch @select="onPickExercise" />
        </div>
        <LegendBar class="sidebar-legend" />
      </aside>

      <aside class="panel details" :class="{ open: detailOpen }">
        <button class="sheet-close detail-close mobile-only" aria-label="关闭详情" @click="detailOpen = false">
          ×
        </button>
        <DetailPanel />
      </aside>

      <div class="bottom-dock">
        <LayerControls />
        <span class="dock-divider" />
        <button
          class="dock-action"
          :class="{ active: store.autoFocus }"
          :aria-pressed="store.autoFocus"
          @click="store.toggleAutoFocus()"
        >
          <el-icon><Aim /></el-icon>
          自动特写
        </button>
        <button class="dock-action" @click="resetView">
          <el-icon><RefreshLeft /></el-icon>
          重置视角
        </button>
      </div>

      <div class="mobile-dock" aria-label="移动端快捷操作">
        <button :class="{ active: pickerOpen }" @click="openPicker()">
          <el-icon><Search /></el-icon>
          <span>动作</span>
        </button>
        <button :class="{ active: layersOpen }" @click="openLayers()">
          <el-icon><Grid /></el-icon>
          <span>图层</span>
        </button>
        <button :class="{ active: detailOpen }" @click="openDetails()">
          <el-icon><Document /></el-icon>
          <span>详情</span>
        </button>
      </div>

      <aside class="panel layers-sheet" :class="{ open: layersOpen }">
        <div class="sheet-head mobile-only">
          <span>图层与视角</span>
          <button class="sheet-close" aria-label="关闭" @click="layersOpen = false">×</button>
        </div>
        <div class="layers-stack">
          <LayerControls />
          <div class="sheet-actions">
            <button
              class="dock-action"
              :class="{ active: store.autoFocus }"
              :aria-pressed="store.autoFocus"
              @click="store.toggleAutoFocus()"
            >
              <el-icon><Aim /></el-icon>
              自动特写
            </button>
            <button class="dock-action" @click="resetView">
              <el-icon><RefreshLeft /></el-icon>
              重置视角
            </button>
          </div>
          <LegendBar />
        </div>
      </aside>

      <div v-if="pickerOpen || detailOpen || layersOpen" class="scrim" @click="closeSheets" />

      <PainCheck v-if="showPain" @close="showPain = false" @select-exercise="openExerciseFromPain" />
      <HypertrophyPanel
        v-if="showHypertrophy"
        @close="showHypertrophy = false"
        @select-exercise="openExerciseFromHypertrophy"
      />
      <AboutLicense v-if="showAbout" @close="showAbout = false" />
    </div>
  </el-config-provider>
</template>

<style scoped>
.app {
  position: relative;
  width: 100%;
  height: 100dvh;
  min-height: 340px;
  overflow: hidden;
  isolation: isolate;
}

.stage {
  position: absolute;
  inset: 0;
}

.stage :deep(.viewport) {
  border: 0;
  border-radius: 0;
  background:
    radial-gradient(1000px 700px at 50% 34%, rgba(30, 45, 56, 0.46) 0%, transparent 62%),
    radial-gradient(900px 600px at 82% 92%, rgba(17, 32, 39, 0.5) 0%, transparent 58%),
    #080b0f;
}

.identity {
  position: absolute;
  left: 28px;
  top: 24px;
  z-index: 60;
  pointer-events: none;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #77838d;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #4fd6a0;
  box-shadow: 0 0 10px rgba(79, 214, 160, 0.5);
}

.identity h1 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 9px 0 6px;
  font-size: 32px;
  font-weight: 650;
  letter-spacing: -0.03em;
  color: var(--text);
}

.edition {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #8aa3ad;
  border: 1px solid rgba(138, 163, 173, 0.3);
  border-radius: 6px;
  padding: 2px 6px;
}

.identity-meta {
  margin: 0;
  font-size: 10.5px;
  letter-spacing: 0.02em;
  color: #77838d;
}

.identity-meta span {
  padding: 0 5px;
  color: #4d5a64;
}

.top-actions {
  position: absolute;
  right: 24px;
  top: 24px;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 7px;
}

.top-action {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 12px;
  border-radius: 11px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(13, 18, 24, 0.78);
  backdrop-filter: blur(18px);
  color: #aeb8c0;
  font-size: 11.5px;
  cursor: pointer;
  transition: color 140ms ease, border-color 140ms ease, background 140ms ease;
}

.top-action:hover {
  color: var(--text);
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(18, 24, 31, 0.9);
}

.top-action :deep(.el-icon) {
  font-size: 14px;
}

.top-action.pain {
  color: #ff9b8c;
  border-color: rgba(255, 107, 90, 0.28);
  background: rgba(255, 107, 90, 0.07);
}

.top-action.hyper {
  color: #7fe3bb;
  border-color: rgba(79, 214, 160, 0.28);
  background: rgba(79, 214, 160, 0.07);
}

.panel {
  position: absolute;
  z-index: 40;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(160deg, rgba(18, 24, 32, 0.9), rgba(9, 13, 18, 0.93));
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.46);
  backdrop-filter: blur(24px) saturate(1.12);
}

.sidebar {
  left: 24px;
  top: 126px;
  bottom: 24px;
  width: 316px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  min-height: 0;
}

.sidebar-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar :deep(.search-panel) {
  height: 100%;
}

.sidebar-legend {
  padding: 0;
  border: 0;
  background: transparent;
  backdrop-filter: none;
  gap: 6px 10px;
  max-width: none;
}

.sidebar-legend :deep(.legend-item) {
  font-size: 9.5px;
}

.details {
  right: 24px;
  top: 126px;
  bottom: 24px;
  width: 384px;
  padding: 18px;
  overflow: hidden;
}

.details :deep(.detail) {
  height: 100%;
  overflow-y: auto;
  padding-right: 2px;
}

.bottom-dock {
  position: absolute;
  left: calc(24px + 316px + 16px);
  right: calc(24px + 384px + 16px);
  bottom: 20px;
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(11, 15, 21, 0.82);
  backdrop-filter: blur(20px);
  box-shadow: 0 16px 46px rgba(0, 0, 0, 0.36);
}

.bottom-dock :deep(.layer-controls) {
  border: 0;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
  padding: 0;
}

.dock-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.09);
  margin: 0 3px;
}

.dock-action {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--muted);
  font-size: 11px;
  padding: 8px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 140ms ease, color 140ms ease;
}

.dock-action:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
}

.dock-action.active {
  color: var(--cyan);
  background: rgba(56, 217, 232, 0.1);
}

.mobile-dock,
.mobile-only,
.scrim {
  display: none;
}

.sheet-head {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.sheet-head > span:first-child {
  flex: 1;
}

.sheet-count {
  font-size: 11px;
  font-weight: 400;
  color: var(--faint);
  font-variant-numeric: tabular-nums;
}

.sheet-close {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
}

.detail-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
}

.layers-sheet {
  left: 24px;
  bottom: 24px;
  width: 360px;
  padding: 16px;
  display: none;
}

.layers-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layers-stack :deep(.layer-controls) {
  border: 0;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
  padding: 0;
}

.sheet-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.layers-stack :deep(.legend) {
  border: 0;
  background: transparent;
  backdrop-filter: none;
  padding: 0;
  max-width: none;
}

@media (max-width: 1320px) and (min-width: 1101px) {
  .sidebar {
    width: 286px;
  }

  .details {
    width: 344px;
  }

  .bottom-dock {
    left: calc(24px + 286px + 16px);
    right: calc(24px + 344px + 16px);
  }

  .action-label {
    display: none;
  }

  .top-action {
    width: 38px;
    padding: 0;
    justify-content: center;
  }
}

@media (max-width: 1100px) {
  .identity {
    left: 18px;
    top: 18px;
    right: 150px;
  }

  .identity h1 {
    font-size: 25px;
    margin: 7px 0 4px;
  }

  .eyebrow {
    font-size: 8.5px;
  }

  .identity-meta {
    font-size: 9.5px;
  }

  .top-actions {
    right: 14px;
    top: 18px;
    gap: 5px;
  }

  .top-action {
    width: 40px;
    height: 40px;
    padding: 0;
    justify-content: center;
    border-radius: 10px;
  }

  .action-label,
  .bottom-dock,
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  .panel {
    position: fixed;
    left: 12px;
    right: 12px;
    width: auto;
    top: auto;
    bottom: calc(76px + env(safe-area-inset-bottom));
    max-height: 70dvh;
    padding: 14px;
    transform: translateY(calc(100% + 96px));
    opacity: 0;
    pointer-events: none;
    transition: transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease;
  }

  .panel.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .sidebar {
    height: min(68dvh, 620px);
    gap: 8px;
  }

  .sidebar :deep(.panel-head) {
    display: none;
  }

  .sidebar-legend {
    display: none;
  }

  .details {
    height: min(70dvh, 660px);
    max-height: 70dvh;
    padding: 16px;
  }

  .details :deep(.detail-head h2) {
    font-size: 22px;
  }

  .details :deep(.detail-head) {
    padding-right: 34px;
  }

  .layers-sheet {
    left: 12px;
    right: 12px;
    width: auto;
    bottom: calc(76px + env(safe-area-inset-bottom));
    max-height: 64dvh;
    overflow-y: auto;
    display: block;
  }

  .layers-stack :deep(.layer-controls) {
    flex-wrap: wrap;
  }

  .mobile-dock {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 6px;
    padding: 5px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(11, 15, 21, 0.9);
    backdrop-filter: blur(20px);
    box-shadow: 0 16px 46px rgba(0, 0, 0, 0.4);
  }

  .mobile-dock button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    border: 0;
    border-radius: 11px;
    background: transparent;
    color: var(--muted);
    font-size: 9.5px;
    padding: 7px 6px;
    cursor: pointer;
  }

  .mobile-dock button :deep(.el-icon) {
    font-size: 18px;
  }

  .mobile-dock button.active {
    color: var(--cyan);
    background: rgba(56, 217, 232, 0.1);
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: 35;
    display: block;
    background: rgba(4, 7, 10, 0.5);
    backdrop-filter: blur(2px);
  }
}
</style>
