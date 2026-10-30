<script setup lang="ts">
import { useAnatomyStore } from '../stores/anatomy'
import type { LayerName } from '../data/types'

const store = useAnatomyStore()

const items: { id: LayerName; label: string; color: string }[] = [
  { id: 'muscles', label: '肌肉', color: '#ff5a4e' },
  { id: 'bones', label: '骨骼', color: '#d9cbb3' },
  { id: 'joints', label: '关节韧带', color: '#38d9e8' },
]
</script>

<template>
  <div class="layer-controls glass">
    <button
      v-for="item in items"
      :key="item.id"
      class="layer-toggle"
      :class="{ off: !store.layers[item.id] }"
      :aria-pressed="store.layers[item.id]"
      @click="store.toggleLayer(item.id)"
    >
      <i :style="{ background: item.color }" />
      <span>{{ item.label }}</span>
    </button>
    <span class="divider" />
    <button
      class="layer-toggle"
      :class="{ on: store.isolateActive }"
      :aria-pressed="store.isolateActive"
      @click="store.toggleIsolate()"
    >
      <i class="isolate" />
      <span>仅显示参与</span>
    </button>
    <span class="divider" />
    <button
      class="layer-toggle plane-toggle"
      :class="{ on: store.sagittalPlane }"
      :aria-pressed="store.sagittalPlane"
      @click="store.togglePlane('sagittal')"
    >
      <i class="plane-icon sagittal" />
      <span>矢状面</span>
    </button>
    <button
      class="layer-toggle plane-toggle coronal"
      :class="{ on: store.coronalPlane }"
      :aria-pressed="store.coronalPlane"
      @click="store.togglePlane('coronal')"
    >
      <i class="plane-icon coronal" />
      <span>冠状面</span>
    </button>
  </div>
</template>

<style scoped>
.layer-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 5px;
}

.layer-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: 11.5px;
  padding: 6px 9px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 140ms ease, opacity 140ms ease;
}

.layer-toggle:hover {
  background: rgba(255, 255, 255, 0.06);
}

.layer-toggle.off {
  opacity: 0.38;
}

.layer-toggle.off i {
  background: var(--faint) !important;
}

.layer-toggle.on {
  background: rgba(56, 217, 232, 0.1);
  color: var(--cyan);
}

.layer-toggle span {
  white-space: nowrap;
}

.layer-toggle i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}

.layer-toggle i.isolate {
  background: transparent;
  border: 1px solid currentColor;
  box-sizing: border-box;
}

.plane-toggle.on {
  background: rgba(56, 217, 232, 0.1);
  color: var(--cyan);
}

.plane-toggle.coronal.on {
  background: rgba(242, 184, 75, 0.1);
  color: #f2c66d;
}

.plane-icon {
  width: 7px;
  height: 7px;
  border: 1px solid currentColor;
  border-radius: 1px;
  flex: none;
  position: relative;
}

.plane-icon.sagittal::after {
  content: '';
  position: absolute;
  left: 2px;
  top: -2px;
  bottom: -2px;
  width: 1px;
  background: currentColor;
}

.plane-icon.coronal::after {
  content: '';
  position: absolute;
  top: 2px;
  left: -2px;
  right: -2px;
  height: 1px;
  background: currentColor;
}

.divider {
  width: 1px;
  height: 16px;
  background: var(--line);
  margin: 0 3px;
}
</style>
