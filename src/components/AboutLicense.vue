<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="license-title">
        <header>
          <h2 id="license-title">模型来源与许可</h2>
          <button class="close" aria-label="关闭" @click="emit('close')">×</button>
        </header>

        <p>
          本应用中的肌肉、骨骼与关节 3D 模型来自开源解剖图谱
          <strong>Z-Anatomy</strong>，其数据源自 <strong>BodyParts3D</strong>。模型经合并、减面与压缩后用于网页展示。
        </p>

        <ul>
          <li>
            <strong>Z-Anatomy</strong> — The open source atlas of anatomy，CC BY-SA 4.0。
            <a href="https://www.z-anatomy.com/" target="_blank" rel="noreferrer">官网</a>
            ·
            <a href="https://github.com/LluisV/Z-Anatomy" target="_blank" rel="noreferrer">GitHub</a>
          </li>
          <li>
            <strong>BodyParts3D</strong> — The Database Center for Life Science，CC BY-SA 2.1 Japan。
            <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/" target="_blank" rel="noreferrer">
              数据库
            </a>
          </li>
        </ul>

        <p class="license-note">
          本应用中的衍生 3D 资源（GLB）同样以 CC BY-SA 4.0 许可发布。Web 端当前使用约 140 万面的高模版本，
          小程序使用 52k 面低模。界面结构参考了 Human Atlas（MIT）的全屏解剖浏览布局，但未使用其 3D 数据；
          动作与肌肉映射参考通用运动解剖学资料，仅用于学习与演示，不构成医疗建议。
        </p>

        <footer>
          <button class="primary" @click="emit('close')">知道了</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(4, 6, 9, 0.66);
  backdrop-filter: blur(8px);
}

.modal {
  width: min(560px, 100%);
  border-radius: 16px;
  border: 1px solid var(--line);
  background: #10141b;
  padding: 24px 26px 20px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

h2 {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.02em;
}

.close {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
}

p {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--muted);
}

p strong {
  color: var(--text);
}

ul {
  list-style: none;
  margin: 0 0 14px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

li {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--muted);
  padding: 10px 12px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

li strong {
  color: var(--text);
}

a {
  color: var(--cyan);
  text-decoration: none;
  white-space: nowrap;
}

a:hover {
  text-decoration: underline;
}

.license-note {
  font-size: 12px;
  color: var(--faint);
}

footer {
  display: flex;
  justify-content: flex-end;
}

.primary {
  border: 0;
  border-radius: 8px;
  background: var(--cyan);
  color: #062225;
  font-weight: 600;
  font-size: 13px;
  padding: 9px 18px;
  cursor: pointer;
}
</style>
