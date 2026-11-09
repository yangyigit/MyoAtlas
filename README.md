# 肌谱 · MyoAtlas

输入或选择一个训练动作，用可旋转的高模 3D 解剖人体展示调用的肌肉、关节与骨骼。Web 端使用约 140 万面的高模版本（肌肉 81 万 / 骨骼 39 万 / 关节 17 万），肌肉按主责 / 协同 / 稳定三级高亮，关节按相对负荷分级着色，并给出肌肉功能、技术要点、常见错误、风险红旗与低风险替代。

界面采用全屏 3D + 浮动玻璃面板结构：左侧动作选择、右侧动作详情、底部图层与视角控制；移动端使用底部抽屉。该布局参考了 [Human Atlas](https://github.com/ashemag/human-atlas)（MIT）的浏览结构，但未使用其 3D 数据。

顶栏「疼痛排查」提供人体区域图、可能相关结构、诱因动作、症状问卷与分诊建议，以及本地疼痛日记。

顶栏「增肌面板」按肌群查看动作覆盖与刺激画像、记录训练日志并按 7 天汇总各肌群有效组数；个人档案中的疼痛区域与器械可用性会联动提示。

3D 视口提供**矢状面 / 冠状面**参考标线独立开关，用半透明网格显示解剖平面。

## 本地运行

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5173
pnpm test       # 数据完整性与搜索单测
pnpm build      # 类型检查 + 生产构建
```

## 技术栈

Vue 3 + TypeScript + Vite + Pinia + Three.js（Draco GLB、PBR/IBL）+ Element Plus（深色主题）。

## 目录

- `src/data/`：肌群、骨骼、关节、51 个动作、搜索逻辑、动作知识库（肌肉功能、关节负荷、风险与替代）、疼痛排查数据/分诊、增肌刺激画像与容量目标
- `src/stores/`：解剖状态、训练日志与个人档案（localStorage）
- `src/three/`：场景、材质高亮、相机、关节 gizmo、拾取
- `src/stores/`：唯一状态源
- `src/components/`：搜索、3D 视口、详情、图层、图例、许可弹窗
- `public/models/`：肌肉 / 骨骼 / 关节 / 肌腱 4 个 Draco GLB 与 manifest
- `tools/anatomy-build/`：Blender 资源再生成管线
- `tools/verify/`：Playwright 桌面验收脚本（可选）

## 3D 模型许可

模型来自 [Z-Anatomy](https://www.z-anatomy.com/)（CC BY-SA 4.0），数据源自 [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/)（CC BY-SA 2.1 Japan）。本应用中的衍生 GLB 同以 CC BY-SA 4.0 发布，详见 [public/models/LICENSE.txt](public/models/LICENSE.txt)。Web 高模 Draco 资源约 4.2MB；小程序低模约 875KB。

## 动作库

动作清单与器械分类参考 [free-exercise-db](https://github.com/yuhonas/free-exercise-db)（Unlicense，876 条公开动作）；中文名称、肌肉角色、关节运动与训练要点按本项目的解剖分组重新整理。当前 51 个动作，其中 20 个为器械/绳索动作，覆盖胸、背、肩、臂、腿、核心。

内容参考通用运动解剖学与力量训练资料，负荷等级表示动作对关节的相对要求，不是受伤概率。本工具用于学习与辅助排查，不构成医疗诊断或治疗建议。


## 小程序 / H5 轻量版（miniapp）

`miniapp/` 是基于 **uni-app + unibest** 的跨端版本，同时支持 H5 和微信小程序。人体使用 **three-platformize + Three.js 原生 3D**，与桌面版共享同一套解剖分组模型；支持单指旋转、双指缩放、正/背面视角、肌肉/骨骼/关节图层和“仅参与”隔离。

```bash
cd miniapp
pnpm install
pnpm dev:h5          # H5，http://127.0.0.1:9000
pnpm dev:mp-weixin   # 微信小程序，导入 dist/dev/mp-weixin
pnpm build:h5
pnpm build:mp-weixin
```

小程序 AppID 在 `miniapp/env/.env` 的 `VITE_WX_APPID` 中配置。数据层与 Web 版保持一致，修改 `src/data` 后执行：

```bash
pnpm sync:mini-data
```

说明：小程序端使用 1.1MB 源模型（52k 面，KHR_mesh_quantization 量化后约 875KB），微信主包约 1.70MB；完整高模与矢状面/冠状面标线请使用根目录的 Web 版。模型再生成见 `tools/anatomy-build/README.md`。
