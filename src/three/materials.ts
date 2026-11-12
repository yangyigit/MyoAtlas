import * as THREE from 'three'
import type { LayerName, MuscleRole } from '../data/types'

export const PALETTE = {
  muscleBase: '#7e3a33',
  boneBase: '#d8c8ae',
  jointBase: '#3a6b72',
  primary: '#b53c33',
  secondary: '#a95c3a',
  stabilizer: '#b08a50',
  boneActive: '#efd8af',
  jointActive: '#4fd6e0',
  inactive: '#462a27',
  inactiveBone: '#5f5749',
  inactiveJoint: '#2f555b',
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
const FOCUS_TINT = new THREE.Color(0xffb199)
const FOCUS_EMISSIVE = new THREE.Color(0xff5c3c)

export interface AnatomyMaterial {
  material: THREE.MeshStandardMaterial
  targetColor: THREE.Color
  targetEmissive: THREE.Color
  targetEmissiveIntensity: number
  targetOpacity: number
  breathing: boolean
  shade: number
}

function tinted(color: THREE.Color, shade: number) {
  return color.clone().multiplyScalar(shade)
}

const ORGANIC_NOISE_KEY = 'organic-noise-v1'

function addOrganicSurfaceDetail(material: THREE.MeshPhysicalMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 vMusclePos;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vMusclePos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
    )

    shader.fragmentShader = `
      varying vec3 vMusclePos;
      float mHash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float mNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(mHash(i), mHash(i + vec3(1.0, 0.0, 0.0)), f.x),
              mix(mHash(i + vec3(0.0, 1.0, 0.0)), mHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
          mix(mix(mHash(i + vec3(0.0, 0.0, 1.0)), mHash(i + vec3(1.0, 0.0, 1.0)), f.x),
              mix(mHash(i + vec3(0.0, 1.0, 1.0)), mHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
          f.z
        );
      }
    ` + shader.fragmentShader
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float mottling = mNoise(vMusclePos * 34.0) * 0.65 + mNoise(vMusclePos * 96.0) * 0.35;
        float fibers = 0.5 + 0.5 * sin(
          (vMusclePos.x * 0.55 + vMusclePos.y * 0.35 + vMusclePos.z * 0.45) * 110.0
        );
        diffuseColor.rgb *= mix(0.82, 1.06, mottling) * mix(0.97, 1.03, fibers);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (mottling - 0.5) * 0.14, 0.22, 0.95);`,
      )
  }
  material.customProgramCacheKey = () => ORGANIC_NOISE_KEY
}

export function createAnatomyMaterial(layer: LayerName, seed = 0): AnatomyMaterial {
  const shade = 0.93 + ((seed * 37) % 100) / 100 * 0.1

  let material: THREE.MeshStandardMaterial
  if (layer === 'muscles') {
    const physical = new THREE.MeshPhysicalMaterial({
      color: tinted(BASE[layer], shade),
      roughness: 0.54,
      metalness: 0,
      clearcoat: 0.28,
      clearcoatRoughness: 0.55,
      sheen: 0.35,
      sheenRoughness: 0.75,
      sheenColor: new THREE.Color(0xff8f7c),
      emissive: 0x000000,
      emissiveIntensity: 0,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      side: THREE.FrontSide,
    })
    addOrganicSurfaceDetail(physical)
    material = physical
  } else {
    material = new THREE.MeshStandardMaterial({
      color: tinted(BASE[layer], shade),
      roughness: layer === 'joints' ? 0.45 : 0.62,
      metalness: layer === 'joints' ? 0.08 : 0.02,
      emissive: 0x000000,
      emissiveIntensity: 0,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      side: THREE.FrontSide,
    })
  }

  return {
    material,
    targetColor: tinted(BASE[layer], shade),
    targetEmissive: new THREE.Color(0x000000),
    targetEmissiveIntensity: 0,
    targetOpacity: 1,
    breathing: false,
    shade,
  }
}

export function createConnectiveMaterial(): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xd6c5ac,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.6,
    sheen: 0.2,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(0xfff0dc),
    side: THREE.FrontSide,
  })
  addOrganicSurfaceDetail(material)
  return material
}

export function setBase(state: AnatomyMaterial, layer: LayerName, reveal: boolean) {
  state.targetColor.copy(tinted(BASE[layer], state.shade))
  state.targetEmissive.setRGB(0, 0, 0)
  state.targetEmissiveIntensity = 0
  state.targetOpacity = layer === 'muscles' && reveal ? 0.42 : 1
  state.breathing = false
}

export function setRole(state: AnatomyMaterial, role: MuscleRole) {
  const color = tinted(ROLE[role], state.shade)
  state.targetColor.copy(color)
  state.targetEmissive.copy(color)
  state.targetEmissiveIntensity = role === 'primary' ? 0.2 : role === 'secondary' ? 0.14 : 0.1
  state.targetOpacity = 1
  state.breathing = true
}

export function setActiveBone(state: AnatomyMaterial) {
  const color = tinted(ACTIVE_BONE, state.shade)
  state.targetColor.copy(color)
  state.targetEmissive.copy(color)
  state.targetEmissiveIntensity = 0.14
  state.targetOpacity = 1
  state.breathing = false
}

export function setActiveJoint(state: AnatomyMaterial) {
  const color = tinted(ACTIVE_JOINT, state.shade)
  state.targetColor.copy(color)
  state.targetEmissive.copy(color)
  state.targetEmissiveIntensity = 0.4
  state.targetOpacity = 1
  state.breathing = false
}

export function setDim(state: AnatomyMaterial, layer: LayerName, reveal: boolean) {
  state.targetColor.copy(tinted(DIM[layer], state.shade))
  state.targetEmissive.setRGB(0, 0, 0)
  state.targetEmissiveIntensity = 0
  state.targetOpacity =
    layer === 'muscles' ? (reveal ? 0.4 : 0.64) : layer === 'bones' ? 0.4 : 0.35
  state.breathing = false
}

/** 点击引导线后的聚焦高亮：提亮 + 强发光 */
export function setFocused(state: AnatomyMaterial) {
  state.targetColor.lerp(FOCUS_TINT, 0.24)
  state.targetEmissive.copy(FOCUS_EMISSIVE)
  state.targetEmissiveIntensity = 0.55
  state.targetOpacity = 1
  state.breathing = true
}

/** 聚焦某块肌肉时，其他肌肉稍作压暗，形成对比 */
export function setMuted(state: AnatomyMaterial) {
  state.targetColor.multiplyScalar(0.68)
  state.targetEmissiveIntensity *= 0.35
  state.breathing = false
}

export function updateAnatomyMaterial(
  state: AnatomyMaterial,
  dt: number,
  time: number,
  hovered: boolean,
  animateBreath = true,
  focused = false,
) {
  const material = state.material
  const k = 1 - Math.exp(-dt * 9)
  material.color.lerp(state.targetColor, k)
  material.emissive.lerp(state.targetEmissive, k)

  const breath =
    state.breathing && animateBreath
      ? 0.01 + 0.012 * Math.sin((time / 2400) * Math.PI * 2)
      : 0
  const pulse = focused
    ? animateBreath
      ? 0.18 * (0.5 + 0.5 * Math.sin((time / 640) * Math.PI * 2))
      : 0.16
    : 0
  const targetEmissive = state.targetEmissiveIntensity + breath + pulse + (hovered ? 0.1 : 0)
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
