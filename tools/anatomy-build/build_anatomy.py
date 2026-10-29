"""Build web-ready anatomy GLB layers from the Z-Anatomy FBX sources.

Usage:
  blender -b --factory-startup --python tools/anatomy-build/build_anatomy.py

Outputs public/models/{muscles,bones,joints}.glb + manifest.json.
The source FBX files are downloaded into tools/anatomy-build/.cache/ and are
not committed (see .gitignore).
"""

import bpy
import bmesh
import json
import os
import re
import sys
import time
import urllib.request
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT_DIR = os.path.join(ROOT, "public", "models")
CACHE_DIR = os.path.join(HERE, ".cache")
GROUPS_PATH = os.path.join(HERE, "groups.json")

FBX_BASE = "https://raw.githubusercontent.com/LluisV/Z-Anatomy/PC-Version/Resources/Models/FBX/"
SOURCES = {
    "muscles": ("MuscularSystem100.fbx", FBX_BASE + "MuscularSystem100.fbx"),
    "bones": ("SkeletalSystem100.fbx", FBX_BASE + "SkeletalSystem100.fbx"),
    "joints": ("Joints100.fbx", FBX_BASE + "Joints100.fbx"),
}
PREFIX = {"muscles": "muscle", "bones": "bone", "joints": "joint"}
TARGET_TRIS = {"muscles": 200_000, "bones": 120_000, "joints": 50_000}

MAT_COLORS = {
    "muscles": (0.42, 0.18, 0.15, 1.0),
    "bones": (0.82, 0.76, 0.66, 1.0),
    "joints": (0.18, 0.4, 0.44, 1.0),
}


def log(*args):
    print("[anatomy]", *args, flush=True)


def ensure_sources():
    os.makedirs(CACHE_DIR, exist_ok=True)
    paths = {}
    for layer, (filename, url) in SOURCES.items():
        path = os.path.join(CACHE_DIR, filename)
        if not os.path.exists(path) or os.path.getsize(path) < 1_000_000:
            log("downloading", filename)
            urllib.request.urlretrieve(url, path)
        paths[layer] = path
    return paths


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_meshes(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path)
    return [o for o in bpy.data.objects if o not in before and o.type == "MESH"]


def bake_world_transforms(objs):
    for obj in objs:
        if obj.data.users > 1:
            obj.data = obj.data.copy()
        world = obj.matrix_world.copy()
        obj.parent = None
        obj.data.transform(world)
        obj.matrix_basis = Matrix.Identity(4)
        for mod in list(obj.modifiers):
            obj.modifiers.remove(mod)


def union_bounds(objs):
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    for obj in objs:
        for corner in obj.bound_box:
            p = obj.matrix_world @ Vector(corner)
            mn = Vector((min(mn.x, p.x), min(mn.y, p.y), min(mn.z, p.z)))
            mx = Vector((max(mx.x, p.x), max(mx.y, p.y), max(mx.z, p.z)))
    return mn, mx


def normalize_all(objs):
    mn, mx = union_bounds(objs)
    height = mx.z - mn.z
    scale = 1.75 / height
    cx = (mn.x + mx.x) / 2
    cy = (mn.y + mx.y) / 2
    mat = Matrix.Translation((-cx * scale, -cy * scale, -mn.z * scale)) @ Matrix.Scale(scale, 4)
    for obj in objs:
        obj.data.transform(mat)
    log("normalized: height", round(height, 4), "scale", round(scale, 5))


def compile_rules(groups_cfg):
    compiled = {}
    for layer, cfg in groups_cfg.items():
        compiled[layer] = [
            (g["id"], [re.compile(p, re.IGNORECASE) for p in g["patterns"]])
            for g in cfg["groups"]
        ]
    return compiled


def match_group(name, rules):
    for gid, patterns in rules:
        for pattern in patterns:
            if pattern.search(name):
                return gid
    return None


def obj_box(obj):
    pts = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx


def box_iou(a, b):
    (amn, amx), (bmn, bmx) = a, b
    inter = Vector(
        (
            max(0.0, min(amx.x, bmx.x) - max(amn.x, bmn.x)),
            max(0.0, min(amx.y, bmx.y) - max(amn.y, bmn.y)),
            max(0.0, min(amx.z, bmx.z) - max(amn.z, bmn.z)),
        )
    )
    inter_vol = inter.x * inter.y * inter.z
    a_vol = (amx - amn).x * (amx - amn).y * (amx - amn).z
    b_vol = (bmx - bmn).x * (bmx - bmn).y * (bmx - bmn).z
    union = a_vol + b_vol - inter_vol
    return inter_vol / union if union > 1e-9 else 0.0


def dedupe(objs):
    kept = []
    for obj in sorted(objs, key=lambda o: len(o.data.polygons), reverse=True):
        box = obj_box(obj)
        duplicate = any(box_iou(box, obj_box(k)) > 0.9 for k in kept)
        if not duplicate:
            kept.append(obj)
    return kept


def make_material(layer):
    mat = bpy.data.materials.new(name=f"{layer}-base")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = MAT_COLORS[layer]
        bsdf.inputs["Roughness"].default_value = 0.8
        bsdf.inputs["Metallic"].default_value = 0.0
    return mat


def recalc_normals(mesh):
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()


def join_group(objs, node_name, material, ratio):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.hide_set(False)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = node_name
    joined.data.name = node_name
    joined.data.materials.clear()
    joined.data.materials.append(material)

    if ratio < 0.999:
        mod = joined.modifiers.new(name="decimate", type="DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = ratio
        bpy.ops.object.modifier_apply(modifier=mod.name)

    recalc_normals(joined.data)
    for poly in joined.data.polygons:
        poly.use_smooth = True
    joined.data.validate()
    return joined


def tris_of(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def export_layer(layer, objects, manifest):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]

    path = os.path.join(OUT_DIR, f"{layer}.glb")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_animations=False,
        export_normals=True,
        export_texcoords=False,
        export_materials="EXPORT",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    size = os.path.getsize(path)
    log("exported", os.path.relpath(path, ROOT), f"{size / 1e6:.2f}MB")

    mn, mx = union_bounds(objects)
    bounds = {
        "min": [round(mn.x, 4), round(mn.z, 4), round(-mx.y, 4)],
        "max": [round(mx.x, 4), round(mx.z, 4), round(-mn.y, 4)],
    }
    manifest["layers"][layer] = {
        "file": f"{layer}.glb",
        "bytes": size,
        "bounds": bounds,
        "nodes": [
            {"id": obj.name.split("__", 1)[1], "node": obj.name, "tris": tris_of(obj)}
            for obj in sorted(objects, key=lambda o: o.name)
        ],
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(GROUPS_PATH, encoding="utf-8") as fh:
        groups_cfg = json.load(fh)
    rules = compile_rules(groups_cfg)
    paths = ensure_sources()

    reset_scene()
    layer_objects = {}
    for layer, path in paths.items():
        log("importing", os.path.basename(path))
        layer_objects[layer] = import_meshes(path)
        log(layer, "meshes", len(layer_objects[layer]))

    all_objects = [o for objs in layer_objects.values() for o in objs]
    bake_world_transforms(all_objects)
    normalize_all(all_objects)

    manifest = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": {
            "atlas": "Z-Anatomy (CC BY-SA 4.0)",
            "database": "BodyParts3D (CC BY-SA 2.1 Japan)",
        },
        "model": {"height": 1.75, "up": "Y", "forward": "+Z"},
        "layers": {},
    }

    for layer, objs in layer_objects.items():
        cfg = groups_cfg[layer]
        exclude = re.compile(cfg.get("exclude", r"$^"), re.IGNORECASE) if cfg.get("exclude") else None
        min_polys = cfg.get("minPolys", 0)
        buckets = {}
        skipped = 0
        excluded = 0
        for obj in objs:
            name = obj.name
            if exclude and exclude.search(name):
                excluded += 1
                continue
            if len(obj.data.polygons) < min_polys:
                skipped += 1
                continue
            gid = match_group(name, rules[layer])
            if gid is None:
                gid = cfg.get("fallback")
            if gid is None:
                skipped += 1
                continue
            buckets.setdefault(gid, []).append(obj)

        total_polys = sum(len(o.data.polygons) for group in buckets.values() for o in group)
        ratio = max(0.03, min(1.0, TARGET_TRIS[layer] / max(total_polys, 1)))
        log(
            layer,
            "groups",
            len(buckets),
            "polys",
            total_polys,
            "ratio",
            round(ratio, 4),
            "excluded",
            excluded,
            "skipped",
            skipped,
        )

        material = make_material(layer)
        exported = []
        for gid, candidates in sorted(buckets.items()):
            kept = dedupe(candidates)
            node_name = f"{PREFIX[layer]}__{gid}"
            obj = join_group(kept, node_name, material, ratio)
            exported.append(obj)
            log("  ", node_name, "meshes", len(candidates), "->", len(kept), "tris", tris_of(obj))

        export_layer(layer, exported, manifest)

    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)
    log("manifest written", os.path.relpath(manifest_path, ROOT))


if __name__ == "__main__":
    main()
