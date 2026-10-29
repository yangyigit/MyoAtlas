# 解剖资源构建管线

从 Z-Anatomy 的 FBX 源模型生成 Web 可用的 Draco GLB。

## 前置

- Blender 3.6（脚本使用内置 Python，无需额外依赖）
- 首次运行需要下载三个 FBX（约 88MB）

## 下载源文件

Blender 内置 Python 可能缺少系统根证书，先用 curl 下载到缓存目录：

```bash
mkdir -p tools/anatomy-build/.cache
cd tools/anatomy-build/.cache
BASE=https://raw.githubusercontent.com/LluisV/Z-Anatomy/PC-Version/Resources/Models/FBX
curl -L -o MuscularSystem100.fbx "$BASE/MuscularSystem100.fbx"
curl -L -o SkeletalSystem100.fbx "$BASE/SkeletalSystem100.fbx"
curl -L -o Joints100.fbx "$BASE/Joints100.fbx"
```

## 构建

```bash
/Applications/Blender.app/Contents/MacOS/Blender \
  -b --factory-startup \
  --python tools/anatomy-build/build_anatomy.py
```

产物写入 `public/models/`：

- `muscles.glb`（41 个肌群节点，约 300k 三角面）
- `bones.glb`（20 个骨骼节点，约 150k 三角面）
- `joints.glb`（11 个关节/韧带节点，约 80k 三角面；肩胛胸壁为伪关节，无网格，仅前端 gizmo）
- `soft-tissue.glb`（肌腱与支持带单节点 `soft__tissue`，约 23k 三角面）
- `manifest.json`（节点、三角面、包围盒）
- `LICENSE.txt`

## 规则

`groups.json` 用正则把 FBX 网格映射到肌群/骨骼/关节节点：

- 肌肉排除筋膜、滑囊、腱鞘等；未匹配网格并入 `other-muscles`
- 软组织仅保留肌腱与支持带，排除全身浅筋膜（否则会盖住肌肉）、滑囊与腱鞘
- 骨骼按完整骨、肋骨、椎骨、颅骨、手足骨分组；≤20 面占位网格丢弃
- 关节按关节囊与韧带关键词分组；左右合并
- 同组内包围盒 IoU > 0.9 的重复网格去重
- 每层统一按目标三角面数设置 Decimate 比例

修改 `groups.json` 后重跑构建，`manifest.json` 与 GLB 会同步更新。

## 许可

Z-Anatomy（CC BY-SA 4.0）+ BodyParts3D（CC BY-SA 2.1 Japan）。衍生 GLB 以 CC BY-SA 4.0 发布，保留署名。
