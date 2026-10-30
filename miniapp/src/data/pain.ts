import type { BoneId, JointId, MuscleId } from './types'

export type PainView = 'front' | 'back'
export type StructureType = '肌肉' | '肌腱' | '关节' | '骨骼'
export type TriageLevel = 'self-care' | 'caution' | 'urgent'

export interface PainShape {
  x: number
  y: number
  w: number
  h: number
  rx?: number
}

export interface PainStructure {
  nameZh: string
  type: StructureType
  noteZh: string
  muscleId?: MuscleId
  jointId?: JointId
  boneId?: BoneId
}

export interface PainRegion {
  id: string
  nameZh: string
  view: PainView
  shapes: PainShape[]
  structures: PainStructure[]
  exerciseIds: string[]
  adviceZh: string
}

export interface PainAnswers {
  intensity: number
  onset: 'during' | 'after' | 'rest' | 'night'
  duration: 'lt1w' | '1to4w' | 'gt4w'
  swelling: boolean
  locking: boolean
  instability: boolean
  numbness: boolean
  weakness: boolean
  trauma: boolean
  nightPain: boolean
  cantBearWeight: boolean
}

export interface TriageResult {
  level: TriageLevel
  titleZh: string
  reasons: string[]
  adviceZh: string
}

export const PAIN_DISCLAIMER =
  '本工具用于运动解剖学习与辅助排查，不构成医疗诊断或治疗建议。疼痛持续、加重或伴随红旗信号时，请停止训练并咨询医生或物理治疗师。'

const rect = (x: number, y: number, w: number, h: number, rx = 8): PainShape => ({
  x,
  y,
  w,
  h,
  rx,
})

export const PAIN_REGIONS: PainRegion[] = [
  {
    id: 'neck',
    nameZh: '颈部',
    view: 'front',
    shapes: [rect(114, 60, 32, 30)],
    structures: [
      { nameZh: '颈椎', type: '骨骼', noteZh: '颈部疼痛若伴随麻木、放射痛或无力，需要优先排除神经症状。', boneId: 'spine' },
      { nameZh: '斜方肌上束', type: '肌肉', noteZh: '常因耸肩、长时间紧张而疲劳。', muscleId: 'trapezius-upper' },
      { nameZh: '肩胛提肌', type: '肌肉', noteZh: '颈肩交界常见紧张点。', muscleId: 'levator-scapulae' },
    ],
    exerciseIds: ['overhead-press', 'face-pull', 'barbell-row'],
    adviceZh: '先降低耸肩与颈部代偿，避免大重量过顶动作；伴随上肢麻木/无力时尽快就医。',
  },
  {
    id: 'shoulder',
    nameZh: '肩部',
    view: 'front',
    shapes: [rect(58, 92, 46, 42), rect(156, 92, 46, 42)],
    structures: [
      { nameZh: '冈上肌 / 肩袖', type: '肌腱', noteZh: '过顶或外展动作中可能与肩峰下空间相关。', muscleId: 'supraspinatus' },
      { nameZh: '三角肌前/中束', type: '肌肉', noteZh: '推举与外展动作的主要发力肌。', muscleId: 'deltoid-anterior' },
      { nameZh: '肱二头肌长头腱', type: '肌腱', noteZh: '肩前侧疼痛常需要评估长头腱。', muscleId: 'biceps-brachii' },
      { nameZh: '肩锁关节', type: '关节', noteZh: '推举/飞鸟末端或肩部撞击后可能受压。', jointId: 'acromioclavicular' },
    ],
    exerciseIds: ['overhead-press', 'lateral-raise', 'barbell-bench-press', 'dips', 'face-pull'],
    adviceZh: '先减少过顶与深度外展范围，检查肩胛上回旋与后缩控制；肩前侧疼痛持续时就医评估肩袖。',
  },
  {
    id: 'chest',
    nameZh: '胸部',
    view: 'front',
    shapes: [rect(98, 94, 64, 58)],
    structures: [
      { nameZh: '胸大肌 / 肌腱', type: '肌肉', noteZh: '卧推/飞鸟末端拉伸位负荷较高。', muscleId: 'pectoralis-major' },
      { nameZh: '胸小肌', type: '肌肉', noteZh: '过度紧张可能限制肩胛后倾。', muscleId: 'pectoralis-minor' },
      { nameZh: '胸骨 / 肋骨', type: '骨骼', noteZh: '胸骨或肋骨疼痛需与内脏/呼吸相关症状区分。', boneId: 'sternum' },
    ],
    exerciseIds: ['barbell-bench-press', 'dumbbell-fly', 'push-up', 'dips'],
    adviceZh: '减少卧推/飞鸟末端过深范围，保持肩胛后缩下沉；胸痛伴气短、心悸等全身症状时立即就医。',
  },
  {
    id: 'elbow',
    nameZh: '肘部',
    view: 'front',
    shapes: [rect(54, 184, 28, 28), rect(178, 184, 28, 28)],
    structures: [
      { nameZh: '前臂伸肌群起点（肘外侧）', type: '肌腱', noteZh: '握力与伸腕负荷过大时常见刺激点。', muscleId: 'forearm-extensors' },
      { nameZh: '前臂屈肌群起点（肘内侧）', type: '肌腱', noteZh: '反复屈腕/握力与拉类动作相关。', muscleId: 'forearm-flexors' },
      { nameZh: '肱二头肌 / 肱三头肌肌腱', type: '肌腱', noteZh: '肘前/后侧肌腱在弯举与臂屈伸中负荷。', muscleId: 'biceps-brachii' },
    ],
    exerciseIds: ['barbell-curl', 'hammer-curl', 'barbell-row', 'cable-triceps-pushdown', 'close-grip-bench-press'],
    adviceZh: '减少握力与腕部代偿，改用中立握/绳索；肘部持续肿痛或卡锁时就医。',
  },
  {
    id: 'wrist',
    nameZh: '腕 / 前臂',
    view: 'front',
    shapes: [rect(54, 214, 28, 52), rect(178, 214, 28, 52)],
    structures: [
      { nameZh: '桡腕关节', type: '关节', noteZh: '腕背伸位承重（俯卧撑/卧推）负荷较高。', jointId: 'wrist' },
      { nameZh: '前臂屈肌群', type: '肌肉', noteZh: '握力与腕屈曲。', muscleId: 'forearm-flexors' },
      { nameZh: '前臂伸肌群', type: '肌肉', noteZh: '腕伸展与稳定。', muscleId: 'forearm-extensors' },
    ],
    exerciseIds: ['push-up', 'barbell-bench-press', 'barbell-curl', 'close-grip-bench-press'],
    adviceZh: '保持腕中立位，必要时用握把/护腕；麻木、刺痛或握力明显下降时就医。',
  },
  {
    id: 'abdomen',
    nameZh: '腹部',
    view: 'front',
    shapes: [rect(98, 152, 64, 58)],
    structures: [
      { nameZh: '腹直肌', type: '肌肉', noteZh: '屈曲核心；反复卷腹可能引起腹肌延迟性酸痛。', muscleId: 'rectus-abdominis' },
      { nameZh: '腹斜肌', type: '肌肉', noteZh: '旋转/侧屈；俄罗斯转体负荷较高。', muscleId: 'external-oblique' },
      { nameZh: '腹横肌', type: '肌肉', noteZh: '腹压与腰椎稳定。', muscleId: 'transversus-abdominis' },
    ],
    exerciseIds: ['crunch', 'plank', 'hanging-leg-raise', 'russian-twist'],
    adviceZh: '区分训练后酸痛与锐痛/持续痛；腹痛伴恶心、发热或局部包块时就医。',
  },
  {
    id: 'hip-groin',
    nameZh: '髋 / 腹股沟',
    view: 'front',
    shapes: [rect(96, 208, 68, 44)],
    structures: [
      { nameZh: '髂腰肌', type: '肌肉', noteZh: '髋屈曲与腰椎稳定；过紧可能增加腰椎前凸。', muscleId: 'iliopsoas' },
      { nameZh: '内收肌群', type: '肌肉', noteZh: '深蹲/弓步中内收肌拉伤风险。', muscleId: 'adductors' },
      { nameZh: '髋关节', type: '关节', noteZh: '深屈曲+内旋可能增加髋臼撞击相关压力。', jointId: 'hip' },
    ],
    exerciseIds: ['back-squat', 'lunge', 'deadlift', 'romanian-deadlift', 'leg-press'],
    adviceZh: '减少过深髋屈曲与内旋，先控制髋外展/骨盆稳定；腹股沟持续痛或卡顿时就医。',
  },
  {
    id: 'thigh-front',
    nameZh: '大腿前侧',
    view: 'front',
    shapes: [rect(88, 254, 32, 80), rect(140, 254, 32, 80)],
    structures: [
      { nameZh: '股四头肌', type: '肌肉', noteZh: '膝伸展；深蹲/腿举中负荷高。', muscleId: 'quadriceps' },
      { nameZh: '股直肌', type: '肌肉', noteZh: '跨髋膝双关节，髋屈曲/膝伸展都参与。', muscleId: 'quadriceps' },
      { nameZh: '髂腰肌', type: '肌肉', noteZh: '髋屈曲，可能参与大腿前侧牵拉感。', muscleId: 'iliopsoas' },
    ],
    exerciseIds: ['back-squat', 'lunge', 'leg-press', 'leg-curl'],
    adviceZh: '区分肌肉酸痛与拉伤；突发撕裂感、肿胀或明显无力时停止训练并就医。',
  },
  {
    id: 'knee',
    nameZh: '膝部',
    view: 'front',
    shapes: [rect(88, 334, 32, 32), rect(140, 334, 32, 32)],
    structures: [
      { nameZh: '髌股关节', type: '关节', noteZh: '深蹲/弓步中膝前侧压力；膝内扣时增加。', jointId: 'knee' },
      { nameZh: '股四头肌 / 髌腱', type: '肌腱', noteZh: '跳跃、深蹲与腿举中髌腱负荷高。', muscleId: 'quadriceps' },
      { nameZh: '鹅足 / 内侧结构', type: '肌腱', noteZh: '膝内侧疼痛需要结合内收肌与腘绳肌评估。' },
    ],
    exerciseIds: ['back-squat', 'lunge', 'leg-press', 'leg-curl'],
    adviceZh: '先减小深蹲深度/负荷，确保膝盖对齐脚尖；肿胀、交锁、打软腿时尽快就医。',
  },
  {
    id: 'shin-ankle',
    nameZh: '小腿 / 踝',
    view: 'front',
    shapes: [rect(88, 364, 30, 92), rect(142, 364, 30, 92)],
    structures: [
      { nameZh: '胫骨前肌', type: '肌肉', noteZh: '踝背屈；胫前疼痛相关区域。', muscleId: 'tibialis-anterior' },
      { nameZh: '腓肠肌 / 比目鱼肌', type: '肌肉', noteZh: '踝跖屈；提踵与跳跃负荷高。', muscleId: 'gastrocnemius' },
      { nameZh: '跟腱', type: '肌腱', noteZh: '跖屈末端负荷；晨起僵硬/压痛需评估。', muscleId: 'soleus' },
      { nameZh: '踝关节', type: '关节', noteZh: '背屈/跖屈与稳定；扭伤后常见。', jointId: 'ankle' },
    ],
    exerciseIds: ['calf-raise', 'lunge', 'back-squat'],
    adviceZh: '减少弹震与突然增加跑跳/提踵量；明显肿胀、无法负重或跟腱突发锐痛时就医。',
  },
  {
    id: 'upper-back',
    nameZh: '上背 / 肩胛间',
    view: 'back',
    shapes: [rect(96, 92, 68, 58), rect(58, 92, 42, 38), rect(160, 92, 42, 38)],
    structures: [
      { nameZh: '菱形肌', type: '肌肉', noteZh: '肩胛后缩；划船/拉类动作后常见酸痛。', muscleId: 'rhomboid' },
      { nameZh: '斜方肌中/下束', type: '肌肉', noteZh: '肩胛后缩/下压与上回旋。', muscleId: 'trapezius-mid' },
      { nameZh: '肩胛骨', type: '骨骼', noteZh: '肩胛运动异常可能与肩部疼痛相关。', boneId: 'scapula' },
    ],
    exerciseIds: ['barbell-row', 'seated-cable-row', 'lat-pulldown', 'pull-up', 'face-pull'],
    adviceZh: '先降低拉类重量与耸肩，练习肩胛后缩/下压；伴随上肢麻木或无力时就医。',
  },
  {
    id: 'lower-back',
    nameZh: '下背 / 腰',
    view: 'back',
    shapes: [rect(100, 150, 60, 88)],
    structures: [
      { nameZh: '竖脊肌', type: '肌肉', noteZh: '脊柱伸展/等长稳定；硬拉/深蹲后常见疲劳。', muscleId: 'erector-spinae' },
      { nameZh: '腰椎', type: '关节', noteZh: '屈曲+剪切+旋转组合负荷较高。', jointId: 'lumbar-spine' },
      { nameZh: '腰方肌', type: '肌肉', noteZh: '侧屈/骨盆稳定；单侧负荷可能紧张。' },
    ],
    exerciseIds: ['deadlift', 'romanian-deadlift', 'back-squat', 'barbell-row'],
    adviceZh: '先减重量/减少屈曲与旋转，保持脊柱中立；伴随下肢放射痛、麻木或大小便异常时立即就医。',
  },
  {
    id: 'glute',
    nameZh: '臀部 / 髋后',
    view: 'back',
    shapes: [rect(96, 238, 68, 50)],
    structures: [
      { nameZh: '臀大肌', type: '肌肉', noteZh: '髋伸展/外旋；髋铰链主动肌。', muscleId: 'gluteus-maximus' },
      { nameZh: '臀中肌', type: '肌肉', noteZh: '髋外展/骨盆稳定；单腿动作相关。', muscleId: 'gluteus-medius' },
      { nameZh: '骶髂关节', type: '关节', noteZh: '骨盆环负荷；单腿/旋转动作中稳定要求高。', jointId: 'sacroiliac' },
    ],
    exerciseIds: ['deadlift', 'romanian-deadlift', 'back-squat', 'lunge', 'leg-press'],
    adviceZh: '先降低髋铰链/单腿负荷，改善臀中肌控制；夜间痛、发热或明显跛行时就医。',
  },
  {
    id: 'hamstring',
    nameZh: '大腿后侧',
    view: 'back',
    shapes: [rect(88, 288, 32, 80), rect(140, 288, 32, 80)],
    structures: [
      { nameZh: '腘绳肌', type: '肌肉', noteZh: '髋伸展/膝屈曲；RDL 拉伸位负荷高。', muscleId: 'hamstrings' },
      { nameZh: '坐骨结节 / 腘绳肌腱', type: '肌腱', noteZh: '髋铰链与冲刺中常见拉伤区域。', muscleId: 'hamstrings' },
    ],
    exerciseIds: ['romanian-deadlift', 'leg-curl', 'deadlift', 'lunge'],
    adviceZh: '减少突然加速/大重量拉伸，先控制离心；突发撕裂感或淤青时停止训练并就医。',
  },
  {
    id: 'calf-back',
    nameZh: '小腿后侧',
    view: 'back',
    shapes: [rect(90, 368, 28, 76), rect(142, 368, 28, 76)],
    structures: [
      { nameZh: '腓肠肌 / 比目鱼肌', type: '肌肉', noteZh: '踝跖屈；提踵与跳跃负荷高。', muscleId: 'gastrocnemius' },
      { nameZh: '跟腱', type: '肌腱', noteZh: '提踵末端与弹震负荷；跟腱问题常见。', muscleId: 'soleus' },
    ],
    exerciseIds: ['calf-raise', 'lunge', 'back-squat'],
    adviceZh: '减少弹震与突然增加提踵量；跟腱突发锐痛、无法踮脚或明显肿胀时就医。',
  },
]

export const PAIN_REGION_BY_ID: Record<string, PainRegion> = Object.fromEntries(
  PAIN_REGIONS.map((region) => [region.id, region]),
)

export const DEFAULT_PAIN_ANSWERS: PainAnswers = {
  intensity: 3,
  onset: 'after',
  duration: 'lt1w',
  swelling: false,
  locking: false,
  instability: false,
  numbness: false,
  weakness: false,
  trauma: false,
  nightPain: false,
  cantBearWeight: false,
}

export function triagePain(answers: PainAnswers): TriageResult {
  const reasons: string[] = []
  if (answers.trauma) reasons.push('近期外伤后出现疼痛')
  if (answers.swelling) reasons.push('明显肿胀或发热')
  if (answers.locking) reasons.push('关节交锁/卡住')
  if (answers.instability) reasons.push('打软腿或关节不稳')
  if (answers.numbness) reasons.push('麻木或放射痛')
  if (answers.weakness) reasons.push('肌力明显下降')
  if (answers.nightPain) reasons.push('夜间静息痛')
  if (answers.cantBearWeight) reasons.push('无法负重')
  if (answers.intensity >= 8) reasons.push('疼痛强度 ≥ 8/10')

  if (reasons.length > 0) {
    return {
      level: 'urgent',
      titleZh: '建议停止训练并尽快就医',
      reasons,
      adviceZh:
        '出现红旗信号时不要自行诊断或强行训练。建议尽快咨询运动医学/骨科/物理治疗师，必要时急诊评估。',
    }
  }

  const cautionReasons: string[] = []
  if (answers.intensity >= 5) cautionReasons.push('疼痛强度 ≥ 5/10')
  if (answers.onset === 'during') cautionReasons.push('训练过程中出现疼痛')
  if (answers.onset === 'night') cautionReasons.push('夜间疼痛')
  if (answers.duration !== 'lt1w') cautionReasons.push('疼痛已持续超过 1 周')

  if (cautionReasons.length > 0) {
    return {
      level: 'caution',
      titleZh: '建议降低负荷并观察',
      reasons: cautionReasons,
      adviceZh:
        '先减少重量、范围或训练量，避免疼痛动作，观察 3–7 天；若持续、加重或出现红旗信号，请就医评估。',
    }
  }

  return {
    level: 'self-care',
    titleZh: '可先调整训练并观察',
    reasons: ['暂无红旗信号', '疼痛强度较低且持续时间短'],
    adviceZh:
      '可先调整动作范围、握距/站距与训练量，保持无痛范围活动；若 1 周内无改善或加重，请咨询专业人士。',
  }
}

export interface PainDiaryEntry {
  id: string
  date: string
  regionId: string
  regionName: string
  intensity: number
  level: TriageLevel
  note: string
}
