<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AnatomyScene, type SceneHover } from '../three/AnatomyScene'
import { useAnatomyStore } from '../stores/anatomy'

const store = useAnatomyStore()
const host = ref<HTMLDivElement | null>(null)
const tooltip = ref<{ nameZh: string; kind: string; x: number; y: number } | null>(null)

let scene: AnatomyScene | null = null

const loading = computed(() => store.status === 'idle' || store.status === 'loading')
const error = computed(() => store.errorMessage)
const progress = computed(() => Math.round(store.progress * 100))
const circumference = 2 * Math.PI * 42

function handleHover(hover: SceneHover | null) {
  if (!hover || !host.value) {
    tooltip.value = null
    return
  }
  const rect = host.value.getBoundingClientRect()
  tooltip.value = {
    nameZh: hover.nameZh,
    kind: hover.kind,
    x: hover.clientX - rect.left + 16,
    y: hover.clientY - rect.top + 16,
  }
}

function syncScene(focus = store.autoFocus) {
  if (!scene) return
  scene.setExercise(store.selectedExercise)
  scene.setLayers({ ...store.layers })
  scene.setIsolate(store.isolateActive)
  if (focus) scene.focus(store.selectedExercise.view)
}

function createScene() {
  if (!host.value) return
  scene?.dispose()
  scene = null
  tooltip.value = null
  store.setStatus('loading')
  store.setProgress(0)
  store.setError(null)
  try {
    scene = new AnatomyScene(host.value, {
      onProgress: (value) => store.setProgress(value),
      onReady: () => {
        store.setStatus('ready')
        syncScene(store.autoFocus)
      },
      onError: (message) => store.setError(message || '模型加载失败'),
      onHover: handleHover,
    })
    void scene.load()
  } catch {
    store.setError('当前浏览器无法初始化 WebGL，请更换浏览器或开启硬件加速。')
  }
}

function resetView() {
  scene?.resetView()
}

defineExpose({ resetView })

onMounted(createScene)
onBeforeUnmount(() => {
  scene?.dispose()
  scene = null
})

watch(
  () => store.selectedExerciseId,
  () => syncScene(store.autoFocus),
)
watch(
  () => store.layers,
  () => scene?.setLayers({ ...store.layers }),
  { deep: true },
)
watch(
  () => store.isolateActive,
  (value) => scene?.setIsolate(value),
)
watch(
  [() => store.sagittalPlane, () => store.coronalPlane],
  () => scene?.setPlanes({ sagittal: store.sagittalPlane, coronal: store.coronalPlane }),
)
watch(
  () => store.autoFocus,
  (value) => {
    if (value) scene?.focus(store.selectedExercise.view)
  },
)
</script>

<template>
  <div class="viewport">
    <div ref="host" class="scene-host" />

    <p class="scene-hint">拖拽旋转 · 滚轮缩放 · 悬停查看名称</p>

    <div
      v-if="tooltip"
      class="tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      <strong>{{ tooltip.nameZh }}</strong>
      <span>{{ tooltip.kind }}</span>
    </div>

    <div v-if="loading" class="status-overlay">
      <div class="loader">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle class="track" cx="50" cy="50" r="42" />
          <circle
            class="value"
            cx="50"
            cy="50"
            r="42"
            :style="{ strokeDashoffset: circumference * (1 - store.progress) }"
          />
        </svg>
        <span>{{ progress }}%</span>
      </div>
      <p>正在装配解剖模型…</p>
    </div>

    <div v-else-if="error" class="status-overlay error">
      <strong>模型加载失败</strong>
      <p>{{ error }}</p>
      <button class="retry" @click="createScene">重试</button>
    </div>
  </div>
</template>

<style scoped>
.viewport {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(120% 90% at 50% 0%, #111a22 0%, #080b0f 68%);
  isolation: isolate;
}

.scene-hint {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  margin: 0;
  font-size: 9.5px;
  letter-spacing: 0.08em;
  color: rgba(119, 131, 141, 0.8);
  pointer-events: none;
  white-space: nowrap;
}

.scene-host {
  position: absolute;
  inset: 0;
}

.scene-host :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.scene-host :deep(.anatomy-labels) {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.tooltip {
  position: absolute;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 9px;
  border-radius: 7px;
  background: rgba(8, 12, 16, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.12);
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.tooltip strong {
  font-size: 12px;
  color: var(--text);
  font-weight: 600;
}

.tooltip span {
  font-size: 10px;
  color: var(--cyan);
  border-left: 1px solid var(--line);
  padding-left: 7px;
}

.status-overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: rgba(8, 11, 15, 0.72);
  backdrop-filter: blur(4px);
}

.status-overlay p {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.loader {
  position: relative;
  width: 92px;
  height: 92px;
  display: grid;
  place-items: center;
}

.loader svg {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
}

.loader circle {
  fill: none;
  stroke-width: 3;
}

.loader .track {
  stroke: rgba(255, 255, 255, 0.06);
}

.loader .value {
  stroke: var(--cyan);
  stroke-linecap: round;
  stroke-dasharray: 264;
  transition: stroke-dashoffset 200ms ease;
  filter: drop-shadow(0 0 6px rgba(56, 217, 232, 0.4));
}

.loader span {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.status-overlay.error strong {
  font-size: 15px;
  color: var(--text);
}

.retry {
  border: 1px solid rgba(56, 217, 232, 0.35);
  background: rgba(56, 217, 232, 0.1);
  color: var(--cyan);
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 12px;
  cursor: pointer;
}

@media (max-width: 1400px) {
  .scene-hint {
    display: none;
  }
}

@media (max-width: 1100px) {
  .scene-host {
    top: 92px;
    bottom: calc(78px + env(safe-area-inset-bottom));
  }
}

@media (max-width: 920px) {
  .scene-hint {
    display: none;
  }
}
</style>
