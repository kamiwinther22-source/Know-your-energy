# Path-traced silver button face (top-down, orthographic, transparent background).
# usage: python button.py -- <out.png> <width_px> <aspect W/H> <samples>
import bpy, bmesh, math, sys, os, addon_utils
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PX, ASP, SAMPLES = argv[0], int(argv[1]), float(argv[2]), int(argv[3])
HDRI = os.environ.get('HDRI', os.path.join(os.path.dirname(__file__), '..', '..', 'hdri', 'studio-log.jpg'))
bpy.ops.wm.read_factory_settings(use_empty=True)
addon_utils.enable('cycles', default_set=False, persistent=False)
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; cy = sc.cycles
cy.device = 'CPU'; cy.samples = SAMPLES; cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'
cy.max_bounces = 12; cy.glossy_bounces = 8; cy.filter_width = 1.2
sc.render.film_transparent = True
sc.render.resolution_x = PX; sc.render.resolution_y = int(PX / ASP); sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
try:
    sc.view_settings.view_transform = 'Standard'
except Exception: pass
W = 21.0; H = W / ASP
S = 0.01
def metal(name, rough, col=(0.93, 0.93, 0.93), aniso=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Metallic'].default_value = 1.0; b.inputs['Roughness'].default_value = rough
    if aniso: b.inputs['Anisotropic'].default_value = aniso
    return m
m_bevel = metal('bevel', 0.10); m_face = metal('face', 0.30, (0.96, 0.96, 0.96), 0.0)
# geometry: hexagon (points left/right), bevel ring rising to a flat face
c = H * 0.5
pts = [(-W/2, 0), (-W/2 + c, H/2), (W/2 - c, H/2), (W/2, 0), (W/2 - c, -H/2), (-W/2 + c, -H/2)]
bm = bmesh.new()
vs = [bm.verts.new((x * S, y * S, 0)) for x, y in pts]
f = bm.faces.new(vs)
bm.normal_update()
if f.normal.z < 0: f.normal_flip(); bm.normal_update()
bmesh.ops.inset_individual(bm, faces=[f], thickness=H * 0.19 * S, depth=H * 0.13 * S, use_even_offset=True)
bm.normal_update()
top = [fc for fc in bm.faces if fc.normal.z > 0.99]
print('top faces', len(top), 'faces', len(bm.faces))
for fc in bm.faces: fc.material_index = 0
for fc in top:
    if abs(fc.calc_area()) > 0: pass
top.sort(key=lambda fc: fc.calc_area(), reverse=True)
top[0].material_index = 1
bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.001) if False else None
me = bpy.data.meshes.new('b'); bm.to_mesh(me); bm.free()
ob = bpy.data.objects.new('b', me); sc.collection.objects.link(ob)
ob.data.materials.append(m_bevel); ob.data.materials.append(m_face)
for p in ob.data.polygons: p.use_smooth = False
# camera
cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = W * S * 1.03
co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); co.location = (0, 0, 0.5); co.rotation_euler = (0, 0, 0); sc.camera = co
# world: dark studio with strip lights, so the bevels catch crisp reflections
w = bpy.data.worlds.new('w'); w.use_nodes = True; sc.world = w
nt = w.node_tree; nt.nodes.clear()
bgn = nt.nodes.new('ShaderNodeBackground'); bgn.inputs['Color'].default_value = (1, 1, 1, 1); bgn.inputs['Strength'].default_value = float(os.environ.get('WORLD', '0.10'))
out = nt.nodes.new('ShaderNodeOutputWorld'); nt.links.new(bgn.outputs['Background'], out.inputs['Surface'])
def strip(loc, size, energy, tgt=(0, 0, 0)):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc); o = bpy.context.active_object
    o.scale = (size[0], size[1], 1)
    d = Vector(tgt) - Vector(loc); o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    m = bpy.data.materials.new('e'); m.use_nodes = True; nt2 = m.node_tree; nt2.nodes.clear()
    em = nt2.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = energy
    ot = nt2.nodes.new('ShaderNodeOutputMaterial'); nt2.links.new(em.outputs['Emission'], ot.inputs['Surface'])
    o.data.materials.append(m); o.visible_camera = False
def area(loc, size, energy):
    l = bpy.data.lights.new('l', 'AREA'); l.size = size[0]; l.size_y = size[1]; l.energy = energy
    o = bpy.data.objects.new('l', l); sc.collection.objects.link(o); o.location = loc
    d = Vector((0, 0, 0)) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
E_ = float(os.environ.get('E', '6'))
strip((-0.22, 0.00, 0.16), (0.04, 0.30), E_)
strip((0.22, 0.00, 0.12), (0.03, 0.30), E_ * 0.7)
strip((0.00, 0.14, 0.14), (0.40, 0.03), E_ * 0.9)
strip((0.00, -0.14, 0.10), (0.40, 0.02), E_ * 0.35)
area((-0.08, 0.05, 0.10), (0.30, 0.06), float(os.environ.get('KEY', '3')))
bpy.ops.render.render(write_still=False)
img = bpy.data.images['Render Result']; img.save_render(OUT)
print('saved', OUT)
