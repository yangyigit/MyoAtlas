import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { BONE_BY_ID } from '../data/bones'
import { JOINT_BY_ID } from '../data/joints'
import { MUSCLE_BY_ID } from '../data/muscles'
import type { Exercise, ExerciseView, LayerName, MuscleRole } from '../data/types'
import { JointGizmo } from './JointGizmo'
import { MOTION_SUPPORTED } from '../data/exercises'
import { MotionRig } from './MotionRig'
import {
  createAnatomyMaterial,
  createConnectiveMaterial,
  disposeMaterial,
  setActiveBone,
  setActiveJoint,
  setBase,
  setDim,
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

const DEFAULT_VIEW: ExerciseView = {
  camera: [1.15, 1.05, 2.75],
  target: [0, 0.92, 0],
  fov: 35,
}

const MOTION_VIEW: ExerciseView = {
  camera: [2.3, 1.05, 1.9],
  target: [0, 0.62, 0.1],
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
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly controls: OrbitControls
  private readonly layerRoots: Record<LayerName, THREE.Group> = {
    muscles: new THREE.Group(),
    bones: new THREE.Group(),
    joints: new THREE.Group(),
  }
  private readonly meshEntries: MeshEntry[] = []
  private readonly pickables: THREE.Mesh[] = []
  private readonly softMeshes: THREE.Mesh[] = []
  private softMaterial: THREE.MeshPhysicalMaterial | null = null
  private motionRig: MotionRig | null = null
  private motionEnabled = false
  private readonly gizmos: JointGizmo[] = []
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly resizeObserver: ResizeObserver
  private readonly reduceMotionQuery: MediaQueryList

  private exercise: Exercise | null = null
  private layers: Record<LayerName, boolean> = { muscles: true, bones: true, joints: true }
  private isolate = false
  private cameraAnimation: CameraAnimation | null = null
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
        const gizmo = new JointGizmo(motion, joint)
        gizmo.setVisible(this.layers.joints)
        this.gizmos.push(gizmo)
        this.scene.add(gizmo.root)
      }
    }
    this.applyState()
    this.motionRig?.setExercise(exercise)
  }

  private applyState() {
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

    for (const entry of this.meshEntries) {
      let active = false
      if (entry.layer === 'muscles') {
        const role = roleMap.get(entry.groupId)
        active = Boolean(role)
        if (role) setRole(entry.state, role)
        else setDim(entry.state, 'muscles', reveal)
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

  setLayers(layers: Record<LayerName, boolean>) {
    this.layers = { ...layers }
    for (const layer of Object.keys(this.layerRoots) as LayerName[]) {
      this.layerRoots[layer].visible = !this.motionEnabled && layers[layer]
    }
    if (!this.motionEnabled) {
      for (const gizmo of this.gizmos) gizmo.setVisible(layers.joints)
    }
    this.applyState()
    this.motionRig?.setLayers(layers)
  }

  setIsolate(value: boolean) {
    this.isolate = value
    this.applyState()
    this.motionRig?.setIsolate(value)
  }

  setMotion(enabled: boolean) {
    if (enabled === this.motionEnabled) return
    if (enabled && !this.exercise) return
    if (enabled && !MOTION_SUPPORTED.has(this.exercise!.id)) return

    if (enabled) {
      if (!this.motionRig) {
        this.motionRig = new MotionRig(
          this.scene,
          [
            ...this.meshEntries.map((entry) => ({
              mesh: entry.mesh,
              layer: entry.layer,
              groupId: entry.groupId,
            })),
            ...this.softMeshes.map((mesh) => ({
              mesh,
              layer: 'muscles' as const,
              groupId: 'soft-tissue',
            })),
          ],
        )
      }
      this.motionEnabled = true
      for (const layer of Object.keys(this.layerRoots) as LayerName[]) {
        this.layerRoots[layer].visible = false
      }
      for (const gizmo of this.gizmos) gizmo.setVisible(false)
      this.motionRig.setExercise(this.exercise)
      this.motionRig.setLayers(this.layers)
      this.motionRig.setIsolate(this.isolate)
      this.motionRig.setEnabled(true)
      this.setHovered(null)
      this.focus(MOTION_VIEW)
    } else {
      this.motionEnabled = false
      this.motionRig?.setEnabled(false)
      for (const layer of Object.keys(this.layerRoots) as LayerName[]) {
        this.layerRoots[layer].visible = this.layers[layer]
      }
      for (const gizmo of this.gizmos) gizmo.setVisible(this.layers.joints)
      if (this.exercise) this.focus(this.exercise.view)
    }
  }

  get isMotionEnabled() {
    return this.motionEnabled
  }

  focus(view: ExerciseView) {
    const toPosition = new THREE.Vector3(...view.camera)
    const toTarget = new THREE.Vector3(...view.target)
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

  resetView() {
    this.focus(this.motionEnabled ? MOTION_VIEW : DEFAULT_VIEW)
  }

  private clearGizmos() {
    for (const gizmo of this.gizmos) {
      gizmo.dispose()
    }
    this.gizmos.length = 0
  }

  private handlePointerMove = (event: PointerEvent) => {
    if (this.motionEnabled) {
      this.setHovered(null)
      return
    }
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

    this.motionRig?.update(now, this.reducedMotion)

    for (const entry of this.meshEntries) {
      updateAnatomyMaterial(
        entry.state,
        dt,
        now,
        entry.mesh === this.hoveredMesh,
        !this.reducedMotion,
      )
    }
    for (const gizmo of this.gizmos) gizmo.update(now, this.reducedMotion)

    this.updateCamera(now)
    this.controls.update()
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
    for (const entry of this.meshEntries) {
      entry.mesh.geometry.dispose()
      disposeMaterial(entry.state)
    }
    for (const mesh of this.softMeshes) mesh.geometry.dispose()
    this.softMaterial?.dispose()
    this.motionRig?.dispose()
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.labelRenderer.domElement.remove()
  }
}
