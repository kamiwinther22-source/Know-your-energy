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
ROSE = mat('rosegold', Base_Color=tuple(float(x) for x in os.environ.get('GOLD', '0.92,0.60,0.52').split(',')) + (1,), Metallic=1.0, Roughness=float(os.environ.get('GR', '0.12')))

# world: a broad soft gradient (bright overhead, dark at the horizon), which is what gives liquid chrome its long smooth reflections
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
nt = w.node_tree
bg = nt.nodes['Background']; bg.inputs['Strength'].default_value = 1.0
tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
nt.links.new(tc.outputs['Generated'], sep.inputs['Vector'])
ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'B_SPLINE'
el = ramp.color_ramp.elements
el[0].position = 0.5; el[0].color = (0.015, 0.015, 0.02, 1)      # horizon and below: nearly black
el[1].position = 1.0; el[1].color = (float(os.environ.get('ZEN', '2.6')),) * 3 + (1,)   # straight overhead: bright
m1 = ramp.color_ramp.elements.new(0.72); m1.color = (0.30, 0.30, 0.33, 1)
m2 = ramp.color_ramp.elements.new(0.88); m2.color = (1.0, 1.0, 1.02, 1)
nt.links.new(sep.outputs['Z'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])

# the path: the outer edge of the frame is a rounded rectangle; the pair of strands runs just inside it, and the strands
# swell where the frame has room (top, bottom, corners) and slim down along the sides, where the reading needs the width
SIDE = float(os.environ.get('SIDE', '0.55'))     # thickness of the sides compared with the top and bottom
EDGE = 3.0                                       # gap between the canvas edge and the outside of the metal
hw, hh = CW / 2 - EDGE, CH / 2 - EDGE
def sstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def grow(x, y, s):
    e = abs(y) / hh
    f = SIDE + (1 - SIDE) * sstep(0.80, 0.97, e)
    return f * (1 + 0.06 * math.sin(2 * math.pi * s / (L_REAL / 7.0)))   # a slow liquid ripple in the thickness
pts = []   # (x, y, nx, ny) on the outer edge, in px
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
N = len(pts); L = N * 0.5; L_REAL = L
PITCH = L / round(L / PITCH0)    # a whole number of twists, so the pattern closes without a seam
print('path length %.1f px, %d points, pitch %.2f px, %d twists' % (L, N, PITCH, round(L / PITCH)))
# per point: thickness of each strand, and where the middle of the pair sits (just inside the outer edge)
LOC = []
for i, (x, y, nx, ny) in enumerate(pts):
    g = grow(x, y, i * 0.5); rt = RT * g; rh = RH * g
    inset = rt + rh
    LOC.append((x - nx * inset, y - ny * inset, nx, ny, rt, rh))

def strand(name, phase, material):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = PX; cu.bevel_resolution = 16; cu.resolution_u = 2; cu.use_fill_caps = False
    sp = cu.splines.new('POLY'); sp.points.add(N - 1); sp.use_cyclic_u = True
    for i, (x, y, nx, ny, rt, rh) in enumerate(LOC):
        th = 2 * math.pi * (i * 0.5) / PITCH + phase
        off = rh * math.cos(th); z = rh * math.sin(th)
        sp.points[i].co = ((x + nx * off) * PX, (y + ny * off) * PX, z * PX, 1.0)
        sp.points[i].radius = rt
    ob = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(material)
    for s_ in cu.splines: s_.use_smooth = True
    return ob
strand('platinum_strand', 0.0, PLAT)
strand('rose_strand', math.pi, ROSE)

cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = max(CW, CH) * PX
cam = bpy.data.objects.new('cam', cam_d); bpy.context.scene.collection.objects.link(cam)
cam.location = (0, 0, 1.0); cam.rotation_euler = (0, 0, 0); sc.camera = cam
# jewellery-style lighting: large soft boxes above give long clean highlights along each strand; a little of the studio picture fills the shadows
def softbox(name, loc, w_mm, h_mm, watts):
    ld = bpy.data.lights.new(name, 'AREA'); ld.shape = 'RECTANGLE'; ld.size = w_mm * SB * 0.001; ld.size_y = h_mm * SB * 0.001; ld.energy = watts
    ob = bpy.data.objects.new(name, ld); bpy.context.scene.collection.objects.link(ob); ob.location = Vector(loc)
    ob.rotation_euler = (Vector((0, 0, 0)) - ob.location).to_track_quat('-Z', 'Y').to_euler()
SB = float(os.environ.get('SB', '1'))
KW = float(os.environ.get('KEY', '300'))
softbox('key', (-0.18, 0.30, 0.40), 420, 260, KW * float(os.environ.get('KEYF', '0.0')))
softbox('fill', (0.28, -0.22, 0.34), 160, 520, KW * float(os.environ.get('FILLF', '0.0')))
softbox('top', (0.0, 0.0, 0.55), 700, 700, KW * float(os.environ.get('TOPF', '0.35')))

t0 = time.time()
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('RENDER DONE in %.1fs -> %s' % (time.time() - t0, OUT))
