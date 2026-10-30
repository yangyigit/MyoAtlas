<script setup lang="ts">
import { ref } from 'vue'
import ExerciseSearch from './components/ExerciseSearch.vue'
import AnatomyViewport from './components/AnatomyViewport.vue'
import DetailPanel from './components/DetailPanel.vue'
import AboutLicense from './components/AboutLicense.vue'
import PainCheck from './components/PainCheck.vue'
import HypertrophyPanel from './components/HypertrophyPanel.vue'
import { useAnatomyStore } from './stores/anatomy'

const showAbout = ref(false)
const showPain = ref(false)
const showHypertrophy = ref(false)
const store = useAnatomyStore()

function openExerciseFromPain(id: string) {
  store.selectExercise(id)
  showPain.value = false
}

function openPain() {
  showHypertrophy.value = false
  showPain.value = true
}

function openHypertrophy() {
  showPain.value = false
  showHypertrophy.value = true
}

function openExerciseFromHypertrophy(id: string) {
  store.selectExercise(id)
  showHypertrophy.value = false
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <span class="mark">肌</span>
        <div class="brand-text">
          <strong>肌动图谱</strong>
          <span>Kinesis Atlas</span>
        </div>
      </div>
      <div class="topbar-meta">
        <span class="tagline">选择动作 · 看见发力</span>
        <span class="source">Z-Anatomy · BodyParts3D</span>
        <button class="pain-button" @click="openPain()">
          <span class="pain-dot" />
          疼痛排查
        </button>
        <button class="hyper-button" @click="openHypertrophy()">
          <span class="hyper-dot" />
          增肌面板
        </button>
        <button class="about-button" @click="showAbout = true">模型来源与许可</button>
      </div>
    </header>

    <main class="layout">
      <aside class="panel sidebar">
        <ExerciseSearch />
      </aside>
      <section class="stage">
        <AnatomyViewport />
      </section>
      <aside class="panel details">
        <DetailPanel />
      </aside>
    </main>

    <PainCheck
      v-if="showPain"
      @close="showPain = false"
      @select-exercise="openExerciseFromPain"
    />
    <HypertrophyPanel
      v-if="showHypertrophy"
      @close="showHypertrophy = false"
      @select-exercise="openExerciseFromHypertrophy"
    />
    <AboutLicense v-if="showAbout" @close="showAbout = false" />
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  display: grid;
  grid-template-rows: 56px minmax(0, 1fr);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(10, 13, 18, 0.72);
  backdrop-filter: blur(12px);
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: linear-gradient(145deg, #2a3a44, #101820);
  border: 1px solid rgba(56, 217, 232, 0.35);
  color: var(--cyan);
  font-size: 14px;
  font-weight: 700;
  box-shadow: inset 0 0 12px rgba(56, 217, 232, 0.12);
}

.brand-text {
  display: flex;
  align-items: baseline;
  gap: 9px;
}

.brand-text strong {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0.08em;
}

.brand-text span {
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--faint);
}

.topbar-meta {
  display: flex;
  align-items: center;
  gap: 14px;
}

.tagline {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.source {
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--faint);
  border-left: 1px solid var(--line);
  padding-left: 14px;
}

.pain-button {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(255, 107, 90, 0.32);
  background: rgba(255, 107, 90, 0.08);
  color: #ff9b8c;
  border-radius: 7px;
  padding: 6px 11px;
  font-size: 11px;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}

.pain-button:hover {
  background: rgba(255, 107, 90, 0.14);
  border-color: rgba(255, 107, 90, 0.5);
}

.pain-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px rgba(255, 107, 90, 0.6);
}

.hyper-button {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(79, 214, 160, 0.32);
  background: rgba(79, 214, 160, 0.08);
  color: #7fe3bb;
  border-radius: 7px;
  padding: 6px 11px;
  font-size: 11px;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}

.hyper-button:hover {
  background: rgba(79, 214, 160, 0.14);
  border-color: rgba(79, 214, 160, 0.5);
}

.hyper-dot {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: currentColor;
  box-shadow: 0 0 8px rgba(79, 214, 160, 0.6);
}

.about-button {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  border-radius: 7px;
  padding: 6px 11px;
  font-size: 11px;
  cursor: pointer;
  transition: color 140ms ease, border-color 140ms ease;
}

.about-button:hover {
  color: var(--text);
  border-color: rgba(255, 255, 255, 0.2);
}

.layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 360px;
  gap: 12px;
  padding: 12px;
  min-height: 0;
}

.panel {
  min-height: 0;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(17, 21, 28, 0.8);
  backdrop-filter: blur(14px);
  padding: 16px;
  overflow: hidden;
}

.stage {
  min-width: 0;
  min-height: 0;
}

@media (max-width: 1180px) {
  .layout {
    grid-template-columns: 280px minmax(0, 1fr) 320px;
  }

  .tagline {
    display: none;
  }
}

@media (max-width: 920px) {
  .app {
    height: auto;
    min-height: 100%;
  }

  .topbar {
    position: sticky;
    top: 0;
  }

  .source {
    display: none;
  }

  .layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto 62vh auto;
    height: auto;
  }

  .sidebar {
    max-height: 46vh;
  }

  .details {
    max-height: none;
  }

  .panel {
    overflow-y: auto;
  }

  .topbar-meta {
    gap: 8px;
  }

  .brand {
    gap: 8px;
  }

  .brand-text span {
    display: none;
  }

  .brand-text strong {
    font-size: 13px;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .mark {
    width: 28px;
    height: 28px;
  }

  .about-button,
  .pain-button,
  .hyper-button {
    padding: 5px 7px;
    font-size: 10.5px;
  }
}
</style>
