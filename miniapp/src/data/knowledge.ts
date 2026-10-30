import type { JointId, MuscleId, StressLevel } from './types'

export interface MuscleKnowledge {
  functionZh: string
  commonIssueZh?: string
}

export interface JointGuide {
  planeZh: string
  romZh: string
  cautionZh: string
}

export interface JointStress {
  level: StressLevel
  noteZh: string
}

export interface Substitution {
  label: string
  note: string
  exerciseId?: string
}

export interface ExerciseKnowledge {
  summaryZh: string
  jointStress: Partial<Record<JointId, JointStress>>
  cues: string[]
  errors: string[]
  risks: string[]
  substitutions: Substitution[]
}

export const STRESS_LABELS: Record<StressLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const STRESS_COLORS: Record<StressLevel, string> = {
  low: '#4fd6a0',
  medium: '#f2b84b',
  high: '#ff6b5a',
}

export const MUSCLE_KNOWLEDGE = {
  'pectoralis-major': {
    functionZh: '肩关节水平内收、内旋与屈曲；锁骨部偏上束，胸骨部偏下束。',
    commonIssueZh: '肩前侧不适、胸大肌肌腱在卧推/飞鸟末端容易受牵拉。',
  },
  'pectoralis-minor': {
    functionZh: '肩胛骨前伸、下压与下回旋。',
    commonIssueZh: '过度紧张可能限制肩胛后倾，增加肩前侧压力。',
  },
  'serratus-anterior': {
    functionZh: '肩胛骨前伸与上回旋，维持肩胛贴附胸壁。',
    commonIssueZh: '不足时推举末端肩胛控制差，肩峰下空间变小。',
  },
  'deltoid-anterior': {
    functionZh: '肩关节屈曲、水平内收与内旋。',
    commonIssueZh: '卧推/推举中常过度代偿，导致肩前侧负荷增加。',
  },
  'deltoid-lateral': {
    functionZh: '肩关节外展，尤其是 15–90° 区间。',
    commonIssueZh: '过头外展或耸肩代偿时，肩峰下压力增加。',
  },
  'deltoid-posterior': {
    functionZh: '肩关节水平外展、伸展与外旋。',
    commonIssueZh: '薄弱时肩前侧代偿，推类动作肩部稳定性下降。',
  },
  'trapezius-upper': {
    functionZh: '肩胛骨上提与上回旋；也参与颈部伸展。',
    commonIssueZh: '长期耸肩/紧张可导致颈肩不适。',
  },
  'trapezius-mid': {
    functionZh: '肩胛骨后缩，维持肩胛位置。',
    commonIssueZh: '不足时划船/卧推肩胛不稳。',
  },
  'trapezius-lower': {
    functionZh: '肩胛骨下压与上回旋。',
    commonIssueZh: '不足时过顶动作肩胛上回旋受限。',
  },
  'latissimus-dorsi': {
    functionZh: '肩关节伸展、内收与内旋；协助躯干伸展。',
    commonIssueZh: '过紧可能限制肩屈曲；拉类动作中常与肱二头肌共同发力。',
  },
  rhomboid: {
    functionZh: '肩胛骨后缩与下回旋。',
    commonIssueZh: '过紧可限制肩胛上回旋，影响过顶动作。',
  },
  'levator-scapulae': {
    functionZh: '肩胛骨上提与下回旋；颈部侧屈。',
    commonIssueZh: '紧张常与颈肩不适相关。',
  },
  'teres-major': {
    functionZh: '肩关节伸展、内收与内旋。',
    commonIssueZh: '拉类动作中与背阔肌协同；过度紧张可限制肩屈曲。',
  },
  'teres-minor': {
    functionZh: '肩关节外旋，参与肩袖稳定。',
    commonIssueZh: '肩袖肌腱在过顶动作中易受刺激。',
  },
  infraspinatus: {
    functionZh: '肩关节外旋，维持肱骨头在关节盂内。',
    commonIssueZh: '肩袖肌腱负荷过高时肩后侧/外侧不适。',
  },
  supraspinatus: {
    functionZh: '肩关节外展启动（前 15°），肩袖稳定。',
    commonIssueZh: '肩峰下撞击/肩袖肌腱问题的常见相关结构。',
  },
  subscapularis: {
    functionZh: '肩关节内旋，肩袖前侧稳定。',
    commonIssueZh: '过紧可限制外旋，增加肩前侧压力。',
  },
  'erector-spinae': {
    functionZh: '脊柱伸展、侧屈与旋转；维持躯干直立。',
    commonIssueZh: '硬拉/深蹲中疲劳时腰椎屈曲增加，腰背负荷上升。',
  },
  'rectus-abdominis': {
    functionZh: '脊柱屈曲与抗伸展，维持腹压。',
    commonIssueZh: '反复屈曲或颈部代偿可能引起颈腰不适。',
  },
  'external-oblique': {
    functionZh: '躯干旋转、侧屈与抗伸展。',
    commonIssueZh: '旋转动作中与对侧腹内斜肌协同。',
  },
  'internal-oblique': {
    functionZh: '躯干旋转、侧屈与腹压。',
    commonIssueZh: '旋转控制不足时腰椎负荷增加。',
  },
  'transversus-abdominis': {
    functionZh: '腹压与腰椎稳定，抗伸展。',
    commonIssueZh: '不足时大重量动作腰椎稳定性下降。',
  },
  iliopsoas: {
    functionZh: '髋屈曲；深层维持腰椎与骨盆稳定。',
    commonIssueZh: '过紧可能增加腰椎前凸；悬垂举腿中负荷较高。',
  },
  'biceps-brachii': {
    functionZh: '肘屈曲、前臂旋后；长头参与肩屈曲。',
    commonIssueZh: '长头肌腱在过顶/拉类动作中可能受刺激。',
  },
  brachialis: {
    functionZh: '肘屈曲，尤其在旋前/中立位。',
    commonIssueZh: '肘前侧肌腱负荷。',
  },
  brachioradialis: {
    functionZh: '肘屈曲，中立握位发力明显。',
    commonIssueZh: '肘外侧/前臂近端负荷。',
  },
  'triceps-brachii': {
    functionZh: '肘伸展；长头参与肩伸展。',
    commonIssueZh: '肘后侧肌腱在窄推/臂屈伸中负荷高。',
  },
  'forearm-flexors': {
    functionZh: '腕屈曲、握力与肘辅助屈曲。',
    commonIssueZh: '肘内侧/前臂屈肌腱负荷。',
  },
  'forearm-extensors': {
    functionZh: '腕伸展与腕稳定。',
    commonIssueZh: '肘外侧/前臂伸肌腱负荷（网球肘相关区域）。',
  },
  'gluteus-maximus': {
    functionZh: '髋伸展与外旋，起身/髋铰链主动肌。',
    commonIssueZh: '不足时腰椎/腘绳肌代偿。',
  },
  'gluteus-medius': {
    functionZh: '髋外展与骨盆稳定。',
    commonIssueZh: '不足时单腿动作膝内扣、髋外侧不适。',
  },
  'gluteus-minimus': {
    functionZh: '髋外展与内旋，骨盆稳定。',
    commonIssueZh: '髋外侧/深层稳定负担。',
  },
  'tensor-fasciae-latae': {
    functionZh: '髋屈曲、外展与内旋。',
    commonIssueZh: '过度活跃可增加髂胫束/髋外侧张力。',
  },
  adductors: {
    functionZh: '髋内收与骨盆稳定；部分纤维参与髋伸展。',
    commonIssueZh: '深蹲/弓步中内收肌拉伤风险。',
  },
  quadriceps: {
    functionZh: '膝伸展；股直肌参与髋屈曲。',
    commonIssueZh: '髌股关节/髌腱负荷，膝前侧不适常见。',
  },
  hamstrings: {
    functionZh: '膝屈曲与髋伸展。',
    commonIssueZh: '髋铰链/冲刺中腘绳肌腱负荷高。',
  },
  gastrocnemius: {
    functionZh: '踝跖屈与膝屈曲。',
    commonIssueZh: '小腿后侧/跟腱负荷。',
  },
  soleus: {
    functionZh: '踝跖屈，站立稳定。',
    commonIssueZh: '跟腱/小腿深层负荷。',
  },
  'tibialis-anterior': {
    functionZh: '踝背屈与足内翻。',
    commonIssueZh: '胫前疼痛相关区域。',
  },
  fibularis: {
    functionZh: '踝外翻与外侧稳定。',
    commonIssueZh: '踝外侧扭伤后常需强化。',
  },
  'other-muscles': {
    functionZh: '面部、手内在肌、颈部等未单独分组的肌肉。',
    commonIssueZh: '本工具重点不在这些结构。',
  },
} as const satisfies Record<MuscleId, MuscleKnowledge>

export const JOINT_GUIDE = {
  shoulder: {
    planeZh: '肩胛平面 / 多平面',
    romZh: '屈曲 0–180°，外展 0–180°，外旋 0–90°',
    cautionZh: '过顶位与前侧关节囊负荷增加；肩胛控制不足时肩峰下空间变小。',
  },
  scapulothoracic: {
    planeZh: '肩胛平面',
    romZh: '上回旋 0–60°，后缩 0–25°',
    cautionZh: '肩胛稳定是肩关节负荷分配的前提。',
  },
  acromioclavicular: {
    planeZh: '肩胛平面',
    romZh: '小幅旋转',
    cautionZh: '肩锁关节在推举/飞鸟末端可能受压。',
  },
  sternoclavicular: {
    planeZh: '多平面',
    romZh: '上提/后缩小幅活动',
    cautionZh: '锁骨内侧负荷，较少成为训练限制。',
  },
  elbow: {
    planeZh: '矢状面',
    romZh: '屈曲 0–150°',
    cautionZh: '肘伸/屈肌腱在末端负荷高；避免锁死冲击。',
  },
  wrist: {
    planeZh: '矢状面 / 冠状面',
    romZh: '屈伸各约 0–70°',
    cautionZh: '腕中立位可减少肘腕压力。',
  },
  hip: {
    planeZh: '多平面',
    romZh: '屈曲 0–140°，伸展 0–30°，外展 0–45°',
    cautionZh: '深屈曲+内旋可能增加髋臼撞击风险。',
  },
  knee: {
    planeZh: '矢状面',
    romZh: '屈曲 0–150°',
    cautionZh: '髌股关节与膝前侧负荷；避免膝内扣与锁死。',
  },
  ankle: {
    planeZh: '矢状面',
    romZh: '背屈 0–20°，跖屈 0–50°',
    cautionZh: '跟腱与踝前侧负荷；足踝活动度不足会传导到膝髋。',
  },
  sacroiliac: {
    planeZh: '骨盆环',
    romZh: '小幅活动',
    cautionZh: '单腿/旋转动作中骨盆稳定负荷。',
  },
  'lumbar-spine': {
    planeZh: '矢状面 / 旋转',
    romZh: '屈曲 0–60°，旋转 0–30°',
    cautionZh: '屈曲+剪切+旋转组合负荷较高；疲劳时控制下降。',
  },
  'cervical-spine': {
    planeZh: '多平面',
    romZh: '屈伸/旋转各约 0–45°',
    cautionZh: '训练中应避免颈部代偿。',
  },
} as const satisfies Record<JointId, JointGuide>

export const GLOBAL_RED_FLAGS = [
  '训练中突发锐痛、撕裂感或听到响声后无法继续',
  '明显肿胀、发热、发红或关节变形',
  '关节交锁、卡住、反复打软腿或明显不稳',
  '麻木、放射痛、肌力明显下降或大小便异常',
  '夜间静息痛、持续加重或休息数天不缓解',
  '外伤后无法负重，或伴随胸痛、气短、眩晕等全身症状',
]

const sub = (label: string, note: string, exerciseId?: string): Substitution => ({
  label,
  note,
  exerciseId,
})

export const EXERCISE_KNOWLEDGE: Record<string, ExerciseKnowledge> = {
  'barbell-bench-press': {
    summaryZh: '水平推举，胸大肌为主，三角肌前束与肱三头肌协同；肩胛稳定决定肩前侧负荷。',
    jointStress: {
      shoulder: { level: 'medium', noteZh: '肘部过度外展或肩胛后缩不足时，肩前侧与肩峰下压力增加。' },
      elbow: { level: 'low', noteZh: '避免顶端锁死冲击。' },
      scapulothoracic: { level: 'low', noteZh: '肩胛后缩下沉不足会让肩关节代偿。' },
    },
    cues: ['肩胛后缩下沉，脚踩实地面', '肘部约 45–70° 夹角，杠铃下放到胸骨中下段'],
    errors: ['肘部完全外展成“T”字，肩前侧压力大', '臀部离凳、腰椎过度反弓'],
    risks: ['肩前侧/胸大肌肌腱负荷；肩胛控制差时更明显'],
    substitutions: [
      sub('哑铃卧推', '活动更自由，肩部不适时可调整握距与轨迹', 'dumbbell-bench-press'),
      sub('俯卧撑', '自重、可控制范围，适合作为降级', 'push-up'),
    ],
  },
  'dumbbell-bench-press': {
    summaryZh: '哑铃水平推举，胸大肌为主；双侧独立，肩胛与肩袖稳定要求更高。',
    jointStress: {
      shoulder: { level: 'medium', noteZh: '下放过深或肘部过度外展会增加肩前侧压力。' },
      elbow: { level: 'low', noteZh: '哑铃轨迹自由，肘部压力相对可控。' },
    },
    cues: ['肩胛稳定，哑铃下放到胸侧', '前臂尽量垂直地面'],
    errors: ['下放过深追求拉伸，肩前侧不适', '两侧轨迹不对称'],
    risks: ['肩前侧负荷；肩袖稳定不足时更明显'],
    substitutions: [
      sub('杠铃卧推', '更稳定、便于渐进负荷', 'barbell-bench-press'),
      sub('俯卧撑', '自重降级，易控制范围', 'push-up'),
    ],
  },
  'incline-bench-press': {
    summaryZh: '上斜推举，胸大肌锁骨部与三角肌前束参与更多；肩前侧负荷高于平板。',
    jointStress: {
      shoulder: { level: 'medium', noteZh: '上斜角度越大，肩前束与肩峰下压力越明显。' },
      elbow: { level: 'low', noteZh: '与平板类似，避免锁死。' },
    },
    cues: ['凳面 15–30°，肩胛后缩下沉', '杠铃下放到上胸，不要压到颈部'],
    errors: ['角度过陡变成肩推', '肩部前顶、肋骨外翻'],
    risks: ['肩前侧负荷增加；肩关节不适时降低角度'],
    substitutions: [
      sub('哑铃卧推', '轨迹自由，可减少肩部夹挤感', 'dumbbell-bench-press'),
      sub('站姿推举', '改为垂直推，肩胛平面不同', 'overhead-press'),
    ],
  },
  'push-up': {
    summaryZh: '闭链水平推，胸大肌、肱三头肌与三角肌前束参与；核心与肩胛稳定要求高。',
    jointStress: {
      shoulder: { level: 'medium', noteZh: '肩胛前伸/后缩控制不足时肩前侧压力增加。' },
      elbow: { level: 'low', noteZh: '肘部不要完全锁死。' },
      scapulothoracic: { level: 'low', noteZh: '肩胛前伸不足会限制推起。' },
    },
    cues: ['身体成一条直线，核心收紧', '肘部约 45°，胸口接近地面'],
    errors: ['塌腰、头部前伸', '肩胛完全不动的“死推”'],
    risks: ['肩前侧与腕部负荷；可改用握把或上斜版本'],
    substitutions: [
      sub('上斜俯卧撑', '降低负荷，适合肩部不适或初学者', undefined),
      sub('哑铃卧推', '改为开链推举，便于控制', 'dumbbell-bench-press'),
    ],
  },
  'dumbbell-fly': {
    summaryZh: '胸大肌水平内收，肘部微屈固定；末端拉伸位对胸大肌肌腱与肩前侧要求高。',
    jointStress: {
      shoulder: { level: 'high', noteZh: '水平外展末端 + 负重拉伸，肩前侧与胸大肌肌腱压力较大。' },
      elbow: { level: 'low', noteZh: '保持微屈，不要变成推举。' },
    },
    cues: ['肘部微屈固定，像抱树', '下放到胸侧有拉伸感即可，不要追求过深'],
    errors: ['肘部角度来回变化变成推举', '下放过深、肩部前顶'],
    risks: ['肩前侧/胸大肌肌腱在拉伸末端负荷高'],
    substitutions: [
      sub('哑铃卧推', '推举轨迹更稳定，拉伸位压力较小', 'dumbbell-bench-press'),
      sub('器械夹胸', '固定轨迹，便于控制末端范围', undefined),
    ],
  },
  dips: {
    summaryZh: '双杠撑体，胸大肌下束与肱三头肌为主；肩关节伸展末端负荷较高。',
    jointStress: {
      shoulder: { level: 'high', noteZh: '肩关节伸展末端 + 前侧关节囊压力较大。' },
      elbow: { level: 'medium', noteZh: '肘伸肌腱负荷高，避免锁死冲击。' },
      scapulothoracic: { level: 'medium', noteZh: '肩胛下沉/后缩控制不足会增加肩前侧压力。' },
    },
    cues: ['身体略前倾，肩胛下沉', '下放到肩部舒适的范围，不要硬压'],
    errors: ['下放过深、肩部前顶', '耸肩或肩胛完全松散'],
    risks: ['肩前侧/肩袖与肘伸肌腱负荷较高；肩不适时慎用'],
    substitutions: [
      sub('窄距卧推', '开链推举，肩部压力更可控', 'close-grip-bench-press'),
      sub('绳索下压', '以肱三头肌为主，减少肩部负荷', 'cable-triceps-pushdown'),
    ],
  },
  'pull-up': {
    summaryZh: '垂直拉，背阔肌与大圆肌为主；肩内收/伸展末端与肘屈肌腱负荷较高。',
    jointStress: {
      shoulder: { level: 'medium', noteZh: '肩内收/伸展末端与悬挂位对肩关节要求高。' },
      elbow: { level: 'medium', noteZh: '肘屈肌腱在拉类动作中负荷较高。' },
      scapulothoracic: { level: 'low', noteZh: '肩胛下回旋控制不足会影响肩部位置。' },
    },
    cues: ['先沉肩胛，再用背阔肌拉', '避免摆荡与耸肩'],
    errors: ['只用手臂拉、肩胛不动', '下放过快、肩部失去控制'],
    risks: ['肩前侧/肩袖与肘屈肌腱负荷；悬挂位不适时改用下拉'],
    substitutions: [
      sub('高位下拉', '可调重量、更易控制', 'lat-pulldown'),
      sub('坐姿划船', '水平拉，肩关节位置不同', 'seated-cable-row'),
    ],
  },
  'lat-pulldown': {
    summaryZh: '垂直拉，背阔肌为主；可调重量，肩胛与肘屈控制要求适中。',
    jointStress: {
      shoulder: { level: 'low', noteZh: '避免颈后下拉与过度后仰。' },
      elbow: { level: 'low', noteZh: '肘屈肌腱负荷中等。' },
      scapulothoracic: { level: 'low', noteZh: '先下沉肩胛再拉。' },
    },
    cues: ['先沉肩胛，再把肘拉向身体两侧', '躯干轻微后仰，不要大幅摆动'],
    errors: ['颈后下拉', '用手臂硬拉、肩胛不动'],
    risks: ['肩前侧在极端后仰/颈后位压力增加'],
    substitutions: [
      sub('引体向上', '自重垂直拉，进阶选择', 'pull-up'),
      sub('坐姿划船', '水平拉，肩关节更中立', 'seated-cable-row'),
    ],
  },
  'barbell-row': {
    summaryZh: '俯身水平拉，背阔肌、菱形肌与斜方肌中束为主；腰椎需要稳定。',
    jointStress: {
      shoulder: { level: 'low', noteZh: '肩关节以中立位拉，压力相对可控。' },
      elbow: { level: 'low', noteZh: '肘屈肌腱负荷中等。' },
      scapulothoracic: { level: 'low', noteZh: '肩胛后缩是主要动作。' },
    },
    cues: ['髋铰链俯身，脊柱中立', '肘部贴近身体，肩胛后缩'],
    errors: ['弓背/腰椎屈曲', '起身借力、耸肩'],
    risks: ['腰椎在俯身位负荷较高；腰背疲劳时降重量'],
    substitutions: [
      sub('坐姿划船', '躯干有支撑，腰椎负荷更低', 'seated-cable-row'),
      sub('高位下拉', '垂直拉，减少俯身', 'lat-pulldown'),
    ],
  },
  'straight-arm-pulldown': {
    summaryZh: '直臂下压，背阔肌与大圆肌；长杠杆对肩前侧与肱二头肌长头腱有张力。',
    jointStress: {
      shoulder: { level: 'medium', noteZh: '直臂长杠杆 + 末端伸展，肩前侧张力较高。' },
      elbow: { level: 'low', noteZh: '保持微屈，不要锁死。' },
      scapulothoracic: { level: 'low', noteZh: '肩胛下沉稳定。' },
    },
    cues: ['肘部微屈固定，用背阔肌把手臂压向身体', '躯干稳定，不要大幅摆动'],
    errors: ['变成肱三头肌下压', '耸肩、肩胛失去控制'],
    risks: ['肩前侧/长头腱张力；肩不适时减小范围'],
    substitutions: [
      sub('高位下拉', '肘屈参与，长杠杆压力较小', 'lat-pulldown'),
      sub('坐姿划船', '水平拉，肩关节更中立', 'seated-cable-row'),
    ],
  },
  deadlift: {
    summaryZh: '髋铰链全身动作，臀大肌、腘绳肌与竖脊肌为主；腰椎在负荷下维持中立是关键。',
    jointStress: {
      hip: { level: 'medium', noteZh: '髋伸展力矩大，髋关节负荷高。' },
      knee: { level: 'low', noteZh: '膝屈曲角度较小。' },
      'lumbar-spine': { level: 'high', noteZh: '屈曲+剪切+大负荷；疲劳时腰椎控制下降。' },
    },
    cues: ['髋铰链、脊柱中立，杠铃贴腿', '脚踩实，起身时髋膝同步伸展'],
    errors: ['弓背起杠', '杠铃远离身体、用腰硬拉'],
    risks: ['腰椎在疲劳/大重量下负荷高；腰背不适时改用降级动作'],
    substitutions: [
      sub('罗马尼亚硬拉', '膝更直、负荷更集中腘绳肌/臀', 'romanian-deadlift'),
      sub('腿举', '有支撑，腰椎剪切负荷更低', 'leg-press'),
    ],
  },
  'seated-cable-row': {
    summaryZh: '坐姿水平拉，菱形肌、斜方肌中束与背阔肌；躯干有支撑，腰椎负荷较低。',
    jointStress: {
      shoulder: { level: 'low', noteZh: '肩关节中立位拉，压力可控。' },
      elbow: { level: 'low', noteZh: '肘屈肌腱负荷中等。' },
      scapulothoracic: { level: 'low', noteZh: '肩胛后缩是主要动作。' },
    },
    cues: ['先肩胛后缩，再屈肘拉向腹部', '躯干稳定，不要大幅后仰'],
    errors: ['用腰后仰借力', '耸肩、肩胛不动'],
    risks: ['腰椎在后仰借力时负荷增加'],
    substitutions: [
      sub('杠铃划船', '自由重量、全身稳定要求更高', 'barbell-row'),
      sub('高位下拉', '垂直拉，刺激不同', 'lat-pulldown'),
    ],
  },
  'overhead-press': {
    summaryZh: '垂直推举，三角肌前/中束为主；过顶位对肩峰下空间与肩胛上回旋要求高。',
    jointStress: {
      shoulder: { level: 'high', noteZh: '过顶位肩峰下空间变窄；肩胛上回旋不足时压力更大。' },
      elbow: { level: 'medium', noteZh: '肘伸肌腱在顶端负荷较高。' },
      scapulothoracic: { level: 'medium', noteZh: '肩胛上回旋不足会限制过顶并增加肩部压力。' },
    },
    cues: ['核心收紧、肋骨下沉', '杠铃沿面部前方上行，顶端肩胛上回旋'],
    errors: ['腰椎过度反弓、肋骨外翻', '耸肩顶起、肩胛不上回旋'],
    risks: ['肩峰下/肩前侧在过顶位负荷较高；肩不适时改用中立握或地雷管推举'],
    substitutions: [
      sub('哑铃侧平举', '避免过顶，专注三角肌中束', 'lateral-raise'),
      sub('上斜卧推', '推举角度降低，肩部压力更可控', 'incline-bench-press'),
    ],
  },
  'lateral-raise': {
    summaryZh: '三角肌中束外展；小重量、长杠杆，末端与肩峰下空间相关。',
    jointStress: {
      shoulder: { level: 'medium', noteZh: '超过 90° 外展可能增加肩峰下压力；避免耸肩代偿。' },
    },
    cues: ['肘部微屈，向两侧抬起', '抬到肩高即可，避免耸肩'],
    errors: ['耸肩、用斜方肌上束代偿', '过度超过肩高、肩部前顶'],
    risks: ['肩峰下压力与肩部不适；肩痛时降低幅度'],
    substitutions: [
      sub('面拉', '肩胛后侧与肩外旋，肩部更友好', 'face-pull'),
      sub('俯身飞鸟', '后束为主，避免外展末端', 'bent-over-reverse-fly'),
    ],
  },
  'bent-over-reverse-fly': {
    summaryZh: '俯身反向飞鸟，三角肌后束与菱形肌；腰椎在俯身位需要稳定。',
    jointStress: {
      shoulder: { level: 'medium', noteZh: '水平外展末端负荷，重量过大时肩后侧压力增加。' },
      scapulothoracic: { level: 'low', noteZh: '肩胛后缩控制。' },
    },
    cues: ['髋铰链俯身，脊柱中立', '肘部微屈，向两侧打开'],
    errors: ['弓背、起身借力', '耸肩、用手臂甩'],
    risks: ['腰椎在俯身位负荷；肩后侧在末端负荷'],
    substitutions: [
      sub('面拉', '站姿、肩胛后侧友好', 'face-pull'),
      sub('坐姿划船', '躯干有支撑，腰椎负荷更低', 'seated-cable-row'),
    ],
  },
  'face-pull': {
    summaryZh: '绳索面拉，三角肌后束、菱形肌与肩外旋肌群；肩胛后侧友好。',
    jointStress: {
      shoulder: { level: 'low', noteZh: '外旋/水平外展，重量可控时较友好。' },
      scapulothoracic: { level: 'low', noteZh: '肩胛后缩/下回旋。' },
    },
    cues: ['拉向面部，肘部高于手腕', '末端外旋，肩胛后缩'],
    errors: ['重量过大变成划船', '耸肩、腰部后仰'],
    risks: ['肩后侧/肩袖在重量过大时负荷增加'],
    substitutions: [
      sub('俯身飞鸟', '自由重量后束', 'bent-over-reverse-fly'),
      sub('坐姿划船', '水平拉，肩胛后侧', 'seated-cable-row'),
    ],
  },
  'barbell-curl': {
    summaryZh: '杠铃弯举，肱二头肌与肱肌；肘屈肌腱与长头腱负荷。',
    jointStress: {
      elbow: { level: 'medium', noteZh: '肘屈肌腱与肱二头肌长头腱负荷。' },
      shoulder: { level: 'low', noteZh: '肩关节保持稳定，避免摆动。' },
    },
    cues: ['肘部固定在身体两侧', '全程控制，不要甩腰'],
    errors: ['腰部摆动借力', '肘部前移变成肩屈'],
    risks: ['肘前侧/长头腱负荷；肘痛时改用锤式或绳索'],
    substitutions: [
      sub('锤式弯举', '中立握，肘部更友好', 'hammer-curl'),
      sub('高位下拉', '拉类动作，肘屈参与但负荷不同', 'lat-pulldown'),
    ],
  },
  'hammer-curl': {
    summaryZh: '锤式弯举，肱肌与肱桡肌；中立握对肘部较友好。',
    jointStress: {
      elbow: { level: 'low', noteZh: '中立握减少前臂旋转应力。' },
    },
    cues: ['肘部固定，手掌相对', '控制下放'],
    errors: ['甩动、肘部前移'],
    risks: ['肘外侧/前臂近端负荷'],
    substitutions: [
      sub('杠铃弯举', '旋后位，肱二头肌参与更多', 'barbell-curl'),
      sub('绳索下压', '肘伸肌群，平衡肘部负荷', 'cable-triceps-pushdown'),
    ],
  },
  'close-grip-bench-press': {
    summaryZh: '窄距卧推，肱三头肌与胸大肌；肘伸肌腱负荷高。',
    jointStress: {
      elbow: { level: 'high', noteZh: '窄距 + 大重量使肘伸肌腱负荷较高。' },
      shoulder: { level: 'medium', noteZh: '肘部更贴近身体，肩前侧压力相对可控。' },
    },
    cues: ['握距略窄于肩，肘部贴近身体', '下放到胸骨下段，避免腕部过度折叠'],
    errors: ['握距过窄、腕部压力大', '肘部外展、肩前侧代偿'],
    risks: ['肘伸肌腱/腕部负荷；肘痛时改用绳索下压'],
    substitutions: [
      sub('绳索下压', '肘部固定，肱三头肌为主', 'cable-triceps-pushdown'),
      sub('颈后臂屈伸', '过顶位拉伸肱三头肌长头', 'overhead-triceps-extension'),
    ],
  },
  'cable-triceps-pushdown': {
    summaryZh: '绳索下压，肱三头肌；肘部固定，肩关节负荷低。',
    jointStress: {
      elbow: { level: 'medium', noteZh: '肘伸肌腱负荷；避免顶端锁死冲击。' },
    },
    cues: ['肘部固定在身体两侧', '下压到底，控制回程'],
    errors: ['肘部前后移动', '用肩部下压'],
    risks: ['肘伸肌腱负荷；肘痛时减轻重量/范围'],
    substitutions: [
      sub('窄距卧推', '复合推举，肱三头肌负荷更高', 'close-grip-bench-press'),
      sub('颈后臂屈伸', '长头拉伸更多', 'overhead-triceps-extension'),
    ],
  },
  'overhead-triceps-extension': {
    summaryZh: '过顶臂屈伸，肱三头肌长头拉伸；肩过顶位与肘伸肌腱负荷。',
    jointStress: {
      elbow: { level: 'medium', noteZh: '肘伸肌腱在拉伸位负荷。' },
      shoulder: { level: 'low', noteZh: '过顶位对肩关节有要求，肩不适时改用下压。' },
    },
    cues: ['肘部朝前，避免外展', '下放到舒适范围，不要强行过深'],
    errors: ['肘部外展、腰部反弓', '重量过大导致肩肘代偿'],
    risks: ['肘伸肌腱与肩过顶位负荷'],
    substitutions: [
      sub('绳索下压', '避免过顶，肘部更友好', 'cable-triceps-pushdown'),
      sub('窄距卧推', '复合动作，负荷分布不同', 'close-grip-bench-press'),
    ],
  },
  'back-squat': {
    summaryZh: '杠铃深蹲，股四头肌与臀大肌为主；膝、髋、腰椎共同承担负荷。',
    jointStress: {
      hip: { level: 'medium', noteZh: '深蹲底部髋屈曲，髋关节负荷较高。' },
      knee: { level: 'medium', noteZh: '髌股关节与膝前侧负荷；膝内扣时增加。' },
      ankle: { level: 'low', noteZh: '踝背屈不足会传导到膝/髋。' },
      'lumbar-spine': { level: 'medium', noteZh: '轴向负荷+屈曲；腰背疲劳时控制下降。' },
    },
    cues: ['脚踩实，膝盖对齐脚尖', '髋膝同步下蹲，脊柱中立'],
    errors: ['膝内扣、脚跟离地', '弓腰、底部失去控制'],
    risks: ['膝前侧/髌股与腰椎负荷；腰膝不适时改用腿举/箱蹲'],
    substitutions: [
      sub('腿举', '有支撑，腰椎负荷更低', 'leg-press'),
      sub('弓步蹲', '单腿、负荷更低，控制要求高', 'lunge'),
    ],
  },
  'leg-press': {
    summaryZh: '腿举机，股四头肌与臀大肌；腰椎有支撑，膝负荷为主。',
    jointStress: {
      knee: { level: 'medium', noteZh: '髌股关节负荷；避免膝关节锁死冲击。' },
      hip: { level: 'low', noteZh: '髋屈曲角度可控。' },
    },
    cues: ['脚掌踩实，膝盖对齐脚尖', '下放到可控范围，不要锁死膝'],
    errors: ['膝盖内扣', '下放过深导致骨盆卷起'],
    risks: ['膝前侧/髌股负荷；膝不适时减小范围'],
    substitutions: [
      sub('杠铃深蹲', '自由重量、全身稳定要求更高', 'back-squat'),
      sub('弓步蹲', '单腿、控制要求更高', 'lunge'),
    ],
  },
  lunge: {
    summaryZh: '弓步蹲，股四头肌、臀大肌与臀中肌；单腿稳定与膝前侧控制要求高。',
    jointStress: {
      hip: { level: 'medium', noteZh: '单腿髋伸展/屈曲负荷。' },
      knee: { level: 'medium', noteZh: '前腿髌股关节负荷较高；膝内扣时增加。' },
      ankle: { level: 'low', noteZh: '踝背屈与稳定。' },
    },
    cues: ['前脚踩实，膝盖对齐脚尖', '躯干稳定，后膝下沉'],
    errors: ['膝内扣、前膝过度前移', '躯干左右晃动'],
    risks: ['膝前侧/髌股与髋外侧负荷；平衡不足时扶架'],
    substitutions: [
      sub('腿举', '双腿有支撑，稳定性要求低', 'leg-press'),
      sub('杠铃深蹲', '双腿动作，控制更稳定', 'back-squat'),
    ],
  },
  'romanian-deadlift': {
    summaryZh: '罗马尼亚硬拉，腘绳肌与臀大肌；髋铰链、腰椎等长稳定。',
    jointStress: {
      hip: { level: 'medium', noteZh: '髋铰链力矩大。' },
      knee: { level: 'low', noteZh: '膝微屈，负荷较小。' },
      'lumbar-spine': { level: 'medium', noteZh: '脊柱等长稳定；铰链控制不足时腰椎负荷增加。' },
    },
    cues: ['髋向后推，杠铃贴腿', '膝微屈，脊柱中立'],
    errors: ['弓背、用腰下放', '杠铃远离身体'],
    risks: ['腰椎与腘绳肌负荷；腰背疲劳时降重量'],
    substitutions: [
      sub('腿弯举', '孤立腘绳肌，腰椎负荷低', 'leg-curl'),
      sub('硬拉', '更大范围、更多肌群参与', 'deadlift'),
    ],
  },
  'leg-curl': {
    summaryZh: '腿弯举，腘绳肌；膝屈曲孤立训练，腰椎负荷低。',
    jointStress: {
      knee: { level: 'medium', noteZh: '腘绳肌腱/膝后侧负荷；避免弹震。' },
    },
    cues: ['髋部贴紧垫面', '控制下放，不要甩'],
    errors: ['髋部抬起借力', '回程失控'],
    risks: ['腘绳肌腱/膝后侧负荷'],
    substitutions: [
      sub('罗马尼亚硬拉', '髋主导，腘绳肌拉伸更多', 'romanian-deadlift'),
      sub('腿举', '复合腿推，整体负荷', 'leg-press'),
    ],
  },
  'calf-raise': {
    summaryZh: '提踵，腓肠肌与比目鱼肌；跟腱与踝关节负荷。',
    jointStress: {
      ankle: { level: 'medium', noteZh: '跟腱在跖屈末端负荷较高；避免弹震。' },
    },
    cues: ['缓慢下放到拉伸位', '顶端停顿，控制回程'],
    errors: ['弹震借力', '踝关节内/外翻'],
    risks: ['跟腱/小腿后侧负荷；跟腱不适时减小范围'],
    substitutions: [
      sub('腿举', '整体腿部负荷，踝部压力较小', 'leg-press'),
      sub('弓步蹲', '下肢综合训练', 'lunge'),
    ],
  },
  plank: {
    summaryZh: '平板支撑，腹直肌/腹横肌/腹斜肌等长收缩；核心抗伸展。',
    jointStress: {
      'lumbar-spine': { level: 'low', noteZh: '等长稳定；塌腰时腰椎压力增加。' },
      shoulder: { level: 'medium', noteZh: '静态支撑对肩关节有要求。' },
      hip: { level: 'low', noteZh: '髋部等长稳定。' },
    },
    cues: ['收紧腹部与臀部，身体成一条直线', '肩胛稳定，不要塌腰'],
    errors: ['塌腰、头部前伸', '憋气或耸肩'],
    risks: ['腰椎在塌腰时压力增加；肩部不适时改用跪姿'],
    substitutions: [
      sub('卷腹', '屈曲核心，动作范围小', 'crunch'),
      sub('悬垂举腿', '悬垂核心训练，肩部要求更高', 'hanging-leg-raise'),
    ],
  },
  crunch: {
    summaryZh: '卷腹，腹直肌屈曲；腰椎反复屈曲，颈部易代偿。',
    jointStress: {
      'lumbar-spine': { level: 'medium', noteZh: '反复屈曲；腰椎不适时减少范围。' },
      hip: { level: 'low', noteZh: '髋部保持稳定。' },
    },
    cues: ['下巴微收，胸骨向骨盆靠近', '下背贴地，动作小而控制'],
    errors: ['用手拉头', '起身过高变成髋屈'],
    risks: ['腰椎屈曲与颈部代偿；腰痛时改用死虫/平板'],
    substitutions: [
      sub('平板支撑', '等长抗伸展，腰椎屈曲少', 'plank'),
      sub('悬垂举腿', '悬垂核心训练', 'hanging-leg-raise'),
    ],
  },
  'hanging-leg-raise': {
    summaryZh: '悬垂举腿，腹直肌与髂腰肌；悬挂位对肩关节、腰椎屈曲要求高。',
    jointStress: {
      hip: { level: 'medium', noteZh: '髋屈曲力矩大。' },
      'lumbar-spine': { level: 'medium', noteZh: '骨盆后倾/腰椎屈曲；摆动时负荷增加。' },
      shoulder: { level: 'medium', noteZh: '悬挂位对肩关节有要求。' },
    },
    cues: ['先稳定肩胛，再卷骨盆抬腿', '避免摆荡'],
    errors: ['摆荡借力', '只抬腿不卷骨盆'],
    risks: ['肩关节悬挂与腰椎屈曲负荷；肩不适时改用仰卧举腿'],
    substitutions: [
      sub('卷腹', '地面动作，肩部无悬挂负荷', 'crunch'),
      sub('平板支撑', '等长核心，腰椎屈曲少', 'plank'),
    ],
  },
  'russian-twist': {
    summaryZh: '俄罗斯转体，腹斜肌旋转；腰椎旋转+屈曲组合负荷。',
    jointStress: {
      'lumbar-spine': { level: 'medium', noteZh: '旋转+屈曲；腰椎不适时减少旋转幅度。' },
    },
    cues: ['胸椎带动旋转，骨盆稳定', '小幅度、控制节奏'],
    errors: ['只用手臂甩动', '腰部塌陷、旋转过大'],
    risks: ['腰椎旋转/屈曲负荷；腰痛时改用抗旋转训练'],
    substitutions: [
      sub('平板支撑', '抗伸展/抗旋转，腰椎负荷低', 'plank'),
      sub('卷腹', '屈曲为主，旋转少', 'crunch'),
    ],
  },
}
