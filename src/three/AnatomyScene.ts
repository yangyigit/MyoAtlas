import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { BONE_BY_ID } from '../data/bones'
import { JOINT_BY_ID } from '../data/joints'
import { EXERCISE_KNOWLEDGE } from '../data/knowledge'
import { MUSCLE_BY_ID } from '../data/muscles'
import type { Exercise, ExerciseView, LayerName, MuscleRole } from '../data/types'
import { JointGizmo } from './JointGizmo'
import {
  createAnatomyMaterial,
  createConnectiveMaterial,
  disposeMaterial,
  setActiveBone,
  setActiveJoint,
  setBase,
  setDim,
  setFocused,
  setMuted,
  setRole,
  updateAnatomyMaterial,
  type AnatomyMaterial,
} from './materials'

export interface SceneHover {
  nameZh: string
  kind: '肌肉' | '骨骼' | '关节'
  clientX: number
  clientY: number
}

export interface SceneCallbacks {
  onProgress?: (progress: number) => void
  onReady?: () => void
  onError?: (message: string) => void
  onHover?: (hover: SceneHover | null) => void
  /** 点击引导线卡片选中某块肌肉 */
  onMuscleSelect?: (muscleId: string, nameZh: string) => void
}

interface MeshEntry {
  mesh: THREE.Mesh
  state: AnatomyMaterial
  layer: LayerName
  groupId: string
  nameZh: string
  kind: SceneHover['kind']
}

interface CameraAnimation {
  fromPosition: THREE.Vector3
  toPosition: THREE.Vector3
  fromTarget: THREE.Vector3
  toTarget: THREE.Vector3
  fromFov: number
  toFov: number
  start: number
  duration: number
}

interface GuideItem {
  mesh: THREE.Mesh
  anchor: THREE.Vector3
  el: HTMLButtonElement
  path: SVGPathElement
  dot: SVGCircleElement
  width: number
  height: number
  x: number
  y: number
  side: -1 | 1
  onScreen: boolean
  occluded: boolean
  hot: boolean
  behind: boolean
  active: boolean
  pathD: string
}

const SVG_NS = 'http://www.w3.org/2000/svg'

const ROLE_LABEL: Record<MuscleRole, string> = {
  primary: '主责',
  secondary: '协同',
  stabilizer: '稳定',
}

const DEFAULT_VIEW: ExerciseView = {
  camera: [1.15, 1.05, 2.75],
  target: [0, 0.92, 0],
  fov: 35,
}

const KIND: Record<LayerName, SceneHover['kind']> = {
  muscles: '肌肉',
  bones: '骨骼',
  joints: '关节',
}

export class AnatomyScene {
  private readonly container: HTMLElement
  private readonly callbacks: SceneCallbacks
  private readonly renderer: THREE.WebGLRenderer
  private readonly labelRenderer: CSS2DRenderer
  private readonly guideLayer: HTMLDivElement
  private readonly guideSvg: SVGSVGElement
  private guideItems: GuideItem[] = []
  private guideEnabled = false
  private focusedMuscleId: string | null = null
  private focusedMesh: THREE.Mesh | null = null
  private guideBounds = { left: 0, right: 0 }
  private readonly sampleCache = new Map<THREE.Mesh, THREE.Vector3[]>()
  private guideInsets = { left: 0, right: 0, top: 78, bottom: 36 }
  private guidesDirty = true
  private lastAnchorUpdate = 0
  private lastGuideMeasure = 0
  private readonly lastGuideCameraPos = new THREE.Vector3()
  private readonly lastGuideCameraQuat = new THREE.Quaternion()
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly controls: OrbitControls
  private readonly planeLabels: Record<'sagittal' | 'coronal', CSS2DObject | null> = {
    sagittal: null,
    coronal: null,
  }
  private readonly planeGroups: Record<'sagittal' | 'coronal', THREE.Group> = {
    sagittal: new THREE.Group(),
    coronal: new THREE.Group(),
  }
  private readonly layerRoots: Record<LayerName, THREE.Group> = {
    muscles: new THREE.Group(),
    bones: new THREE.Group(),
    joints: new THREE.Group(),
  }
  private readonly meshEntries: MeshEntry[] = []
  private readonly pickables: THREE.Mesh[] = []
  private readonly softMeshes: THREE.Mesh[] = []
  private softMaterial: THREE.MeshPhysicalMaterial | null = null
  private readonly gizmos: JointGizmo[] = []
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly resizeObserver: ResizeObserver
  private readonly reduceMotionQuery: MediaQueryList

  private exercise: Exercise | null = null
  private layers: Record<LayerName, boolean> = { muscles: true, bones: true, joints: true }
  private isolate = false
  private cameraAnimation: CameraAnimation | null = null
  private viewScale = 1
  private hoveredMesh: THREE.Mesh | null = null
  private lastHoverCheck = 0
  private frameId = 0
  private lastFrame = performance.now()
  private disposed = false
  private reducedMotion = false
  private hasLoaded = false

  constructor(container: HTMLElement, callbacks: SceneCallbacks = {}) {
    this.container = container
    this.callbacks = callbacks
    this.reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedMotion = this.reduceMotionQuery.matches

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x0a0d12, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.domElement.className = 'anatomy-canvas'
    container.appendChild(this.renderer.domElement)

    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.domElement.className = 'anatomy-labels'
    container.appendChild(this.labelRenderer.domElement)

    this.guideLayer = document.createElement('div')
    this.guideLayer.className = 'guide-overlay'
    this.guideLayer.style.display = 'none'
    this.guideSvg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement
    this.guideSvg.setAttribute('class', 'guide-lines')
    this.guideSvg.setAttribute('preserveAspectRatio', 'none')
    this.guideLayer.appendChild(this.guideSvg)
    container.appendChild(this.guideLayer)

    this.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 30)
    this.camera.position.set(...DEFAULT_VIEW.camera)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(...DEFAULT_VIEW.target)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.enablePan = false
    this.controls.minDistance = 0.6
    this.controls.maxDistance = 4.5
    this.controls.minPolarAngle = THREE.MathUtils.degToRad(10)
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(170)
    this.controls.update()

    this.setupScene()
    this.resize()

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)

    this.renderer.domElement.addEventListener('pointermove', this.handlePointerMove)
    this.renderer.domElement.addEventListener('pointerleave', this.handlePointerLeave)
    this.controls.addEventListener('start', this.cancelCameraAnimation)
    this.reduceMotionQuery.addEventListener('change', this.handleMotionPreference)

    this.tick()
  }

  private setupScene() {
    this.scene.background = new THREE.Color(0x0a0d12)
    this.scene.fog = new THREE.Fog(0x0a0d12, 5.5, 11)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.35
    pmrem.dispose()

    const hemisphere = new THREE.HemisphereLight(0xb8cbe0, 0x2a1e18, 0.6)
    this.scene.add(hemisphere)

    const key = new THREE.DirectionalLight(0xffe7cc, 2.0)
    key.position.set(2.6, 3.6, 3.2)
    this.scene.add(key)

    const rim = new THREE.DirectionalLight(0x49d6e5, 0.7)
    rim.position.set(-2.8, 1.6, -2.4)
    this.scene.add(rim)

    const fill = new THREE.DirectionalLight(0x9db8ff, 0.3)
    fill.position.set(0, 0.6, -3)
    this.scene.add(fill)

    const bounce = new THREE.DirectionalLight(0x8e352b, 0.55)
    bounce.position.set(0, 0.35, 2.4)
    this.scene.add(bounce)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 72),
      new THREE.MeshStandardMaterial({ color: 0x10141a, roughness: 1, metalness: 0 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.002
    this.scene.add(ground)

    const glow = new THREE.Mesh(
      new THREE.RingGeometry(0.36, 0.98, 72),
      new THREE.MeshBasicMaterial({
        color: 0x1d3038,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    glow.rotation.x = -Math.PI / 2
    glow.position.y = 0.001
    this.scene.add(glow)

    this.scene.add(this.layerRoots.muscles, this.layerRoots.bones, this.layerRoots.joints)

    this.planeGroups.sagittal = this.createPlane('sagittal')
    this.planeGroups.coronal = this.createPlane('coronal')
    this.scene.add(this.planeGroups.sagittal, this.planeGroups.coronal)
  }

  private createPlane(kind: 'sagittal' | 'coronal') {
    const group = new THREE.Group()
    group.name = `plane-${kind}`
    group.visible = false
    const color = kind === 'sagittal' ? 0x38d9e8 : 0xf2b84b
    const gridColor = kind === 'sagittal' ? 0x1f3a40 : 0x3a3122

    const grid = new THREE.GridHelper(2.2, 22, color, gridColor)
    grid.position.y = 0.9
    if (kind === 'sagittal') grid.rotation.z = Math.PI / 2
    else grid.rotation.x = Math.PI / 2
    const gridMaterial = grid.material as THREE.LineBasicMaterial
    gridMaterial.transparent = true
    gridMaterial.opacity = 0.42
    gridMaterial.depthTest = false
    gridMaterial.depthWrite = false
    grid.renderOrder = 2
    group.add(grid)

    const fillGeometry = new THREE.PlaneGeometry(2.2, 2.2)
    const fillMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.025,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    })
    const fill = new THREE.Mesh(fillGeometry, fillMaterial)
    fill.position.y = 0.9
    if (kind === 'sagittal') fill.rotation.y = Math.PI / 2
    fill.renderOrder = 1
    group.add(fill)

    const labelEl = document.createElement('div')
    labelEl.className = `plane-label ${kind}`
    labelEl.textContent = kind === 'sagittal' ? '矢状面' : '冠状面'
    const label = new CSS2DObject(labelEl)
    label.position.set(kind === 'sagittal' ? 0 : 0.2, 1.05, kind === 'sagittal' ? 0.2 : 0)
    label.element.style.display = 'none'
    label.element.style.visibility = 'hidden'
    this.planeLabels[kind] = label
    group.add(label)

    return group
  }

  setPlanes(planes: { sagittal: boolean; coronal: boolean }) {
    for (const kind of ['sagittal', 'coronal'] as const) {
      const visible = planes[kind]
      this.planeGroups[kind].visible = visible
      const label = this.planeLabels[kind]
      if (label) {
        label.visible = visible
        label.element.style.display = visible ? '' : 'none'
        label.element.style.visibility = visible ? 'visible' : 'hidden'
      }
    }
  }

  async load(baseUrl = '/models') {
    if (this.hasLoaded) return
    this.callbacks.onProgress?.(0.02)
    const draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(draco)

    const files = ['muscles', 'bones', 'joints', 'soft-tissue'] as const
    let loadedCount = 0

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const gltf = await loader.loadAsync(`${baseUrl}/${file}.glb`)
          loadedCount += 1
          this.callbacks.onProgress?.(0.05 + (loadedCount / files.length) * 0.95)
          return { file, scene: gltf.scene }
        }),
      )
      for (const { file, scene } of results) {
        if (file === 'soft-tissue') this.addSoftTissue(scene)
        else this.addLayer(file, scene)
      }
      this.hasLoaded = true
      this.callbacks.onProgress?.(1)
      this.callbacks.onReady?.()
      draco.dispose()
    } catch (error) {
      draco.dispose()
      const message = error instanceof Error ? error.message : String(error)
      this.callbacks.onError?.(message)
    }
  }

  private addLayer(layer: LayerName, gltfScene: THREE.Group) {
    const lookup: Record<string, { nameZh: string }> =
      layer === 'muscles' ? MUSCLE_BY_ID : layer === 'bones' ? BONE_BY_ID : JOINT_BY_ID

    const meshes: THREE.Mesh[] = []
    gltfScene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh)
    })

    for (const mesh of meshes) {
      const rawName = mesh.name || ''
      const groupId = rawName.includes('__') ? rawName.split('__')[1] : rawName
      const meta = lookup[groupId]
      if (!meta) continue
      const state = createAnatomyMaterial(layer)
      mesh.material = state.material
      mesh.userData = { layer, groupId, nameZh: meta.nameZh }
      mesh.frustumCulled = false

      this.meshEntries.push({
        mesh,
        state,
        layer,
        groupId,
        nameZh: meta.nameZh,
        kind: KIND[layer],
      })
      this.pickables.push(mesh)
    }

    this.layerRoots[layer].add(gltfScene)
    this.layerRoots[layer].visible = this.layers[layer]
  }

  private addSoftTissue(gltfScene: THREE.Group) {
    const material = createConnectiveMaterial()
    this.softMaterial = material
    const meshes: THREE.Mesh[] = []
    gltfScene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh)
    })
    for (const mesh of meshes) {
      mesh.material = material
      mesh.frustumCulled = false
      mesh.userData = { layer: 'muscles', groupId: 'soft-tissue', nameZh: '腱膜 / 筋膜' }
      this.softMeshes.push(mesh)
    }
    this.layerRoots.muscles.add(gltfScene)
  }

  setExercise(exercise: Exercise | null) {
    this.exercise = exercise
    this.clearGizmos()
    if (exercise) {
      for (const motion of exercise.joints) {
        const joint = JOINT_BY_ID[motion.id]
        if (!joint) continue
        const stress = EXERCISE_KNOWLEDGE[exercise.id]?.jointStress[motion.id]?.level ?? 'low'
        const gizmo = new JointGizmo(motion, joint, stress)
        gizmo.setVisible(this.layers.joints)
        this.gizmos.push(gizmo)
        this.scene.add(gizmo.root)
      }
    }
    this.applyState()
  }

  private applyState() {
    this.refreshMaterials()
    if (this.guideEnabled) this.rebuildGuides()
  }

  private refreshMaterials() {
    const reveal = this.layers.bones || this.layers.joints
    const exercise = this.exercise

    if (!exercise) {
      for (const entry of this.meshEntries) {
        setBase(entry.state, entry.layer, reveal)
        entry.mesh.visible = true
      }
      for (const mesh of this.softMeshes) mesh.visible = !this.isolate
      return
    }

    const roleMap = new Map<string, MuscleRole>(exercise.muscles.map((m) => [m.id, m.role]))
    const boneSet = new Set<string>(exercise.bones)
    const jointSet = new Set<string>(exercise.joints.map((j) => j.id))
    const focused = this.focusedMuscleId

    for (const entry of this.meshEntries) {
      let active = false
      if (entry.layer === 'muscles') {
        const role = roleMap.get(entry.groupId)
        active = Boolean(role)
        if (role) setRole(entry.state, role)
        else setDim(entry.state, 'muscles', reveal)
        if (focused && active) {
          if (entry.groupId === focused) setFocused(entry.state)
          else setMuted(entry.state)
        }
      } else if (entry.layer === 'bones') {
        active = boneSet.has(entry.groupId)
        if (active) setActiveBone(entry.state)
        else setDim(entry.state, 'bones', reveal)
      } else {
        active = jointSet.has(entry.groupId)
        if (active) setActiveJoint(entry.state)
        else setDim(entry.state, 'joints', reveal)
      }
      entry.mesh.visible = !this.isolate || active
    }
    for (const mesh of this.softMeshes) mesh.visible = !this.isolate
  }

  /** 聚焦某块肌肉（传 null 取消） */
  setFocusedMuscle(muscleId: string | null) {
    if (muscleId === this.focusedMuscleId) return
    this.focusedMuscleId = muscleId
    this.focusedMesh =
      this.meshEntries.find((entry) => entry.layer === 'muscles' && entry.groupId === muscleId)
        ?.mesh ?? null
    this.refreshMaterials()
  }

  setLayers(layers: Record<LayerName, boolean>) {
    this.layers = { ...layers }
    for (const layer of Object.keys(this.layerRoots) as LayerName[]) {
      this.layerRoots[layer].visible = layers[layer]
    }
    for (const gizmo of this.gizmos) gizmo.setVisible(layers.joints)
    this.applyState()
  }

  setIsolate(value: boolean) {
    this.isolate = value
    this.applyState()
  }

  setGuideLines(value: boolean) {
    if (this.guideEnabled === value) return
    this.guideEnabled = value
    this.guideLayer.style.display = value ? '' : 'none'
    if (value) {
      this.rebuildGuides()
      this.guidesDirty = true
    } else {
      this.clearGuides()
    }
  }

  private clearGuides() {
    for (const item of this.guideItems) {
      item.el.remove()
      item.path.remove()
      item.dot.remove()
    }
    this.guideItems = []
  }

  private rebuildGuides() {
    this.clearGuides()
    const exercise = this.exercise
    if (!this.guideEnabled || !exercise || !this.layers.muscles) return

    const roleMap = new Map<string, MuscleRole>(exercise.muscles.map((m) => [m.id, m.role]))
    const entries = this.meshEntries.filter(
      (entry) => entry.layer === 'muscles' && roleMap.has(entry.groupId),
    )
    const height = this.container.clientHeight || 600
    this.scene.updateMatrixWorld()

    for (const entry of entries) {
      const role = roleMap.get(entry.groupId) as MuscleRole

      const el = document.createElement('button')
      el.type = 'button'
      el.className = `guide-label ${role}`
      el.setAttribute('aria-pressed', 'false')
      el.title = `点击聚焦：${entry.nameZh}`
      el.style.opacity = '0'
      const name = document.createElement('span')
      name.textContent = entry.nameZh
      const badge = document.createElement('b')
      badge.textContent = ROLE_LABEL[role]
      el.append(name, badge)
      el.addEventListener('click', () => {
        this.callbacks.onMuscleSelect?.(entry.groupId, entry.nameZh)
      })
      this.guideLayer.appendChild(el)

      const path = document.createElementNS(SVG_NS, 'path') as SVGPathElement
      path.setAttribute('class', `guide-line ${role}`)
      const dot = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement
      dot.setAttribute('class', `guide-dot ${role}`)
      dot.setAttribute('r', '2.6')
      this.guideSvg.appendChild(path)
      this.guideSvg.appendChild(dot)

      this.guideItems.push({
        mesh: entry.mesh,
        anchor: new THREE.Vector3(),
        el,
        path,
        dot,
        width: el.offsetWidth,
        height: el.offsetHeight,
        x: 0,
        y: height / 2,
        side: -1,
        onScreen: false,
        occluded: false,
        hot: false,
        behind: false,
        active: false,
        pathD: '',
      })
    }

    this.guideSvg.setAttribute('width', String(this.container.clientWidth || 1))
    this.guideSvg.setAttribute('height', String(height))
    const half = (this.container.clientWidth || 1) / 2
    this.guideBounds = { left: half - 60, right: half + 60 }
    this.guidesDirty = true
  }

  /** 每块肌肉的世界坐标顶点采样：用于挑选面向相机的锚点与估算屏幕轮廓 */
  private samplesFor(mesh: THREE.Mesh) {
    const cached = this.sampleCache.get(mesh)
    if (cached) return cached
    const position = mesh.geometry.attributes.position as THREE.BufferAttribute | undefined
    const list: THREE.Vector3[] = []
    if (position) {
      const step = Math.max(1, Math.floor(position.count / 200))
      const point = new THREE.Vector3()
      mesh.updateWorldMatrix(true, false)
      for (let i = 0; i < position.count; i += step) {
        point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld)
        list.push(point.clone())
      }
    }
    this.sampleCache.set(mesh, list)
    return list
  }

  private updateGuideAnchors() {
    const width = this.container.clientWidth || 1
    const height = this.container.clientHeight || 1
    const cameraPos = this.camera.position
    const probe = new THREE.Vector3()
    const screenX: number[] = []
    const cloud: { mesh: THREE.Mesh; x: number; y: number; distance: number }[] = []

    for (const entry of this.meshEntries) {
      if (entry.layer !== 'muscles' || !entry.mesh.visible || !this.isMeshVisible(entry.mesh)) continue
      for (const sample of this.samplesFor(entry.mesh)) {
        probe.copy(sample).project(this.camera)
        if (probe.z > 1) continue
        cloud.push({
          mesh: entry.mesh,
          x: (probe.x * 0.5 + 0.5) * width,
          y: (-probe.y * 0.5 + 0.5) * height,
          distance: cameraPos.distanceTo(sample),
        })
        screenX.push((probe.x * 0.5 + 0.5) * width)
      }
    }

    if (screenX.length > 12) {
      screenX.sort((a, b) => a - b)
      this.guideBounds = {
        left: screenX[Math.floor(screenX.length * 0.02)],
        right: screenX[Math.min(screenX.length - 1, Math.floor(screenX.length * 0.98))],
      }
    }

    for (const item of this.guideItems) {
      let best: THREE.Vector3 | null = null
      let bestDistance = Infinity
      for (const sample of this.samplesFor(item.mesh)) {
        const distance = sample.distanceToSquared(cameraPos)
        if (distance < bestDistance) {
          bestDistance = distance
          best = sample
        }
      }
      if (!best) continue
      item.anchor.copy(best)

      probe.copy(best).project(this.camera)
      const ax = (probe.x * 0.5 + 0.5) * width
      const ay = (-probe.y * 0.5 + 0.5) * height
      const anchorDistance = Math.sqrt(bestDistance)
      let occluded = false
      for (const point of cloud) {
        if (point.mesh === item.mesh) continue
        if (point.distance > anchorDistance - 0.015) continue
        const dx = point.x - ax
        const dy = point.y - ay
        if (dx * dx + dy * dy < 49) {
          occluded = true
          break
        }
      }
      item.occluded = occluded
    }
  }


  private updateGuides(now: number) {
    if (!this.guideEnabled || !this.guideItems.length) return

    // 投影依赖相机矩阵；这里主动刷新，避免用到上一帧的矩阵
    this.camera.updateMatrixWorld()
    this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert()

    const moved = this.camera.position.distanceToSquared(this.lastGuideCameraPos) > 0.0004
    const rotated = this.camera.quaternion.angleTo(this.lastGuideCameraQuat) > 0.015
    if (this.guidesDirty || ((moved || rotated) && now - this.lastAnchorUpdate > 90)) {
      this.updateGuideAnchors()
      this.guidesDirty = false
      this.lastAnchorUpdate = now
      this.lastGuideCameraPos.copy(this.camera.position)
      this.lastGuideCameraQuat.copy(this.camera.quaternion)
    }

    this.updateGuideLayout()
  }

  setGuideInsets(insets: Partial<{ left: number; right: number; top: number; bottom: number }>) {
    this.guideInsets = { ...this.guideInsets, ...insets }
  }

  private updateGuideLayout() {
    const width = this.container.clientWidth || 1
    const height = this.container.clientHeight || 1
    const edge = 12
    let leftCol = 0
    let rightCol = 0
    const now = performance.now()
    const remeasure = now - this.lastGuideMeasure > 500
    if (remeasure) this.lastGuideMeasure = now
    const { left: insetLeft, right: insetRight } = this.guideInsets
    const top = this.guideInsets.top
    const bottom = Math.max(top + 60, height - this.guideInsets.bottom)
    const leftLimit = insetLeft + edge
    const rightLimit = Math.max(leftLimit + 80, width - insetRight - edge)
    const leftList: GuideItem[] = []
    const rightList: GuideItem[] = []
    const screenXs: number[] = []
    const projected = new THREE.Vector3()

    if (this.guideSvg.getAttribute('width') !== String(width)) {
      this.guideSvg.setAttribute('width', String(width))
      this.guideSvg.setAttribute('height', String(height))
    }

    for (const item of this.guideItems) {
      if (remeasure || !item.width) item.width = item.el.offsetWidth
      if (remeasure || !item.height) item.height = item.el.offsetHeight
      projected.copy(item.anchor).project(this.camera)
      const sx = (projected.x * 0.5 + 0.5) * width
      const sy = (-projected.y * 0.5 + 0.5) * height
      item.onScreen = projected.z < 1
      item.x = sx
      item.y = THREE.MathUtils.clamp(sy, top, bottom)
      screenXs.push(sx)
    }

    // 以锚点的中位数作为分列界线，保证左右两列标签数量均衡
    screenXs.sort((a, b) => a - b)
    const axis = screenXs.length ? screenXs[Math.floor(screenXs.length / 2)] : width * 0.5

    for (const item of this.guideItems) {
      if (!item.onScreen) continue
      item.side = item.x < axis ? -1 : 1
      ;(item.side === -1 ? leftList : rightList).push(item)
    }

    const widest = (list: GuideItem[]) =>
      list.reduce((max, item) => Math.max(max, item.width || 64), 0)

    // 左列贴在模型左侧外缘；右列贴在模型右侧外缘，超出安全区时回收到面板内侧
    const leftMin = leftLimit + widest(leftList)
    const leftColTarget = this.guideBounds.left - 14 - widest(leftList)
    leftCol = Math.min(Math.max(leftColTarget, leftMin), Math.max(leftMin, axis - 14))

    const rightMax = Math.max(rightLimit - widest(rightList), axis + 14)
    const rightLo = Math.min(axis + 14, rightMax)
    const rightColTarget = this.guideBounds.right + 14
    rightCol = Math.min(Math.max(rightColTarget, rightLo), rightMax)

    this.stackGuides(leftList, top, bottom)
    this.stackGuides(rightList, top, bottom)

    for (const item of this.guideItems) {
      const w = item.width || 64
      const h = item.height || 20
      const labelLeft = item.side === -1 ? leftCol - w : rightCol
      const labelY = item.y
      const attachX = item.side === -1 ? leftCol + 9 : rightCol - 9
      const endX = item.side === -1 ? leftCol : rightCol

      const d = `M${item.x.toFixed(1)} ${item.y.toFixed(1)}L${attachX.toFixed(1)} ${item.y.toFixed(1)}L${attachX.toFixed(1)} ${labelY.toFixed(1)}L${endX.toFixed(1)} ${labelY.toFixed(1)}`
      if (d !== item.pathD) {
        item.pathD = d
        item.path.setAttribute('d', d)
        item.dot.setAttribute('cx', item.x.toFixed(1))
        item.dot.setAttribute('cy', item.y.toFixed(1))
      }

      const transform = `translate3d(${labelLeft.toFixed(1)}px, ${(labelY - h / 2).toFixed(1)}px, 0)`
      if (item.el.style.transform !== transform) item.el.style.transform = transform

      const hidden = !item.onScreen
      const isFocused = item.mesh === this.focusedMesh
      const opacity = hidden ? '0' : isFocused ? '1' : item.occluded ? '0.66' : '1'
      if (item.el.style.opacity !== opacity) item.el.style.opacity = opacity
      if (item.path.style.opacity !== opacity) item.path.style.opacity = opacity
      if (item.dot.style.opacity !== opacity) item.dot.style.opacity = opacity
      item.path.style.visibility = hidden ? 'hidden' : 'visible'
      item.dot.style.visibility = hidden ? 'hidden' : 'visible'

      if (item.occluded !== item.behind) {
        item.behind = item.occluded
        item.el.classList.toggle('behind', item.behind)
        item.path.classList.toggle('behind', item.behind)
        item.dot.classList.toggle('behind', item.behind)
      }

      const hot = item.mesh === this.hoveredMesh
      if (hot !== item.hot) {
        item.hot = hot
        item.el.classList.toggle('hot', hot)
        item.path.classList.toggle('hot', hot)
        item.dot.classList.toggle('hot', hot)
      }

      const active = isFocused
      if (active !== item.active) {
        item.active = active
        item.el.classList.toggle('active', active)
        item.el.setAttribute('aria-pressed', String(active))
        item.path.classList.toggle('active', active)
        item.dot.classList.toggle('active', active)
      }
    }
  }

  private stackGuides(list: GuideItem[], top: number, bottom: number) {
    if (!list.length) return
    const half = (item: GuideItem) => (item.height || 20) / 2 + 3
    list.sort((a, b) => a.y - b.y)
    for (let i = 1; i < list.length; i += 1) {
      const min = list[i - 1].y + half(list[i - 1]) + half(list[i])
      if (list[i].y < min) list[i].y = min
    }
    const last = list[list.length - 1]
    if (last.y + half(last) > bottom) {
      last.y = bottom - half(last)
      for (let i = list.length - 2; i >= 0; i -= 1) {
        const max = list[i + 1].y - half(list[i + 1]) - half(list[i])
        if (list[i].y > max) list[i].y = max
      }
    }
    for (const item of list) {
      const low = top + half(item)
      item.y = THREE.MathUtils.clamp(item.y, low, Math.max(low, bottom - half(item)))
    }
  }

  focus(view: ExerciseView) {
    const scale = this.aspectScale(this.camera.aspect)
    this.viewScale = scale
    const toTarget = new THREE.Vector3(...view.target)
    const toPosition = new THREE.Vector3(...view.camera)
      .sub(toTarget)
      .multiplyScalar(scale)
      .add(toTarget)
    const toFov = view.fov ?? 35

    if (this.reducedMotion) {
      this.camera.position.copy(toPosition)
      this.controls.target.copy(toTarget)
      this.camera.fov = toFov
      this.camera.updateProjectionMatrix()
      this.controls.update()
      return
    }

    this.cameraAnimation = {
      fromPosition: this.camera.position.clone(),
      toPosition,
      fromTarget: this.controls.target.clone(),
      toTarget,
      fromFov: this.camera.fov,
      toFov,
      start: performance.now(),
      duration: 900,
    }
  }

  private aspectScale(aspect: number) {
    return aspect < 0.9 ? Math.min(1.7, 0.9 / Math.max(aspect, 0.36)) : 1
  }

  resetView() {
    this.focus(DEFAULT_VIEW)
  }

  private clearGizmos() {
    for (const gizmo of this.gizmos) {
      gizmo.dispose()
    }
    this.gizmos.length = 0
  }

  private handlePointerMove = (event: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const now = performance.now()
    if (now - this.lastHoverCheck < 50) return
    this.lastHoverCheck = now

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const candidates = this.pickables.filter(
      (mesh) =>
        this.isMeshVisible(mesh) &&
        (mesh.material as THREE.MeshStandardMaterial).opacity > 0.7,
    )
    const hits = this.raycaster.intersectObjects(candidates, false)
    const hit = hits[0]?.object as THREE.Mesh | undefined
    if (!hit) {
      this.setHovered(null)
      return
    }
    const entry = this.meshEntries.find((item) => item.mesh === hit)
    if (!entry) {
      this.setHovered(null)
      return
    }
    this.hoveredMesh = hit
    this.callbacks.onHover?.({
      nameZh: entry.nameZh,
      kind: entry.kind,
      clientX: event.clientX,
      clientY: event.clientY,
    })
  }

  private handlePointerLeave = () => {
    this.setHovered(null)
  }

  private setHovered(mesh: THREE.Mesh | null) {
    if (mesh) {
      this.hoveredMesh = mesh
      return
    }
    if (this.hoveredMesh) {
      this.hoveredMesh = null
      this.callbacks.onHover?.(null)
    }
  }

  private isMeshVisible(mesh: THREE.Mesh) {
    let node: THREE.Object3D | null = mesh
    while (node) {
      if (!node.visible) return false
      node = node.parent
    }
    return true
  }

  private cancelCameraAnimation = () => {
    this.cameraAnimation = null
  }

  private handleMotionPreference = (event: MediaQueryListEvent) => {
    this.reducedMotion = event.matches
  }

  private resize() {
    const width = this.container.clientWidth || 1
    const height = this.container.clientHeight || 1
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.labelRenderer.setSize(width, height)

    const scale = this.aspectScale(this.camera.aspect)
    if (this.controls && Math.abs(scale - this.viewScale) > 0.001) {
      this.cameraAnimation = null
      const offset = this.camera.position.clone().sub(this.controls.target)
      offset.multiplyScalar(scale / this.viewScale)
      this.camera.position.copy(this.controls.target).add(offset)
      this.viewScale = scale
      this.controls.update()
    }
  }

  private updateCamera(now: number) {
    const animation = this.cameraAnimation
    if (!animation) return
    let t = Math.min(1, (now - animation.start) / animation.duration)
    t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    this.camera.position.lerpVectors(animation.fromPosition, animation.toPosition, t)
    this.controls.target.lerpVectors(animation.fromTarget, animation.toTarget, t)
    this.camera.fov = THREE.MathUtils.lerp(animation.fromFov, animation.toFov, t)
    this.camera.updateProjectionMatrix()
    if (t >= 1) this.cameraAnimation = null
  }

  private tick = () => {
    if (this.disposed) return
    this.frameId = requestAnimationFrame(this.tick)
    const now = performance.now()
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05)
    this.lastFrame = now

    for (const entry of this.meshEntries) {
      updateAnatomyMaterial(
        entry.state,
        dt,
        now,
        entry.mesh === this.hoveredMesh,
        !this.reducedMotion,
        entry.mesh === this.focusedMesh,
      )
    }
    for (const gizmo of this.gizmos) gizmo.update(now, this.reducedMotion)

    this.updateCamera(now)
    this.controls.update()
    this.updateGuides(now)
    this.renderer.render(this.scene, this.camera)
    this.labelRenderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frameId)
    this.resizeObserver.disconnect()
    this.renderer.domElement.removeEventListener('pointermove', this.handlePointerMove)
    this.renderer.domElement.removeEventListener('pointerleave', this.handlePointerLeave)
    this.controls.removeEventListener('start', this.cancelCameraAnimation)
    this.reduceMotionQuery.removeEventListener('change', this.handleMotionPreference)
    this.clearGizmos()
    this.clearGuides()
    this.guideLayer.remove()
    for (const entry of this.meshEntries) {
      entry.mesh.geometry.dispose()
      disposeMaterial(entry.state)
    }
    for (const mesh of this.softMeshes) mesh.geometry.dispose()
    this.softMaterial?.dispose()
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.labelRenderer.domElement.remove()
  }
}
