"""
Reproduce the waitlist phone sequences.

    blender -b -P scripts/blender/render_waitlist_phones.py -- --frames 48

Writes PNG frames under /tmp/dozen-phones, then compressed WebP sequences:

    public/marketing/phones/desktop/<shot>/000.webp
    public/marketing/phones/mobile/<shot>/000.webp   (every 3rd frame, smaller)
    public/marketing/phones/manifest.json

Blender 4.0 Eevee, studio lights, real Dozen screenshots on the glass.
Headless: `blender -b` (no display). Eevee is used because a full Cycles
pass of ~200 frames is too slow on CPU.
"""

from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
import sys

import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PNG_ROOT = os.environ.get("DOZEN_PHONE_PNG", "/tmp/dozen-phones")
OUT_ROOT = os.path.join(ROOT, "public", "marketing", "phones")

SHOTS = [
    {
        "id": "testers",
        "image": "public/marketing/screenshots/board-testers-mobile.png",
        "yaw0": -0.62,
        "yaw1": 0.55,
        "pitch": 0.16,
    },
    {
        "id": "request",
        "image": "public/marketing/screenshots/request-detail-mobile.png",
        "yaw0": 0.20,
        "yaw1": 0.78,
        "pitch": 0.16,
    },
    {
        "id": "review",
        "image": "public/marketing/screenshots/review-form-mobile.png",
        "yaw0": 0.48,
        "yaw1": -0.34,
        "pitch": 0.08,
    },
    {
        "id": "feedback",
        "image": "public/marketing/screenshots/board-feedback-mobile.png",
        "yaw0": -0.62,
        "yaw1": 0.18,
        "pitch": 0.20,
    },
]

DESKTOP_W = 720
DESKTOP_H = 960


def args_after_double_dash() -> list[str]:
    if "--" in sys.argv:
        return sys.argv[sys.argv.index("--") + 1 :]
    return []


def parse_args() -> tuple[int, str | None]:
    frames = 48
    only = None
    argv = args_after_double_dash()
    i = 0
    while i < len(argv):
        if argv[i] == "--frames" and i + 1 < len(argv):
            frames = max(2, int(argv[i + 1]))
            i += 2
            continue
        if argv[i] == "--shot" and i + 1 < len(argv):
            only = argv[i + 1]
            i += 2
            continue
        i += 1
    return frames, only


def ffmpeg_bin() -> str:
    found = shutil.which("ffmpeg")
    if found:
        return found
    bundled = os.path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg")
    if os.path.isfile(bundled):
        return bundled
    raise SystemExit("ffmpeg not found")


def clear_scene() -> None:
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


def track_to(obj: bpy.types.Object, target: bpy.types.Object) -> None:
    constraint = obj.constraints.new("TRACK_TO")
    constraint.target = target
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"


def add_area(
    name: str,
    location: tuple[float, float, float],
    energy: float,
    size: float,
    color: tuple[float, float, float],
    target: bpy.types.Object,
) -> None:
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    track_to(obj, target)


def principled(name: str, color: tuple[float, float, float], roughness: float, metallic: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def screen_material(image_path: str) -> bpy.types.Material:
    mat = bpy.data.materials.new("Screen")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    tex = nodes.new("ShaderNodeTexImage")
    image = bpy.data.images.load(image_path, check_existing=True)
    image.colorspace_settings.name = "sRGB"
    tex.image = image
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 1.15
    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(tex.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def build_phone(image_path: str) -> bpy.types.Object:
    # Body sits on Z, front face points toward -Y.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = "PhoneBody"
    body.scale = (0.0365, 0.0042, 0.076)
    bpy.ops.object.transform_apply(scale=True)
    bevel = body.modifiers.new("Bevel", "BEVEL")
    bevel.width = 0.0032
    bevel.segments = 4
    bevel.affect = "EDGES"
    body.data.materials.append(principled("Body", (0.043, 0.122, 0.227), 0.42, 0.08))

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.00405, 0))
    bezel = bpy.context.active_object
    bezel.name = "Bezel"
    bezel.scale = (0.0336, 0.00035, 0.0722)
    bpy.ops.object.transform_apply(scale=True)
    bezel.data.materials.append(principled("Bezel", (0.02, 0.03, 0.05), 0.55, 0.0))

    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -0.00445, 0))
    screen = bpy.context.active_object
    screen.name = "Screen"
    screen.scale = (0.0312, 0.0694, 1)
    screen.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True, scale=True)
    screen.data.materials.append(screen_material(image_path))

    return body


def build_stage() -> bpy.types.Object:
    target = bpy.data.objects.new("Target", None)
    bpy.context.collection.objects.link(target)
    target.location = (0, 0, 0)

    shadow = bpy.data.images.new("SoftShadow", 128, 128, alpha=True)
    pixels: list[float] = []
    for y in range(128):
        for x in range(128):
            dx = (x + 0.5) / 128 - 0.5
            dy = (y + 0.5) / 128 - 0.5
            dist = math.sqrt(dx * dx * 1.15 + dy * dy * 2.4)
            alpha = max(0.0, 1.0 - dist * 2.05)
            alpha = alpha * alpha * 0.42
            pixels.extend((0.043, 0.09, 0.16, alpha))
    shadow.pixels = pixels
    shadow.pack()
    shadow_mat = bpy.data.materials.new("Shadow")
    shadow_mat.use_nodes = True
    shadow_mat.blend_method = "BLEND"
    nodes = shadow_mat.node_tree.nodes
    links = shadow_mat.node_tree.links
    nodes.clear()
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = shadow
    out = nodes.new("ShaderNodeOutputMaterial")
    transp = nodes.new("ShaderNodeBsdfTransparent")
    dark = nodes.new("ShaderNodeBsdfDiffuse")
    dark.inputs["Color"].default_value = (0.05, 0.1, 0.18, 1)
    mix = nodes.new("ShaderNodeMixShader")
    links.new(tex.outputs["Alpha"], mix.inputs[0])
    links.new(transp.outputs["BSDF"], mix.inputs[1])
    links.new(dark.outputs["BSDF"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])

    bpy.ops.mesh.primitive_plane_add(size=1, location=(0.004, 0.0, -0.041))
    floor = bpy.context.active_object
    floor.name = "ShadowCard"
    floor.scale = (0.07, 0.045, 1)
    bpy.ops.object.transform_apply(scale=True)
    floor.data.materials.append(shadow_mat)

    world = bpy.data.worlds["World"]
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.933, 0.949, 0.976, 1)
    bg.inputs["Strength"].default_value = 1.0

    add_area("Key", (-0.18, -0.28, 0.22), 6.5, 0.22, (1, 0.98, 0.94), target)
    add_area("Fill", (0.22, -0.16, 0.06), 2.2, 0.35, (0.86, 0.92, 1), target)
    add_area("Rim", (0.02, 0.22, 0.14), 4.0, 0.12, (0.45, 0.62, 1), target)
    add_area("Warm", (-0.08, -0.02, 0.24), 1.4, 0.1, (1, 0.78, 0.35), target)

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 50
    cam = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    track_to(cam, target)
    return cam


def place_camera(cam: bpy.types.Object, yaw: float, pitch: float) -> None:
    radius = 0.185
    cam.location = (
        math.sin(yaw) * radius * 0.92,
        -math.cos(yaw) * radius,
        0.012 + math.sin(pitch) * 0.09,
    )


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 16
    if hasattr(scene.eevee, "use_gtao"):
        scene.eevee.use_gtao = True
        scene.eevee.gtao_distance = 0.2
    if hasattr(scene.eevee, "use_soft_shadows"):
        scene.eevee.use_soft_shadows = True
    scene.view_settings.view_transform = "Standard"
    scene.render.resolution_x = DESKTOP_W
    scene.render.resolution_y = DESKTOP_H
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.film_transparent = False


def render_shot(shot: dict, frames: int, cam: bpy.types.Object) -> str:
    folder = os.path.join(PNG_ROOT, shot["id"])
    os.makedirs(folder, exist_ok=True)
    image_path = os.path.join(ROOT, shot["image"])
    if not os.path.isfile(image_path):
        raise SystemExit(f"missing screenshot {image_path}")
    # Rebuild the screen material by rebuilding the phone each shot.
    for name in ("PhoneBody", "Bezel", "Screen"):
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)
    build_phone(image_path)
    for index in range(frames):
        t = index / (frames - 1)
        yaw = shot["yaw0"] + (shot["yaw1"] - shot["yaw0"]) * t
        pitch = shot["pitch"] + 0.06 * math.sin(t * math.pi)
        place_camera(cam, yaw, pitch)
        bpy.context.scene.render.filepath = os.path.join(folder, f"{index:03d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"RENDERED {shot['id']} {index + 1}/{frames}", flush=True)
    return folder


def convert_shot(shot_id: str, frames: int, ffmpeg: str) -> dict:
    desktop_dir = os.path.join(OUT_ROOT, "desktop", shot_id)
    mobile_dir = os.path.join(OUT_ROOT, "mobile", shot_id)
    os.makedirs(desktop_dir, exist_ok=True)
    os.makedirs(mobile_dir, exist_ok=True)
    desktop = []
    mobile = []
    mobile_indexes = list(range(0, frames, 3))
    if mobile_indexes[-1] != frames - 1:
        mobile_indexes.append(frames - 1)
    for index in range(frames):
        src = os.path.join(PNG_ROOT, shot_id, f"{index:03d}.png")
        name = f"{index:03d}.webp"
        dest = os.path.join(desktop_dir, name)
        subprocess.check_call(
            [
                ffmpeg,
                "-y",
                "-i",
                src,
                "-c:v",
                "libwebp",
                "-quality",
                "62",
                "-compression_level",
                "6",
                dest,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        desktop.append(f"/marketing/phones/desktop/{shot_id}/{name}")
        if index in mobile_indexes:
            mdest = os.path.join(mobile_dir, name)
            subprocess.check_call(
                [
                    ffmpeg,
                    "-y",
                    "-i",
                    src,
                    "-vf",
                    "scale=420:-1",
                    "-c:v",
                    "libwebp",
                    "-quality",
                    "58",
                    "-compression_level",
                    "6",
                    mdest,
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            mobile.append(f"/marketing/phones/mobile/{shot_id}/{name}")
    return {"desktop": desktop, "mobile": mobile}


def main() -> None:
    frames, only = parse_args()
    shots = [shot for shot in SHOTS if only is None or shot["id"] == only]
    if not shots:
        raise SystemExit(f"unknown shot {only}")
    clear_scene()
    configure_render()
    cam = build_stage()
    for shot in shots:
        render_shot(shot, frames, cam)
    ffmpeg = ffmpeg_bin()
    manifest_path = os.path.join(OUT_ROOT, "manifest.json")
    existing = {"frames": frames, "shots": {}}
    if os.path.isfile(manifest_path) and only:
        with open(manifest_path, encoding="utf-8") as handle:
            existing = json.load(handle)
    shot_map = existing.get("shots", {})
    for shot in shots:
        shot_map[shot["id"]] = convert_shot(shot["id"], frames, ffmpeg)
    os.makedirs(OUT_ROOT, exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump({"frames": frames, "shots": shot_map}, handle, indent=2)
        handle.write("\n")
    print("WROTE", manifest_path)


if __name__ == "__main__":
    main()
