import { describe, expect, it } from 'vitest'
import manifest from '../public/models/manifest.json'
import { BONES, BONE_BY_ID } from '../src/data/bones'
import { EXERCISES } from '../src/data/exercises'
import { JOINTS } from '../src/data/joints'
import { MUSCLES, MUSCLE_BY_ID } from '../src/data/muscles'
import { searchExercises } from '../src/data/search'
import { EXERCISE_KNOWLEDGE, JOINT_GUIDE, MUSCLE_KNOWLEDGE } from '../src/data/knowledge'
import { DEFAULT_PAIN_ANSWERS, PAIN_REGIONS, triagePain } from '../src/data/pain'
import { EXERCISE_STIMULUS, ROLE_WEIGHTS, volumeGuideFor } from '../src/data/hypertrophy'

const muscleNodes = new Set(manifest.layers.muscles.nodes.map((node) => node.id))
const boneNodes = new Set(manifest.layers.bones.nodes.map((node) => node.id))
const jointNodes = new Set(manifest.layers.joints.nodes.map((node) => node.id))
const totalBytes = Object.values(manifest.layers).reduce((sum, layer) => sum + layer.bytes, 0)

describe('anatomy data', () => {
  it('has unique structure ids', () => {
    expect(new Set(MUSCLES.map((m) => m.id)).size).toBe(MUSCLES.length)
    expect(new Set(BONES.map((b) => b.id)).size).toBe(BONES.length)
    expect(new Set(JOINTS.map((j) => j.id)).size).toBe(JOINTS.length)
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length)
  })

  it('resolves every exercise reference', () => {
    for (const exercise of EXERCISES) {
      for (const muscle of exercise.muscles) {
        expect(MUSCLE_BY_ID[muscle.id], `${exercise.id} muscle ${muscle.id}`).toBeTruthy()
      }
      for (const bone of exercise.bones) {
        expect(BONE_BY_ID[bone], `${exercise.id} bone ${bone}`).toBeTruthy()
      }
      for (const joint of exercise.joints) {
        expect(JOINTS.some((item) => item.id === joint.id), `${exercise.id} joint ${joint.id}`).toBe(true)
      }
    }
  })

  it('gives every exercise primary, secondary and stabilizer work', () => {
    for (const exercise of EXERCISES) {
      const roles = new Set(exercise.muscles.map((m) => m.role))
      expect(exercise.muscles.length, exercise.id).toBeGreaterThanOrEqual(3)
      expect(roles.has('primary'), `${exercise.id} primary`).toBe(true)
      expect(roles.has('secondary'), `${exercise.id} secondary`).toBe(true)
      expect(roles.has('stabilizer'), `${exercise.id} stabilizer`).toBe(true)

      const ids = exercise.muscles.map((m) => m.id)
      expect(new Set(ids).size, `${exercise.id} duplicate muscles`).toBe(ids.length)
      expect(exercise.joints.length, `${exercise.id} joints`).toBeGreaterThan(0)
      expect(new Set(exercise.joints.map((j) => j.id)).size).toBe(exercise.joints.length)
    }
  })

  it('has valid camera views', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.view.camera).toHaveLength(3)
      expect(exercise.view.target).toHaveLength(3)
      expect(exercise.view.camera.every(Number.isFinite)).toBe(true)
      expect(exercise.view.target.every(Number.isFinite)).toBe(true)
    }
  })

  it('keeps names and aliases unambiguous', () => {
    const owners = new Map<string, string>()
    for (const exercise of EXERCISES) {
      for (const label of [exercise.nameZh, exercise.nameEn, ...exercise.aliases]) {
        const key = label.trim().toLowerCase()
        const owner = owners.get(key)
        if (owner) expect(owner, `duplicate label "${label}"`).toBe(exercise.id)
        owners.set(key, exercise.id)
      }
    }
  })
})

describe('generated assets', () => {
  it('covers every structure with a GLB node', () => {
    for (const muscle of MUSCLES) expect(muscleNodes.has(muscle.id), muscle.id).toBe(true)
    for (const bone of BONES) expect(boneNodes.has(bone.id), bone.id).toBe(true)
    for (const joint of JOINTS) {
      if (joint.id === 'scapulothoracic') continue
      expect(jointNodes.has(joint.id), joint.id).toBe(true)
    }
  })

  it('stays within the asset budget', () => {
    expect(muscleNodes.size).toBe(41)
    expect(boneNodes.size).toBe(20)
    expect(jointNodes.size).toBe(11)
    const softLayer = (manifest.layers as Record<string, { nodes: { id: string }[] }>)[
      'soft-tissue'
    ]
    expect(softLayer?.nodes[0]?.id).toBe('tissue')
    expect(totalBytes).toBeLessThanOrEqual(12 * 1024 * 1024)
    expect(manifest.model.height).toBe(1.75)
  })
})

describe('exercise knowledge', () => {
  it('covers every exercise with cues, risks and valid substitutions', () => {
    for (const exercise of EXERCISES) {
      const knowledge = EXERCISE_KNOWLEDGE[exercise.id]
      expect(knowledge, exercise.id).toBeTruthy()
      expect(knowledge.summaryZh.length).toBeGreaterThan(10)
      expect(knowledge.cues.length).toBeGreaterThan(0)
      expect(knowledge.errors.length).toBeGreaterThan(0)
      expect(knowledge.risks.length).toBeGreaterThan(0)
      expect(knowledge.substitutions.length).toBeGreaterThan(0)
      for (const joint of exercise.joints) {
        expect(
          knowledge.jointStress[joint.id]?.level,
          `${exercise.id} ${joint.id}`,
        ).toMatch(/^(low|medium|high)$/)
      }
      for (const substitution of knowledge.substitutions) {
        if (substitution.exerciseId) {
          expect(EXERCISES.some((item) => item.id === substitution.exerciseId)).toBe(true)
        }
      }
    }
  })

  it('documents every muscle and joint', () => {
    for (const muscle of MUSCLES) {
      expect(MUSCLE_KNOWLEDGE[muscle.id].functionZh.length).toBeGreaterThan(5)
    }
    for (const joint of JOINTS) {
      expect(JOINT_GUIDE[joint.id].romZh.length).toBeGreaterThan(3)
    }
  })
})

describe('hypertrophy data', () => {
  it('covers every exercise with a stimulus profile', () => {
    for (const exercise of EXERCISES) {
      const stimulus = EXERCISE_STIMULUS[exercise.id]
      expect(stimulus, exercise.id).toBeTruthy()
      expect(stimulus.emphasisZh.length).toBeGreaterThan(5)
      expect(['lengthened', 'mid', 'shortened', 'balanced']).toContain(
        stimulus.resistanceProfile,
      )
      expect(['low', 'medium', 'high']).toContain(stimulus.stability)
      expect(['low', 'medium', 'high']).toContain(stimulus.skill)
    }
    expect(ROLE_WEIGHTS.primary).toBe(1)
    expect(ROLE_WEIGHTS.stabilizer).toBeLessThan(ROLE_WEIGHTS.secondary)
  })

  it('provides volume guides for trainable muscles', () => {
    for (const muscle of MUSCLES) {
      const guide = volumeGuideFor(muscle)
      if (muscle.id === 'other-muscles') {
        expect(guide).toBeNull()
        continue
      }
      expect(guide, muscle.id).toBeTruthy()
      expect(guide!.min).toBeLessThanOrEqual(guide!.max)
      expect(guide!.noteZh.length).toBeGreaterThan(3)
    }
  })
})

describe('pain triage', () => {
  it('covers body regions with valid references', () => {
    expect(PAIN_REGIONS.length).toBeGreaterThanOrEqual(12)
    expect(new Set(PAIN_REGIONS.map((region) => region.id)).size).toBe(PAIN_REGIONS.length)
    for (const region of PAIN_REGIONS) {
      expect(region.shapes.length, region.id).toBeGreaterThan(0)
      expect(region.structures.length, region.id).toBeGreaterThan(0)
      expect(region.exerciseIds.length, region.id).toBeGreaterThan(0)
      for (const exerciseId of region.exerciseIds) {
        expect(EXERCISES.some((exercise) => exercise.id === exerciseId), `${region.id} ${exerciseId}`).toBe(true)
      }
      for (const structure of region.structures) {
        expect(structure.nameZh.length, region.id).toBeGreaterThan(0)
        if (structure.muscleId) expect(MUSCLE_BY_ID[structure.muscleId], structure.nameZh).toBeTruthy()
        if (structure.boneId) expect(BONE_BY_ID[structure.boneId], structure.nameZh).toBeTruthy()
        if (structure.jointId) expect(JOINTS.some((joint) => joint.id === structure.jointId), structure.nameZh).toBe(true)
      }
    }
  })

  it('marks red flags as urgent', () => {
    const flags = [
      'swelling',
      'locking',
      'instability',
      'numbness',
      'weakness',
      'trauma',
      'nightPain',
      'cantBearWeight',
    ] as const
    for (const flag of flags) {
      expect(triagePain({ ...DEFAULT_PAIN_ANSWERS, [flag]: true }).level, flag).toBe('urgent')
    }
    expect(triagePain({ ...DEFAULT_PAIN_ANSWERS, intensity: 8 }).level).toBe('urgent')
  })

  it('recommends caution for moderate or persistent pain', () => {
    expect(triagePain({ ...DEFAULT_PAIN_ANSWERS, intensity: 5 }).level).toBe('caution')
    expect(triagePain({ ...DEFAULT_PAIN_ANSWERS, duration: '1to4w' }).level).toBe('caution')
    expect(triagePain({ ...DEFAULT_PAIN_ANSWERS, onset: 'during' }).level).toBe('caution')
  })

  it('recommends self-care for mild short-lived pain', () => {
    expect(triagePain(DEFAULT_PAIN_ANSWERS).level).toBe('self-care')
  })
})

describe('exercise search', () => {
  it('finds bench press by its Chinese alias', () => {
    expect(searchExercises('卧推')[0]?.id).toBe('barbell-bench-press')
  })

  it('normalizes spaces and case', () => {
    expect(searchExercises('  Bench  ')[0]?.id).toBe('barbell-bench-press')
    expect(searchExercises('深 蹲')[0]?.id).toBe('back-squat')
  })

  it('respects category filters', () => {
    const results = searchExercises('', 'leg')
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((exercise) => exercise.category === 'leg')).toBe(true)
  })

  it('returns an empty list for unknown movements', () => {
    expect(searchExercises('不存在的动作')).toEqual([])
  })

  it('returns all 31 movements for an empty query', () => {
    expect(searchExercises('').length).toBe(31)
  })
})
