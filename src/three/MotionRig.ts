import * as THREE from 'three'
import type { Exercise, ExerciseView, LayerName, MuscleRole } from '../data/types'
import {
  createAnatomyMaterial,
  createConnectiveMaterial,
  setActiveBone,
  setActiveJoint,
  setDim,
  setRole,
  updateAnatomyMaterial,
  type AnatomyMaterial,
} from './materials'
import { MOTION_CONFIGS, type EquipmentKind, type MotionConfig, type Vec3 } from './motionConfigs'

export interface MotionSource {
  mesh: THREE.Mesh
  layer: LayerName
  groupId: string
}

interface BoneDef {
  name: string
  head: [number, number, number]
  tail: [number, number, number]
  parent: string | null
}

const BONE_DEFS: BoneDef[] = [
  { name: 'pelvis', head: [0, 0.9, 0], tail: [0, 1.05, 0], parent: null },
  { name: 'spine', head: [0, 1.05, 0], tail: [0, 1.4, 0], parent: 'pelvis' },
  { name: 'head', head: [0, 1.4, 0], tail: [0, 1.68, 0], parent: 'spine' },
]

for (const side of [1, -1] as const) {
  const s = side === 1 ? 'L' : 'R'
  BONE_DEFS.push(
    { name: `upperarm.${s}`, head: [0.17 * side, 1.37, 0], tail: [0.24 * side, 1.1, 0], parent: 'spine' },
    { name: `forearm.${s}`, head: [0.24 * side, 1.1, 0], tail: [0.27 * side, 0.88, 0], parent: `upperarm.${s}` },
    { name: `hand.${s}`, head: [0.27 * side, 0.88, 0], tail: [0.28 * side, 0.78, 0], parent: `forearm.${s}` },
    { name: `thigh.${s}`, head: [0.1 * side, 0.87, 0], tail: [0.11 * side, 0.5, 0], parent: 'pelvis' },
    { name: `shin.${s}`, head: [0.11 * side, 0.5, 0], tail: [0.1 * side, 0.15, 0], parent: `thigh.${s}` },
    { name: `foot.${s}`, head: [0.1 * side, 0.15, 0], tail: [0.1 * side, 0.04, 0.12], parent: `shin.${s}` },
  )
}

const BONE_HEAD = new Map<string, THREE.Vector3>()
const BONE_TAIL = new Map<string, THREE.Vector3>()
for (const def of BONE_DEFS) {
  BONE_HEAD.set(def.name, new THREE.Vector3(...def.head))
  BONE_TAIL.set(def.name, new THREE.Vector3(...def.tail))
}

interface MotionGroup {
  layer: LayerName
  groupId: string
  state: AnatomyMaterial
  role?: MuscleRole
  active: boolean
}

const DEFAULT_VIEW: ExerciseView = {
  camera: [1.9, 1.3, 3.1],
  target: [0, 0.9, 0],
  fov: 34,
}

const lerpVec = (a: Vec3, b: Vec3, t: number) =>
  new THREE.Vector3(
    THREE.MathUtils.lerp(a[0], b[0], t),
    THREE.MathUtils.lerp(a[1], b[1], t),
    THREE.MathUtils.lerp(a[2], b[2], t),
  )

export class MotionRig {
  readonly root = new THREE.Group()
  readonly equipment = new THREE.Group()
  private readonly scene: THREE.Scene
  private readonly bones = new Map<string, THREE.Group>()
  private readonly segments: { mesh: THREE.Mesh; layer: LayerName; groupId: string }[] = []
  private readonly groups = new Map<string, MotionGroup>()
  private readonly geometries: THREE.BufferGeometry[] = []
  private readonly equipmentGeometries: THREE.BufferGeometry[] = []
  private readonly equipmentMaterials: THREE.Material[] = []
  private readonly softMaterial: THREE.MeshPhysicalMaterial
  private readonly jointCoverMaterial: THREE.MeshPhysicalMaterial
  private readonly jointCovers: THREE.Mesh[] = []
  private readonly jointCoverGeometries: THREE.BufferGeometry[] = []
  private readonly props = new Map<EquipmentKind, THREE.Group>()
  private readonly dumbbells: Record<'L' | 'R', THREE.Group> = {
    L: new THREE.Group(),
    R: new THREE.Group(),
  }
  private cableHandle: THREE.Group | null = null
  private config: MotionConfig | null = null
  private exercise: Exercise | null = null
  private enabled = false
  private motionStartedAt = 0
  private isolate = false
  private layers: Record<LayerName, boolean> = { muscles: true, bones: true, joints: true }

  constructor(scene: THREE.Scene, sources: MotionSource[]) {
    this.scene = scene
    this.root.name = 'motion-rig'
    this.root.visible = false
    this.root.position.set(0, 0.9, 0)
    scene.add(this.root)
    this.softMaterial = createConnectiveMaterial()
    this.jointCoverMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xbfae93,
      roughness: 0.52,
      clearcoat: 0.22,
      clearcoatRoughness: 0.6,
    })

    this.buildBones()
    this.buildSegments(sources)
    this.buildJointCovers()
    this.buildEquipment()
  }

  private buildBones() {
    this.root.updateMatrixWorld(true)
    for (const def of BONE_DEFS) {
      const group = new THREE.Group()
      group.name = def.name
      const head = BONE_HEAD.get(def.name)!
      if (def.parent) {
        const parent = this.bones.get(def.parent)!
        group.position.copy(head).sub(BONE_HEAD.get(def.parent)!)
        parent.add(group)
      } else {
        group.position.set(0, 0, 0)
        this.root.add(group)
      }
      this.bones.set(def.name, group)
    }
    this.root.updateMatrixWorld(true)
  }

  private nearestBone(point: THREE.Vector3): string {
    let best = 'pelvis'
    let bestDist = Infinity
    for (const def of BONE_DEFS) {
      const head = BONE_HEAD.get(def.name)!
      const tail = BONE_TAIL.get(def.name)!
      const ab = tail.clone().sub(head)
      const lengthSq = Math.max(ab.lengthSq(), 1e-9)
      const t = THREE.MathUtils.clamp(point.clone().sub(head).dot(ab) / lengthSq, 0, 1)
      const projected = head.clone().addScaledVector(ab, t)
      const dist = projected.distanceToSquared(point)
      if (dist < bestDist) {
        bestDist = dist
        best = def.name
      }
    }
    return best
  }

  private groupFor(layer: LayerName, groupId: string): MotionGroup {
    const key = `${layer}:${groupId}`
    const existing = this.groups.get(key)
    if (existing) return existing
    const state = createAnatomyMaterial(layer, groupId.length * 7 + groupId.charCodeAt(0))
    const entry: MotionGroup = { layer, groupId, state, active: false }
    this.groups.set(key, entry)
    return entry
  }

  private buildJointCovers() {
    const cover = (bone: string, radius: number, scaleY = 1) => {
      const geometry = new THREE.SphereGeometry(radius, 18, 14)
      this.jointCoverGeometries.push(geometry)
      const mesh = new THREE.Mesh(geometry, this.jointCoverMaterial)
      mesh.scale.y = scaleY
      mesh.visible = false
      this.bones.get(bone)!.add(mesh)
      this.jointCovers.push(mesh)
    }
    for (const side of ['L', 'R']) {
      cover(`upperarm.${side}`, 0.045, 1.06)
      cover(`forearm.${side}`, 0.032)
      cover(`thigh.${side}`, 0.04, 1.04)
      cover(`shin.${side}`, 0.035)
    }
  }

  private buildSegments(sources: MotionSource[]) {
    const tmp = new THREE.Vector3()
    for (const source of sources) {
      const mesh = source.mesh
      mesh.updateWorldMatrix(true, false)
      const geometry = mesh.geometry.clone()
      geometry.applyMatrix4(mesh.matrixWorld)
      this.geometries.push(geometry)
      const position = geometry.getAttribute('position')
      const normal = geometry.getAttribute('normal')
      const index = geometry.getIndex()
      const triCount = index ? index.count / 3 : position.count / 3
      const buckets = new Map<string, number[]>()

      for (let tri = 0; tri < triCount; tri += 1) {
        const i0 = index ? index.getX(tri * 3) : tri * 3
        const i1 = index ? index.getX(tri * 3 + 1) : tri * 3 + 1
        const i2 = index ? index.getX(tri * 3 + 2) : tri * 3 + 2
        tmp.set(
          (position.getX(i0) + position.getX(i1) + position.getX(i2)) / 3,
          (position.getY(i0) + position.getY(i1) + position.getY(i2)) / 3,
          (position.getZ(i0) + position.getZ(i1) + position.getZ(i2)) / 3,
        )
        const bone = this.nearestBone(tmp)
        let bucket = buckets.get(bone)
        if (!bucket) {
          bucket = []
          buckets.set(bone, bucket)
        }
        bucket.push(i0, i1, i2)
      }

      for (const [bone, indices] of buckets) {
        const segmentGeometry = new THREE.BufferGeometry()
        segmentGeometry.setAttribute('position', position)
        segmentGeometry.setAttribute('normal', normal)
        segmentGeometry.setIndex(indices)
        const material =
          source.groupId === 'soft-tissue'
            ? this.softMaterial
            : this.groupFor(source.layer, source.groupId).state.material
        const segment = new THREE.Mesh(segmentGeometry, material)
        segment.frustumCulled = false
        segment.userData = {
          layer: source.layer,
          groupId: source.groupId,
          motionSegment: true,
        }
        this.scene.add(segment)
        segment.updateMatrixWorld(true)
        this.bones.get(bone)!.attach(segment)
        this.segments.push({ mesh: segment, layer: source.layer, groupId: source.groupId })
      }
    }
    this.root.updateMatrixWorld(true)
  }

  private makeProp(kind: EquipmentKind) {
    const group = new THREE.Group()
    group.name = `equipment-${kind}`
    group.visible = false
    this.props.set(kind, group)
    this.equipment.add(group)
    return group
  }

  private buildEquipment() {
    const padMaterial = new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.85 })
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b414a,
      roughness: 0.45,
      metalness: 0.55,
    })
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0x9aa4ae,
      roughness: 0.32,
      metalness: 0.85,
    })
    const plateMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3138,
      roughness: 0.55,
      metalness: 0.4,
    })
    const matMaterial = new THREE.MeshStandardMaterial({ color: 0x161c22, roughness: 0.95 })
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0x5b2b26, roughness: 0.6 })
    this.equipmentMaterials.push(
      padMaterial,
      frameMaterial,
      steelMaterial,
      plateMaterial,
      matMaterial,
      ballMaterial,
    )

    const addMesh = (
      parent: THREE.Group,
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      position: [number, number, number] = [0, 0, 0],
    ) => {
      this.equipmentGeometries.push(geometry)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...position)
      parent.add(mesh)
      return mesh
    }

    const bench = this.makeProp('bench')
    addMesh(bench, new THREE.BoxGeometry(0.54, 0.09, 1.35), padMaterial, [0, 0.455, -0.3])
    for (const x of [-0.21, 0.21]) {
      for (const z of [-0.85, 0.25]) {
        addMesh(bench, new THREE.BoxGeometry(0.045, 0.4, 0.045), frameMaterial, [x, 0.2, z])
      }
    }
    addMesh(bench, new THREE.BoxGeometry(0.5, 0.04, 0.04), frameMaterial, [0, 0.02, -0.85])
    addMesh(bench, new THREE.BoxGeometry(0.5, 0.04, 0.04), frameMaterial, [0, 0.02, 0.25])

    const barbell = this.makeProp('barbell')
    const barGeometry = new THREE.CylinderGeometry(0.012, 0.012, 1.5, 14)
    barGeometry.rotateZ(Math.PI / 2)
    addMesh(barbell, barGeometry, steelMaterial)
    for (const x of [-0.66, -0.6, 0.6, 0.66]) {
      const plateGeometry = new THREE.CylinderGeometry(0.16, 0.16, 0.028, 24)
      plateGeometry.rotateZ(Math.PI / 2)
      addMesh(barbell, plateGeometry, plateMaterial, [x, 0, 0])
    }
    const collarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12)
    collarGeometry.rotateZ(Math.PI / 2)
    for (const x of [-0.56, 0.56]) {
      addMesh(barbell, collarGeometry, steelMaterial, [x, 0, 0])
    }

    const dumbbells = this.makeProp('dumbbells')
    for (const side of ['L', 'R'] as const) {
      const group = this.dumbbells[side]
      group.name = `dumbbell-${side}`
      const handleGeometry = new THREE.CylinderGeometry(0.014, 0.014, 0.18, 10)
      handleGeometry.rotateZ(Math.PI / 2)
      addMesh(group, handleGeometry, steelMaterial)
      for (const x of [-0.09, 0.09]) {
        const weightGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.05, 16)
        weightGeometry.rotateZ(Math.PI / 2)
        addMesh(group, weightGeometry, plateMaterial, [x, 0, 0])
      }
      dumbbells.add(group)
    }

    const pullup = this.makeProp('pullup-bar')
    const pullupBarGeometry = new THREE.CylinderGeometry(0.014, 0.014, 1.5, 12)
    pullupBarGeometry.rotateZ(Math.PI / 2)
    addMesh(pullup, pullupBarGeometry, steelMaterial, [0, 2.02, 0])
    for (const x of [-0.75, 0.75]) {
      addMesh(pullup, new THREE.BoxGeometry(0.06, 2.02, 0.06), frameMaterial, [x, 1.01, 0])
    }

    const dip = this.makeProp('dip-bars')
    for (const x of [-0.3, 0.3]) {
      const dipBarGeometry = new THREE.CylinderGeometry(0.016, 0.016, 1.1, 12)
      dipBarGeometry.rotateX(Math.PI / 2)
      addMesh(dip, dipBarGeometry, steelMaterial, [x, 0.95, 0])
      for (const z of [-0.45, 0.45]) {
        addMesh(dip, new THREE.BoxGeometry(0.05, 0.95, 0.05), frameMaterial, [x, 0.475, z])
      }
    }

    const cable = this.makeProp('cable')
    addMesh(cable, new THREE.BoxGeometry(0.12, 1.9, 0.12), frameMaterial, [0.9, 0.95, 0.4])
    addMesh(cable, new THREE.BoxGeometry(0.22, 0.22, 0.16), padMaterial, [0.9, 1.85, 0.4])
    const handle = new THREE.Group()
    handle.name = 'cable-handle'
    const handleGeometry = new THREE.TorusGeometry(0.05, 0.012, 8, 20)
    addMesh(handle, handleGeometry, steelMaterial)
    cable.add(handle)
    this.cableHandle = handle

    this.makeProp('mat')
    addMesh(this.props.get('mat')!, new THREE.BoxGeometry(2.1, 0.03, 1.3), matMaterial, [0, 0.015, 0])

    const step = this.makeProp('step')
    addMesh(step, new THREE.BoxGeometry(0.7, 0.12, 0.36), padMaterial, [0, 0.06, 0.2])

    const platform = this.makeProp('platform')
    addMesh(platform, new THREE.BoxGeometry(0.9, 0.7, 0.08), padMaterial, [0, 0.55, 0.95])
    addMesh(platform, new THREE.BoxGeometry(0.9, 0.05, 0.05), frameMaterial, [0, 0.2, 1.0])

    const ball = this.makeProp('ball')
    const ballGeometry = new THREE.SphereGeometry(0.12, 20, 16)
    addMesh(ball, ballGeometry, ballMaterial)

    this.equipment.visible = false
    this.scene.add(this.equipment)
  }

  private syncProps() {
    const kinds = new Set<EquipmentKind>(this.config?.equipment ?? [])
    for (const [kind, group] of this.props) {
      group.visible = this.enabled && kinds.has(kind)
    }
    this.equipment.visible = this.enabled && kinds.size > 0
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (enabled) this.motionStartedAt = performance.now()
    this.root.visible = enabled
    this.syncProps()
    for (const cover of this.jointCovers) cover.visible = enabled && this.layers.muscles
    if (!enabled) return
    this.root.updateMatrixWorld(true)
    this.pose(0)
    this.updateEquipment()
    for (const segment of this.segments) {
      segment.mesh.visible = this.layers[segment.layer]
    }
  }

  setExercise(exercise: Exercise | null) {
    this.exercise = exercise
    this.config = exercise ? MOTION_CONFIGS[exercise.id] ?? null : null
    this.syncProps()
    if (!exercise) return
    const roleMap = new Map<string, MuscleRole>(exercise.muscles.map((m) => [m.id, m.role]))
    const boneSet = new Set<string>(exercise.bones)
    const jointSet = new Set<string>(exercise.joints.map((j) => j.id))
    for (const group of this.groups.values()) {
      if (group.layer === 'muscles') {
        const role = roleMap.get(group.groupId)
        group.active = Boolean(role)
        group.role = role
        if (role) setRole(group.state, role)
        else setDim(group.state, 'muscles', true)
      } else if (group.layer === 'bones') {
        group.active = boneSet.has(group.groupId)
        if (group.active) setActiveBone(group.state)
        else setDim(group.state, 'bones', true)
      } else {
        group.active = jointSet.has(group.groupId)
        if (group.active) setActiveJoint(group.state)
        else setDim(group.state, 'joints', true)
      }
    }
    for (const segment of this.segments) {
      const group = this.groups.get(`${segment.layer}:${segment.groupId}`)
      segment.mesh.visible =
        this.enabled &&
        this.layers[segment.layer] &&
        (!this.isolate || Boolean(group?.active) || segment.groupId === 'soft-tissue')
    }
    if (this.enabled) {
      this.pose(0)
      this.updateEquipment()
    }
  }

  setLayers(layers: Record<LayerName, boolean>) {
    this.layers = { ...layers }
    for (const segment of this.segments) {
      segment.mesh.visible = this.enabled && layers[segment.layer]
    }
    for (const cover of this.jointCovers) cover.visible = this.enabled && layers.muscles
  }

  setIsolate(isolate: boolean) {
    this.isolate = isolate
    if (this.exercise) this.setExercise(this.exercise)
  }

  getView(): ExerciseView {
    return this.config?.view ?? DEFAULT_VIEW
  }

  private orientBone(name: string, target: THREE.Vector3) {
    const group = this.bones.get(name)
    if (!group || !group.parent) return
    group.parent.updateWorldMatrix(true, false)
    const parentQuaternion = new THREE.Quaternion()
    group.parent.getWorldQuaternion(parentQuaternion)
    const rest = BONE_TAIL.get(name)!.clone().sub(BONE_HEAD.get(name)!).normalize()
    const localTarget = target.clone().normalize().applyQuaternion(parentQuaternion.invert())
    group.quaternion.setFromUnitVectors(rest, localTarget)
  }

  private pose(phase: number) {
    const config = this.config
    if (!config) return
    const bob = config.root.bob
      ? THREE.MathUtils.lerp(config.root.bob[0], config.root.bob[1], phase)
      : 0
    this.root.position.set(
      config.root.position[0],
      config.root.position[1] + bob,
      config.root.position[2],
    )
    this.root.rotation.set(config.root.rotationX, 0, 0)
    for (const bone of this.bones.values()) bone.quaternion.identity()
    this.root.updateMatrixWorld(true)

    if (config.spine) {
      this.orientBone('spine', lerpVec(config.spine.start, config.spine.end, phase))
      this.root.updateMatrixWorld(true)
    }

    for (const side of ['L', 'R'] as const) {
      const mirror = side === 'L' ? 1 : -1
      const upper = lerpVec(config.arms.start.upper, config.arms.end.upper, phase)
      upper.x *= mirror
      this.orientBone(`upperarm.${side}`, upper)
      this.root.updateMatrixWorld(true)

      const fore = lerpVec(config.arms.start.fore, config.arms.end.fore, phase)
      fore.x *= mirror
      this.orientBone(`forearm.${side}`, fore)
      this.bones.get(`hand.${side}`)!.quaternion.identity()

      const thigh = lerpVec(config.legs.start.thigh, config.legs.end.thigh, phase)
      thigh.x *= mirror
      this.orientBone(`thigh.${side}`, thigh)
      this.root.updateMatrixWorld(true)

      const shin = lerpVec(config.legs.start.shin, config.legs.end.shin, phase)
      shin.x *= mirror
      this.orientBone(`shin.${side}`, shin)

      const foot = lerpVec(config.legs.start.foot, config.legs.end.foot, phase)
      foot.x *= mirror
      this.orientBone(`foot.${side}`, foot)
      this.root.updateMatrixWorld(true)
    }
    this.root.updateMatrixWorld(true)
  }

  private handMidpoint() {
    const left = new THREE.Vector3()
    const right = new THREE.Vector3()
    this.bones.get('hand.L')!.getWorldPosition(left)
    this.bones.get('hand.R')!.getWorldPosition(right)
    return { left, right, center: left.clone().add(right).multiplyScalar(0.5) }
  }

  private updateEquipment() {
    const config = this.config
    if (!config) return
    const barbell = this.props.get('barbell')
    if (barbell?.visible) {
      if (config.barAnchor === 'back') {
        const spine = new THREE.Vector3()
        this.bones.get('spine')!.getWorldPosition(spine)
        barbell.position.copy(spine).add(new THREE.Vector3(0, 0.3, 0))
        barbell.quaternion.identity()
      } else {
        const { left, right, center } = this.handMidpoint()
        center.y += 0.045
        barbell.position.copy(center)
        const direction = right.clone().sub(left).normalize()
        barbell.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction)
      }
    }

    if (this.props.get('dumbbells')?.visible) {
      for (const side of ['L', 'R'] as const) {
        const position = new THREE.Vector3()
        this.bones.get(`hand.${side}`)!.getWorldPosition(position)
        this.dumbbells[side].position.copy(position)
      }
    }

    if (this.props.get('cable')?.visible && this.cableHandle) {
      const { center } = this.handMidpoint()
      this.cableHandle.position.copy(center)
    }

    if (this.props.get('ball')?.visible) {
      const { center } = this.handMidpoint()
      center.y += 0.05
      this.props.get('ball')!.position.copy(center)
    }
  }

  update(now: number, reducedMotion: boolean) {
    if (!this.enabled) return
    const elapsed = now - this.motionStartedAt
    const phase = reducedMotion
      ? 0.55
      : 0.5 - 0.5 * Math.cos((elapsed / 2400) * Math.PI * 2)
    this.pose(phase)
    this.updateEquipment()
    const dt = 1 / 60
    for (const group of this.groups.values()) {
      updateAnatomyMaterial(group.state, dt, now, false, !reducedMotion)
    }
  }

  dispose() {
    this.root.removeFromParent()
    this.equipment.removeFromParent()
    for (const geometry of this.geometries) geometry.dispose()
    for (const segment of this.segments) segment.mesh.geometry.dispose()
    for (const group of this.groups.values()) group.state.material.dispose()
    this.softMaterial.dispose()
    for (const geometry of this.equipmentGeometries) geometry.dispose()
    for (const material of this.equipmentMaterials) material.dispose()
    for (const geometry of this.jointCoverGeometries) geometry.dispose()
    this.jointCoverMaterial.dispose()
  }
}