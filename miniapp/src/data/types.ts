export type Region = 'chest' | 'back' | 'shoulder' | 'arm' | 'leg' | 'core' | 'head'
export type ExerciseCategory = Exclude<Region, 'head'>
export type MuscleRole = 'primary' | 'secondary' | 'stabilizer'
export type LayerName = 'muscles' | 'bones' | 'joints'
export type StressLevel = 'low' | 'medium' | 'high'

export type MuscleId =
  | 'pectoralis-major'
  | 'pectoralis-minor'
  | 'serratus-anterior'
  | 'deltoid-anterior'
  | 'deltoid-lateral'
  | 'deltoid-posterior'
  | 'trapezius-upper'
  | 'trapezius-mid'
  | 'trapezius-lower'
  | 'latissimus-dorsi'
  | 'rhomboid'
  | 'levator-scapulae'
  | 'teres-major'
  | 'teres-minor'
  | 'infraspinatus'
  | 'supraspinatus'
  | 'subscapularis'
  | 'erector-spinae'
  | 'rectus-abdominis'
  | 'external-oblique'
  | 'internal-oblique'
  | 'transversus-abdominis'
  | 'iliopsoas'
  | 'biceps-brachii'
  | 'brachialis'
  | 'brachioradialis'
  | 'triceps-brachii'
  | 'forearm-flexors'
  | 'forearm-extensors'
  | 'gluteus-maximus'
  | 'gluteus-medius'
  | 'gluteus-minimus'
  | 'tensor-fasciae-latae'
  | 'adductors'
  | 'quadriceps'
  | 'hamstrings'
  | 'gastrocnemius'
  | 'soleus'
  | 'tibialis-anterior'
  | 'fibularis'
  | 'other-muscles'

export type BoneId =
  | 'cranium'
  | 'mandible'
  | 'clavicle'
  | 'scapula'
  | 'humerus'
  | 'radius'
  | 'ulna'
  | 'ribs'
  | 'sternum'
  | 'spine'
  | 'pelvis'
  | 'femur'
  | 'patella'
  | 'tibia'
  | 'fibula'
  | 'calcaneus'
  | 'talus'
  | 'hand'
  | 'foot'
  | 'other-bones'

export type JointId =
  | 'shoulder'
  | 'scapulothoracic'
  | 'acromioclavicular'
  | 'sternoclavicular'
  | 'elbow'
  | 'wrist'
  | 'hip'
  | 'knee'
  | 'ankle'
  | 'sacroiliac'
  | 'lumbar-spine'
  | 'cervical-spine'

export interface MuscleGroup {
  id: MuscleId
  nameZh: string
  nameEn: string
  region: Region
}

export interface BoneGroup {
  id: BoneId
  nameZh: string
  nameEn: string
  region: Region
}

export type JointType = 'ball-and-socket' | 'hinge' | 'pivot' | 'plane' | 'pseudo'

export interface JointGroup {
  id: JointId
  nameZh: string
  nameEn: string
  type: JointType
  region: Region
  anchor: [number, number, number]
  bilateral: boolean
}

export interface ExerciseView {
  camera: [number, number, number]
  target: [number, number, number]
  fov?: number
}

export interface JointMotion {
  id: JointId
  motionZh: string
  axis: [number, number, number]
  arc: [number, number]
}

export interface MuscleActivation {
  id: MuscleId
  role: MuscleRole
}

export interface Exercise {
  id: string
  nameZh: string
  nameEn: string
  aliases: string[]
  category: ExerciseCategory
  equipment: string
  view: ExerciseView
  muscles: MuscleActivation[]
  bones: BoneId[]
  joints: JointMotion[]
}
