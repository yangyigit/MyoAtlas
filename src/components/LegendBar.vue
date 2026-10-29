<script setup lang="ts">
import { PALETTE } from '../three/materials'

const items = [
  { label: '主责', color: PALETTE.primary },
  { label: '协同', color: PALETTE.secondary },
  { label: '稳定', color: PALETTE.stabilizer },
  { label: '关节', color: PALETTE.jointActive },
  { label: '骨骼', color: PALETTE.boneActive },
]
</script>

<template>
  <div class="legend glass">
    <span v-for="item in items" :key="item.label" class="legend-item">
      <i :style="{ background: item.color }" />
      {{ item.label }}
    </span>
  </div>
</template>

<style scoped>
.legend {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--muted);
}

.legend-item i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
</style>
