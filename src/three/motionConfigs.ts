import type { ExerciseView } from '../data/types'

export type Vec3 = [number, number, number]
export type EquipmentKind =
  | 'bench'
  | 'barbell'
  | 'dumbbells'
  | 'pullup-bar'
  | 'cable'
  | 'dip-bars'
  | 'mat'
  | 'step'
  | 'platform'
  | 'ball'

export interface ArmTargets {
  upper: Vec3
  fore: Vec3
}

export interface LegTargets {
  thigh: Vec3
  shin: Vec3
  foot: Vec3
}

export interface MotionConfig {
  root: { position: Vec3; rotationX: number; bob?: [number, number] }
  spine?: { start: Vec3; end: Vec3 }
  arms: { start: ArmTargets; end: ArmTargets }
  legs: { start: LegTargets; end: LegTargets }
  equipment: EquipmentKind[]
  barAnchor?: 'hands' | 'back'
  view: ExerciseView
}

const STAND_LEGS = {
  start: { thigh: [0, -1, 0] as Vec3, shin: [0, -1, 0] as Vec3, foot: [0, -0.05, 1] as Vec3 },
  end: { thigh: [0, -1, 0] as Vec3, shin: [0, -1, 0] as Vec3, foot: [0, -0.05, 1] as Vec3 },
}

const SUPINE_LEGS = {
  start: { thigh: [0, 0.05, 1] as Vec3, shin: [0, -1, 0.12] as Vec3, foot: [0, -0.05, 1] as Vec3 },
  end: { thigh: [0, 0.05, 1] as Vec3, shin: [0, -1, 0.12] as Vec3, foot: [0, -0.05, 1] as Vec3 },
}

const SEATED_LEGS = {
  start: { thigh: [0, -0.2, 1] as Vec3, shin: [0, -1, 0.1] as Vec3, foot: [0, -0.1, 1] as Vec3 },
  end: { thigh: [0, -0.2, 1] as Vec3, shin: [0, -1, 0.1] as Vec3, foot: [0, -0.1, 1] as Vec3 },
}

const SUPINE_ARMS = {
  start: { upper: [0.98, 0.02, -0.14] as Vec3, fore: [0.05, 0.86, 0.5] as Vec3 },
  end: { upper: [0.68, 0.74, -0.14] as Vec3, fore: [0.17, 0.98, 0.08] as Vec3 },
}

const FLY_ARMS = {
  start: { upper: [0.98, 0.2, 0.0] as Vec3, fore: [0.6, 0.8, 0.2] as Vec3 },
  end: { upper: [0.55, 0.55, 0.0] as Vec3, fore: [0.25, 0.95, 0.1] as Vec3 },
}

const DOWN_ARMS = {
  start: { upper: [0.15, -1, 0] as Vec3, fore: [0.1, -1, 0.1] as Vec3 },
  end: { upper: [0.15, -1, 0] as Vec3, fore: [0.1, -1, 0.1] as Vec3 },
}

const PRESS_ARMS = {
  start: { upper: [0.5, 0.4, 0.1] as Vec3, fore: [0.2, 0.9, 0.1] as Vec3 },
  end: { upper: [0.2, 0.9, 0.1] as Vec3, fore: [0.05, 1, 0] as Vec3 },
}

const RAISE_ARMS = {
  start: { upper: [0.2, -0.9, 0] as Vec3, fore: [0.2, -0.85, 0.15] as Vec3 },
  end: { upper: [0.95, 0.1, 0] as Vec3, fore: [1, 0.05, 0.05] as Vec3 },
}

const CURL_ARMS = {
  start: DOWN_ARMS.start,
  end: { upper: [0.15, -0.9, 0.1] as Vec3, fore: [0.1, 0.4, 0.9] as Vec3 },
}

const PUSHDOWN_ARMS = {
  start: { upper: [0.15, -0.9, 0.1] as Vec3, fore: [0.1, 0.4, 0.8] as Vec3 },
  end: { upper: [0.15, -0.9, 0.1] as Vec3, fore: [0.1, -0.9, 0.2] as Vec3 },
}

const OVERHEAD_EXT_ARMS = {
  start: { upper: [0.3, 0.8, 0.1] as Vec3, fore: [0.1, -0.2, -0.8] as Vec3 },
  end: { upper: [0.3, 0.8, 0.1] as Vec3, fore: [0.1, 0.9, 0] as Vec3 },
}

const ROW_ARMS = {
  start: { upper: [0.1, -0.8, 0.3] as Vec3, fore: [0.1, -0.7, 0.5] as Vec3 },
  end: { upper: [0.2, -0.2, -0.4] as Vec3, fore: [0.1, 0.3, 0.6] as Vec3 },
}

const FACE_PULL_ARMS = {
  start: { upper: [0.2, 0.2, 0.9] as Vec3, fore: [0.1, 0.3, 0.9] as Vec3 },
  end: { upper: [0.4, 0.3, 0.6] as Vec3, fore: [0.3, 0.4, 0.6] as Vec3 },
}

const HANG_ARMS = {
  start: { upper: [0.2, 1, 0] as Vec3, fore: [0.05, 1, 0] as Vec3 },
  end: { upper: [0.5, 0.8, 0.1] as Vec3, fore: [0.1, 1, 0] as Vec3 },
}

const PULLDOWN_ARMS = {
  start: { upper: [0.3, 0.9, 0] as Vec3, fore: [0.1, 1, 0] as Vec3 },
  end: { upper: [0.2, 0.2, 0.2] as Vec3, fore: [0.1, -0.5, 0.6] as Vec3 },
}

const SUPPORT_ARMS = {
  start: { upper: [0.3, -0.6, 0.1] as Vec3, fore: [0.1, -1, 0] as Vec3 },
  end: { upper: [0.15, -0.9, 0.1] as Vec3, fore: [0.05, -1, 0] as Vec3 },
}

const CRUNCH_ARMS = {
  start: { upper: [0.4, 0.4, 0.2] as Vec3, fore: [0.25, 0.5, 0.4] as Vec3 },
  end: { upper: [0.35, 0.55, -0.2] as Vec3, fore: [0.2, 0.6, 0.2] as Vec3 },
}

const TWIST_ARMS = {
  start: { upper: [0.2, 0.1, 0.9] as Vec3, fore: [0.1, 0.1, 0.9] as Vec3 },
  end: { upper: [0.5, 0.2, 0.7] as Vec3, fore: [0.4, 0.2, 0.7] as Vec3 },
}

const SUPINE_VIEW: ExerciseView = {
  camera: [1.5, 1.5, 3.2],
  target: [0, 0.55, 0],
  fov: 33,
}
const STAND_VIEW: ExerciseView = { camera: [1.9, 1.3, 3.1], target: [0, 0.95, 0], fov: 34 }
const HINGE_VIEW: ExerciseView = { camera: [2.4, 1.2, 2.2], target: [0, 0.8, 0], fov: 34 }
const SEATED_VIEW: ExerciseView = { camera: [2.0, 1.2, 2.6], target: [0, 0.7, 0], fov: 34 }
const HANG_VIEW: ExerciseView = { camera: [2.2, 1.5, 2.8], target: [0, 1.2, 0], fov: 34 }
const FLOOR_VIEW: ExerciseView = { camera: [2.6, 1.1, 1.6], target: [0, 0.3, 0], fov: 35 }

const STAND = { position: [0, 0.9, 0] as Vec3, rotationX: 0 }
const SUPINE = { position: [0, 0.55, 0.05] as Vec3, rotationX: -Math.PI / 2 }
const PRONE = { position: [0, 0.5, 0] as Vec3, rotationX: Math.PI / 2 }
const SEATED = { position: [0, 0.62, 0] as Vec3, rotationX: 0 }
const HANG = { position: [0, 1.0, 0] as Vec3, rotationX: 0 }
const DIP = { position: [0, 1.0, 0] as Vec3, rotationX: 0 }

const benchPress = (equipment: EquipmentKind[], barAnchor: 'hands' | 'back' = 'hands'): MotionConfig => ({
  root: SUPINE,
  arms: SUPINE_ARMS,
  legs: SUPINE_LEGS,
  equipment,
  barAnchor,
  view: SUPINE_VIEW,
})

export const MOTION_CONFIGS: Record<string, MotionConfig> = {
  'barbell-bench-press': benchPress(['bench', 'barbell']),
  'dumbbell-bench-press': benchPress(['bench', 'dumbbells']),
  'incline-bench-press': {
    root: { position: [0, 0.6, 0.1], rotationX: -1.05 },
    arms: SUPINE_ARMS,
    legs: SUPINE_LEGS,
    equipment: ['bench', 'barbell'],
    view: SUPINE_VIEW,
  },
  'push-up': {
    root: { ...PRONE, bob: [0, -0.1] },
    arms: SUPPORT_ARMS,
    legs: { start: { thigh: [0, -0.2, -1], shin: [0, -0.9, 0.3], foot: [0, -0.2, 1] }, end: { thigh: [0, -0.15, -1], shin: [0, -0.8, 0.3], foot: [0, -0.2, 1] } },
    equipment: ['mat'],
    view: FLOOR_VIEW,
  },
  'dumbbell-fly': {
    root: SUPINE,
    arms: FLY_ARMS,
    legs: SUPINE_LEGS,
    equipment: ['bench', 'dumbbells'],
    view: SUPINE_VIEW,
  },
  dips: {
    root: { ...DIP, bob: [0, 0.12] },
    arms: { start: { upper: [0.4, -0.5, 0.1], fore: [0.1, -1, 0] }, end: { upper: [0.3, -0.85, 0.1], fore: [0.05, -1, 0] } },
    legs: { start: { thigh: [0, -1, 0.25], shin: [0, -0.8, 0.5], foot: [0, -0.1, 1] }, end: { thigh: [0, -1, 0.25], shin: [0, -0.8, 0.5], foot: [0, -0.1, 1] } },
    equipment: ['dip-bars'],
    view: STAND_VIEW,
  },
  'pull-up': {
    root: { ...HANG, bob: [0, 0.16] },
    arms: HANG_ARMS,
    legs: { start: { thigh: [0, -1, 0.05], shin: [0, -1, 0.15], foot: [0, -0.1, 0.8] }, end: { thigh: [0, -1, 0.05], shin: [0, -1, 0.15], foot: [0, -0.1, 0.8] } },
    equipment: ['pullup-bar'],
    view: HANG_VIEW,
  },
  'lat-pulldown': {
    root: SEATED,
    arms: PULLDOWN_ARMS,
    legs: SEATED_LEGS,
    equipment: ['bench', 'cable'],
    view: SEATED_VIEW,
  },
  'barbell-row': {
    root: STAND,
    spine: { start: [0, 1, 0], end: [0, 0.45, 0.9] },
    arms: ROW_ARMS,
    legs: STAND_LEGS,
    equipment: ['barbell'],
    view: HINGE_VIEW,
  },
  'straight-arm-pulldown': {
    root: STAND,
    arms: { start: { upper: [0.25, 0.2, 0.9], fore: [0.2, 0.3, 0.9] }, end: { upper: [0.2, -0.8, 0.4], fore: [0.15, -0.9, 0.3] } },
    legs: STAND_LEGS,
    equipment: ['cable'],
    view: STAND_VIEW,
  },
  deadlift: {
    root: STAND,
    spine: { start: [0, 1, 0], end: [0, 0.4, 0.9] },
    arms: DOWN_ARMS,
    legs: { start: { thigh: [0, -1, 0], shin: [0, -1, 0], foot: [0, -0.05, 1] }, end: { thigh: [0, -0.85, 0.2], shin: [0, -0.95, -0.1], foot: [0, -0.05, 1] } },
    equipment: ['barbell'],
    view: HINGE_VIEW,
  },
  'seated-cable-row': {
    root: SEATED,
    arms: ROW_ARMS,
    legs: SEATED_LEGS,
    equipment: ['bench', 'cable'],
    view: SEATED_VIEW,
  },
  'overhead-press': {
    root: STAND,
    arms: PRESS_ARMS,
    legs: STAND_LEGS,
    equipment: ['barbell'],
    view: STAND_VIEW,
  },
  'lateral-raise': {
    root: STAND,
    arms: RAISE_ARMS,
    legs: STAND_LEGS,
    equipment: ['dumbbells'],
    view: STAND_VIEW,
  },
  'bent-over-reverse-fly': {
    root: STAND,
    spine: { start: [0, 1, 0], end: [0, 0.5, 0.8] },
    arms: RAISE_ARMS,
    legs: STAND_LEGS,
    equipment: ['dumbbells'],
    view: HINGE_VIEW,
  },
  'face-pull': {
    root: STAND,
    arms: FACE_PULL_ARMS,
    legs: STAND_LEGS,
    equipment: ['cable'],
    view: STAND_VIEW,
  },
  'barbell-curl': {
    root: STAND,
    arms: CURL_ARMS,
    legs: STAND_LEGS,
    equipment: ['barbell'],
    view: STAND_VIEW,
  },
  'hammer-curl': {
    root: STAND,
    arms: CURL_ARMS,
    legs: STAND_LEGS,
    equipment: ['dumbbells'],
    view: STAND_VIEW,
  },
  'close-grip-bench-press': benchPress(['bench', 'barbell']),
  'cable-triceps-pushdown': {
    root: STAND,
    arms: PUSHDOWN_ARMS,
    legs: STAND_LEGS,
    equipment: ['cable'],
    view: STAND_VIEW,
  },
  'overhead-triceps-extension': {
    root: STAND,
    arms: OVERHEAD_EXT_ARMS,
    legs: STAND_LEGS,
    equipment: ['dumbbells'],
    view: STAND_VIEW,
  },
  'back-squat': {
    root: { ...STAND, bob: [0, -0.18] },
    arms: { start: { upper: [0.4, 0.1, -0.4], fore: [0.3, 0.1, -0.5] }, end: { upper: [0.4, 0.1, -0.4], fore: [0.3, 0.1, -0.5] } },
    legs: { start: STAND_LEGS.start, end: { thigh: [0, -0.65, 0.5], shin: [0, -0.9, -0.2], foot: [0, -0.05, 1] } },
    equipment: ['barbell'],
    barAnchor: 'back',
    view: STAND_VIEW,
  },
  'leg-press': {
    root: { position: [0, 0.55, -0.2], rotationX: -0.4 },
    arms: { start: { upper: [0.4, -0.25, 0.35], fore: [0.2, -0.45, 0.45] }, end: { upper: [0.4, -0.25, 0.35], fore: [0.2, -0.45, 0.45] } },
    legs: { start: { thigh: [0, 0.3, 1], shin: [0, 0, 1], foot: [0, 0, 1] }, end: { thigh: [0, 0.5, 1], shin: [0, 0.4, 1], foot: [0, 0, 1] } },
    equipment: ['bench', 'platform'],
    view: { camera: [2.6, 1.1, 1.8], target: [0, 0.6, 0.2], fov: 35 },
  },
  lunge: {
    root: { ...STAND, bob: [0, -0.14] },
    arms: DOWN_ARMS,
    legs: { start: STAND_LEGS.start, end: { thigh: [0, -0.6, 0.6], shin: [0, -0.9, -0.2], foot: [0, -0.05, 1] } },
    equipment: ['dumbbells'],
    view: STAND_VIEW,
  },
  'romanian-deadlift': {
    root: STAND,
    spine: { start: [0, 1, 0], end: [0, 0.35, 0.95] },
    arms: DOWN_ARMS,
    legs: STAND_LEGS,
    equipment: ['barbell'],
    view: HINGE_VIEW,
  },
  'leg-curl': {
    root: { position: [0, 0.55, 0], rotationX: Math.PI / 2 },
    arms: { start: { upper: [0.2, 0.2, 0.8], fore: [0.1, 0.2, 0.8] }, end: { upper: [0.2, 0.2, 0.8], fore: [0.1, 0.2, 0.8] } },
    legs: { start: { thigh: [0, 0, -1], shin: [0, 0, -1], foot: [0, 0, -1] }, end: { thigh: [0, 0, -1], shin: [0, 0.8, -0.4], foot: [0, 0.6, -0.5] } },
    equipment: ['bench'],
    view: FLOOR_VIEW,
  },
  'calf-raise': {
    root: { ...STAND, bob: [0, 0.07] },
    arms: DOWN_ARMS,
    legs: { start: { thigh: [0, -1, 0], shin: [0, -1, 0], foot: [0, -0.05, 1] }, end: { thigh: [0, -1, 0], shin: [0, -1, 0], foot: [0, -0.2, 1] } },
    equipment: ['step'],
    view: STAND_VIEW,
  },
  plank: {
    root: PRONE,
    arms: SUPPORT_ARMS,
    legs: { start: { thigh: [0, -0.2, -1], shin: [0, -0.9, 0.3], foot: [0, -0.2, 1] }, end: { thigh: [0, -0.2, -1], shin: [0, -0.9, 0.3], foot: [0, -0.2, 1] } },
    equipment: ['mat'],
    view: FLOOR_VIEW,
  },
  crunch: {
    root: { position: [0, 0.25, 0], rotationX: -Math.PI / 2 },
    arms: CRUNCH_ARMS,
    legs: { start: { thigh: [0, -0.2, 1], shin: [0, -1, 0.2], foot: [0, -0.05, 1] }, end: { thigh: [0, -0.2, 1], shin: [0, -1, 0.2], foot: [0, -0.05, 1] } },
    equipment: ['mat'],
    view: SUPINE_VIEW,
  },
  'hanging-leg-raise': {
    root: HANG,
    arms: HANG_ARMS,
    legs: { start: { thigh: [0, -1, 0.05], shin: [0, -1, 0.15], foot: [0, -0.1, 0.8] }, end: { thigh: [0, 0.1, 1], shin: [0, -0.5, 1], foot: [0, -0.1, 1] } },
    equipment: ['pullup-bar'],
    view: HANG_VIEW,
  },
  'russian-twist': {
    root: SEATED,
    spine: { start: [0, 1, 0], end: [0.35, 1, 0.15] },
    arms: TWIST_ARMS,
    legs: SEATED_LEGS,
    equipment: ['mat', 'ball'],
    view: SEATED_VIEW,
  },
}

export const MOTION_EXERCISES = Object.keys(MOTION_CONFIGS)