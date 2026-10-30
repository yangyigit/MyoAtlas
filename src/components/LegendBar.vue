<script setup lang="ts">
import { PALETTE } from '../three/materials'
import { STRESS_COLORS } from '../data/knowledge'

const items = [
  { label: '主责', color: PALETTE.primary },
  { label: '协同', color: PALETTE.secondary },
  { label: '稳定', color: PALETTE.stabilizer },
  { label: '关节低', color: STRESS_COLORS.low },
  { label: '关节中', color: STRESS_COLORS.medium },
  { label: '关节高', color: STRESS_COLORS.high },
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
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  padding: 7px 12px;
  max-width: min(430px, calc(100vw - 28px));
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
