import type { BoneGroup } from './types'

export const BONES = [
  { id: 'cranium', nameZh: '颅骨', nameEn: 'Cranium', region: 'head' },
  { id: 'mandible', nameZh: '下颌骨', nameEn: 'Mandible', region: 'head' },
  { id: 'clavicle', nameZh: '锁骨', nameEn: 'Clavicle', region: 'shoulder' },
  { id: 'scapula', nameZh: '肩胛骨', nameEn: 'Scapula', region: 'shoulder' },
  { id: 'humerus', nameZh: '肱骨', nameEn: 'Humerus', region: 'arm' },
  { id: 'radius', nameZh: '桡骨', nameEn: 'Radius', region: 'arm' },
  { id: 'ulna', nameZh: '尺骨', nameEn: 'Ulna', region: 'arm' },
  { id: 'ribs', nameZh: '肋骨', nameEn: 'Ribs', region: 'chest' },
  { id: 'sternum', nameZh: '胸骨', nameEn: 'Sternum', region: 'chest' },
  { id: 'spine', nameZh: '脊柱', nameEn: 'Spine', region: 'back' },
  { id: 'pelvis', nameZh: '骨盆', nameEn: 'Pelvis', region: 'leg' },
  { id: 'femur', nameZh: '股骨', nameEn: 'Femur', region: 'leg' },
  { id: 'patella', nameZh: '髌骨', nameEn: 'Patella', region: 'leg' },
  { id: 'tibia', nameZh: '胫骨', nameEn: 'Tibia', region: 'leg' },
  { id: 'fibula', nameZh: '腓骨', nameEn: 'Fibula', region: 'leg' },
  { id: 'calcaneus', nameZh: '跟骨', nameEn: 'Calcaneus', region: 'leg' },
  { id: 'talus', nameZh: '距骨', nameEn: 'Talus', region: 'leg' },
  { id: 'hand', nameZh: '手骨', nameEn: 'Hand bones', region: 'arm' },
  { id: 'foot', nameZh: '足骨', nameEn: 'Foot bones', region: 'leg' },
  { id: 'other-bones', nameZh: '其他骨骼', nameEn: 'Other bones', region: 'head' },
] as const satisfies readonly BoneGroup[]

export const BONE_BY_ID = Object.fromEntries(BONES.map((b) => [b.id, b])) as Record<
  (typeof BONES)[number]['id'],
  (typeof BONES)[number]
>
