<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Exercise } from '../data/types'
import {
  BODY_SILHOUETTE,
  DISPLAY_GROUPS,
  resolveBodyRoles,
  roleColor,
  type BodyShape,
  type BodyView,
} from '../data/bodyMap'

const props = defineProps<{
  exercise: Exercise
  view: BodyView
}>()

const instance = getCurrentInstance()
const canvasWidth = ref(320)
const canvasHeight = ref(555)

const roles = computed(() => resolveBodyRoles(props.exercise.muscles))

function setupSize() {
  const info = uni.getSystemInfoSync()
  const width = Math.min((info.windowWidth || 375) - 40, 380)
  canvasWidth.value = Math.max(260, width)
  canvasHeight.value = Math.round(canvasWidth.value * (520 / 300))
}

function drawShape(ctx: UniApp.CanvasContext, shape: BodyShape, scale: number) {
  if (shape.type === 'polygon') {
    ctx.beginPath()
    shape.points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x * scale, y * scale)
      else ctx.lineTo(x * scale, y * scale)
    })
    ctx.closePath()
    return
  }
  if (shape.type === 'ellipse') {
    const steps = 28
    ctx.beginPath()
    for (let index = 0; index <= steps; index += 1) {
      const angle = (index / steps) * Math.PI * 2
      const x = (shape.cx + Math.cos(angle) * shape.rx) * scale
      const y = (shape.cy + Math.sin(angle) * shape.ry) * scale
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    return
  }
  ctx.beginPath()
  ctx.rect(shape.x * scale, shape.y * scale, shape.w * scale, shape.h * scale)
}

function draw() {
  const ctx = uni.createCanvasContext('anatomyCanvas', instance?.proxy as any)
  const scale = canvasWidth.value / 300
  const width = canvasWidth.value
  const height = canvasHeight.value

  ctx.setFillStyle('#0d131a')
  ctx.fillRect(0, 0, width, height)

  ctx.setFillStyle('#151d26')
  ctx.setStrokeStyle('rgba(255,255,255,0.12)')
  ctx.setLineWidth(1)
  for (const shape of BODY_SILHOUETTE) {
    drawShape(ctx, shape, scale)
    ctx.fill()
    ctx.stroke()
  }

  for (const group of DISPLAY_GROUPS) {
    const shapes = group[props.view]
    if (!shapes || !shapes.length) continue
    const role = roles.value[group.id]
    ctx.setFillStyle(roleColor(role))
    ctx.setGlobalAlpha(role ? 0.94 : 0.5)
    for (const shape of shapes) {
      drawShape(ctx, shape, scale)
      ctx.fill()
    }
    if (role) {
      ctx.setGlobalAlpha(0.9)
      ctx.setStrokeStyle('rgba(255,255,255,0.28)')
      ctx.setLineWidth(0.8)
      for (const shape of shapes) {
        drawShape(ctx, shape, scale)
        ctx.stroke()
      }
    }
    ctx.setGlobalAlpha(1)
  }

  // 腹直肌分段线
  if (props.view === 'front') {
    ctx.setStrokeStyle('rgba(13,19,26,0.55)')
    ctx.setLineWidth(1)
    for (const y of [168, 184, 200]) {
      ctx.beginPath()
      ctx.moveTo(135 * scale, y * scale)
      ctx.lineTo(165 * scale, y * scale)
      ctx.stroke()
    }
  }

  ctx.draw()
}

function scheduleDraw() {
  nextTick(() => {
    setTimeout(draw, 60)
  })
}

watch(
  () => [props.exercise.id, props.view],
  () => scheduleDraw(),
)

onMounted(() => {
  setupSize()
  scheduleDraw()
  // #ifdef H5
  window.addEventListener('resize', scheduleDraw)
  // #endif
})

onBeforeUnmount(() => {
  // #ifdef H5
  window.removeEventListener('resize', scheduleDraw)
  // #endif
})
</script>

<template>
  <view class="body-canvas-wrap">
    <canvas
      id="anatomyCanvas"
      canvas-id="anatomyCanvas"
      class="body-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
    />
  </view>
</template>

<style scoped lang="scss">
.body-canvas-wrap {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}

.body-canvas {
  display: block;
  border-radius: 18px;
  background: #0d131a;
}
</style>
