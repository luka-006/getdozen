import * as THREE from "three";

/**
 * Procedural flagship phone. No imported GLB.
 * Black-titanium frame, glossy black back, raised camera island
 * with three lenses and a flash. Screen faces +Z; the camera faces -Z.
 */

const SCREEN_ASPECT = 390 / 844;
const SCREEN_W = 1.09;
const SCREEN_H = SCREEN_W / SCREEN_ASPECT;
const BODY_W = SCREEN_W + 0.092;
const BODY_H = SCREEN_H + 0.092;
const BODY_D = 0.112;
const BODY_R = 0.2;

type SharedGeo = {
  body: THREE.ExtrudeGeometry;
  face: THREE.ShapeGeometry;
  screen: THREE.ShapeGeometry;
  back: THREE.ExtrudeGeometry;
  island: THREE.ExtrudeGeometry;
  lensRing: THREE.CylinderGeometry;
  lensGlass: THREE.CylinderGeometry;
  lensPupil: THREE.CylinderGeometry;
  flash: THREE.CylinderGeometry;
  mic: THREE.CylinderGeometry;
  button: THREE.BoxGeometry;
  buttonSmall: THREE.BoxGeometry;
  port: THREE.BoxGeometry;
  roughness: THREE.CanvasTexture;
};

let shared: SharedGeo | null = null;

function roundedRect(width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.absarc(x + width - r, y + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x + width, y + height - r);
  shape.absarc(x + width - r, y + height - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x + r, y + height);
  shape.absarc(x + r, y + height - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

function normalizeShapeUvs(geometry: THREE.BufferGeometry) {
  const uv = geometry.getAttribute("uv");
  if (!uv) return;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;
  const width = box.max.x - box.min.x || 1;
  const height = box.max.y - box.min.y || 1;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, (uv.getX(i) - box.min.x) / width, (uv.getY(i) - box.min.y) / height);
  }
  uv.needsUpdate = true;
}

function roughnessTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const image = ctx.createImageData(128, 128);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = 168 + Math.random() * 70;
    image.data[i] = n;
    image.data[i + 1] = n;
    image.data[i + 2] = n;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.2, 4.2);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function extrude(shape: THREE.Shape, depth: number, bevel: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.85,
    bevelOffset: -bevel * 0.35,
    bevelSegments: bevel > 0 ? 3 : 0,
    curveSegments: 10,
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function getShared(): SharedGeo {
  if (shared) return shared;
  const lens = (radius: number, height: number) =>
    new THREE.CylinderGeometry(radius, radius, height, 96);

  shared = {
    body: extrude(roundedRect(BODY_W, BODY_H, BODY_R), BODY_D, 0.014),
    face: new THREE.ShapeGeometry(roundedRect(BODY_W - 0.018, BODY_H - 0.018, BODY_R - 0.01), 10),
    screen: new THREE.ShapeGeometry(roundedRect(SCREEN_W, SCREEN_H, 0.145), 10),
    back: extrude(roundedRect(BODY_W - 0.055, BODY_H - 0.055, BODY_R - 0.02), 0.02, 0.004),
    island: extrude(roundedRect(0.5, 0.5, 0.12), 0.04, 0.006),
    lensRing: lens(0.074, 0.016),
    lensGlass: lens(0.058, 0.012),
    lensPupil: lens(0.028, 0.008),
    flash: lens(0.026, 0.012),
    mic: lens(0.012, 0.008),
    button: new THREE.BoxGeometry(0.02, 0.16, 0.04),
    buttonSmall: new THREE.BoxGeometry(0.02, 0.07, 0.036),
    port: new THREE.BoxGeometry(0.09, 0.012, 0.02),
    roughness: roughnessTexture(),
  };
  normalizeShapeUvs(shared.face);
  normalizeShapeUvs(shared.screen);
  return shared;
}

function metal(color: string, roughness: number, intensity = 1) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.94,
    roughness,
    roughnessMap: getShared().roughness,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
    envMapIntensity: intensity,
  });
}

function lensGlint() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const gradient = ctx.createRadialGradient(48, 42, 2, 64, 64, 58);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.22, "rgba(186,208,255,0.28)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addLens(parent: THREE.Group, x: number, y: number, geo: SharedGeo) {
  const group = new THREE.Group();
  group.position.set(x, y, -0.03);
  group.rotation.x = Math.PI / 2;

  const ring = new THREE.Mesh(
    geo.lensRing,
    new THREE.MeshPhysicalMaterial({
      color: "#d5d6db",
      metalness: 1,
      roughness: 0.16,
      envMapIntensity: 1.3,
    }),
  );
  const glass = new THREE.Mesh(
    geo.lensGlass,
    new THREE.MeshPhysicalMaterial({
      color: "#071018",
      metalness: 0.2,
      roughness: 0.03,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 2.1,
    }),
  );
  glass.position.y = -0.004;
  const highlight = new THREE.Mesh(
    new THREE.CircleGeometry(0.05, 48),
    new THREE.MeshBasicMaterial({
      map: lensGlint(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  highlight.rotation.x = Math.PI / 2;
  highlight.position.y = -0.012;
  const pupil = new THREE.Mesh(
    geo.lensPupil,
    new THREE.MeshPhysicalMaterial({
      color: "#010204",
      metalness: 0.4,
      roughness: 0.08,
      envMapIntensity: 1.4,
    }),
  );
  pupil.position.y = -0.008;
  group.add(ring, glass, pupil, highlight);
  parent.add(group);
  return group;
}

export function createFlagshipPhone(screen: THREE.Texture) {
  const geo = getShared();
  const phone = new THREE.Group();
  phone.name = "flagship-phone";

  geo.body.computeBoundingBox();
  const frontZ = geo.body.boundingBox?.max.z ?? BODY_D / 2;

  const body = new THREE.Mesh(geo.body, metal("#1a1c20", 0.34, 1.15));
  phone.add(body);

  const face = new THREE.Mesh(
    geo.face,
    new THREE.MeshStandardMaterial({
      color: "#050506",
      metalness: 0.35,
      roughness: 0.5,
      envMapIntensity: 0.45,
    }),
  );
  face.position.z = frontZ + 0.003;
  phone.add(face);

  const display = new THREE.Mesh(
    geo.screen,
    new THREE.MeshBasicMaterial({ map: screen, toneMapped: false }),
  );
  display.name = "screen";
  display.position.z = frontZ + 0.008;
  phone.add(display);

  const glass = new THREE.Mesh(
    geo.screen,
    new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      metalness: 0.05,
      roughness: 0.05,
      transparent: true,
      opacity: 0.07,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.6,
      depthWrite: false,
    }),
  );
  glass.position.z = frontZ + 0.012;
  phone.add(glass);

  const back = new THREE.Mesh(
    geo.back,
    new THREE.MeshPhysicalMaterial({
      color: "#0b0c10",
      metalness: 0.62,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.25,
    }),
  );
  back.position.z = -BODY_D / 2 - 0.006;
  phone.add(back);

  const island = new THREE.Group();
  island.position.set(-BODY_W * 0.22, BODY_H * 0.3, -BODY_D / 2 - 0.028);
  const islandBody = new THREE.Mesh(geo.island, metal("#2a2c31", 0.28, 1.2));
  island.add(islandBody);

  const spread = 0.108;
  addLens(island, -spread, spread, geo);
  const heroLens = addLens(island, spread, spread, geo);
  addLens(island, -spread, -spread, geo);

  const anchor = new THREE.Object3D();
  anchor.name = "lens-anchor";
  anchor.position.copy(heroLens.position);
  island.add(anchor);

  const flash = new THREE.Mesh(
    geo.flash,
    new THREE.MeshStandardMaterial({
      color: "#fff6dc",
      emissive: "#ffe3a3",
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0,
    }),
  );
  flash.rotation.x = Math.PI / 2;
  flash.position.set(spread, -spread + 0.01, -0.028);
  island.add(flash);

  const mic = new THREE.Mesh(
    geo.mic,
    new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.6, metalness: 0.2 }),
  );
  mic.rotation.x = Math.PI / 2;
  mic.position.set(spread, -spread - 0.075, -0.026);
  island.add(mic);

  phone.add(island);

  const rail = metal("#3a3c42", 0.3, 1.15);
  const buttons: Array<[THREE.BufferGeometry, number, number]> = [
    [geo.buttonSmall, -BODY_W / 2 - 0.006, 0.62],
    [geo.button, -BODY_W / 2 - 0.006, 0.28],
    [geo.button, -BODY_W / 2 - 0.006, 0.08],
    [geo.button, BODY_W / 2 + 0.006, 0.34],
  ];
  for (const [geometry, x, y] of buttons) {
    const mesh = new THREE.Mesh(geometry, rail);
    mesh.position.set(x, y, 0);
    phone.add(mesh);
  }

  const port = new THREE.Mesh(
    geo.port,
    new THREE.MeshStandardMaterial({ color: "#07080a", roughness: 0.45, metalness: 0.3 }),
  );
  port.position.set(0, -BODY_H / 2 + 0.004, 0);
  phone.add(port);

  return phone;
}

export function disposeFlagshipPhone(phone: THREE.Object3D) {
  const seen = new Set<THREE.Material>();
  phone.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of materials) {
      if (seen.has(material)) continue;
      seen.add(material);
      material.dispose();
    }
  });
}
