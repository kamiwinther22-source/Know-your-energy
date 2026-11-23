# Path-traced hero jewel for Know Your Energy.
# usage: python jewel.py -- <mode hero|gem> <out.png> <width> <samples>
import bpy, bmesh, math, sys, random, time, addon_utils, os
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
MODE, OUT, WIDTH, SAMPLES = argv[0], argv[1], int(argv[2]), int(argv[3])

LM = float(os.environ.get('LM', '1'))
WORLD = float(os.environ.get('WORLD', '0.2'))
S = 0.01  # 1 modelling unit = 1 cm; Blender unit = 1 m

bpy.ops.wm.read_factory_settings(use_empty=True)
addon_utils.enable('cycles', default_set=False, persistent=False)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
cy = sc.cycles
cy.device = 'CPU'
cy.samples = SAMPLES
cy.use_adaptive_sampling = True
cy.adaptive_threshold = 0.002
cy.use_denoising = True
cy.denoiser = 'OPENIMAGEDENOISE'
cy.max_bounces = 28
cy.glossy_bounces = 14
cy.transmission_bounces = 28
cy.diffuse_bounces = 4
cy.transparent_max_bounces = 16
cy.caustics_reflective = False
cy.caustics_refractive = False
cy.filter_width = 1.3
sc.render.film_transparent = True
FW = 470.0 if MODE == 'hero' else 390.0
FH = 900.0
aspect = (FW / FH) if MODE in ('scene', 'cloth', 'hero') else 1.0
sc.render.resolution_x = WIDTH
sc.render.resolution_y = int(WIDTH / aspect)
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.render.image_settings.color_depth = '8'
try:
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception as e:
    print('view transform fallback:', e)
print('view transform:', sc.view_settings.view_transform, '| look:', sc.view_settings.look)

# ---------------------------------------------------------------- materials
def mat(name, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    for k, v in kw.items():
        k = k.replace('_', ' ')
        if k in bsdf.inputs:
            bsdf.inputs[k].default_value = v
        else:
            print('!! no input', k)
    return m

PLAT = mat('platinum', Base_Color=(0.84, 0.85, 0.87, 1), Metallic=1.0, Roughness=0.05)
DIAMOND = mat('diamond', Base_Color=(1, 1, 1, 1), Metallic=0.0, Roughness=0.0, IOR=2.417,
              Transmission_Weight=1.0, Transmission_Dispersion_Scale=0.0)
PAVE = mat('pave', Base_Color=(1, 1, 1, 1), Metallic=0.0, Roughness=0.0, IOR=2.417, Transmission_Weight=1.0)

PEARL = mat('pearl', Base_Color=(0.86, 0.79, 0.74, 1), Metallic=0.0, Roughness=0.15,
            Subsurface_Weight=0.25, Subsurface_Scale=0.004, Subsurface_Radius=(1.0, 0.55, 0.45),
            Coat_Weight=1.0, Coat_Roughness=0.05, Coat_IOR=1.6,
            Sheen_Weight=0.15, Sheen_Roughness=0.4, Thin_Film_Thickness=420.0, Thin_Film_IOR=1.5)
# nacre: very fine surface variation so the pearl reads as grown, not machined
nt = PEARL.node_tree
noise = nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 9000
noise.inputs['Detail'].default_value = 6
bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.035; bump.inputs['Distance'].default_value = 0.0004
nt.links.new(noise.outputs['Fac'], bump.inputs['Height'])
nt.links.new(bump.outputs['Normal'], nt.nodes['Principled BSDF'].inputs['Normal'])

PV = os.environ.get('PV', '')
_b = PEARL.node_tree.nodes['Principled BSDF']
if 'f' in PV: _b.inputs['Thin Film Thickness'].default_value = 0
if 's' in PV: _b.inputs['Subsurface Weight'].default_value = 0
if 'c' in PV: _b.inputs['Coat Weight'].default_value = 0
if 'h' in PV: _b.inputs['Sheen Weight'].default_value = 0
if 'b' in PV:
    for l in list(PEARL.node_tree.links): PEARL.node_tree.links.remove(l)
PRE = {
 'v1': dict(base=(0.88,0.80,0.76,1), rough=0.20, coat=0.45, croug=0.22, tf=550, sheen=0.15, ss=0.25),
 'v2': dict(base=(0.90,0.78,0.77,1), rough=0.26, coat=0.25, croug=0.30, tf=800, sheen=0.25, ss=0.35),
 'v3': dict(base=(0.91,0.84,0.78,1), rough=0.22, coat=0.0,  croug=0.30, tf=500, sheen=0.35, ss=0.30),
 'v4': dict(base=(0.88,0.82,0.80,1), rough=0.30, coat=0.6,  croug=0.35, tf=650, sheen=0.30, ss=0.40),
}
if os.environ.get('PP') in PRE:
    q = PRE[os.environ['PP']]
    _b.inputs['Base Color'].default_value = q['base']; _b.inputs['Roughness'].default_value = q['rough']
    _b.inputs['Coat Weight'].default_value = q['coat']; _b.inputs['Coat Roughness'].default_value = q['croug']
    _b.inputs['Thin Film Thickness'].default_value = q['tf']; _b.inputs['Sheen Weight'].default_value = q['sheen']
    _b.inputs['Subsurface Weight'].default_value = q['ss']
FLIP = os.environ.get('FLIP', '1') == '1'
BODY = float(os.environ.get('BODY', '0.62'))
if os.environ.get('PP', 'orient') == 'orient':
    nt = PEARL.node_tree
    lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.5
    cr = nt.nodes.new('ShaderNodeValToRGB')
    el = cr.color_ramp.elements
    # position 0 = grazing edge ... 1 = facing the viewer
    el[0].position = 0.0; el[0].color = (0.88 * BODY, 0.89 * BODY, 0.91 * BODY, 1)     # cool green-teal edge orient
    el[1].position = 1.0; el[1].color = (1.02 * BODY, 1.02 * BODY, 1.03 * BODY, 1)  # ivory-cream centre
    e2 = el.new(0.34); e2.color = (1.0 * BODY, 1.0 * BODY, 1.01 * BODY, 1)           # rose overtone
    out = lw.outputs['Facing']
    if FLIP:
        inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
        nt.links.new(out, inv.inputs[1]); out = inv.outputs['Value']
    nt.links.new(out, cr.inputs['Fac'])
    nt.links.new(cr.outputs['Color'], _b.inputs['Base Color'])
    _b.inputs['Roughness'].default_value = 0.17
    _b.inputs['Coat Weight'].default_value = 0.5; _b.inputs['Coat Roughness'].default_value = 0.07
    _b.inputs['Sheen Weight'].default_value = 0.2; _b.inputs['Subsurface Weight'].default_value = 0.3
    _b.inputs['Thin Film Thickness'].default_value = 0
ONLY = os.environ.get('ONLY', '')
# ---------------------------------------------------------------- geometry helpers
def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob

def brilliant_mesh(name):
    """Round brilliant, unit girdle radius. Standard proportions: table 56%, crown 16.2%, pavilion 43.1% of diameter."""
    R = 1.0
    t = 0.56 * R
    girdle = 0.02 * 2 * R
    crown = 0.162 * 2 * R
    pav = 0.431 * 2 * R
    zt = girdle / 2 + crown
    bm = bmesh.new()
    def P(r, ang_deg, z):
        a = math.radians(ang_deg)
        return bm.verts.new((r * math.cos(a), r * math.sin(a), z))
    T = [P(t, 45 * i, zt) for i in range(8)]
    rs = 0.80 * R
    zs = girdle / 2 + crown * (R - rs) / (R - t)
    St = [P(rs, 45 * i + 22.5, zs) for i in range(8)]
    Gu = [P(R, 22.5 * j, girdle / 2) for j in range(16)]
    Gl = [P(R, 22.5 * j, -girdle / 2) for j in range(16)]
    rm = 0.62 * R
    zm = -girdle / 2 - pav * (R - rm) / R
    M = [P(rm, 45 * i + 22.5, zm) for i in range(8)]
    C = bm.verts.new((0, 0, -girdle / 2 - pav))
    F = lambda *v: bm.faces.new(v)
    F(*T[::-1])  # table (normal up)
    for i in range(8):
        i1 = (i + 1) % 8
        F(T[i], T[i1], St[i])                       # star facet
        F(T[i], St[i], Gu[2 * i], St[i - 1])        # bezel kite
        F(St[i], Gu[2 * i + 1], Gu[2 * i])          # upper girdle facets
        F(St[i], Gu[(2 * i + 2) % 16], Gu[2 * i + 1])
    for j in range(16):
        F(Gu[j], Gu[(j + 1) % 16], Gl[(j + 1) % 16], Gl[j])  # girdle wall (outward)
    for i in range(8):
        F(Gl[(2 * i + 1) % 16], Gl[2 * i], M[i])            # lower girdle facets
        F(Gl[(2 * i + 2) % 16], Gl[(2 * i + 1) % 16], M[i])
        F(C, M[i - 1], Gl[2 * i], M[i])                      # pavilion main kite (reversed fixed by recalc)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    return me

GEM = brilliant_mesh('brilliant')

def gem(name, pos, axis, r, material, spin=0.0):
    ob = bpy.data.objects.new(name, GEM)
    ob.data.materials.clear(); ob.data.materials.append(material)
    q = Vector(axis).normalized().to_track_quat('Z', 'Y')
    ob.rotation_mode = 'QUATERNION'
    ob.rotation_quaternion = q @ Matrix.Rotation(math.radians(spin), 3, 'Z').to_quaternion()
    ob.scale = (r * S,) * 3
    ob.location = Vector(pos) * S
    return link(ob)

def smooth(ob):
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def torus(name, major, minor, loc=(0, 0, 0), material=PLAT, seg=720, minseg=28):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, radius=1, segments=minseg)  # placeholder to init
    bm.clear()
    # build torus manually for clean topology
    verts = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        ca, sa = math.cos(a), math.sin(a)
        ring = []
        for j in range(minseg):
            b = 2 * math.pi * j / minseg
            rr = major + minor * math.cos(b)
            ring.append(bm.verts.new((rr * ca * S, rr * sa * S, minor * math.sin(b) * S)))
        verts.append(ring)
    for i in range(seg):
        for j in range(minseg):
            bm.faces.new((verts[i][j], verts[(i + 1) % seg][j], verts[(i + 1) % seg][(j + 1) % minseg], verts[i][(j + 1) % minseg]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.location = Vector(loc) * S
    ob.data.materials.append(material)
    link(ob)
    return smooth(ob)

def sphere(name, r, loc, material, seg=160):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r * S)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); ob.location = Vector(loc) * S
    ob.data.materials.append(material); link(ob); return smooth(ob)

def band(name, R, h, thick, material=PLAT, seg=720):
    """A vertical band (wedding-band style), rounded edges, built as a closed lathe profile."""
    bm = bmesh.new()
    prof = []
    ri, ro = R - thick / 2, R + thick / 2
    e = min(thick, h) * 0.30
    pts = [(ri + e, -h / 2), (ro - e, -h / 2)]
    for k in range(1, 6):
        a = math.pi / 2 * k / 6
        pts.append((ro - e + e * math.sin(a), -h / 2 + e - e * math.cos(a)))
    pts += [(ro, h / 2 - e)]
    for k in range(1, 6):
        a = math.pi / 2 * k / 6
        pts.append((ro - e + e * math.cos(a), h / 2 - e + e * math.sin(a)))
    pts += [(ri + e, h / 2)]
    for k in range(1, 6):
        a = math.pi / 2 * k / 6
        pts.append((ri + e - e * math.sin(a), h / 2 - e + e * math.cos(a)))
    pts += [(ri, -h / 2 + e)]
    for k in range(1, 6):
        a = math.pi / 2 * k / 6
        pts.append((ri + e - e * math.cos(a), -h / 2 + e - e * math.sin(a)))
    rings = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        ca, sa = math.cos(a), math.sin(a)
        rings.append([bm.verts.new((r_ * ca * S, r_ * sa * S, z * S)) for r_, z in pts])
    n = len(pts)
    for i in range(seg):
        for j in range(n):
            bm.faces.new((rings[i][j], rings[(i + 1) % seg][j], rings[(i + 1) % seg][(j + 1) % n], rings[i][(j + 1) % n]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); ob.data.materials.append(material); link(ob)
    return smooth(ob)

def area(name, loc, target, w, h, power, color=(1, 1, 1)):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.shape = 'RECTANGLE'; ld.size = w * S; ld.size_y = h * S
    ld.energy = power * LM; ld.color = color
    ob = bpy.data.objects.new(name, ld); link(ob)
    ob.location = Vector(loc) * S
    ob.rotation_euler = (Vector(target) * S - ob.location).to_track_quat('-Z', 'Y').to_euler()
    return ob

# ---------------------------------------------------------------- world: deep garnet velvet
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']
VEL_W = tuple(float(x) for x in os.environ.get('VELW', '0.03,0.04,0.035').split(','))
VEL_B = tuple(float(x) for x in os.environ.get('VELB', '0.95,0.06,0.22').split(','))
bg.inputs['Color'].default_value = VEL_W + (1,); bg.inputs['Strength'].default_value = WORLD

# ---------------------------------------------------------------- the piece
random.seed(7)
PEARL_R = 4.6
RING_R = [6.4, 8.6, 10.8, 13.0, 15.2, 17.5]
TUBE = [0.17, 0.15, None, 0.16, 0.14, 0.15]   # ring 2 is the pave band

if MODE in ('hero', 'scene', 'cloth'):
    HERO_FRAME = MODE != 'hero'
    if MODE != 'cloth': sphere('pearl', PEARL_R, (0, 0, 0), PEARL)
    for i, R in enumerate(RING_R):
        if ONLY == 'pearl' or MODE == 'cloth': break
        if TUBE[i] is None:
            band('pave_band', R, 0.55, 0.22)
            n = int(2 * math.pi * R / 0.50)
            for k in range(n):
                a = 2 * math.pi * (k + 0.5) / n
                d = Vector((math.cos(a), math.sin(a), 0))
                gem('pv%d' % k, d * (R + 0.11 + 0.02), d, 0.215, PAVE, spin=random.uniform(0, 45))
        else:
            torus('ring%d' % i, R, TUBE[i])
    # planets: (ring, svg-angle deg, gem radius, dispersion gem?)
    planets = [(0, 150, 1.05), (1, 20, 1.35), (3, 335, 1.2), (4, 100, 1.65), (5, 168, 1.15)]
    for k, (ri, t, gr) in enumerate([] if (ONLY == 'pearl' or MODE == 'cloth') else planets):
        a = math.radians(-t)
        R = RING_R[ri]
        p = Vector((R * math.cos(a), R * math.sin(a), 0))
        radial = Vector((math.cos(a), math.sin(a), 0))
        axis = (radial * 0.30 + Vector((0, -0.45, 0)) + Vector((0, 0, 0.9))).normalized()
        depth = (0.02 + 0.431 * 2) * gr
        center = p + axis * (depth + TUBE[ri] * 0.9)
        gem('planet%d' % k, center, axis, gr, DIAMOND, spin=k * 17)
        # collar and post
        coll = torus('collar%d' % k, gr * 1.015, gr * 0.075, material=PLAT, seg=96, minseg=14)
        coll.location = center * S + axis * (0.0)
        coll.rotation_mode = 'QUATERNION'; coll.rotation_quaternion = axis.to_track_quat('Z', 'Y')
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.10 * gr * S, radius2=0.19 * gr * S, depth=(depth + TUBE[ri]) * S * 1.0)
        me = bpy.data.meshes.new('post%d' % k); bm.to_mesh(me); bm.free()
        post = bpy.data.objects.new('post%d' % k, me); post.data.materials.append(PLAT); link(post); smooth(post)
        post.rotation_mode = 'QUATERNION'; post.rotation_quaternion = axis.to_track_quat('Z', 'Y')
        post.location = (p + axis * ((depth + TUBE[ri]) / 2)) * S

    # ------------------------------------------------------------ camera: phone frame 390x900 css, pearl at (294,263.5), pearl dia 130 css px
    jewel_objs = [o for o in bpy.context.scene.collection.objects]
    elev = math.radians(15.0)
    D = 1.20
    cam_d = bpy.data.cameras.new('cam'); cam_d.sensor_width = 36; cam_d.sensor_fit = 'HORIZONTAL'
    cam_d.lens = 36 * (D * 100) / ((2 * PEARL_R) / (130.0 / FW))
    cam_d.shift_x = 0.5 - 294.0 / FW
    cam_d.shift_y = -((0.5 - 263.5 / FH) * FH / FW)
    cam_d.dof.use_dof = True; cam_d.dof.focus_distance = D; cam_d.dof.aperture_fstop = float(os.environ.get('FSTOP', '9'))
    cam_d.clip_start = 0.05; cam_d.clip_end = 20
    cam = bpy.data.objects.new('cam', cam_d); link(cam)
    cam.location = Vector((0, -D * math.cos(elev), D * math.sin(elev)))
    cam.rotation_euler = (Vector((0, 0, 0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
    # tilt the jewel 12 degrees clockwise about the viewing axis (not the camera, so the drape stays upright)
    view_axis = (Vector((0, 0, 0)) - cam.location).normalized()
    TILT = float(os.environ.get('TILT', '12'))
    tilt = bpy.data.objects.new('tilt', None); link(tilt)
    for o in jewel_objs:
        o.parent = tilt
    tilt.rotation_mode = 'QUATERNION'
    from mathutils import Quaternion
    tilt.rotation_quaternion = Quaternion(view_axis, math.radians(TILT))

    # ------------------------------------------------------------ the satin drape (hangs behind the jewel)
    CURT_Y = float(os.environ.get('CURTY', '32'))
    NX, NZ = 360, 560
    CW, CH = 130.0, 210.0
    SEED = float(os.environ.get('SEED', '3'))
    WL = float(os.environ.get('WL', '1.8'))
    LEAN = float(os.environ.get('LEAN', '0.22'))
    def fold(x, z):
        x = x + LEAN * z
        d  = 5.2 * math.sin(2 * math.pi * x / (33.0 * WL) + 0.9 + 0.006 * z + SEED)
        d += 1.6 * math.sin(2 * math.pi * x / (15.5 * WL) + 2.1 - 0.011 * z + 2 * SEED)
        d += 0.35 * math.sin(2 * math.pi * x / 8.3 + 0.4 + 0.017 * z)
        d += 2.4 * math.sin(2 * math.pi * z / 95.0 + 0.8 * math.sin(x / 21.0) + SEED)
        return d
    bm = bmesh.new()
    grid = []
    for i in range(NX + 1):
        row = []
        for j in range(NZ + 1):
            x = -CW / 2 + CW * i / NX
            z = -CH * 0.62 + CH * j / NZ
            row.append(bm.verts.new((x * S, (CURT_Y + fold(x, z)) * S, z * S)))
        grid.append(row)
    for i in range(NX):
        for j in range(NZ):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
    me = bpy.data.meshes.new('drape'); bm.to_mesh(me); bm.free()
    drape = bpy.data.objects.new('drape', me); link(drape); smooth(drape)
    # UVs so anisotropy runs along the folds (vertical)
    uv = me.uv_layers.new(name='UV')
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv = ((v.x / S + CW / 2) / CW, (v.z / S + CH * 0.62) / CH)
    SATIN_RGB = tuple(float(x) for x in os.environ.get('SATIN', '0.012,0.20,0.125').split(','))
    SATIN = mat('satin', Base_Color=SATIN_RGB + (1,), Metallic=0.0, Roughness=float(os.environ.get('ROUGH', '0.28')), Anisotropic=0.9, Anisotropic_Rotation=0.25,
                Sheen_Weight=float(os.environ.get('SHEEN', '0.1')), Sheen_Roughness=0.35, Specular_IOR_Level=1.0)
    drape.data.materials.append(SATIN)
    if MODE == 'hero':
        drape.is_shadow_catcher = True
        sc.render.film_transparent = True
    # border crop for the jewel render: css region x 0..390, y 90..340
    if MODE == 'hero':
        sc.render.use_border = True; sc.render.use_crop_to_border = True
        sc.render.border_min_x = 0.0; sc.render.border_max_x = 1.0
        sc.render.border_min_y = 1 - 340.0 / FH; sc.render.border_max_y = 1 - 90.0 / FH

    # ------------------------------------------------------------ studio lighting (cm)
    LK = float(os.environ.get('LK', '1'))
    area('key_top',    (-18, -26, 95), (0, 0, 0), 70, 45, 300, (1.0, 1.0, 1.0))
    area('strip_L',    (-62, -8, 22),  (0, 0, 0), 14, 85, 260 * LK, (1.0, 1.0, 1.0))
    area('strip_R',    (64, -14, 18),  (0, 0, 0), 14, 85, 200, (1.0, 1.0, 1.0))
    area('front_soft', (6, -120, 50),  (0, 0, 0), 90, 55, 40,  (1.0, 1.0, 1.0))
    area('rim_back',   (34, 70, 40),   (0, 0, 0), 22, 22, 560, (1.0, 1.0, 1.0))
    area('spark1',     (-30, -45, 62), (0, 0, 0), 7, 7, 180, (1.0, 1.0, 1.0))
    area('spark2',     (28, -38, 48),  (0, 0, 0), 6, 6, 160, (1.0, 1.0, 1.0))
    area('drape_rake', (-95, -10, 10), (0, CURT_Y, -10), 40, 160, float(os.environ.get('RAKE', '900')), (1.0, 1.0, 1.0))
    area('drape_top',  (10, 10, 120),  (0, CURT_Y, -20), 90, 40, float(os.environ.get('TOPL', '500')), (1.0, 1.0, 1.0))

elif MODE == 'gem':
    gem('g', (0, 0, 0), (0, 0, 1), 1.0, DIAMOND, spin=8)
    cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 85; cam_d.sensor_width = 36; cam_d.clip_start = 0.005
    cam = bpy.data.objects.new('cam', cam_d); link(cam)
    bg.inputs['Color'].default_value = (1, 1, 1, 1)
    EL = math.radians(float(os.environ.get('EL', '90')))
    cam.location = Vector((0, -0.075 * math.cos(EL), 0.075 * math.sin(EL)))
    cam.rotation_euler = (Vector((0, 0, 0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
    GL = int(os.environ.get('GL', '6'))
    for k in range(GL):
        a = math.radians(360 / GL * k + 15)
        area('r%d' % k, (math.cos(a) * 7, math.sin(a) * 7, 6), (0, 0, 0), 2.2, 2.2, 0.05 * (1.4 if k % 2 else 0.8) * 6 / GL, (1, 1, 1))
    area('top', (0, 0, 9), (0, 0, 0), 5, 5, 0.012, (1, 1, 1))

if os.environ.get('PROJECT') == '1' and MODE == 'hero':
    import json
    from bpy_extras.object_utils import world_to_camera_view
    bpy.context.view_layer.update()
    res = {}
    for ob in bpy.data.objects:
        if ob.name.startswith('planet') or ob.name == 'pearl':
            c = world_to_camera_view(sc, cam, ob.location)
            res[ob.name] = [round(c.x, 5), round(1 - c.y, 5)]
    # pearl radius in image-width fractions: project a point one radius to the side of the centre
    right = cam.matrix_world.to_3x3() @ Vector((1, 0, 0))
    c2 = world_to_camera_view(sc, cam, Vector((0, 0, 0)) + right * PEARL_R * S)
    c0 = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    res['pearl_r'] = round(abs(c2.x - c0.x) * 1.0, 5)
    res['pearl_r_y'] = round(abs(c2.y - c0.y), 5)
    json.dump(res, open(OUT + '.json', 'w'), indent=1)
    print('PROJECTED', res)
    sys.exit(0)
t0 = time.time()
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('RENDER DONE in %.1fs -> %s' % (time.time() - t0, OUT))
