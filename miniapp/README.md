# 肌动图谱 · Mini

基于 uni-app + unibest 的跨端版本，同时构建 H5 和微信小程序。

## 功能

- 31 个训练动作搜索、分类浏览
- 2D Canvas 人体正面/背面，按主责/协同/稳定高亮肌群
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

- 小程序端使用 2D Canvas 示意人体，肌群为合并显示；完整 3D 版本在仓库根目录的 Web 项目中。
- 数据层与 Web 版保持一致，当前通过复制同步；后续可提取共享包。
- 内容用于学习与辅助排查，不构成医疗诊断；模型来源 Z-Anatomy / BodyParts3D（CC BY-SA）。
