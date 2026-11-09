# 肌谱 · Mini

基于 uni-app + unibest 的跨端版本，同时构建 H5 和微信小程序。

## 功能

- 51 个训练动作搜索、分类浏览
- 原生 3D 人体（three-platformize + Three.js），单指旋转、双指缩放、正/背面视角
- 肌肉/骨骼/关节图层开关与“仅参与”隔离；按主责/协同/稳定高亮
- 肌肉功能、关节负荷、技术要点、常见错误、红旗信号、低风险替代
- 疼痛排查：区域选择、可能相关结构、相关动作、症状问卷、分诊、疼痛日记
- 增肌：肌群动作覆盖、刺激画像、每周有效组数、训练日志

## 运行

```bash
pnpm install
pnpm dev:h5        # H5，http://127.0.0.1:9000
pnpm dev:mp-weixin # 微信小程序，导入 dist/dev/mp-weixin
pnpm build:h5
pnpm build:mp-weixin
```

微信小程序 AppID 在 `env/.env` 的 `VITE_WX_APPID` 中配置，当前为 `touristappid`。

## 说明

- 3D 模型由 Web 版四个 Draco GLB 合并、减面到 52k 三角面后导出，经 `KHR_mesh_quantization` 量化到约 875KB，放在 `src/static/models/anatomy-mini.glb`。
- 小程序用 `WechatPlatform + WebGL1Renderer`，H5 用 `BrowserPlatform + WebGLRenderer`；触摸事件转发给 OrbitControls。
- 微信主包当前约 1.70MB（上限 2MB）；不再使用的 2D Canvas 人体代码已移除。
- 数据层与 Web 版保持一致，当前通过复制同步；后续可提取共享包。
- 内容用于学习与辅助排查，不构成医疗诊断；模型来源 Z-Anatomy / BodyParts3D（CC BY-SA）。
