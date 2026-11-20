"""
Cycles stills of a black-titanium flagship for the waitlist scroll.

    blender -b -P scripts/blender/render_waitlist_cycles.py -- --aspect desktop --frame 0
    blender -b -P scripts/blender/render_waitlist_cycles.py -- --aspect desktop
    blender -b -P scripts/blender/render_waitlist_cycles.py -- --aspect mobile

Screens are PNGs from the real Dozen UI (DOZEN_SCREENS, default /tmp/dozen-hi).
Frames are RGBA PNG, then WebP with alpha under public/marketing/waitlist/frames.
Film is transparent so the page background shows through. No hard rectangle.
"""

from __future__ import annotations

import math
import os
import sys

import bpy
import bmesh
import mathutils

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SCREENS = os.environ.get("DOZEN_SCREENS", "/tmp/dozen-hi")
PNG_ROOT = os.environ.get("DOZEN_CYCLE_PNG", "/tmp/dozen-cycles")

FRAME_COUNT = 16
SCREEN_IDS = ("review", "testers", "wallet", "referral")

# Phone, metres. Screen faces +Y. Z is up.
PW, PH, PD = 0.078, 0.0094, 0.164
CORNER = 0.012


def argv_after() -> list[str]:
    if "--" in sys.argv:
        return sys.argv[sys.argv.index("--") + 1 :]
    return []


def parse_args() -> tuple[str, int | None, float]:
    aspect = "desktop"
    frame = None
    scale = 1.0
    args = argv_after()
    i = 0
    while i < len(args):
        if args[i] == "--aspect" and i + 1 < len(args):
            aspect = args[i + 1]
            i += 2
            continue
        if args[i] == "--frame" and i + 1 < len(args):
            frame = int(args[i + 1])
            i += 2
            continue
        if args[i] == "--scale" and i + 1 < len(args):
            scale = float(args[i + 1])
            i += 2
            continue
        i += 1
    return aspect, frame, scale


def clean_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in (
        bpy.data.meshes,
        bpy.data.materials,
        bpy.data.lights,
        bpy.data.images,
    ):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def principled(name: str) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (-280, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    mat["bsdf"] = bsdf.name
    return mat


def bsdf_of(mat: bpy.types.Material):
    return mat.node_tree.nodes[mat["bsdf"]]


def set_input(node, socket: str, value) -> None:
    node.inputs[socket].default_value = value


def titanium(name: str, color, roughness: float, anisotropic: float) -> bpy.types.Material:
    mat = principled(name)
    node = bsdf_of(mat)
    set_input(node, "Base Color", (*color, 1))
    set_input(node, "Metallic", 1.0)
    set_input(node, "Roughness", roughness)
    set_input(node, "Anisotropic", anisotropic)
    set_input(node, "Anisotropic Rotation", 0.0)
    set_input(node, "Coat Weight", 0.35)
    set_input(node, "Coat Roughness", 0.08)
    set_input(node, "Coat IOR", 1.5)
    set_input(node, "Specular IOR Level", 0.55)
    return mat


def glass_back() -> bpy.types.Material:
    mat = principled("back-glass")
    node = bsdf_of(mat)
    set_input(node, "Base Color", (0.012, 0.014, 0.02, 1))
    set_input(node, "Metallic", 0.08)
    set_input(node, "Roughness", 0.09)
    set_input(node, "IOR", 1.52)
    set_input(node, "Coat Weight", 1.0)
    set_input(node, "Coat Roughness", 0.045)
    set_input(node, "Coat IOR", 1.5)
    set_input(node, "Specular IOR Level", 1.0)
    return mat


def lens_glass() -> bpy.types.Material:
    mat = principled("lens-glass")
    node = bsdf_of(mat)
    set_input(node, "Base Color", (0.004, 0.008, 0.014, 1))
    set_input(node, "Metallic", 0.0)
    set_input(node, "Roughness", 0.0)
    set_input(node, "IOR", 1.7)
    set_input(node, "Coat Weight", 1.0)
    set_input(node, "Coat Roughness", 0.0)
    set_input(node, "Coat IOR", 1.8)
    set_input(node, "Specular IOR Level", 1.0)
    return mat


def screen_material(path: str) -> bpy.types.Material:
    mat = principled("screen")
    node = bsdf_of(mat)
    tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
    tex.location = (-640, 0)
    image = bpy.data.images.load(path)
    image.colorspace_settings.name = "sRGB"
    tex.image = image
    tex.interpolation = "Cubic"
    mat.node_tree.links.new(tex.outputs["Color"], node.inputs["Base Color"])
    mat.node_tree.links.new(tex.outputs["Color"], node.inputs["Emission Color"])
    set_input(node, "Emission Strength", 0.72)
    set_input(node, "Roughness", 0.22)
    set_input(node, "Metallic", 0.0)
    set_input(node, "Coat Weight", 1.0)
    set_input(node, "Coat Roughness", 0.04)
    set_input(node, "Coat IOR", 1.5)
    mat["image"] = image.name
    return mat


def smooth(obj: bpy.types.Object) -> None:
    mesh = obj.data
    for poly in mesh.polygons:
        poly.use_smooth = True
    if hasattr(mesh, "use_auto_smooth"):
        mesh.use_auto_smooth = True
        mesh.auto_smooth_angle = math.radians(55)


def link(obj: bpy.types.Object) -> bpy.types.Object:
    bpy.context.collection.objects.link(obj)
    return obj


def rounded_prism(name: str, w: float, h: float, d: float, radius: float, segs: int = 10):
    """Prism. Width X, height Z, depth Y. Origin at centre."""
    hw, hh, hd = w / 2, h / 2, d / 2
    radius = min(radius, hw * 0.98, hh * 0.98)
    corners = (
        (hw - radius, hh - radius, 0.0, math.pi / 2),
        (-hw + radius, hh - radius, math.pi / 2, math.pi),
        (-hw + radius, -hh + radius, math.pi, math.pi * 1.5),
        (hw - radius, -hh + radius, math.pi * 1.5, math.pi * 2),
    )
    pts = []
    for cx, cz, a0, a1 in corners:
        for i in range(segs):
            a = a0 + (a1 - a0) * (i / segs)
            pts.append((cx + radius * math.cos(a), 0.0, cz + radius * math.sin(a)))
    bm = bmesh.new()
    verts = [bm.verts.new(p) for p in pts]
    bm.verts.ensure_lookup_table()
    face = bm.faces.new(verts)
    extruded = bmesh.ops.extrude_face_region(bm, geom=[face])
    new_verts = [g for g in extruded["geom"] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=new_verts, vec=(0, hd * 2, 0))
    bmesh.ops.translate(bm, verts=list(bm.verts), vec=(0, -hd, 0))
    rails = [
        e
        for e in bm.edges
        if abs(e.verts[0].co.y - e.verts[1].co.y) > hd
    ]
    bmesh.ops.bevel(
        bm,
        geom=rails,
        offset=min(0.00115, hd * 0.45),
        segments=3,
        profile=0.6,
        affect="EDGES",
        clamp_overlap=True,
    )
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    smooth(obj)
    return link(obj)


def screen_plane(name: str, w: float, h: float):
    """Plane facing +Y. Width along X, height along Z. UVs match the screenshot."""
    bm = bmesh.new()
    coords = ((-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2))
    verts = [bm.verts.new(c) for c in coords]
    face = bm.faces.new(verts)
    uv_layer = bm.loops.layers.uv.new("UV")
    for loop in face.loops:
        co = loop.vert.co
        loop[uv_layer].uv = (0.5 - co.x / w, co.z / h + 0.5)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    return link(bpy.data.objects.new(name, mesh))


def cylinder(name: str, radius: float, depth: float, verts: int = 64):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=verts,
        radius1=radius,
        radius2=radius,
        depth=depth,
    )
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    smooth(obj)
    return link(obj)


def new_phone(screen_path: str) -> bpy.types.Object:
    root = bpy.data.objects.new("phone", None)
    link(root)

    body_mat = titanium("frame", (0.02, 0.021, 0.024), 0.34, 0.88)
    island_mat = titanium("island", (0.035, 0.037, 0.042), 0.22, 0.4)
    ring_mat = titanium("ring", (0.16, 0.17, 0.18), 0.16, 0.35)
    back_mat = glass_back()
    lens_mat = lens_glass()
    pupil_mat = principled("pupil")
    set_input(bsdf_of(pupil_mat), "Base Color", (0.0, 0.0, 0.0, 1))
    set_input(bsdf_of(pupil_mat), "Roughness", 0.08)
    set_input(bsdf_of(pupil_mat), "Metallic", 0.2)
    flash_mat = principled("flash")
    set_input(bsdf_of(flash_mat), "Base Color", (1.0, 0.93, 0.78, 1))
    set_input(bsdf_of(flash_mat), "Emission Color", (1.0, 0.9, 0.7, 1))
    set_input(bsdf_of(flash_mat), "Emission Strength", 6.0)
    set_input(bsdf_of(flash_mat), "Roughness", 0.25)
    bezel_mat = principled("bezel")
    set_input(bsdf_of(bezel_mat), "Base Color", (0.01, 0.01, 0.012, 1))
    set_input(bsdf_of(bezel_mat), "Roughness", 0.45)
    set_input(bsdf_of(bezel_mat), "Metallic", 0.4)

    body = rounded_prism("body", PW, PD, PH, CORNER, 12)
    body.data.materials.append(body_mat)
    body.parent = root

    bezel = rounded_prism("bezel", PW - 0.0032, PD - 0.0036, 0.00045, CORNER - 0.001, 10)
    bezel.data.materials.append(bezel_mat)
    bezel.location.y = PH / 2 + 0.0002
    bezel.parent = root

    screen = screen_plane("screen", PW - 0.0066, PD - 0.0074)
    screen.data.materials.append(screen_material(screen_path))
    screen.location.y = PH / 2 + 0.00055
    screen.parent = root

    back = screen_plane("back", PW - 0.0052, PD - 0.006)
    back.data.materials.append(back_mat)
    back.rotation_euler.x = math.pi
    back.location.y = -PH / 2 - 0.00045
    back.parent = root

    island_w, island_h = 0.036, 0.036
    island = rounded_prism("island", island_w, island_h, 0.0026, 0.008, 8)
    island.data.materials.append(island_mat)
    island.location = (-PW * 0.2, -PH / 2 - 0.0015, PD * 0.28)
    island.parent = root

    def add_lens(x: float, z: float):
        ring = cylinder("ring", 0.0064, 0.0016, 72)
        ring.data.materials.append(ring_mat)
        ring.rotation_euler.x = math.pi / 2
        glass = cylinder("glass", 0.00515, 0.0011, 72)
        glass.data.materials.append(lens_mat)
        glass.rotation_euler.x = math.pi / 2
        pupil = cylinder("pupil", 0.0025, 0.0007, 48)
        pupil.data.materials.append(pupil_mat)
        pupil.rotation_euler.x = math.pi / 2
        for piece, depth in ((ring, 0.0009), (glass, 0.0015), (pupil, 0.0021)):
            piece.location = (
                island.location.x + x,
                island.location.y - depth,
                island.location.z + z,
            )
            piece.parent = root

    spread = 0.0082
    add_lens(-spread, spread)
    add_lens(spread, spread)
    add_lens(-spread, -spread)
    flash = cylinder("flash", 0.0023, 0.0008, 40)
    flash.data.materials.append(flash_mat)
    flash.rotation_euler.x = math.pi / 2
    flash.location = (
        island.location.x + spread,
        island.location.y - 0.0012,
        island.location.z - spread,
    )
    flash.parent = root
    lidar = cylinder("lidar", 0.00115, 0.0005, 24)
    lidar.data.materials.append(pupil_mat)
    lidar.rotation_euler.x = math.pi / 2
    lidar.location = (
        island.location.x + spread,
        island.location.y - 0.0011,
        island.location.z - spread - 0.0052,
    )
    lidar.parent = root
    return root


def studio() -> None:
    world = bpy.data.worlds.new("studio")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.42, 0.45, 0.5, 1)
    bg.inputs["Strength"].default_value = 0.28

    def area(name, loc, size, power, color):
        light = bpy.data.lights.new(name, "AREA")
        light.shape = "RECTANGLE"
        light.size = size
        light.size_y = size * 0.62
        light.energy = power
        light.color = color
        obj = bpy.data.objects.new(name, light)
        obj.location = loc
        direction = mathutils.Vector((0, 0, 0.02)) - mathutils.Vector(loc)
        obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        link(obj)

    area("key", (0.42, 1.05, 0.78), 0.7, 90, (1.0, 0.98, 0.94))
    area("rim", (-0.7, -0.35, 0.38), 0.28, 70, (0.72, 0.82, 1.0))
    area("fill", (-0.2, 1.25, 0.55), 0.9, 12, (0.96, 0.97, 1.0))

    # Softboxes the metal can actually reflect. Kept out of the lens.
    def card(name, loc, scale, color, strength):
        mesh = bpy.data.meshes.new(name)
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1)
        bm.to_mesh(mesh)
        bm.free()
        obj = bpy.data.objects.new(name, mesh)
        obj.location = loc
        obj.scale = scale
        direction = mathutils.Vector((0, 0, 0)) - mathutils.Vector(loc)
        obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
        mat = principled(name + "-mat")
        node = bsdf_of(mat)
        set_input(node, "Emission Color", (*color, 1))
        set_input(node, "Emission Strength", strength)
        set_input(node, "Base Color", (*color, 1))
        obj.data.materials.append(mat)
        link(obj)

    # Behind the camera, so the glass picks up a soft ceiling highlight
    # instead of a hard rectangle across the lower back.
    card("softbox", (0.04, 0.85, 0.62), (0.28, 0.7, 1), (1, 1, 1), 1.6)
    card("blue", (-1.6, 1.1, 0.35), (0.22, 0.7, 1), (0.12, 0.31, 0.85), 2.2)
    for obj in bpy.context.scene.objects:
        if obj.type == "LIGHT":
            obj.data.use_shadow = obj.name in {"key", "rim"}
        if obj.name in {"softbox", "blue"}:
            obj.visible_shadow = False


def contact_shadow() -> bpy.types.Object:
    """Soft oval under a phone. Fades to nothing, so it cannot draw a floor edge."""
    mesh = bpy.data.meshes.new("shadow")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("shadow", mesh)
    mat = bpy.data.materials.new("contact")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    transparent = nt.nodes.new("ShaderNodeBsdfTransparent")
    shadow = nt.nodes.new("ShaderNodeEmission")
    shadow.inputs["Color"].default_value = (0.05, 0.06, 0.08, 1)
    shadow.inputs["Strength"].default_value = 1.0
    mix = nt.nodes.new("ShaderNodeMixShader")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    sub_x = nt.nodes.new("ShaderNodeMath")
    sub_x.operation = "SUBTRACT"
    sub_x.inputs[1].default_value = 0.5
    sub_y = nt.nodes.new("ShaderNodeMath")
    sub_y.operation = "SUBTRACT"
    sub_y.inputs[1].default_value = 0.5
    sq_x = nt.nodes.new("ShaderNodeMath")
    sq_x.operation = "MULTIPLY"
    sq_y = nt.nodes.new("ShaderNodeMath")
    sq_y.operation = "MULTIPLY"
    add = nt.nodes.new("ShaderNodeMath")
    add.operation = "ADD"
    root = nt.nodes.new("ShaderNodeMath")
    root.operation = "SQRT"
    div = nt.nodes.new("ShaderNodeMath")
    div.operation = "DIVIDE"
    div.inputs[1].default_value = 0.5
    soften = nt.nodes.new("ShaderNodeMapRange")
    soften.inputs["From Min"].default_value = 0.0
    soften.inputs["From Max"].default_value = 1.0
    soften.inputs["To Min"].default_value = 0.58
    soften.inputs["To Max"].default_value = 1.0
    nt.links.new(coord.outputs["Generated"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["X"], sub_x.inputs[0])
    nt.links.new(sep.outputs["Y"], sub_y.inputs[0])
    nt.links.new(sub_x.outputs["Value"], sq_x.inputs[0])
    nt.links.new(sub_x.outputs["Value"], sq_x.inputs[1])
    nt.links.new(sub_y.outputs["Value"], sq_y.inputs[0])
    nt.links.new(sub_y.outputs["Value"], sq_y.inputs[1])
    nt.links.new(sq_x.outputs["Value"], add.inputs[0])
    nt.links.new(sq_y.outputs["Value"], add.inputs[1])
    nt.links.new(add.outputs["Value"], root.inputs[0])
    nt.links.new(root.outputs["Value"], div.inputs[0])
    nt.links.new(div.outputs["Value"], soften.inputs["Value"])
    nt.links.new(soften.outputs["Result"], mix.inputs["Fac"])
    nt.links.new(shadow.outputs["Emission"], mix.inputs[1])
    nt.links.new(transparent.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    obj.data.materials.append(mat)
    obj.visible_shadow = False
    obj.visible_glossy = False
    obj.visible_diffuse = False
    obj.visible_transmission = False
    return link(obj)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def ease(t: float) -> float:
    return t * t * (3 - 2 * t)


def sample(keys, t: float):
    t = min(1, max(0, t))
    i = 0
    while i < len(keys) - 2 and keys[i + 1][0] < t:
        i += 1
    a = keys[i]
    b = keys[min(len(keys) - 1, i + 1)]
    span = max(1e-4, b[0] - a[0])
    u = ease(min(1, max(0, (t - a[0]) / span)))
    return u, a, b


def mix_vec(a, b, u):
    return tuple(lerp(a[i], b[i], u) for i in range(3))


# (t, cam, look, front xyz, front yaw, front pitch, front screen,
#  back xyz, back yaw, back pitch, back scale, back screen)
# yaw around Z. 0 shows the screen to a +Y camera. pi shows the glass back.
# pitch around X tips the phone back, the same way on every hero.
# One hero pose is reused for review, testers, wallet and referral.
# The hero phone yaws through a full turn into the lens, then back to that pose.
# Desktop phones sit in the right half so the copy column can balance them.
# Mobile phones sit low and centred, under the copy.
# Island at yaw pi, phone at origin: world offset about (0.016, 0.006, 0.046).
HERO_YAW = 0.46
HERO_PITCH = 0.12
BACK_YAW = 2.52
BACK_PITCH = 0.1
TURN = math.pi * 2 + HERO_YAW

DESKTOP = [
    (0.00, (-0.005, 0.48, 0.04), (-0.05, 0.0, 0.01), (-0.078, 0.03, -0.004), HERO_YAW, HERO_PITCH, 0, (-0.016, -0.05, 0.028), BACK_YAW, BACK_PITCH, 0.78, 1),
    (0.18, (0.01, 0.46, 0.045), (-0.02, 0.0, 0.012), (-0.04, 0.02, 0.0), 1.35, 0.08, 0, (0.04, -0.08, 0.04), BACK_YAW, BACK_PITCH, 0.62, 1),
    (0.34, (0.0, 0.40, 0.05), (-0.005, 0.0, 0.016), (-0.01, 0.01, 0.006), 2.45, 0.04, 0, (0.45, -0.3, -0.16), BACK_YAW, 0.0, 0.04, 1),
    (0.50, (0.008, 0.052, 0.048), (0.008, 0.0, 0.046), (0.0, 0.0, 0.0), math.pi, 0.0, 0, (0.7, -0.4, -0.25), 0.2, 0.0, 0.01, 1),
    (0.66, (-0.005, 0.48, 0.04), (-0.05, 0.0, 0.01), (-0.078, 0.03, -0.004), TURN, HERO_PITCH, 1, (-0.016, -0.05, 0.028), BACK_YAW, BACK_PITCH, 0.78, 1),
    (0.80, (-0.005, 0.48, 0.04), (-0.05, 0.0, 0.01), (-0.078, 0.03, -0.004), TURN, HERO_PITCH, 1, (-0.016, -0.05, 0.028), BACK_YAW, BACK_PITCH, 0.78, 1),
    (0.86, (-0.005, 0.48, 0.04), (-0.05, 0.0, 0.01), (-0.078, 0.03, -0.004), TURN, HERO_PITCH, 2, (-0.016, -0.05, 0.028), BACK_YAW, BACK_PITCH, 0.78, 2),
    (0.96, (-0.005, 0.48, 0.04), (-0.05, 0.0, 0.01), (-0.078, 0.03, -0.004), TURN, HERO_PITCH, 2, (-0.016, -0.05, 0.028), BACK_YAW, BACK_PITCH, 0.78, 2),
    (1.00, (-0.005, 0.48, 0.04), (-0.05, 0.0, 0.01), (-0.078, 0.03, -0.004), TURN, HERO_PITCH, 3, (-0.016, -0.05, 0.028), BACK_YAW, BACK_PITCH, 0.78, 3),
]

MOBILE = [
    (0.00, (0.0, 0.52, 0.13), (0.0, 0.0, 0.018), (0.0, 0.01, -0.02), HERO_YAW, HERO_PITCH, 0, (-0.004, -0.036, 0.02), BACK_YAW, BACK_PITCH, 0.74, 1),
    (0.20, (0.0, 0.40, 0.15), (0.0, 0.0, 0.03), (0.0, 0.01, -0.05), 1.4, 0.06, 0, (0.01, -0.07, -0.02), BACK_YAW, BACK_PITCH, 0.48, 1),
    (0.36, (0.0, 0.36, 0.12), (0.0, 0.0, 0.02), (0.0, 0.004, -0.04), 2.5, 0.02, 0, (0.4, -0.28, -0.2), BACK_YAW, 0.0, 0.04, 1),
    (0.50, (0.004, 0.058, -0.016), (0.004, 0.0, -0.02), (0.0, 0.0, -0.066), math.pi, 0.0, 0, (0.55, -0.4, -0.3), 0.2, 0.0, 0.01, 1),
    (0.66, (0.0, 0.52, 0.13), (0.0, 0.0, 0.018), (0.0, 0.01, -0.02), TURN, HERO_PITCH, 1, (-0.004, -0.036, 0.02), BACK_YAW, BACK_PITCH, 0.74, 1),
    (0.80, (0.0, 0.52, 0.13), (0.0, 0.0, 0.018), (0.0, 0.01, -0.02), TURN, HERO_PITCH, 1, (-0.004, -0.036, 0.02), BACK_YAW, BACK_PITCH, 0.74, 1),
    (0.86, (0.0, 0.52, 0.13), (0.0, 0.0, 0.018), (0.0, 0.01, -0.02), TURN, HERO_PITCH, 2, (-0.004, -0.036, 0.02), BACK_YAW, BACK_PITCH, 0.74, 2),
    (0.96, (0.0, 0.52, 0.13), (0.0, 0.0, 0.018), (0.0, 0.01, -0.02), TURN, HERO_PITCH, 2, (-0.004, -0.036, 0.02), BACK_YAW, BACK_PITCH, 0.74, 2),
    (1.00, (0.0, 0.52, 0.13), (0.0, 0.0, 0.018), (0.0, 0.01, -0.02), TURN, HERO_PITCH, 3, (-0.004, -0.036, 0.02), BACK_YAW, BACK_PITCH, 0.74, 3),
]


def place_shadow(disc: bpy.types.Object, location, scale: float, hide: bool) -> None:
    disc.location = (location[0], location[1] - 0.01, -PD / 2 - 0.006)
    disc.rotation_euler = (0, 0, 0)
    amount = 0.0 if hide else max(0.0, scale)
    disc.scale = (0.095 * amount, 0.052 * amount, 1)


def apply_pose(phones, shadows, cam, keys, index: int, count: int) -> None:
    t = 0 if count <= 1 else index / (count - 1)
    u, a, b = sample(keys, t)
    cam.location = mix_vec(a[1], b[1], u)
    look = mathutils.Vector(mix_vec(a[2], b[2], u))
    direction = look - mathutils.Vector(cam.location)
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    front, back = phones
    front.location = mix_vec(a[3], b[3], u)
    front.rotation_euler = (lerp(a[5], b[5], u), 0, lerp(a[4], b[4], u))
    front.scale = (1, 1, 1)
    set_screen(front, SCREEN_IDS[int(round(lerp(a[6], b[6], u)))])

    back.location = mix_vec(a[7], b[7], u)
    back.rotation_euler = (lerp(a[9], b[9], u), 0, lerp(a[8], b[8], u))
    s = lerp(a[10], b[10], u)
    back.scale = (s, s, s)
    set_screen(back, SCREEN_IDS[int(round(lerp(a[11], b[11], u)))])

    # A macro lens is full-bleed. A contact oval in that frame would read as a smudge.
    hide = cam.location.y < 0.16
    place_shadow(shadows[0], front.location, 1.0, hide)
    place_shadow(shadows[1], back.location, s, hide)


def set_screen(phone: bpy.types.Object, screen_id: str) -> None:
    image_name = f"screen-{screen_id}"
    for child in phone.children:
        if child.name.startswith("screen"):
            mat = child.data.materials[0]
            image = bpy.data.images.get(image_name)
            for node in mat.node_tree.nodes:
                if node.type == "TEX_IMAGE":
                    node.image = image


def configure_render(aspect: str, scale: float) -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 80
    scene.cycles.use_denoising = False
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.02
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = -0.15
    if aspect == "mobile":
        scene.render.resolution_x = 780
        scene.render.resolution_y = 1688
    else:
        scene.render.resolution_x = 1440
        scene.render.resolution_y = 900
    scene.render.resolution_percentage = int(scale * 100)
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 50 if aspect == "desktop" else 48
    cam_data.sensor_width = 36
    cam_data.clip_start = 0.01
    cam_data.clip_end = 40
    cam = bpy.data.objects.new("cam", cam_data)
    link(cam)
    scene.camera = cam
    return cam


def main() -> None:
    aspect, only, scale = parse_args()
    keys = DESKTOP if aspect == "desktop" else MOBILE
    clean_scene()
    studio()
    images = {}
    for screen_id in SCREEN_IDS:
        path = os.path.join(SCREENS, f"{screen_id}.png")
        if not os.path.isfile(path):
            raise SystemExit(f"missing screen texture {path}")
        image = bpy.data.images.load(path)
        image.name = f"screen-{screen_id}"
        image.colorspace_settings.name = "sRGB"
        images[screen_id] = image
    front = new_phone(os.path.join(SCREENS, "review.png"))
    back = new_phone(os.path.join(SCREENS, "testers.png"))
    shadows = (contact_shadow(), contact_shadow())
    cam = configure_render(aspect, scale)
    out_dir = os.path.join(PNG_ROOT, aspect)
    os.makedirs(out_dir, exist_ok=True)
    frames = [only] if only is not None else list(range(FRAME_COUNT))
    for index in frames:
        apply_pose((front, back), shadows, cam, keys, index, FRAME_COUNT)
        bpy.context.scene.render.filepath = os.path.join(out_dir, f"{index:02d}.png")
        bpy.ops.render.render(write_still=True)
        print("rendered", aspect, index)


if __name__ == "__main__":
    main()
