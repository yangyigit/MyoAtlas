import * as THREE from 'three'
import type { Exercise, LayerName, MuscleRole } from '../data/types'
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
  private readonly bar = new THREE.Group()
  private readonly bench = new THREE.Group()
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
    this.equipmentMaterials.push(padMaterial, frameMaterial, steelMaterial, plateMaterial)

    const addBox = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      material: THREE.Material,
    ) => {
      const geometry = new THREE.BoxGeometry(w, h, d)
      this.equipmentGeometries.push(geometry)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x, y, z)
      this.bench.add(mesh)
    }

    addBox(0.54, 0.09, 1.35, 0, 0.455, -0.3, padMaterial)
    addBox(0.5, 0.05, 0.08, 0, 0.38, -0.9, frameMaterial)
    addBox(0.5, 0.05, 0.08, 0, 0.38, 0.3, frameMaterial)
    for (const x of [-0.21, 0.21]) {
      for (const z of [-0.85, 0.25]) {
        addBox(0.045, 0.4, 0.045, x, 0.2, z, frameMaterial)
      }
    }
    addBox(0.5, 0.04, 0.04, 0, 0.02, -0.85, frameMaterial)
    addBox(0.5, 0.04, 0.04, 0, 0.02, 0.25, frameMaterial)

    const barGeometry = new THREE.CylinderGeometry(0.012, 0.012, 1.5, 14)
    barGeometry.rotateZ(Math.PI / 2)
    this.equipmentGeometries.push(barGeometry)
    this.bar.add(new THREE.Mesh(barGeometry, steelMaterial))

    for (const x of [-0.66, -0.6, 0.6, 0.66]) {
      const plateGeometry = new THREE.CylinderGeometry(0.16, 0.16, 0.028, 24)
      plateGeometry.rotateZ(Math.PI / 2)
      this.equipmentGeometries.push(plateGeometry)
      const plate = new THREE.Mesh(plateGeometry, plateMaterial)
      plate.position.x = x
      this.bar.add(plate)
    }

    const collarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12)
    collarGeometry.rotateZ(Math.PI / 2)
    this.equipmentGeometries.push(collarGeometry)
    for (const x of [-0.56, 0.56]) {
      const collar = new THREE.Mesh(collarGeometry, steelMaterial)
      collar.position.x = x
      this.bar.add(collar)
    }

    this.equipment.add(this.bench, this.bar)
    this.equipment.visible = false
    this.scene.add(this.equipment)
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (enabled) this.motionStartedAt = performance.now()
    this.root.visible = enabled
    this.equipment.visible = enabled && Boolean(this.exercise)
    for (const cover of this.jointCovers) cover.visible = enabled && this.layers.muscles
    if (!enabled) return
    this.root.updateMatrixWorld(true)
    this.pose(0)
    this.updateBar()
    for (const segment of this.segments) {
      segment.mesh.visible = this.layers[segment.layer]
    }
  }

  setExercise(exercise: Exercise | null) {
    this.exercise = exercise
    this.equipment.visible = this.enabled && Boolean(exercise)
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
    this.root.position.set(0, 0.55, 0.05)
    this.root.rotation.set(-Math.PI / 2, 0, 0)
    for (const bone of this.bones.values()) bone.quaternion.identity()
    this.root.updateMatrixWorld(true)

    const lift = phase
    for (const side of ['L', 'R'] as const) {
      const sx = side === 'L' ? 1 : -1
      const upper = new THREE.Vector3(
        sx * (0.98 - lift * 0.3),
        0.02 + lift * 0.72,
        -0.14,
      )
      this.orientBone(`upperarm.${side}`, upper)
      this.root.updateMatrixWorld(true)

      const fore = new THREE.Vector3(
        sx * (0.05 + lift * 0.12),
        0.86 + lift * 0.12,
        0.5 - lift * 0.42,
      )
      this.orientBone(`forearm.${side}`, fore)
      this.bones.get(`hand.${side}`)!.quaternion.identity()

      this.orientBone(`thigh.${side}`, new THREE.Vector3(sx * 0.03, 0.05, 1))
      this.root.updateMatrixWorld(true)
      this.orientBone(`shin.${side}`, new THREE.Vector3(sx * 0.02, -1, 0.12))
      this.orientBone(`foot.${side}`, new THREE.Vector3(0, -0.05, 1))
      this.root.updateMatrixWorld(true)
    }
    this.root.updateMatrixWorld(true)
  }

  private updateBar() {
    const left = this.bones.get('hand.L')!
    const right = this.bones.get('hand.R')!
    const leftPos = new THREE.Vector3()
    const rightPos = new THREE.Vector3()
    left.getWorldPosition(leftPos)
    right.getWorldPosition(rightPos)
    const center = leftPos.clone().add(rightPos).multiplyScalar(0.5)
    center.y += 0.045
    this.bar.position.copy(center)
    const direction = rightPos.clone().sub(leftPos).normalize()
    this.bar.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction)
  }

  update(now: number, reducedMotion: boolean) {
    if (!this.enabled) return
    const elapsed = now - this.motionStartedAt
    const phase = reducedMotion
      ? 0.55
      : 0.5 - 0.5 * Math.cos((elapsed / 2400) * Math.PI * 2)
    this.pose(phase)
    this.updateBar()
    const dt = 1 / 60
    for (const group of this.groups.values()) {
      updateAnatomyMaterial(group.state, dt, now, false, !reducedMotion)
    }
  }

  get creatingMeshes(): number {
    return this.segments.length
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