<script setup lang="ts">
const items = [
  { label: '主责', color: '#ff5a4e' },
  { label: '协同', color: '#ff9f43' },
  { label: '稳定', color: '#ffd166' },
  { label: '关节', color: '#38d9e8' },
  { label: '骨骼', color: '#d9cbb3' },
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
