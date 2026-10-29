import * as THREE from 'three'
import type { LayerName, MuscleRole } from '../data/types'

export const PALETTE = {
  muscleBase: '#7a3f36',
  boneBase: '#d9cbb3',
  jointBase: '#3a6b72',
  primary: '#ff5a4e',
  secondary: '#ff9f43',
  stabilizer: '#ffd166',
  boneActive: '#f2c66d',
  jointActive: '#38d9e8',
  inactive: '#3a3431',
  inactiveBone: '#5f5849',
  inactiveJoint: '#2b4b50',
} as const

const BASE: Record<LayerName, THREE.Color> = {
  muscles: new THREE.Color(PALETTE.muscleBase),
  bones: new THREE.Color(PALETTE.boneBase),
  joints: new THREE.Color(PALETTE.jointBase),
}

const ROLE: Record<MuscleRole, THREE.Color> = {
  primary: new THREE.Color(PALETTE.primary),
  secondary: new THREE.Color(PALETTE.secondary),
  stabilizer: new THREE.Color(PALETTE.stabilizer),
}

const DIM: Record<LayerName, THREE.Color> = {
  muscles: new THREE.Color(PALETTE.inactive),
  bones: new THREE.Color(PALETTE.inactiveBone),
  joints: new THREE.Color(PALETTE.inactiveJoint),
}

const ACTIVE_BONE = new THREE.Color(PALETTE.boneActive)
const ACTIVE_JOINT = new THREE.Color(PALETTE.jointActive)

export interface AnatomyMaterial {
  material: THREE.MeshStandardMaterial
  targetColor: THREE.Color
  targetEmissive: THREE.Color
  targetEmissiveIntensity: number
  targetOpacity: number
  breathing: boolean
}

export function createAnatomyMaterial(layer: LayerName): AnatomyMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: BASE[layer].clone(),
    roughness: layer === 'joints' ? 0.5 : 0.72,
    metalness: layer === 'joints' ? 0.08 : 0.02,
    emissive: 0x000000,
    emissiveIntensity: 0,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    side: THREE.FrontSide,
  })
  return {
    material,
    targetColor: BASE[layer].clone(),
    targetEmissive: new THREE.Color(0x000000),
    targetEmissiveIntensity: 0,
    targetOpacity: 1,
    breathing: false,
  }
}

export function setBase(state: AnatomyMaterial, layer: LayerName, reveal: boolean) {
  state.targetColor.copy(BASE[layer])
  state.targetEmissive.setRGB(0, 0, 0)
  state.targetEmissiveIntensity = 0
  state.targetOpacity = layer === 'muscles' && reveal ? 0.3 : 1
  state.breathing = false
}

export function setRole(state: AnatomyMaterial, role: MuscleRole) {
  const color = ROLE[role]
  state.targetColor.copy(color)
  state.targetEmissive.copy(color)
  state.targetEmissiveIntensity = role === 'primary' ? 0.5 : role === 'secondary' ? 0.34 : 0.22
  state.targetOpacity = 1
  state.breathing = true
}

export function setActiveBone(state: AnatomyMaterial) {
  state.targetColor.copy(ACTIVE_BONE)
  state.targetEmissive.copy(ACTIVE_BONE)
  state.targetEmissiveIntensity = 0.32
  state.targetOpacity = 1
  state.breathing = false
}

export function setActiveJoint(state: AnatomyMaterial) {
  state.targetColor.copy(ACTIVE_JOINT)
  state.targetEmissive.copy(ACTIVE_JOINT)
  state.targetEmissiveIntensity = 0.55
  state.targetOpacity = 1
  state.breathing = false
}

export function setDim(state: AnatomyMaterial, layer: LayerName, reveal: boolean) {
  state.targetColor.copy(DIM[layer])
  state.targetEmissive.setRGB(0, 0, 0)
  state.targetEmissiveIntensity = 0
  state.targetOpacity =
    layer === 'muscles' ? (reveal ? 0.22 : 0.45) : layer === 'bones' ? 0.5 : 0.32
  state.breathing = false
}

export function updateAnatomyMaterial(
  state: AnatomyMaterial,
  dt: number,
  time: number,
  hovered: boolean,
  animateBreath = true,
) {
  const material = state.material
  const k = 1 - Math.exp(-dt * 9)
  material.color.lerp(state.targetColor, k)
  material.emissive.lerp(state.targetEmissive, k)

  const breath =
    state.breathing && animateBreath
      ? 0.07 + 0.05 * Math.sin((time / 2400) * Math.PI * 2)
      : 0
  const targetEmissive = state.targetEmissiveIntensity + breath + (hovered ? 0.16 : 0)
  material.emissiveIntensity += (targetEmissive - material.emissiveIntensity) * k

  const opacity = material.opacity + (state.targetOpacity - material.opacity) * k
  material.opacity = opacity

  const transparent = opacity < 0.995
  if (transparent !== material.transparent) {
    material.transparent = transparent
    material.needsUpdate = true
  }
  material.depthWrite = opacity > 0.6
}

export function disposeMaterial(state: AnatomyMaterial) {
  state.material.dispose()
}
