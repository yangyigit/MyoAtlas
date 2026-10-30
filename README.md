# 肌动图谱 · Kinesis Atlas

输入或选择一个训练动作，用可旋转的 3D 解剖人体展示调用的肌肉、关节与骨骼。肌肉按主责 / 协同 / 稳定三级高亮，关节播放运动方向 gizmo，相机自动飞到目标部位特写。

## 本地运行

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5173
pnpm test       # 数据完整性与搜索单测
pnpm build      # 类型检查 + 生产构建
```

## 技术栈

Vue 3 + TypeScript + Vite + Pinia + Three.js（Draco GLB、PBR/IBL）。

## 目录

- `src/data/`：肌群、骨骼、关节、31 个动作及搜索逻辑
- `src/three/`：场景、材质高亮、相机、关节 gizmo、拾取
- `src/stores/`：唯一状态源
- `src/components/`：搜索、3D 视口、详情、图层、图例、许可弹窗
- `public/models/`：肌肉 / 骨骼 / 关节 / 肌腱 4 个 Draco GLB 与 manifest
- `tools/anatomy-build/`：Blender 资源再生成管线
- `tools/verify/`：Playwright 桌面验收脚本（可选）

## 3D 模型许可

模型来自 [Z-Anatomy](https://www.z-anatomy.com/)（CC BY-SA 4.0），数据源自 [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/)（CC BY-SA 2.1 Japan）。本应用中的衍生 GLB 同以 CC BY-SA 4.0 发布，详见 [public/models/LICENSE.txt](public/models/LICENSE.txt)。

动作与肌肉映射参考通用运动解剖学资料，仅用于学习与演示，不构成医疗建议。
