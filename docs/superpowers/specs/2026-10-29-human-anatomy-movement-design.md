# 肌动图谱（Kinesis Atlas）— 3D 人体动作解剖可视化 Web 应用设计

- 日期：2026-10-29
- 状态：已确认，待实施
- 目标平台：桌面浏览器优先（Chrome/Safari 最新版），窄屏做基础适配

## 1. 概述

输入或选择一个训练动作（如「卧推」），页面用可旋转的 3D 解剖人体展示该动作调用的肌肉、关节与骨骼：

- 相机自动飞到目标部位特写；
- 肌肉按「主责 / 协同 / 稳定」三级高亮；
- 关节高亮并循环播放运动方向示意动画；
- 右侧面板列出参与结构及分级、关节运动描述；
- 支持肌肉 / 骨骼 / 关节图层开关、仅显示参与结构、悬停查看名称。

成功标准：

1. 输入「卧推」能在结果列表第一屏命中「杠铃卧推」，选中后 1 秒内完成高亮切换。
2. 特写视角准确聚焦胸部前侧，主责为胸大肌与三角肌前束，肉眼可区分三级配色。
3. 关节运动标签与 gizmo 动画方向一致（如盂肱关节「水平内收」）。
4. 全量 GLB 资源 ≤ 12MB，本地开发机加载 ≤ 3 秒，交互帧率 ≥ 45fps。

## 2. 范围

### 包含

- 31 个预设动作（胸 6 / 背 6 / 肩 4 / 臂 5 / 腿 6 / 核心 4），中英文名 + 别名模糊搜索。
- 基于 Z-Anatomy 真实解剖模型的肌肉、骨骼、关节韧带三层展示。
- 三级肌肉高亮、关节运动循环动画、骨骼高亮。
- 相机特写与视角重置、图层控制、悬停拾取、图例。
- 桌面布局 + 窄屏基础适配。
- 资源构建管线（Blender 无界面脚本）与许可署名。

### 不包含

- 自由文本 AI 解析、后端服务、账号系统。
- 用户自定义动作。
- 完整肢体骨骼动画 / 动作过程回放（模型保持解剖姿态）。
- 医疗诊断、康复处方等专业结论。
- 移动端原生 App。

## 3. 技术栈与架构

- Vue 3（Composition API + `<script setup>` + TypeScript）
- Vite，Pinia，Three.js（含 GLTFLoader、DRACOLoader、OrbitControls、CSS2DRenderer）
- Vitest（数据与搜索单测）、vue-tsc（类型检查）
- 包管理器：pnpm

### 目录结构

```
src/
  data/
    types.ts            类型定义
    muscles.ts          肌群定义（中文名、英文名、分区、节点映射）
    bones.ts            骨骼定义
    joints.ts           关节定义（含运动轴、gizmo 锚点）
    exercises.ts        31 个动作及其肌肉/骨骼/关节映射
    exerciseViews.ts    分区默认视角 + 单动作覆盖视角
    search.ts           搜索与排序
  three/
    AnatomyScene.ts     场景生命周期、加载、渲染循环、拾取
    materials.ts        高亮材质状态与过渡
    JointGizmo.ts       关节环形箭头动画 + CSS2D 标签
    camera.ts           视角预设、飞行插值与重置
  stores/
    anatomy.ts          当前动作、图层、特写开关、加载/错误状态
  components/
    AppShell.vue
    ExerciseSearch.vue
    ExerciseList.vue
    AnatomyViewport.vue
    LayerControls.vue
    LegendBar.vue
    DetailPanel.vue
    MuscleRoleList.vue
    JointMotionList.vue
    AboutLicense.vue
  App.vue
  main.ts
public/
  models/               muscles.glb / bones.glb / joints.glb / soft-tissue.glb / manifest.json / LICENSE.txt
  draco/                Draco 解码器
tools/
  anatomy-build/
    build_anatomy.py    Blender 无界面构建脚本
    groups.json         解剖名称 → 肌群/骨骼/关节分组规则
    README.md           资源再生成说明
docs/
  superpowers/specs/2026-10-29-human-anatomy-movement-design.md
```

### 模块职责

- `data/`：纯数据与纯函数，不依赖 Three.js 与 Vue，可独立单测。
- `three/`：命令式 3D 引擎。对外只暴露 `load()`、`applyExercise(exercise)`、`setLayers(layers)`、`focus(view)`、`resetView()`、`dispose()`。
- `stores/anatomy.ts`：唯一状态源；用户操作写入 store，`AnatomyViewport` 监听并调用引擎方法。
- `components/`：只读 store + 触发动作，不直接操作 Three.js 对象。

### 数据流

1. 启动：`AnatomyScene.load()` 加载四个 GLB（肌肉 / 骨骼 / 关节 / 肌腱），LoadingManager 进度写入 store。
2. 选择动作：store 记录 `selectedExerciseId` → 视口调用 `applyExercise()`（材质高亮 + 关节 gizmo + 骨骼高亮）→ 若「自动特写」开启则 `focus(view)`。
3. 图层/隔离/特写开关：store 状态 → `setLayers()` / `focus()` / `resetView()`。
4. 悬停：引擎射线拾取 → 节点 `userData.groupId` → 回查中文名 → 通过事件更新 HTML tooltip。
5. 数据校验在构建与测试阶段完成，运行时不重复校验。

## 4. 数据模型

```ts
type MuscleRole = 'primary' | 'secondary' | 'stabilizer'
type Region = 'chest' | 'back' | 'shoulder' | 'arm' | 'leg' | 'core'
type LayerName = 'muscles' | 'bones' | 'joints'

interface MuscleGroup {
  id: string            // 例：'pectoralis-major'
  nameZh: string
  nameEn: string
  region: Region
}

interface BoneGroup {
  id: string            // 例：'humerus'
  nameZh: string
  nameEn: string
  region: Region
}

interface JointGroup {
  id: string            // 例：'shoulder'
  nameZh: string
  nameEn: string
  type: 'ball-and-socket' | 'hinge' | 'pivot' | 'plane' | 'pseudo'
  region: Region
  anchor: [number, number, number]  // 模型空间锚点（右手系，Y 向上，+Z 朝前）
}

interface ExerciseView {
  camera: [number, number, number]
  target: [number, number, number]
  fov?: number          // 默认 35
}

interface JointMotion {
  id: string            // JointGroup.id
  motionZh: string      // 例：'水平内收'
  axis: [number, number, number]   // 模型空间旋转轴
  arc: [number, number]            // gizmo 往复角度范围（度）
}

interface Exercise {
  id: string
  nameZh: string
  nameEn: string
  aliases: string[]
  category: Region
  equipment: string
  view: ExerciseView
  muscles: { id: string; role: MuscleRole }[]
  bones: string[]
  joints: JointMotion[]
}
```

ID 均为 kebab-case 英文。动作与结构数据中所有引用必须能解析，由单测保证。

### 肌群（41 组）

| id | 中文 | 英文 | Z-Anatomy 来源命名 |
|---|---|---|---|
| pectoralis-major | 胸大肌 | Pectoralis major | Clavicular head / Sternocostal head / (Abdominal part) |
| pectoralis-minor | 胸小肌 | Pectoralis minor | Pectoralis minor muscle |
| serratus-anterior | 前锯肌 | Serratus anterior | Serratus anterior muscle |
| deltoid-anterior | 三角肌前束 | Anterior deltoid | Clavicular part of deltoid |
| deltoid-lateral | 三角肌中束 | Lateral deltoid | Acromial part of deltoid |
| deltoid-posterior | 三角肌后束 | Posterior deltoid | Scapular spinal part of deltoid |
| trapezius-upper | 斜方肌上束 | Upper trapezius | Descending part of trapezius |
| trapezius-mid | 斜方肌中束 | Middle trapezius | Transverse part of trapezius |
| trapezius-lower | 斜方肌下束 | Lower trapezius | Ascending part of trapezius |
| latissimus-dorsi | 背阔肌 | Latissimus dorsi | Latissimus dorsi muscle |
| rhomboid | 菱形肌 | Rhomboids | Rhomboid major / minor |
| levator-scapulae | 肩胛提肌 | Levator scapulae | Levator scapulae |
| teres-major | 大圆肌 | Teres major | Teres major muscle |
| teres-minor | 小圆肌 | Teres minor | Teres minor muscle |
| infraspinatus | 冈下肌 | Infraspinatus | Infraspinatus muscle |
| supraspinatus | 冈上肌 | Supraspinatus | Supraspinatus muscle |
| subscapularis | 肩胛下肌 | Subscapularis | Subscapularis muscle |
| erector-spinae | 竖脊肌 | Erector spinae | Iliocostalis / Longissimus / Spinalis |
| rectus-abdominis | 腹直肌 | Rectus abdominis | Rectus abdominis muscle |
| external-oblique | 腹外斜肌 | External oblique | External abdominal oblique |
| internal-oblique | 腹内斜肌 | Internal oblique | Internal abdominal oblique |
| transversus-abdominis | 腹横肌 | Transversus abdominis | Transversus abdominis muscle |
| iliopsoas | 髂腰肌 | Iliopsoas | Psoas major + Iliacus |
| biceps-brachii | 肱二头肌 | Biceps brachii | Long / Short head of biceps brachii |
| brachialis | 肱肌 | Brachialis | Brachialis muscle |
| brachioradialis | 肱桡肌 | Brachioradialis | Brachioradialis muscle |
| triceps-brachii | 肱三头肌 | Triceps brachii | Long / Lateral / Medial head of triceps |
| forearm-flexors | 前臂屈肌群 | Forearm flexors | Flexor digitorum / carpi, pronators |
| forearm-extensors | 前臂伸肌群 | Forearm extensors | Extensor digitorum / carpi |
| gluteus-maximus | 臀大肌 | Gluteus maximus | Gluteus maximus muscle |
| gluteus-medius | 臀中肌 | Gluteus medius | Gluteus medius muscle |
| gluteus-minimus | 臀小肌 | Gluteus minimus | Gluteus minimus muscle |
| tensor-fasciae-latae | 阔筋膜张肌 | Tensor fasciae latae | Tensor fasciae latae |
| adductors | 内收肌群 | Hip adductors | Adductor longus / brevis / magnus, Pectineus, Gracilis |
| quadriceps | 股四头肌 | Quadriceps | Rectus femoris + Vastus lateralis / medialis / intermedius |
| hamstrings | 腘绳肌 | Hamstrings | Biceps femoris + Semitendinosus + Semimembranosus |
| gastrocnemius | 腓肠肌 | Gastrocnemius | Medial / Lateral head of gastrocnemius |
| soleus | 比目鱼肌 | Soleus | Soleus muscle |
| tibialis-anterior | 胫骨前肌 | Tibialis anterior | Tibialis anterior muscle |
| fibularis | 腓骨肌群 | Fibularis | Fibularis longus / brevis / tertius |
| other-muscles | 其他肌群 | Other muscles | 面肌、手内在肌、筋膜等未映射网格合并 |

### 骨骼（20 组）

| id | 中文 | 来源命名 |
|---|---|---|
| cranium | 颅骨 | Frontal / Parietal / Occipital / Temporal / Sphenoid / Ethmoid |
| mandible | 下颌骨 | Mandible |
| clavicle | 锁骨 | Clavicle.l/.r |
| scapula | 肩胛骨 | Scapula.l/.r |
| humerus | 肱骨 | Humerus.l/.r |
| radius | 桡骨 | Radius.l/.r |
| ulna | 尺骨 | Ulna.l/.r |
| ribs | 肋骨 | First–Twelfth rib.l/.r |
| sternum | 胸骨 | Body / Manubrium of sternum |
| spine | 脊柱 | Vertebra C3–L5、Sacrum |
| pelvis | 骨盆 | Hip bone.l/.r |
| femur | 股骨 | Femur.l/.r |
| patella | 髌骨 | Patella.l/.r |
| tibia | 胫骨 | Tibia.l/.r |
| fibula | 腓骨 | Fibula.l/.r |
| calcaneus | 跟骨 | Calcaneus.l/.r |
| talus | 距骨 | Talus.l/.r |
| hand | 手骨（简化） | 手部骨碎片合并 |
| foot | 足骨（简化） | 足部骨碎片合并 |
| other-bones | 其他骨骼 | 剩余完整骨碎片 |

骨骼高亮规则（确定性，不逐动作手写）：由动作激活的关节推导——

- 盂肱关节 → 肱骨 + 肩胛骨；肩锁/胸锁 → 锁骨 + 肩胛骨 + 胸骨
- 肘关节 → 肱骨 + 桡骨 + 尺骨；腕关节 → 桡骨 + 尺骨 + 手骨
- 髋关节 → 骨盆 + 股骨；膝关节 → 股骨 + 胫骨 + 髌骨；踝关节 → 胫骨 + 腓骨 + 距骨 + 跟骨
- 腰椎/颈椎 → 脊柱；骶髂 → 骨盆 + 脊柱；肩胛胸壁 → 肩胛骨 + 肋骨 + 脊柱

### 关节（12 组）

| id | 中文 | 类型 |
|---|---|---|
| shoulder | 盂肱关节 | ball-and-socket |
| scapulothoracic | 肩胛胸壁 | pseudo |
| acromioclavicular | 肩锁关节 | plane |
| sternoclavicular | 胸锁关节 | plane |
| elbow | 肘关节 | hinge |
| wrist | 桡腕关节 | plane |
| hip | 髋关节 | ball-and-socket |
| knee | 膝关节 | hinge |
| ankle | 踝关节 | hinge |
| sacroiliac | 骶髂关节 | plane |
| lumbar-spine | 腰椎 | pseudo |
| cervical-spine | 颈椎 | pseudo |

肩胛胸壁为伪关节，没有独立的关节囊网格，仅用于前端 gizmo 与运动标注。`anchor` 初始值由模型包围盒推算（如肩关节 ≈ 肱骨头中心），实施时在浏览器中校准并写入 `joints.ts`。

## 5. 动作库

搜索规则：

- 归一化（去空格、转小写）后匹配中文名、英文名、别名。
- 排序：完全匹配 > 前缀匹配 > 包含匹配；同级按动作库顺序。
- 空查询展示全部动作（按分类分组），默认选中「杠铃卧推」。
- 输入防抖 120ms，支持 ↑/↓/Enter 键盘操作；无结果时展示推荐 chips（卧推、深蹲、引体向上、平板支撑）。

动作表（主责 / 协同 / 稳定 / 关节·运动）：

| 动作 | 主责 | 协同 | 稳定 | 关节与运动 |
|---|---|---|---|---|
| 杠铃卧推 Barbell Bench Press（卧推、平板卧推） | 胸大肌、三角肌前束 | 肱三头肌、胸小肌 | 前锯肌、菱形肌、冈下肌、小圆肌 | 盂肱·水平内收；肘·伸展；肩胛胸壁·后缩稳定 |
| 哑铃卧推 Dumbbell Bench Press（哑铃平板卧推） | 胸大肌、三角肌前束 | 肱三头肌 | 冈下肌、小圆肌、前锯肌、腹横肌 | 盂肱·水平内收；肘·伸展 |
| 上斜卧推 Incline Bench Press（上斜推胸） | 胸大肌、三角肌前束 | 肱三头肌、前锯肌 | 菱形肌、冈下肌 | 盂肱·屈曲+水平内收；肘·伸展 |
| 俯卧撑 Push-up（伏地挺身） | 胸大肌、肱三头肌、三角肌前束 | 前锯肌、腹直肌 | 腹横肌、臀大肌、菱形肌 | 盂肱·水平内收；肘·屈伸；肩胛胸壁·前伸/后缩 |
| 哑铃飞鸟 Dumbbell Fly（飞鸟夹胸） | 胸大肌 | 三角肌前束 | 冈下肌、小圆肌、肱二头肌 | 盂肱·水平内收/外展；肘·微屈稳定 |
| 双杠臂屈伸 Dips（双杠撑体） | 胸大肌、肱三头肌 | 三角肌前束 | 菱形肌、前锯肌、腹横肌 | 盂肱·伸展/内收；肘·屈伸；肩胛胸壁·下回旋 |
| 引体向上 Pull-up（正手引体） | 背阔肌、大圆肌 | 肱二头肌、肱肌、菱形肌、斜方肌中/下束 | 前臂屈肌群、腹直肌 | 盂肱·内收/伸展；肘·屈曲；肩胛胸壁·下回旋 |
| 高位下拉 Lat Pulldown（下拉） | 背阔肌、大圆肌 | 肱二头肌、肱肌、菱形肌 | 斜方肌下束、前臂屈肌群 | 盂肱·内收；肘·屈曲；肩胛胸壁·下回旋 |
| 杠铃划船 Barbell Row（俯身划船） | 背阔肌、菱形肌、斜方肌中束 | 肱二头肌、肱肌、三角肌后束、竖脊肌 | 腹直肌、腹横肌、臀大肌 | 盂肱·伸展；肘·屈曲；肩胛胸壁·后缩 |
| 直臂下压 Straight-arm Pulldown（直臂下拉） | 背阔肌、大圆肌 | 肱三头肌 | 腹横肌、菱形肌 | 盂肱·伸展；肘·稳定；肩胛胸壁·后缩 |
| 硬拉 Deadlift（传统硬拉） | 臀大肌、腘绳肌、竖脊肌 | 股四头肌、背阔肌、斜方肌中束、前臂屈肌群 | 腹直肌、腹横肌、菱形肌 | 髋·伸展；膝·伸展；腰椎·中立稳定 |
| 坐姿划船 Seated Cable Row（坐姿滑轮划船） | 背阔肌、菱形肌、斜方肌中束 | 肱二头肌、三角肌后束 | 竖脊肌、腹横肌 | 盂肱·伸展；肘·屈曲；肩胛胸壁·后缩 |
| 站姿推举 Overhead Press（肩推、站姿杠铃推举） | 三角肌前束、三角肌中束 | 肱三头肌、斜方肌上束、前锯肌 | 冈上肌、冈下肌、腹横肌 | 盂肱·屈曲/外展；肘·伸展；肩胛胸壁·上回旋 |
| 哑铃侧平举 Lateral Raise（侧平举） | 三角肌中束 | 三角肌前束、冈上肌、斜方肌上束 | 冈下肌、小圆肌 | 盂肱·外展 |
| 俯身飞鸟 Bent-over Reverse Fly（反向飞鸟） | 三角肌后束 | 菱形肌、斜方肌中束、冈下肌、小圆肌 | 竖脊肌、腹横肌 | 盂肱·水平外展；肩胛胸壁·后缩 |
| 面拉 Face Pull（绳索面拉） | 三角肌后束、菱形肌、斜方肌中/下束 | 冈下肌、小圆肌 | 腹横肌、臀大肌 | 盂肱·外旋/水平外展；肩胛胸壁·后缩/下回旋 |
| 杠铃弯举 Barbell Curl（二头弯举） | 肱二头肌、肱肌 | 肱桡肌、前臂屈肌群 | 三角肌前束 | 肘·屈曲；盂肱·屈曲稳定 |
| 锤式弯举 Hammer Curl（锤式） | 肱肌、肱桡肌 | 肱二头肌、前臂屈肌群 | 三角肌前束 | 肘·屈曲 |
| 窄距卧推 Close-grip Bench Press（窄推） | 肱三头肌、胸大肌 | 三角肌前束 | 冈下肌、小圆肌、前锯肌 | 肘·伸展；盂肱·水平内收 |
| 绳索下压 Cable Triceps Pushdown（三头下压） | 肱三头肌 | 前臂伸肌群 | 三角肌后束、腹横肌 | 肘·伸展 |
| 颈后臂屈伸 Overhead Triceps Extension（过头臂屈伸） | 肱三头肌 | 前臂屈肌群 | 三角肌、腹横肌 | 肘·伸展；盂肱·屈曲稳定 |
| 深蹲 Back Squat（杠铃深蹲） | 股四头肌、臀大肌 | 腘绳肌、内收肌群、竖脊肌 | 腹横肌、腹直肌、比目鱼肌 | 髋·屈伸；膝·屈伸；踝·背屈/跖屈；腰椎·中立稳定 |
| 腿举 Leg Press（倒蹬） | 股四头肌、臀大肌 | 腘绳肌、内收肌群 | 腹横肌 | 膝·伸展；髋·屈伸 |
| 弓步蹲 Lunge（箭步蹲） | 股四头肌、臀大肌、臀中肌 | 腘绳肌、内收肌群 | 腹横肌、比目鱼肌 | 髋·屈伸；膝·屈伸；踝·背屈/跖屈 |
| 罗马尼亚硬拉 Romanian Deadlift（RDL） | 腘绳肌、臀大肌 | 竖脊肌、内收肌群 | 背阔肌、腹横肌 | 髋·屈伸（铰链）；膝·微屈稳定；腰椎·中立 |
| 腿弯举 Leg Curl（俯卧腿弯举） | 腘绳肌 | 腓肠肌 | 臀大肌、腹横肌 | 膝·屈曲 |
| 提踵 Calf Raise（站姿提踵） | 腓肠肌、比目鱼肌 | 腓骨肌群 | 胫骨前肌 | 踝·跖屈/背屈 |
| 平板支撑 Plank | 腹直肌、腹横肌、腹外斜肌 | 臀大肌、三角肌前束、前锯肌 | 竖脊肌、菱形肌 | 腰椎·中立稳定；盂肱·稳定；髋·稳定 |
| 卷腹 Crunch | 腹直肌 | 腹外斜肌、腹内斜肌 | 髂腰肌 | 胸腰段·屈曲；髋·稳定 |
| 悬垂举腿 Hanging Leg Raise（悬垂抬腿） | 腹直肌、髂腰肌 | 腹外斜肌、腹内斜肌 | 前臂屈肌群、背阔肌 | 髋·屈曲；腰椎·屈曲 |
| 俄罗斯转体 Russian Twist | 腹外斜肌、腹内斜肌、腹直肌 | 腹横肌 | 竖脊肌、髂腰肌 | 腰椎·旋转 |

`bones` 字段由第 4 节骨骼推导规则生成，存储显式数组（不在运行时推导），便于单测与展示。

### 视角预设

模型规范：Y 向上、+Z 朝前、双脚位于 Y=0、身高 1.75。

| 分类 | camera | target |
|---|---|---|
| chest | [0.72, 1.72, 1.45] | [0, 1.18, 0] |
| back | [-0.90, 1.65, -1.65] | [0, 1.18, 0] |
| shoulder | [0.85, 1.62, 1.35] | [0, 1.32, 0] |
| arm | [1.00, 1.28, 1.35] | [0.28, 1.02, 0] |
| leg | [0.90, 1.25, 2.40] | [0, 0.85, 0] |
| core | [0.70, 1.22, 1.90] | [0, 1.00, 0] |

单动作覆盖：硬拉、罗马尼亚硬拉用侧视 `[2.1, 1.15, 1.1] / [0, 0.85, 0]`；腿弯举 `[1.4, 0.7, 1.0] / [0, 0.4, 0]`；提踵 `[1.2, 0.6, 1.0] / [0, 0.3, 0]`；引体向上、高位下拉使用背侧分类视角。其余使用分类默认值。

## 6. 3D 场景与交互

### 场景

- `WebGLRenderer`（antialias、ACESFilmicToneMapping、DPR 上限 2），深色背景 `#0A0D12`，轻微雾化。
- 环境 IBL（RoomEnvironment + PMREM，强度 0.35）+ 主光 / 轮廓光 / 补光 / 暖色反弹光；地面为简化暗色圆盘。
- 肌肉使用 `MeshPhysicalMaterial`：粗糙度 0.54、clearcoat 0.28、sheen 0.35，并通过注入式着色器加入世界坐标噪声与纤维纹理；骨与关节使用 `MeshStandardMaterial`。
- 默认视角：全身 3/4，camera `[1.15, 1.05, 2.75]`，target `[0, 0.92, 0]`，fov 35。
- `OrbitControls`：阻尼 0.08，限制俯仰 10°–170°，距离 0.6–4.5；禁用平移以保持构图。

### 高亮状态

| 状态 | 肌肉 | 骨骼 | 关节 |
|---|---|---|---|
| 基础 | 暗肌肉红 `#7E3A33`（带明暗变化） | 象牙 `#D8C8AE` | 灰青 `#3A6B72` |
| 主责 | 深红 `#B53C33` + 微弱自发光 | — | — |
| 协同 | 砖红 `#A95C3A` + 微弱自发光 | — | — |
| 稳定 | 赭色 `#B08A50` + 微弱自发光 | — | — |
| 参与骨骼 | — | 暖象牙 `#EFD8AF` + 微弱自发光 | — |
| 激活关节 | — | — | 青 `#4FD6E0` + 自发光 |

- 非参与肌肉压暗为 `#462A27`；开启骨骼/关节层时以 0.4 不透明度呈现，形成可透视骨架的体表轮廓。未参与骨骼为 `#5F5749`（0.4），未参与关节为 `#2F555B`（0.35）。
- 「仅显示参与结构」开启时，非参与组 `visible=false`。
- 骨骼或关节层开启时，非参与肌肉切为半透明（opacity 0.4，`depthWrite=false`），参与肌肉保持不透明；两层都关闭时非参与肌肉为 0.64。
- 颜色过渡在 RAF 中按指数缓动（约 0.3s 完成），尊重 `prefers-reduced-motion`（直接切换）。

### 关节循环动画

- 每个激活关节生成 gizmo：Torus 圆环（半径按关节类型 0.042–0.05）+ 箭头锥体，按 `axis` 定向；CSS2D 标签显示「关节名 · 运动名」。肩胛胸壁属伪关节，无网格高亮，仅显示光点与标签。
- 动画：绕轴在 `arc` 范围内以正弦缓动往复，周期 2.4s；圆环与箭头同步旋转。
- 同时激活肌肉的自发光强度做 0.01–0.022 的微弱呼吸（周期 2.4s，与 gizmo 同相）。
- 不做骨骼旋转或肌肉形变，避免破坏解剖模型。
- 多关节动作最多同时显示 4 个 gizmo（深蹲含髋、膝、踝、腰椎四轴）。
- `prefers-reduced-motion: reduce` 时 gizmo 静止在弧线中点，标签保留。

### 相机特写

- `focus(view)`：camera 与 controls.target 用 smoothstep 在 900ms 内插值；完成后仍可自由旋转缩放。
- 自动特写开关默认开启；关闭后选择动作只换高亮，不动相机。
- 「重置视角」回到默认全身视角（900ms）。
- 用户一旦手动拖拽，当前过渡立即取消，以用户操作为准。

### 悬停拾取

- pointermove 节流 50ms，射线只检测参与高亮的肌肉/骨骼/关节网格；肌腱层不做拾取。
- 命中节点读取 `userData.groupId` 与图层类型，tooltip 显示中文名 + 类型（肌肉/骨骼/关节），跟随指针偏移 14px；指针离开或命中空白时隐藏。
- 悬停仅做轻微提亮（自发光 +0.08），不改变角色高亮状态。

### 资源加载

- 四个 GLB 并行加载，肌肉优先；加载完成前显示进度条与简化骨架占位。肌腱层挂到肌肉根节点，随肌肉图层显示/隐藏。
- Draco 解码器放本地 `public/draco/`，不走 CDN。
- 加载失败显示错误浮层与「重试」按钮；WebGL 不可用时显示静态提示。

## 7. UI / UX

### 布局（≥1024px）

- **顶栏 56px**：产品名「肌动图谱」+ 副标题「Kinesis Atlas」；右侧「模型来源与许可」入口。
- **左栏 320px**：搜索框（placeholder「输入动作，如：卧推 / 深蹲 / 划船」）、分类 chips（全部 / 胸 / 背 / 肩 / 臂 / 腿 / 核心）、动作列表。
- **中间 3D 视口**：全高；左上图层面板；右上操作（自动特写开关、重置视角）；左下三级图例 + 关节/骨骼色；右下操作提示（拖拽旋转 · 滚轮缩放 · 悬停查看名称）。
- **右栏 360px**：动作标题（中/英）、分类与器械标签；「目标肌群」按主责/协同/稳定分组，每组带强度条（主责 100%、协同 65%、稳定 35%）；「关节运动」列表（关节名 + 运动描述，激活时圆点呼吸）；「参与骨骼」chips。

### 窄屏（<1024px）

- 左栏折叠为顶部搜索栏 + 抽屉式动作列表；右栏折叠为底部可上拉详情面板；3D 视口保持主区域。
- 不做逐像素打磨，但所有功能可用。

### 视觉规范

- 背景：`#0A0D12` 径向渐变 + 极淡 48px 网格线（opacity 0.04）。
- 文字：`-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`；主文字 `#E8E3D9`，次要 `#8B877E`。
- 面板：`#11151C / 88%` 不透明 + 1px `rgba(255,255,255,0.08)` 边框 + 12px 圆角；不使用大面积霓虹与渐变按钮。
- 强调色：关节青 `#38D9E8`；主责红 `#FF5A4E`。
- 动效：面板淡入 160ms；高亮过渡 400ms；相机 900ms；无弹跳动画。

### 状态

- 加载中：视口中央进度环 + 百分比；面板骨架屏。
- 无搜索结果：「没有找到『xxx』」+ 推荐动作 chips。
- 加载失败：错误卡片 + 重试。
- 窄屏提示：首屏轻提示「拖拽旋转」。

### 署名

- 页脚/关于弹窗文案：
  - 模型：Z-Anatomy — The open source atlas of anatomy（CC BY-SA 4.0）
  - 数据来源：BodyParts3D — The Database Center for Life Science（CC BY-SA 2.1 Japan）
  - 本应用中的衍生 3D 资源以 CC BY-SA 4.0 发布。
- `public/models/LICENSE.txt` 保存完整许可说明。

## 8. 资源管线

### 输入

- `https://raw.githubusercontent.com/LluisV/Z-Anatomy/PC-Version/Resources/Models/FBX/MuscularSystem100.fbx`（约 37MB，686 网格）
- `.../SkeletalSystem100.fbx`（约 41MB，1952 网格）
- `.../Joints100.fbx`（约 9.8MB，416 网格）

下载缓存到 `tools/anatomy-build/.cache/`（gitignore），生成物提交到 `public/models/`。

### 构建步骤（Blender 3.6 无界面）

1. 逐个导入 FBX，应用变换，统一坐标系；按包围盒把模型缩放到 1.75m、脚底 Y=0、X/Z 居中、面向 +Z。
2. 肌肉层：排除 fascia / bursa / sheath / retinaculum / aponeurosis / tendon 命名的网格；按 `groups.json` 正则合并为 41 组；未映射网格并入 `other-muscles`。
3. 软组织层：从同一 FBX 提取 `tendon` / `retinaculum`（排除 bursa / sheath / synovial），合并为单节点 `soft__tissue`，独立导出 `soft-tissue.glb`。
4. 骨骼层：排除 ≤20 面的占位网格；完整长骨与颅骨/肋骨/椎骨按规则合并为 20 组；手/足碎骨合并为简化组。
5. 关节层：按关节名正则合并关节囊与韧带为 11 组（左右合并；肩胛胸壁无网格）。
6. 去重：同组内包围盒重叠率 > 90% 的网格只保留面数最高者（处理 `.i/.j` 与 `.l/.r` 重复）。
7. 减面：Decimate Collapse，目标三角面——肌肉 30 万、骨骼 15 万、关节 8 万、肌腱 9 万；平滑着色。
8. 每层赋予单一基础材质（颜色由前端材质覆盖），节点名 `muscle__<id>` / `bone__<id>` / `joint__<id>` / `soft__tissue`。
9. 导出 4 个 GLB（Draco level 6）+ `manifest.json`（图层节点、三角面数、包围盒、模型朝向）；同时写入 `public/models/LICENSE.txt`。
10. 校验：每层三角面与文件大小在预算内；41/20/11 组与肌腱节点全部存在（肩胛胸壁为 gizmo-only 伪关节）；不再有 ≤6 面占位网格。

### 产物预算

| 文件 | 目标大小 | 三角面 |
|---|---|---|
| muscles.glb | ≤ 2MB | ≤ 300k |
| bones.glb | ≤ 1MB | ≤ 150k |
| joints.glb | ≤ 1MB | ≤ 80k |
| soft-tissue.glb | ≤ 0.5MB | ≤ 90k |
| manifest.json | < 20KB | — |

总计 ≤ 12MB。

### 许可

- 源数据：BodyParts3D（CC BY-SA 2.1 JP）+ Z-Anatomy（CC BY-SA 4.0）。
- 生成物与应用内展示的衍生模型按 CC BY-SA 4.0 发布；必须保留署名与许可链接。
- FBX 源文件不提交仓库；脚本记录来源 URL 与许可。

## 9. 性能与错误处理

- DPR 上限 2；窗口 resize 防抖；页面隐藏时暂停 RAF。
- 材质按组复用；高亮只修改颜色/自发光，不克隆几何、不重建材质。
- 拾取只在 pointermove 节流执行；射线检测对象为 73 个组节点。
- GLB 并行加载 + Draco；加载失败可重试，已加载层不重复请求。
- `dispose()` 释放几何、材质、纹理、渲染器与事件监听。
- 所有入口对 `selectedExercise` 做空值保护；未知 ID 在测试阶段即失败。

## 10. 测试与验收

### 单元测试（Vitest）

1. 数据完整性：每个动作的 muscle/bone/joint ID 均存在；每个动作主责 ≥1、协同/稳定非空；别名全局唯一且不与动作名重复；每个动作有视角与 ≥1 个关节运动。
2. 骨骼推导：按关节规则生成的 bones 与数据中显式数组一致。
3. 搜索：空查询返回全部；「卧推」首位为杠铃卧推；「bench」命中；大小写/空格归一化；分类过滤；无结果返回空数组。
4. manifest 覆盖：数据中的 41/20/12 个 ID 中，除肩胛胸壁外的 41/20/11 个在对应图层 manifest 中都有节点；`soft-tissue` 图层包含 `tissue` 节点。

### 构建与类型

- `pnpm typecheck`（vue-tsc）无错误。
- `pnpm build` 成功。
- `pnpm test` 全绿。

### 浏览器手工验收

1. 首屏加载后默认「杠铃卧推」已选中，相机位于胸部特写，主责红/协同橙/稳定黄可区分。
2. 搜索「卧推」→ 结果首位正确；选中后高亮与右侧列表一致。
3. 关节 gizmo 循环播放，「盂肱关节 · 水平内收」标签随关节定位；肌肉呼吸动画同步。
4. 切换肌肉/骨骼/关节图层：骨骼可见时肌肉半透明；关闭骨骼恢复。
5. 「仅显示参与结构」隐藏未参与组；「重置视角」回到全身。
6. 切换到深蹲：相机下移，股四头肌/臀大肌为主责，膝关节/髋关节 gizmo 出现。
7. 悬停肌肉显示中文名与类型；移出消失。
8. 无结果输入、断网加载失败、窄屏布局三种边界正常。
9. 开启系统「减少动态效果」后循环动画停止、相机瞬移。

### 验收指标

- 本地加载 ≤ 3s；交互 ≥ 45fps（Apple Silicon + Chrome）。
- 资源总量 ≤ 12MB。
- 31 个动作全部可通过搜索命中。

## 11. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| FBX 命名不规则，分组遗漏 | 部分肌肉不参与高亮 | `groups.json` 正则 + 未映射兜底 `other-*`；构建报告未映射比例，需 <5% |
| `.i/.j` 与 `.l/.r` 重复网格 | 重影/z-fighting | 组内包围盒重叠 >90% 去重，保留面数最高者；浏览器目检 |
| 骨骼碎片多、占位网格 | 骨架不完整 | 排除 ≤6 面网格；只用完整长骨/颅骨/肋骨/椎骨，手足简化 |
| 减面过度 | 肌肉形态模糊 | 每层面数预算内优先保留轮廓；近景特写目检 |
| CC BY-SA 传染性 | 合规风险 | 明确署名、保留许可文件、衍生资源同许可发布 |
| 相机预设不适配模型朝向 | 特写偏移 | 用包围盒归一化后在浏览器逐分类校准，视角数据集中可调 |
| 关节锚点偏差 | gizmo 漂移 | 锚点集中在 `joints.ts`，按骨骼包围盒校准 |
| 低端设备掉帧 | 体验下降 | DPR 上限、减面、按需渲染（无动画时降频） |

## 12. 交付物

- 可运行的 Vue 3 应用源码与配置。
- 3 个 Draco GLB + manifest + Draco 解码器 + 许可文件。
- Blender 构建脚本、分组规则、再生成 README。
- 单元测试与通过记录。
- 本设计文档。


## 13. 运动演示（追加实现）

在静态解剖模式之外增加「运动」开关，用于直观演示动作过程。

- 范围：先支持杠铃卧推；其他动作按钮置灰并提示暂未提供。
- 实现：将现有 4 个静态 GLB 的网格在运行时按最近骨骼切分为刚性分段，挂到 pelvis / spine / head / 上臂 / 前臂 / 手 / 大腿 / 小腿 / 脚共 15 个骨骼节点；肩、肘、髋、膝加关节覆盖球遮盖接缝。
- 姿态：仰卧在卧推凳上，双腿屈膝落地；上臂与前臂使用世界空间目标方向的 FK 求解，按 2.4s 周期做推举循环。
- 器械：程序化卧推凳与杠铃；杠铃位置每帧取双手世界坐标中点，并沿双手连线定向。
- 相机：运动模式使用独立 3/4 脚端视角；关闭后恢复静态特写。
- 限制：刚性分段非平滑蒙皮，关节处可见分段感；当前只覆盖卧推，扩展其他动作需逐个校准骨骼姿态与器械。
