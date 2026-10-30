import type { Exercise, MuscleActivation, MuscleId, MuscleRole, Region } from './types'

export type BodyView = 'front' | 'back'

export type BodyShape =
  | { type: 'polygon'; points: [number, number][] }
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'rect'; x: number; y: number; w: number; h: number; r?: number }

export type DisplayGroupId =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'adductors'
  | 'shins'
  | 'traps'
  | 'lats'
  | 'erectors'
  | 'glutes'
  | 'hamstrings'
  | 'calves'

export interface DisplayGroup {
  id: DisplayGroupId
  nameZh: string
  front?: BodyShape[]
  back?: BodyShape[]
}

const mirror = (points: [number, number][]): [number, number][] =>
  points.map(([x, y]) => [300 - x, y])

const mirrorShapes = (shapes: BodyShape[]): BodyShape[] =>
  shapes.map((shape) => {
    if (shape.type === 'polygon') return { type: 'polygon', points: mirror(shape.points) }
    if (shape.type === 'ellipse') return { ...shape, cx: 300 - shape.cx }
    return { ...shape, x: 300 - shape.x - shape.w }
  })

const both = (shapes: BodyShape[]): BodyShape[] => [...shapes, ...mirrorShapes(shapes)]

const ellipse = (cx: number, cy: number, rx: number, ry: number): BodyShape => ({
  type: 'ellipse',
  cx,
  cy,
  rx,
  ry,
})

export const BODY_SILHOUETTE: BodyShape[] = [
  ellipse(150, 42, 26, 30),
  { type: 'rect', x: 137, y: 64, w: 26, h: 26, r: 10 },
  {
    type: 'polygon',
    points: [
      [100, 98],
      [200, 98],
      [192, 160],
      [182, 235],
      [172, 270],
      [128, 270],
      [118, 235],
      [108, 160],
    ],
  },
  ...both([
    {
      type: 'polygon',
      points: [
        [100, 100],
        [86, 112],
        [80, 176],
        [96, 180],
        [106, 124],
      ],
    },
    {
      type: 'polygon',
      points: [
        [80, 176],
        [96, 180],
        [92, 252],
        [76, 248],
      ],
    },
    ellipse(84, 263, 9, 14),
    {
      type: 'polygon',
      points: [
        [122, 270],
        [148, 270],
        [145, 352],
        [116, 348],
      ],
    },
    {
      type: 'polygon',
      points: [
        [116, 352],
        [145, 352],
        [141, 440],
        [120, 440],
      ],
    },
    ellipse(130, 451, 17, 10),
  ]),
]

export const DISPLAY_GROUPS: DisplayGroup[] = [
  {
    id: 'traps',
    nameZh: '斜方肌 / 菱形肌',
    back: [
      {
        type: 'polygon',
        points: [
          [150, 88],
          [178, 112],
          [166, 150],
          [150, 162],
          [134, 150],
          [122, 112],
        ],
      },
    ],
  },
  {
    id: 'lats',
    nameZh: '背阔肌',
    back: both([
      {
        type: 'polygon',
        points: [
          [130, 128],
          [116, 158],
          [122, 206],
          [150, 192],
          [150, 148],
        ],
      },
    ]),
  },
  {
    id: 'erectors',
    nameZh: '竖脊肌',
    back: [
      {
        type: 'polygon',
        points: [
          [143, 150],
          [149, 150],
          [149, 246],
          [141, 246],
        ],
      },
      {
        type: 'polygon',
        points: [
          [151, 150],
          [157, 150],
          [159, 246],
          [151, 246],
        ],
      },
    ],
  },
  {
    id: 'glutes',
    nameZh: '臀大肌 / 臀中肌',
    back: [ellipse(135, 261, 19, 23), ellipse(165, 261, 19, 23)],
  },
  {
    id: 'hamstrings',
    nameZh: '腘绳肌',
    back: both([
      {
        type: 'polygon',
        points: [
          [120, 282],
          [147, 282],
          [143, 350],
          [116, 346],
        ],
      },
    ]),
  },
  {
    id: 'calves',
    nameZh: '小腿肌群',
    front: [ellipse(128, 394, 9, 27), ellipse(172, 394, 9, 27)],
    back: [ellipse(128, 394, 11, 29), ellipse(172, 394, 11, 29)],
  },
  {
    id: 'shoulders',
    nameZh: '三角肌 / 肩袖',
    front: [ellipse(106, 112, 13, 12), ellipse(194, 112, 13, 12)],
    back: [ellipse(106, 114, 13, 12), ellipse(194, 114, 13, 12)],
  },
  {
    id: 'chest',
    nameZh: '胸大肌 / 胸小肌',
    front: both([
      {
        type: 'polygon',
        points: [
          [131, 112],
          [114, 118],
          [118, 146],
          [146, 148],
          [148, 122],
        ],
      },
    ]),
  },
  {
    id: 'biceps',
    nameZh: '肱二头肌 / 肱肌',
    front: both([ellipse(95, 158, 11, 27)]),
  },
  {
    id: 'triceps',
    nameZh: '肱三头肌',
    back: both([ellipse(95, 160, 12, 29)]),
  },
  {
    id: 'forearms',
    nameZh: '前臂肌群',
    front: both([
      {
        type: 'polygon',
        points: [
          [84, 186],
          [98, 188],
          [92, 246],
          [80, 242],
        ],
      },
    ]),
    back: both([
      {
        type: 'polygon',
        points: [
          [84, 186],
          [98, 188],
          [92, 246],
          [80, 242],
        ],
      },
    ]),
  },
  {
    id: 'abs',
    nameZh: '腹直肌',
    front: [{ type: 'rect', x: 135, y: 150, w: 30, h: 70, r: 6 }],
  },
  {
    id: 'obliques',
    nameZh: '腹斜肌 / 腹横肌',
    front: both([
      {
        type: 'polygon',
        points: [
          [122, 150],
          [135, 158],
          [133, 218],
          [118, 222],
        ],
      },
    ]),
  },
  {
    id: 'quads',
    nameZh: '股四头肌',
    front: both([
      {
        type: 'polygon',
        points: [
          [122, 278],
          [148, 278],
          [144, 348],
          [118, 344],
        ],
      },
    ]),
  },
  {
    id: 'adductors',
    nameZh: '内收肌群 / 髂腰肌',
    front: [
      {
        type: 'polygon',
        points: [
          [143, 280],
          [150, 280],
          [150, 340],
          [140, 340],
        ],
      },
      {
        type: 'polygon',
        points: [
          [150, 280],
          [157, 280],
          [160, 340],
          [150, 340],
        ],
      },
    ],
  },
  {
    id: 'shins',
    nameZh: '胫骨前肌 / 腓骨肌群',
    front: both([
      {
        type: 'polygon',
        points: [
          [123, 358],
          [139, 358],
          [136, 438],
          [124, 438],
        ],
      },
    ]),
  },
]

const MUSCLE_GROUPS: Record<MuscleId, DisplayGroupId[]> = {
  'pectoralis-major': ['chest'],
  'pectoralis-minor': ['chest'],
  'serratus-anterior': ['chest', 'obliques'],
  'deltoid-anterior': ['shoulders'],
  'deltoid-lateral': ['shoulders'],
  'deltoid-posterior': ['shoulders'],
  'trapezius-upper': ['traps'],
  'trapezius-mid': ['traps'],
  'trapezius-lower': ['traps'],
  'latissimus-dorsi': ['lats'],
  rhomboid: ['traps'],
  'levator-scapulae': ['traps'],
  'teres-major': ['lats'],
  'teres-minor': ['shoulders'],
  infraspinatus: ['shoulders'],
  supraspinatus: ['shoulders'],
  subscapularis: ['shoulders'],
  'erector-spinae': ['erectors'],
  'rectus-abdominis': ['abs'],
  'external-oblique': ['obliques'],
  'internal-oblique': ['obliques'],
  'transversus-abdominis': ['obliques'],
  iliopsoas: ['adductors'],
  'biceps-brachii': ['biceps'],
  brachialis: ['biceps'],
  brachioradialis: ['forearms'],
  'triceps-brachii': ['triceps'],
  'forearm-flexors': ['forearms'],
  'forearm-extensors': ['forearms'],
  'gluteus-maximus': ['glutes'],
  'gluteus-medius': ['glutes'],
  'gluteus-minimus': ['glutes'],
  'tensor-fasciae-latae': ['glutes'],
  adductors: ['adductors'],
  quadriceps: ['quads'],
  hamstrings: ['hamstrings'],
  gastrocnemius: ['calves'],
  soleus: ['calves'],
  'tibialis-anterior': ['shins'],
  fibularis: ['shins', 'calves'],
  'other-muscles': [],
}

const ROLE_RANK: Record<MuscleRole, number> = {
  primary: 3,
  secondary: 2,
  stabilizer: 1,
}

export function resolveBodyRoles(muscles: MuscleActivation[]): Partial<Record<DisplayGroupId, MuscleRole>> {
  const result: Partial<Record<DisplayGroupId, MuscleRole>> = {}
  for (const activation of muscles) {
    for (const group of MUSCLE_GROUPS[activation.id] ?? []) {
      const current = result[group]
      if (!current || ROLE_RANK[activation.role] > ROLE_RANK[current]) {
        result[group] = activation.role
      }
    }
  }
  return result
}

export const REGION_LABELS: Record<Region, string> = {
  chest: '胸',
  back: '背',
  shoulder: '肩',
  arm: '臂',
  leg: '腿',
  core: '核心',
  head: '头颈',
}

export const ROLE_COLORS = {
  primary: '#ff5a4e',
  secondary: '#ff9f43',
  stabilizer: '#ffd166',
} as const

export function roleColor(role?: MuscleRole): string {
  if (!role) return '#4a2f2a'
  return ROLE_COLORS[role]
}
