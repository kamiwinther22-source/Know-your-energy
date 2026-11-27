# Path-traced reading-page frame for Know Your Energy: two thin metal strands (platinum and rose gold) twisted together
# around a rounded rectangle. Same renderer, colour management and platinum as jewel.py.
# usage: python frame.py -- <out.png> <canvas_w_px> <canvas_h_px> <scale> <samples>
#   e.g. python frame.py -- frame.png 430 900 2 96     (renders 860 x 1800)
import bpy, math, sys, os, time, addon_utils
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, CW, CH, SCALE, SAMPLES = argv[0], float(argv[1]), float(argv[2]), float(argv[3]), int(argv[4])

PX = 0.001                                    # 1 css pixel = 1 mm in the scene
MARGIN = float(os.environ.get('MARGIN', '9'))  # gap between the canvas edge and the centre of the twisted pair
RC = float(os.environ.get('RC', '50'))         # corner radius of the pair's path
RH = float(os.environ.get('RH', '2.1'))        # how far each strand swings from the path
RT = float(os.environ.get('RT', '1.3'))        # thickness of each strand
PITCH0 = float(os.environ.get('PITCH', '34'))  # length of one full twist
HDRI = os.environ.get('HDRI', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'hdri', 'warehouse.exr'))

bpy.ops.wm.read_factory_settings(use_empty=True)
addon_utils.enable('cycles', default_set=False, persistent=False)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
cy = sc.cycles
cy.device = 'CPU'; cy.samples = SAMPLES; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.002
cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'
cy.max_bounces = 16; cy.glossy_bounces = 12; cy.diffuse_bounces = 3
cy.filter_width = 1.3
sc.render.film_transparent = True
sc.render.resolution_x = int(CW * SCALE); sc.render.resolution_y = int(CH * SCALE); sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.color_depth = '8'
try:
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception as e:
    print('view transform fallback:', e)

def mat(name, **kw):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    for k, v in kw.items():
        b.inputs[k.replace('_', ' ')].default_value = v
    return m

PLAT = mat('platinum', Base_Color=(0.84, 0.85, 0.87, 1), Metallic=1.0, Roughness=float(os.environ.get('PR', '0.10')))
ROSE = mat('rosegold', Base_Color=(0.92, 0.60, 0.52, 1), Metallic=1.0, Roughness=float(os.environ.get('GR', '0.12')))

# world: the studio picture already in the repo, so the metal has something to reflect
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
nt = w.node_tree
bg = nt.nodes['Background']; bg.inputs['Strength'].default_value = float(os.environ.get('WORLD', '1.0'))
if os.path.exists(HDRI):
    env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(HDRI)
    mp = nt.nodes.new('ShaderNodeMapping'); tc = nt.nodes.new('ShaderNodeTexCoord')
    mp.inputs['Rotation'].default_value[2] = math.radians(float(os.environ.get('ROT', '40')))
    nt.links.new(tc.outputs['Generated'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], env.inputs['Vector'])
    nt.links.new(env.outputs['Color'], bg.inputs['Color'])
else:
    print('!! no hdri at', HDRI)
    bg.inputs['Color'].default_value = (0.8, 0.8, 0.85, 1)

# the path: a rounded rectangle, walked in 0.5 px steps, with the outward direction at every step
hw, hh = CW / 2 - MARGIN, CH / 2 - MARGIN
pts = []   # (x, y, nx, ny) in px
def straight(x0, y0, x1, y1, nx, ny):
    n = max(1, int(math.hypot(x1 - x0, y1 - y0) / 0.5))
    for i in range(n):
        f = i / n; pts.append((x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, nx, ny))
def arc(cx, cy_, a0, a1):
    n = max(1, int(abs(a1 - a0) * RC / 0.5))
    for i in range(n):
        a = a0 + (a1 - a0) * i / n; pts.append((cx + RC * math.cos(a), cy_ + RC * math.sin(a), math.cos(a), math.sin(a)))
straight(-(hw - RC), hh, hw - RC, hh, 0, 1)
arc(hw - RC, hh - RC, math.pi / 2, 0)
straight(hw, hh - RC, hw, -(hh - RC), 1, 0)
arc(hw - RC, -(hh - RC), 0, -math.pi / 2)
straight(hw - RC, -hh, -(hw - RC), -hh, 0, -1)
arc(-(hw - RC), -(hh - RC), -math.pi / 2, -math.pi)
straight(-hw, -(hh - RC), -hw, hh - RC, -1, 0)
arc(-(hw - RC), hh - RC, math.pi, math.pi / 2)
N = len(pts); L = N * 0.5
PITCH = L / round(L / PITCH0)    # a whole number of twists, so the pattern closes without a seam
print('path length %.1f px, %d points, pitch %.2f px, %d twists' % (L, N, PITCH, round(L / PITCH)))

def strand(name, phase, material):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = RT * PX; cu.bevel_resolution = 8; cu.resolution_u = 2; cu.use_fill_caps = False
    sp = cu.splines.new('POLY'); sp.points.add(N - 1); sp.use_cyclic_u = True
    for i, (x, y, nx, ny) in enumerate(pts):
        th = 2 * math.pi * (i * 0.5) / PITCH + phase
        off = RH * math.cos(th); z = RH * math.sin(th)
        sp.points[i].co = ((x + nx * off) * PX, (y + ny * off) * PX, z * PX, 1.0)
    ob = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(material)
    for s in cu.splines: s.use_smooth = True
    return ob
strand('platinum_strand', 0.0, PLAT)
strand('rose_strand', math.pi, ROSE)

cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = max(CW, CH) * PX
cam = bpy.data.objects.new('cam', cam_d); bpy.context.scene.collection.objects.link(cam)
cam.location = (0, 0, 1.0); cam.rotation_euler = (0, 0, 0); sc.camera = cam
for name, loc, e in (('key', (-0.35, 0.6, 0.8), float(os.environ.get('KEY', '2.5'))), ('fill', (0.5, -0.5, 0.6), float(os.environ.get('FILL', '0.8')))):
    ld = bpy.data.lights.new(name, 'SUN'); ld.energy = e; ld.angle = math.radians(6)
    ob = bpy.data.objects.new(name, ld); bpy.context.scene.collection.objects.link(ob)
    ob.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

t0 = time.time()
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('RENDER DONE in %.1fs -> %s' % (time.time() - t0, OUT))
