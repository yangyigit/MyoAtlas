"""Export a lightweight, uncompressed GLB for the mini program.

Imports the four web GLBs, decimates to a small triangle budget, assigns a
single material and writes miniapp/src/static/models/anatomy-mini.glb.
"""
import bpy
import os
import math

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'public', 'models')
OUT = os.path.join(ROOT, 'miniapp', 'src', 'static', 'models', 'anatomy-mini.glb')
TARGET_TRIS = 52000

bpy.ops.wm.read_factory_settings(use_empty=True)
meshes = []
for name in ['muscles.glb', 'bones.glb', 'joints.glb', 'soft-tissue.glb']:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, name))
    meshes.extend([o for o in bpy.data.objects if o not in before and o.type == 'MESH'])

print('MESHES', len(meshes))
# Bake transforms and apply a single material.
mat = bpy.data.materials.new('mini-base')
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.42, 0.2, 0.18, 1)
    bsdf.inputs['Roughness'].default_value = 0.72

for obj in meshes:
    if obj.data.users > 1:
        obj.data = obj.data.copy()
    mw = obj.matrix_world.copy()
    obj.parent = None
    obj.data.transform(mw)
    obj.matrix_basis.identity()
    for mod in list(obj.modifiers):
        obj.modifiers.remove(mod)
    obj.data.materials.clear()
    obj.data.materials.append(mat)

total = sum(len(o.data.polygons) for o in meshes)
ratio = max(0.02, min(1.0, TARGET_TRIS / max(total, 1)))
print('POLYS', total, 'ratio', round(ratio, 4))

for obj in meshes:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    mod = obj.modifiers.new('decimate', 'DECIMATE')
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = ratio
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.select_set(False)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_animations=False,
    export_normals=True,
    export_texcoords=False,
    export_draco_mesh_compression_enable=False,
)
print('WROTE', OUT, os.path.getsize(OUT))
