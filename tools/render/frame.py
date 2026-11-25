# Path-traced silver card frame (same metal and lights as button.py)
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
W = 14.6; H = W / ASP
S = 0.01
def metal(name, rough, col=(0.93, 0.93, 0.93), aniso=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Metallic'].default_value = 1.0; b.inputs['Roughness'].default_value = rough
    if aniso: b.inputs['Anisotropic'].default_value = aniso
    return m
m_bevel = metal('bevel', 0.10); m_face = metal('face', 0.22, (0.96, 0.96, 0.96), 0.0)
# a very slight crown along the face (peak in the middle), so its reflection falls off toward the ends like polished metal
_nt = m_face.node_tree; _b = _nt.nodes['Principled BSDF']
_tc = _nt.nodes.new('ShaderNodeTexCoord'); _mp = _nt.nodes.new('ShaderNodeMapping')
_mp.inputs['Scale'].default_value = (1 / (W * S), 1, 1); _mp.inputs['Location'].default_value = (0.5, 0, 0)
_g = _nt.nodes.new('ShaderNodeTexGradient'); _g.gradient_type = 'LINEAR'
_pp = _nt.nodes.new('ShaderNodeMath'); _pp.operation = 'PINGPONG'; _pp.inputs[1].default_value = 0.5
_bp = _nt.nodes.new('ShaderNodeBump'); _bp.inputs['Distance'].default_value = float(os.environ.get('CROWN', '0.03')); _bp.inputs['Strength'].default_value = 1.0
_nt.links.new(_tc.outputs['Object'], _mp.inputs['Vector']); _nt.links.new(_mp.outputs['Vector'], _g.inputs['Vector'])
_nt.links.new(_g.outputs['Fac'], _pp.inputs[0]); _nt.links.new(_pp.outputs['Value'], _bp.inputs['Height']); _nt.links.new(_bp.outputs['Normal'], _b.inputs['Normal'])
# geometry: hexagon (points left/right), bevel ring rising to a flat face
c = 2.0
pts = [(-W/2 + c, H/2), (W/2 - c, H/2), (W/2, H/2 - c), (W/2, -H/2 + c), (W/2 - c, -H/2), (-W/2 + c, -H/2), (-W/2, -H/2 + c), (-W/2, H/2 - c)]
bm = bmesh.new()
vs = [bm.verts.new((x * S, y * S, 0)) for x, y in pts]
f = bm.faces.new(vs)
bm.normal_update()
if f.normal.z < 0: f.normal_flip(); bm.normal_update()
bmesh.ops.inset_individual(bm, faces=[f], thickness=1.2 * S, depth=0.85 * S, use_even_offset=True)
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
cam = bpy.data.cameras.new('c'); cam.type = 'PERSP'; cam.lens = 50; cam.sensor_width = 36; cam.sensor_fit = 'VERTICAL'
co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); co.location = (0, 0, H * S * 1.03 / 36 * 50); co.rotation_euler = (0, 0, 0); sc.camera = co
# world: dark studio with strip lights, so the bevels catch crisp reflections
w = bpy.data.worlds.new('w'); w.use_nodes = True; sc.world = w
nt = w.node_tree; nt.nodes.clear()
bgn = nt.nodes.new('ShaderNodeBackground'); bgn.inputs['Color'].default_value = (1, 1, 1, 1); bgn.inputs['Strength'].default_value = float(os.environ.get('WORLD', '0.02'))
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
# A bevel tilted t from flat reflects light arriving 2t from straight up, in the direction it tilts.
# With t = ~34 deg, that is a light 22 deg above the horizon. Eight lights around the button, each a different strength,
# give every slanted facet its own crisp reflection.
E_ = float(os.environ.get('E', '3'))
R = 0.5; EL = math.radians(22)
for ang, k in ((0, 1.0), (45, 0.45), (90, 0.95), (135, 0.2), (180, 0.65), (225, 0.12), (270, 0.4), (315, 0.8)):
    a_ = math.radians(ang)
    strip((R * math.cos(EL) * math.cos(a_), R * math.cos(EL) * math.sin(a_), R * math.sin(EL)), (0.30, 0.20), E_ * k)
# overhead panel: lights the flat face to a bright silver, not white
strip((0.0, 0.0, 0.9), (0.9, 0.5), float(os.environ.get('TOP', '0.55')))
bpy.ops.render.render(write_still=False)
img = bpy.data.images['Render Result']; img.save_render(OUT)
print('saved', OUT)
