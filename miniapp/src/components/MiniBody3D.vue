<script setup lang="ts">
import { getCurrentInstance, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  DoubleSide,
  FrontSide,
  Group,
  HemisphereLight,
  MathUtils,
  MeshStandardMaterial,
  PerspectiveCamera,
  PLATFORM,
  Scene,
  Spherical,
  Vector3,
  WebGL1Renderer,
  WebGLRenderer,
  sRGBEncoding,
} from 'three-platformize'
import { GLTFLoader } from 'three-platformize/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three-platformize/examples/jsm/controls/OrbitControls.js'
// #ifdef MP-WEIXIN
import { WechatPlatform } from 'three-platformize/src/WechatPlatform'
// #endif
// #ifdef H5
import { BrowserPlatform } from 'three-platformize/src/BrowserPlatform'
// #endif
import type { Exercise, LayerName, MuscleRole } from '@/data/types'

const props = defineProps<{
  exercise: Exercise
  view: 'front' | 'back'
  layers: Record<LayerName, boolean>
  isolate: boolean
  active: boolean
}>()

type AnyMesh = {
  name: string
  visible: boolean
  material: MeshStandardMaterial
  geometry: { dispose: () => void }
  frustumCulled: boolean
}

interface MeshEntry {
  mesh: AnyMesh
  layer: LayerName
  groupId: string
  material: MeshStandardMaterial
  targetColor: Color
  targetEmissive: Color
  targetEmissiveIntensity: number
  targetOpacity: number
  glow: boolean
}

const MUSCLE_ROLE_COLORS: Record<MuscleRole, number> = {
  primary: 0xc23f33,
  secondary: 0xb2653c,
  stabilizer: 0xb98f4f,
}

const BASE_COLORS: Record<LayerName, number> = {
  muscles: 0x7e3a33,
  bones: 0xd8c8ae,
  joints: 0x3a6b72,
}
const DIM_COLORS: Record<LayerName, number> = {
  muscles: 0x4a2c28,
  bones: 0x6b6353,
  joints: 0x32565c,
}
const ACTIVE_BONE = 0xefdcb8
const ACTIVE_JOINT = 0x59e2ec
const SOFT_TISSUE = 0xd6c5ac

const DEFAULT_TARGET = new Vector3(0, 0.92, 0)
const DEFAULT_PHI = 1.5
const DEFAULT_RADIUS = 2.9
const MIN_RADIUS = 1.7
const MAX_RADIUS = 4.4

const MODEL_PATH =
  typeof wx !== 'undefined' && typeof wx.getFileSystemManager === 'function'
    ? 'static/models/anatomy-mini.glb'
    : `${import.meta.env.BASE_URL || '/'}static/models/anatomy-mini.glb`

const instance = getCurrentInstance()
const loading = ref(true)
const progress = ref(0)
const error = ref('')
const ready = ref(false)
const size = reactive({ width: 320, height: 430 })

let renderer: WebGLRenderer | WebGL1Renderer | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let platform: any = null
let h5Canvas: HTMLCanvasElement | null = null
let h5Host: HTMLElement | null = null
let resizeHandler: (() => void) | null = null
let disposed = false
let loopRunning = false
let lastFrame = 0

const meshes: MeshEntry[] = []
const softMeshes: AnyMesh[] = []
let modelRoot: Group | null = null

interface ViewTween {
  fromTheta: number
  toTheta: number
  fromPhi: number
  toPhi: number
  fromRadius: number
  toRadius: number
  start: number
  duration: number
}

let tween: ViewTween | null = null

function measure() {
  const info = uni.getSystemInfoSync()
  const width = Math.min((info.windowWidth || 375) - 40, 380)
  size.width = Math.max(260, Math.round(width))
  size.height = Math.round(size.width * 1.3)
}

function srgb(hex: number) {
  return new Color(hex).convertSRGBToLinear()
}

function createMuscleMaterial(layer: LayerName) {
  return new MeshStandardMaterial({
    color: srgb(BASE_COLORS[layer]),
    roughness: layer === 'muscles' ? 0.52 : layer === 'joints' ? 0.4 : 0.66,
    metalness: layer === 'joints' ? 0.12 : 0.02,
    emissive: new Color(0x000000),
    emissiveIntensity: 0,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    side: FrontSide,
  })
}

function setupScene(canvas: any) {
  scene = new Scene()
  scene.background = new Color(0x0a0d12)

  camera = new PerspectiveCamera(36, size.width / size.height, 0.05, 30)
  camera.position.set(0, 0.95, DEFAULT_RADIUS)
  camera.lookAt(DEFAULT_TARGET)

  const hemi = new HemisphereLight(0xb8cbe0, 0x2a1e18, 0.55)
  hemi.color.convertSRGBToLinear()
  hemi.groundColor.convertSRGBToLinear()
  scene.add(hemi)

  const key = new DirectionalLight(0xffe7cc, 1.0)
  key.color.convertSRGBToLinear()
  key.position.set(2.6, 3.6, 3.2)
  scene.add(key)

  const rim = new DirectionalLight(0x49d6e5, 0.4)
  rim.color.convertSRGBToLinear()
  rim.position.set(-2.8, 1.8, -2.4)
  scene.add(rim)

  const fill = new DirectionalLight(0x9db8ff, 0.22)
  fill.color.convertSRGBToLinear()
  fill.position.set(0, 0.8, -3)
  scene.add(fill)

  const bounce = new DirectionalLight(0x8e352b, 0.28)
  bounce.color.convertSRGBToLinear()
  bounce.position.set(0, 0.3, 2.4)
  scene.add(bounce)

  const backKey = new DirectionalLight(0xffe3cd, 0.9)
  backKey.color.convertSRGBToLinear()
  backKey.position.set(-1.4, 2.4, -3.1)
  scene.add(backKey)

  const backFill = new DirectionalLight(0xa8c4ff, 0.28)
  backFill.color.convertSRGBToLinear()
  backFill.position.set(2.2, 1.1, -2.2)
  scene.add(backFill)

  controls = new OrbitControls(camera, canvas)
  controls.target.copy(DEFAULT_TARGET)
  controls.enableDamping = true
  controls.dampingFactor = 0.1
  controls.enablePan = false
  controls.rotateSpeed = 0.85
  controls.zoomSpeed = 0.7
  controls.minDistance = MIN_RADIUS
  controls.maxDistance = MAX_RADIUS
  controls.minPolarAngle = MathUtils.degToRad(18)
  controls.maxPolarAngle = MathUtils.degToRad(162)
  controls.addEventListener('start', () => {
    tween = null
  })
  controls.update()
}

function createRenderer(canvas: any) {
  const dpr = Math.min(uni.getSystemInfoSync().pixelRatio || 2, 1.6)
  // #ifdef MP-WEIXIN
  renderer = new WebGL1Renderer({ canvas, antialias: true, alpha: false })
  // #endif
  // #ifdef H5
  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false })
  // #endif
  renderer.setPixelRatio(dpr)
  renderer.setSize(size.width, size.height)
  renderer.setClearColor(0x0a0d12, 1)
  renderer.outputEncoding = sRGBEncoding
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
}

const LAYER_BY_PREFIX: Record<string, LayerName> = {
  muscle: 'muscles',
  bone: 'bones',
  joint: 'joints',
}

function addMeshes(gltfScene: Group) {
  const root = new Group()
  const collected: any[] = []
  gltfScene.traverse((object: any) => {
    if (object.isMesh) collected.push(object)
  })

  for (const object of collected) {
    const rawName = (object.name || '') as string
    const [prefix, groupId = rawName] = rawName.includes('__') ? rawName.split('__') : [rawName, rawName]
    object.frustumCulled = false
    root.add(object)

    if (prefix === 'soft') {
      const material = createMuscleMaterial('muscles')
      material.color.copy(srgb(SOFT_TISSUE))
      material.roughness = 0.55
      material.transparent = true
      material.opacity = 0.94
      material.side = DoubleSide
      object.material = material
      softMeshes.push(object as AnyMesh)
      continue
    }

    const layer = LAYER_BY_PREFIX[prefix]
    if (!layer) {
      root.remove(object)
      continue
    }

    const material = createMuscleMaterial(layer)
    object.material = material
    meshes.push({
      mesh: object as AnyMesh,
      layer,
      groupId,
      material,
      targetColor: srgb(BASE_COLORS[layer]),
      targetEmissive: new Color(0x000000),
      targetEmissiveIntensity: 0,
      targetOpacity: 1,
      glow: false,
    })
  }

  modelRoot = root
  scene?.add(root)
}

function applyState() {
  if (!ready.value) return
  const reveal = props.layers.bones
  const roleMap = new Map<string, MuscleRole>(props.exercise.muscles.map((item) => [item.id, item.role]))
  const boneSet = new Set<string>(props.exercise.bones)
  const jointSet = new Set<string>(props.exercise.joints.map((item) => item.id))

  for (const entry of meshes) {
    const layerOn = props.layers[entry.layer]
    let active = false
    if (entry.layer === 'muscles') active = roleMap.has(entry.groupId)
    else if (entry.layer === 'bones') active = boneSet.has(entry.groupId)
    else active = jointSet.has(entry.groupId)

    entry.mesh.visible = layerOn && (!props.isolate || active)
    entry.glow = false

    if (!active) {
      entry.targetColor.copy(srgb(DIM_COLORS[entry.layer]))
      entry.targetEmissive.setHex(0x000000)
      entry.targetEmissiveIntensity = 0
      entry.targetOpacity =
        entry.layer === 'muscles' ? (reveal ? 0.62 : 0.85) : entry.layer === 'bones' ? 0.42 : 0.32
      continue
    }

    entry.glow = entry.layer === 'muscles'
    if (entry.layer === 'muscles') {
      const role = roleMap.get(entry.groupId) as MuscleRole
      const color = srgb(MUSCLE_ROLE_COLORS[role])
      entry.targetColor.copy(color)
      entry.targetEmissive.copy(color)
      entry.targetEmissiveIntensity = role === 'primary' ? 0.12 : role === 'secondary' ? 0.08 : 0.05
    } else if (entry.layer === 'bones') {
      const color = srgb(ACTIVE_BONE)
      entry.targetColor.copy(color)
      entry.targetEmissive.copy(color)
      entry.targetEmissiveIntensity = 0.1
    } else {
      const color = srgb(ACTIVE_JOINT)
      entry.targetColor.copy(color)
      entry.targetEmissive.copy(color)
      entry.targetEmissiveIntensity = 0.38
    }
    entry.targetOpacity = 1
  }

  for (const mesh of softMeshes) {
    mesh.visible = props.layers.muscles && !props.isolate
  }

  if (modelRoot) modelRoot.visible = true
}

function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function animateTo(view: 'front' | 'back' | 'reset') {
  if (!camera || !controls) return
  const spherical = new Spherical().setFromVector3(camera.position.clone().sub(controls.target))
  const desiredTheta = view === 'back' ? Math.PI : 0
  let delta = desiredTheta - spherical.theta
  delta = ((((delta + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI

  tween = {
    fromTheta: spherical.theta,
    toTheta: spherical.theta + delta,
    fromPhi: spherical.phi,
    toPhi: view === 'reset' ? DEFAULT_PHI : DEFAULT_PHI,
    fromRadius: spherical.radius,
    toRadius: view === 'reset' ? DEFAULT_RADIUS : spherical.radius,
    start: Date.now(),
    duration: 620,
  }
}

function zoomBy(factor: number) {
  if (!camera || !controls) return
  tween = null
  const offset = camera.position.clone().sub(controls.target)
  const distance = MathUtils.clamp(offset.length() * factor, MIN_RADIUS, MAX_RADIUS)
  offset.setLength(distance)
  camera.position.copy(controls.target).add(offset)
  controls.update()
}

function resetView() {
  if (!camera || !controls) return
  controls.target.copy(DEFAULT_TARGET)
  animateTo('reset')
}

function updateTween(now: number) {
  if (!tween || !camera || !controls) return
  const raw = Math.min(1, (now - tween.start) / tween.duration)
  const t = ease(raw)
  const spherical = new Spherical(
    MathUtils.lerp(tween.fromRadius, tween.toRadius, t),
    MathUtils.lerp(tween.fromPhi, tween.toPhi, t),
    MathUtils.lerp(tween.fromTheta, tween.toTheta, t),
  )
  camera.position.copy(controls.target).add(new Vector3().setFromSpherical(spherical))
  if (raw >= 1) tween = null
}

function renderFrame() {
  if (!renderer || !scene || !camera || !controls) return
  const now = Date.now()
  const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.06) : 0.016
  lastFrame = now

  const k = 1 - Math.exp(-dt * 11)
  const breath = 0.012 + 0.012 * Math.sin(now / 1100)
  for (const entry of meshes) {
    const material = entry.material
    material.color.lerp(entry.targetColor, k)
    material.emissive.lerp(entry.targetEmissive, k)
    const targetIntensity = entry.targetEmissiveIntensity + (entry.glow ? breath : 0)
    material.emissiveIntensity += (targetIntensity - material.emissiveIntensity) * k
    material.opacity += (entry.targetOpacity - material.opacity) * k

    const transparent = material.opacity < 0.985
    if (material.transparent !== transparent) {
      material.transparent = transparent
      material.needsUpdate = true
    }
    material.depthWrite = material.opacity > 0.75
  }

  updateTween(now)
  controls.update()
  renderer.render(scene, camera)
}

function startLoop() {
  if (!renderer || loopRunning || disposed || !props.active) return
  loopRunning = true
  lastFrame = 0
  renderer.setAnimationLoop(renderFrame)
}

function stopLoop() {
  if (!renderer) return
  loopRunning = false
  renderer.setAnimationLoop(null)
}

function loadModel() {
  const loader = new GLTFLoader()
  loader.load(
    MODEL_PATH,
    (gltf: any) => {
      if (disposed) return
      addMeshes(gltf.scene)
      ready.value = true
      loading.value = false
      progress.value = 1
      applyState()
      if (props.view === 'back') {
        const spherical = new Spherical(DEFAULT_RADIUS, DEFAULT_PHI, Math.PI)
        if (camera && controls) {
          camera.position.copy(controls.target).add(new Vector3().setFromSpherical(spherical))
          controls.update()
        }
      }
      startLoop()
    },
    (event: any) => {
      if (event && event.total) progress.value = Math.min(0.95, event.loaded / event.total)
      else progress.value = 0.4
    },
    (err: any) => {
      loading.value = false
      error.value = err?.message || '模型加载失败，请重试'
    },
  )
}

// #ifdef H5
function initH5() {
  h5Host = document.getElementById('anatomy3d-host')
  if (!h5Host) {
    error.value = '3D 容器初始化失败'
    return
  }
  h5Canvas = document.createElement('canvas')
  h5Canvas.style.display = 'block'
  h5Canvas.style.width = `${size.width}px`
  h5Canvas.style.height = `${size.height}px`
  h5Canvas.style.borderRadius = '16px'
  h5Host.appendChild(h5Canvas)

  PLATFORM.set(new BrowserPlatform())
  try {
    createRenderer(h5Canvas)
    setupScene(h5Canvas)
  } catch (err) {
    loading.value = false
    error.value = err instanceof Error ? err.message : '当前浏览器不支持 WebGL'
    return
  }
  loadModel()

  resizeHandler = () => {
    measure()
    if (!renderer || !camera) return
    renderer.setSize(size.width, size.height)
    camera.aspect = size.width / size.height
    camera.updateProjectionMatrix()
    if (h5Canvas) {
      h5Canvas.style.width = `${size.width}px`
      h5Canvas.style.height = `${size.height}px`
    }
  }
  window.addEventListener('resize', resizeHandler)
}
// #endif

// #ifdef MP-WEIXIN
function initMp() {
  const query = uni.createSelectorQuery().in(instance?.proxy as any) as any
  query
    .select('#anatomy3d')
    .fields({ node: true, size: true })
    .exec((res: any[]) => {
      const item = res && res[0]
      if (!item || !item.node) {
        error.value = '3D 画布初始化失败'
        loading.value = false
        return
      }
      const canvas = item.node
      try {
        platform = new WechatPlatform(canvas, size.width, size.height)
        PLATFORM.set(platform)
        createRenderer(canvas)
        setupScene(canvas)
      } catch (err) {
        loading.value = false
        error.value = err instanceof Error ? err.message : '3D 画布初始化失败'
        return
      }
      loadModel()
    })
}
// #endif

function onTouchStart(event: any) {
  platform?.dispatchTouchEvent(event)
}

function onTouchMove(event: any) {
  platform?.dispatchTouchEvent(event)
}

function onTouchEnd(event: any) {
  platform?.dispatchTouchEvent(event)
}

watch(
  () => props.exercise.id,
  () => applyState(),
)

watch(
  () => [props.layers.muscles, props.layers.bones, props.layers.joints, props.isolate],
  () => applyState(),
)

watch(
  () => props.view,
  (view) => {
    if (ready.value) animateTo(view)
  },
)

watch(
  () => props.active,
  (active) => {
    if (active) startLoop()
    else stopLoop()
  },
)

onMounted(() => {
  measure()
  // #ifdef MP-WEIXIN
  setTimeout(initMp, 80)
  // #endif
  // #ifdef H5
  setTimeout(initH5, 50)
  // #endif
})

onBeforeUnmount(() => {
  disposed = true
  stopLoop()
  // #ifdef H5
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  // #endif
  controls?.dispose()
  for (const entry of meshes) {
    entry.mesh.geometry.dispose()
    entry.material.dispose()
  }
  for (const mesh of softMeshes) {
    mesh.geometry.dispose()
    mesh.material.dispose()
  }
  renderer?.dispose()
  if (platform) PLATFORM.dispose()
  if (h5Canvas) h5Canvas.remove()
  h5Canvas = null
  h5Host = null
  meshes.length = 0
  softMeshes.length = 0
  modelRoot = null
  scene = null
  controls = null
  camera = null
  renderer = null
})
</script>

<template>
  <view id="anatomy3d-host" class="mini-3d-host" :style="{ height: `${size.height}px` }">
    <!-- #ifdef MP-WEIXIN -->
    <canvas
      id="anatomy3d"
      canvas-id="anatomy3d"
      type="webgl"
      class="mini-3d-canvas"
      :style="{ width: `${size.width}px`, height: `${size.height}px` }"
      disable-scroll
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    />
    <!-- #endif -->

    <view v-if="loading" class="viewer-mask">
      <view class="loader-ring" />
      <text class="mask-text">正在加载 3D 解剖模型</text>
      <text class="mask-sub">{{ progress > 0 ? `${Math.round(progress * 100)}%` : '解析模型' }} · 约 5.2 万面</text>
    </view>

    <view v-else-if="error" class="viewer-mask">
      <text class="mask-text">加载失败</text>
      <text class="mask-sub">{{ error }}</text>
    </view>

    <view v-if="ready" class="viewer-hint">单指旋转 · 双指缩放</view>

    <view v-if="ready" class="viewer-tools">
      <view class="tool" @click="zoomBy(0.82)">+</view>
      <view class="tool" @click="zoomBy(1.22)">−</view>
      <view class="tool tool-reset" @click="resetView">重置</view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.mini-3d-host {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  border-radius: 16px;
  overflow: hidden;
  background: radial-gradient(circle at 50% 38%, #16202a 0%, #0a0d12 68%);
}

.mini-3d-canvas {
  display: block;
  border-radius: 16px;
}

.viewer-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(10, 13, 18, 0.86);
  z-index: 2;
}

.loader-ring {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(56, 217, 232, 0.18);
  border-top-color: #38d9e8;
  animation: viewer-spin 0.9s linear infinite;
}

@keyframes viewer-spin {
  to {
    transform: rotate(360deg);
  }
}

.mask-text {
  font-size: 12px;
  color: #c8c2b6;
  letter-spacing: 0.04em;
}

.mask-sub {
  font-size: 10px;
  color: #6f6a61;
}

.viewer-hint {
  position: absolute;
  left: 10px;
  bottom: 9px;
  font-size: 9px;
  color: rgba(180, 176, 166, 0.75);
  letter-spacing: 0.04em;
  pointer-events: none;
}

.viewer-tools {
  position: absolute;
  right: 9px;
  bottom: 9px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #cfd8de;
  background: rgba(15, 21, 28, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.tool-reset {
  font-size: 9px;
  color: #8fdbe4;
  border-color: rgba(56, 217, 232, 0.3);
}
</style>
