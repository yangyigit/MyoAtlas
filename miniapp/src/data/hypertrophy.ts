import type { MuscleGroup, Region } from './types'

export type ResistanceProfile = 'lengthened' | 'mid' | 'shortened' | 'balanced'
export type DemandLevel = 'low' | 'medium' | 'high'

export interface ExerciseStimulus {
  emphasisZh: string
  resistanceProfile: ResistanceProfile
  stability: DemandLevel
  skill: DemandLevel
  noteZh: string
}

export const RESISTANCE_LABELS: Record<ResistanceProfile, string> = {
  lengthened: '拉伸位更难',
  mid: '中段更难',
  shortened: '收缩位更难',
  balanced: '全程/等长',
}

export const DEMAND_LABELS: Record<DemandLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const EXERCISE_STIMULUS: Record<string, ExerciseStimulus> = {
  'barbell-bench-press': {
    emphasisZh: '胸大肌整体（胸骨部偏多），三角肌前束与肱三头肌协同',
    resistanceProfile: 'mid',
    stability: 'medium',
    skill: 'medium',
    noteZh: '平板角度对胸大肌整体刺激均衡；肩部不适可换哑铃或中立握。',
  },
  'dumbbell-bench-press': {
    emphasisZh: '胸大肌整体，活动范围更大；肩袖稳定要求更高',
    resistanceProfile: 'mid',
    stability: 'medium',
    skill: 'medium',
    noteZh: '双侧独立，可用更长拉伸位；注意下放深度。',
  },
  'incline-bench-press': {
    emphasisZh: '胸大肌锁骨部/上胸，三角肌前束参与更多',
    resistanceProfile: 'mid',
    stability: 'medium',
    skill: 'medium',
    noteZh: '15–30° 上斜可增加上胸刺激，角度过陡会变成肩推。',
  },
  'push-up': {
    emphasisZh: '胸大肌、肱三头肌、前锯肌；核心与肩胛稳定',
    resistanceProfile: 'mid',
    stability: 'medium',
    skill: 'low',
    noteZh: '自重闭链，适合作为卧推降级或补充训练量。',
  },
  'dumbbell-fly': {
    emphasisZh: '胸大肌拉伸位，强调水平内收',
    resistanceProfile: 'lengthened',
    stability: 'medium',
    skill: 'low',
    noteZh: '拉伸位刺激明显，但肩前侧负荷高，重量不宜过大。',
  },
  dips: {
    emphasisZh: '胸大肌下束与肱三头肌，肩伸展末端',
    resistanceProfile: 'mid',
    stability: 'medium',
    skill: 'high',
    noteZh: '肩部要求高；可改用窄距卧推或绳索下压。',
  },
  'pull-up': {
    emphasisZh: '背阔肌/大圆肌，垂直拉；肱二头肌协同',
    resistanceProfile: 'shortened',
    stability: 'medium',
    skill: 'high',
    noteZh: '自重大、技能要求高；可用下拉积累训练量。',
  },
  'lat-pulldown': {
    emphasisZh: '背阔肌/大圆肌，可控垂直拉',
    resistanceProfile: 'shortened',
    stability: 'low',
    skill: 'low',
    noteZh: '适合稳定积累背阔肌训练量，注意先沉肩胛。',
  },
  'barbell-row': {
    emphasisZh: '背阔肌/菱形肌/斜方肌中束，水平拉',
    resistanceProfile: 'mid',
    stability: 'medium',
    skill: 'medium',
    noteZh: '俯身位对腰椎稳定有要求；腰背疲劳时改用坐姿划船。',
  },
  'straight-arm-pulldown': {
    emphasisZh: '背阔肌孤立，肩伸展',
    resistanceProfile: 'shortened',
    stability: 'low',
    skill: 'medium',
    noteZh: '适合作为背阔肌孤立补充；肩前侧不适时减小范围。',
  },
  deadlift: {
    emphasisZh: '臀大肌/腘绳肌/竖脊肌，髋铰链整体',
    resistanceProfile: 'mid',
    stability: 'high',
    skill: 'high',
    noteZh: '全身负荷大，恢复成本高；增肌可控制总量。',
  },
  'seated-cable-row': {
    emphasisZh: '背阔肌/菱形肌/斜方肌中束',
    resistanceProfile: 'mid',
    stability: 'low',
    skill: 'low',
    noteZh: '躯干有支撑，适合稳定积累水平拉训练量。',
  },
  'overhead-press': {
    emphasisZh: '三角肌前/中束，肱三头肌协同',
    resistanceProfile: 'mid',
    stability: 'high',
    skill: 'medium',
    noteZh: '过顶位对肩部要求高；肩不适可用地雷管/上斜推举替代。',
  },
  'lateral-raise': {
    emphasisZh: '三角肌中束，外展',
    resistanceProfile: 'lengthened',
    stability: 'low',
    skill: 'low',
    noteZh: '小重量、长杠杆；避免耸肩与超过肩高。',
  },
  'bent-over-reverse-fly': {
    emphasisZh: '三角肌后束/菱形肌',
    resistanceProfile: 'lengthened',
    stability: 'medium',
    skill: 'low',
    noteZh: '俯身位对腰椎有要求；也可用面拉替代。',
  },
  'face-pull': {
    emphasisZh: '三角肌后束/肩袖/肩胛后侧',
    resistanceProfile: 'shortened',
    stability: 'low',
    skill: 'low',
    noteZh: '肩胛后侧友好，适合作为推类训练的平衡补充。',
  },
  'barbell-curl': {
    emphasisZh: '肱二头肌/肱肌',
    resistanceProfile: 'mid',
    stability: 'low',
    skill: 'low',
    noteZh: '肘部固定，避免腰部摆动。',
  },
  'hammer-curl': {
    emphasisZh: '肱肌/肱桡肌',
    resistanceProfile: 'mid',
    stability: 'low',
    skill: 'low',
    noteZh: '中立握对肘部更友好，可补充肱肌训练量。',
  },
  'close-grip-bench-press': {
    emphasisZh: '肱三头肌/胸大肌',
    resistanceProfile: 'mid',
    stability: 'medium',
    skill: 'medium',
    noteZh: '肘伸肌腱负荷高；肘部不适改用绳索下压。',
  },
  'cable-triceps-pushdown': {
    emphasisZh: '肱三头肌外侧/内侧头',
    resistanceProfile: 'shortened',
    stability: 'low',
    skill: 'low',
    noteZh: '肘部固定，适合稳定积累肱三头肌训练量。',
  },
  'overhead-triceps-extension': {
    emphasisZh: '肱三头肌长头，过顶拉伸',
    resistanceProfile: 'lengthened',
    stability: 'low',
    skill: 'medium',
    noteZh: '长头拉伸明显；肩部不适时改用下压。',
  },
  'back-squat': {
    emphasisZh: '股四头肌/臀大肌，全身',
    resistanceProfile: 'mid',
    stability: 'high',
    skill: 'high',
    noteZh: '全身负荷大；膝腰不适可用腿举/箱蹲调整。',
  },
  'leg-press': {
    emphasisZh: '股四头肌/臀大肌，有支撑',
    resistanceProfile: 'mid',
    stability: 'low',
    skill: 'low',
    noteZh: '稳定积累下肢训练量，注意膝不锁死。',
  },
  lunge: {
    emphasisZh: '股四头肌/臀大肌/臀中肌，单腿',
    resistanceProfile: 'mid',
    stability: 'medium',
    skill: 'medium',
    noteZh: '单腿稳定与臀中肌参与更多；平衡不足可扶架。',
  },
  'romanian-deadlift': {
    emphasisZh: '腘绳肌/臀大肌，髋铰链拉伸位',
    resistanceProfile: 'lengthened',
    stability: 'medium',
    skill: 'medium',
    noteZh: '腘绳肌拉伸位刺激好；腰背疲劳时降重量。',
  },
  'leg-curl': {
    emphasisZh: '腘绳肌，膝屈孤立',
    resistanceProfile: 'shortened',
    stability: 'low',
    skill: 'low',
    noteZh: '孤立腘绳肌，适合与髋铰链互补。',
  },
  'calf-raise': {
    emphasisZh: '腓肠肌/比目鱼肌，跖屈',
    resistanceProfile: 'shortened',
    stability: 'low',
    skill: 'low',
    noteZh: '顶端收缩与底部拉伸都做；避免弹震。',
  },
  plank: {
    emphasisZh: '核心等长，抗伸展',
    resistanceProfile: 'balanced',
    stability: 'medium',
    skill: 'low',
    noteZh: '等长稳定，不直接产生大幅肌肉长度变化。',
  },
  crunch: {
    emphasisZh: '腹直肌，脊柱屈曲',
    resistanceProfile: 'mid',
    stability: 'low',
    skill: 'low',
    noteZh: '小幅度、控制；腰痛时改用抗伸展动作。',
  },
  'hanging-leg-raise': {
    emphasisZh: '腹直肌/髂腰肌，骨盆后倾',
    resistanceProfile: 'shortened',
    stability: 'medium',
    skill: 'medium',
    noteZh: '悬垂位对肩部有要求；避免摆荡借力。',
  },
  'russian-twist': {
    emphasisZh: '腹斜肌，旋转',
    resistanceProfile: 'mid',
    stability: 'low',
    skill: 'low',
    noteZh: '腰椎旋转+屈曲组合；腰痛时改用抗旋转训练。',
  },
}

export interface VolumeGuide {
  min: number
  max: number
  noteZh: string
}

const REGION_VOLUME_GUIDE: Record<Region, VolumeGuide> = {
  chest: { min: 10, max: 20, noteZh: '胸大肌/胸小肌直接训练组数，间接刺激按角色折算。' },
  back: { min: 10, max: 20, noteZh: '背阔肌/菱形肌/斜方肌等水平与垂直拉。' },
  shoulder: { min: 8, max: 16, noteZh: '三角肌与肩袖；肩袖小肌群直接训练量可更低。' },
  arm: { min: 6, max: 14, noteZh: '肱二头肌/肱三头肌/前臂；小肌群恢复更快。' },
  leg: { min: 10, max: 20, noteZh: '股四头肌/臀/腘绳肌/小腿；大肌群可承受更高容量。' },
  core: { min: 6, max: 15, noteZh: '腹直肌/腹斜肌/腹横肌；等长与动态结合。' },
  head: { min: 0, max: 0, noteZh: '本工具不做头颈部增肌建议。' },
}

const MUSCLE_VOLUME_OVERRIDES: Partial<Record<string, VolumeGuide>> = {
  'pectoralis-major': { min: 10, max: 20, noteZh: '胸大肌直接组数；上/中/下胸可通过角度分配。' },
  'pectoralis-minor': { min: 4, max: 10, noteZh: '多为辅助/稳定角色，不一定要单独堆积组数。' },
  'serratus-anterior': { min: 4, max: 10, noteZh: '推类与肩胛前伸动作可间接刺激。' },
  'supraspinatus': { min: 4, max: 10, noteZh: '肩袖小肌群，外展/稳定动作即可。' },
  infraspinatus: { min: 4, max: 10, noteZh: '外旋与肩袖稳定，面拉/外旋可补充。' },
  'teres-minor': { min: 4, max: 10, noteZh: '外旋与肩袖稳定。' },
  subscapularis: { min: 4, max: 10, noteZh: '内旋与肩袖稳定。' },
  'rectus-abdominis': { min: 6, max: 15, noteZh: '动态屈曲与抗伸展结合。' },
  'external-oblique': { min: 6, max: 15, noteZh: '旋转/抗旋转与侧屈。' },
  'internal-oblique': { min: 6, max: 15, noteZh: '旋转/抗旋转与腹压。' },
  'transversus-abdominis': { min: 4, max: 12, noteZh: '腹压与抗伸展，多为等长/稳定角色。' },
  quadriceps: { min: 10, max: 20, noteZh: '股四头肌整体；可分配深蹲/腿举/腿屈伸。' },
  hamstrings: { min: 8, max: 16, noteZh: '髋伸展与膝屈曲两个方向都可分配。' },
  'gluteus-maximus': { min: 8, max: 16, noteZh: '髋伸/髋铰链为主。' },
  'gluteus-medius': { min: 6, max: 14, noteZh: '髋外展/单腿稳定，可加入侧向训练。' },
  gastrocnemius: { min: 8, max: 16, noteZh: '小腿需要较高频率与全范围。' },
  soleus: { min: 8, max: 16, noteZh: '屈膝提踵可更多刺激比目鱼肌。' },
  'forearm-flexors': { min: 4, max: 12, noteZh: '握力与腕屈，拉类动作会间接刺激。' },
  'forearm-extensors': { min: 4, max: 12, noteZh: '腕伸与稳定，注意肘外侧负荷。' },
}

export function volumeGuideFor(muscle: MuscleGroup): VolumeGuide | null {
  if (muscle.id === 'other-muscles') return null
  return MUSCLE_VOLUME_OVERRIDES[muscle.id] ?? REGION_VOLUME_GUIDE[muscle.region]
}

export const ROLE_WEIGHTS = {
  primary: 1,
  secondary: 0.5,
  stabilizer: 0.25,
} as const

export const HYPERTROPHY_DISCLAIMER =
  '训练量为一般增肌教育参考，不是个体处方。请结合恢复、动作质量、疼痛与教练/医生建议调整。'
