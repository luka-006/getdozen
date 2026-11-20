"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createFlagshipPhone, disposeFlagshipPhone } from "@/components/waitlist-phone-model";

const SCREENS = [
  "/marketing/waitlist/screens/review.webp",
  "/marketing/waitlist/screens/testers.webp",
  "/marketing/waitlist/screens/wallet.webp",
  "/marketing/waitlist/screens/referral.webp",
] as const;

type Vec3 = [number, number, number];
type Pose = { p: Vec3; r: Vec3; s: number };
type Shot = {
  t: number;
  cam: Vec3;
  look: Vec3;
  lens: number;
  mix: number;
  phones: [Pose, Pose, Pose, Pose];
};

const hidden = (p: Vec3, r: Vec3): Pose => ({ p, r, s: 0 });

const KEYS: Shot[] = [
  {
    t: 0,
    cam: [1.15, 0.28, 6.15],
    look: [0.04, 0.02, 0],
    lens: 0,
    mix: 0,
    phones: [
      { p: [0.05, 0.08, 0], r: [0.18, 0.82, -0.06], s: 1 },
      { p: [-1.48, 0.22, -1.6], r: [0.2, 2.78, 0.14], s: 0.66 },
      hidden([1.7, 0.15, -1.1], [0.1, 2.9, 0]),
      hidden([0.2, -0.05, 0.2], [0.12, 0.5, 0]),
    ],
  },
  {
    t: 0.16,
    cam: [0.52, 0.18, 4.7],
    look: [0, 0.06, 0],
    lens: 0,
    mix: 0,
    phones: [
      { p: [0.02, 0.02, 0.08], r: [0.1, 1.08, -0.02], s: 1 },
      { p: [-1.05, 0.12, -1.15], r: [0.14, 2.98, 0.06], s: 0.74 },
      hidden([1.7, 0.15, -1.1], [0.1, 2.9, 0]),
      hidden([0.2, -0.05, 0.2], [0.12, 0.5, 0]),
    ],
  },
  {
    t: 0.3,
    cam: [0.18, 0.46, 3.25],
    look: [0, 0.38, 0],
    lens: 1,
    mix: 0.35,
    phones: [
      { p: [0, 0.05, 0], r: [0.05, 2.98, 0.02], s: 1 },
      { p: [-1.7, -0.05, -1.5], r: [0.12, 2.55, 0.1], s: 0.32 },
      hidden([1.5, 0.1, -1.2], [0.1, 2.9, 0]),
      hidden([0.15, 0, -0.2], [0.1, 0.4, 0]),
    ],
  },
  {
    t: 0.42,
    cam: [0, 0.72, 2.1],
    look: [0, 0.7, 0],
    lens: 1,
    mix: 1,
    phones: [
      { p: [0, 0.08, 0], r: [0.02, Math.PI, 0], s: 1 },
      { p: [0.12, 0, -0.45], r: [0.1, 0.15, 0], s: 0.88 },
      hidden([1.4, 0.1, -1.3], [0.1, 2.8, 0]),
      hidden([0.1, 0, -0.3], [0.1, 0.4, 0]),
    ],
  },
  {
    t: 0.52,
    cam: [0.55, 0.24, 3.85],
    look: [0.08, 0.06, 0],
    lens: 1,
    mix: 0.18,
    phones: [
      { p: [-0.9, 0.06, -0.6], r: [0.12, 2.4, 0.12], s: 0.7 },
      { p: [0.22, -0.02, 0.12], r: [0.12, -0.32, 0.03], s: 1 },
      hidden([1.35, 0.12, -1], [0.12, 2.85, -0.06]),
      hidden([0.1, 0, 0], [0.1, 0.45, 0]),
    ],
  },
  {
    t: 0.64,
    cam: [0.82, 0.16, 4.95],
    look: [0.04, 0, 0],
    lens: 0,
    mix: 0,
    phones: [
      { p: [-1.55, 0.18, -1.5], r: [0.16, 2.68, 0.1], s: 0.58 },
      { p: [0.08, -0.05, 0], r: [0.14, -0.72, 0.04], s: 1 },
      hidden([2.4, 0.12, -1.4], [0.14, 2.85, -0.08]),
      hidden([0.15, -0.02, 0.1], [0.12, 0.5, 0]),
    ],
  },
  {
    t: 0.76,
    cam: [0.28, 0.18, 4.55],
    look: [0, 0.04, 0],
    lens: 0,
    mix: 0,
    phones: [
      hidden([-2.1, 0.2, -1.8], [0.1, 2.6, 0.1]),
      { p: [-1.15, 0.08, -0.7], r: [0.12, 1.7, 0.08], s: 0.62 },
      { p: [0.12, -0.03, 0.08], r: [0.13, 0.58, -0.03], s: 1 },
      hidden([2.3, 0.05, -1.2], [0.12, -0.4, 0.04]),
    ],
  },
  {
    t: 0.88,
    cam: [0, 0.7, 2.15],
    look: [0, 0.68, 0],
    lens: 3,
    mix: 1,
    phones: [
      hidden([-2, 0.2, -1.6], [0.1, 2.5, 0]),
      hidden([-1.6, 0.1, -1.4], [0.12, 2.7, 0.1]),
      { p: [0, 0.06, 0], r: [0.02, Math.PI, 0], s: 1 },
      { p: [0.12, 0, -0.4], r: [0.1, 0.35, 0], s: 0.9 },
    ],
  },
  {
    t: 1,
    cam: [0.72, 0.12, 5.05],
    look: [0, 0, 0],
    lens: 0,
    mix: 0,
    phones: [
      hidden([-2.2, 0.15, -1.7], [0.1, 2.4, 0]),
      hidden([-1.9, 0.1, -1.5], [0.1, 2.6, 0]),
      { p: [-1.28, 0.16, -1.15], r: [0.18, 2.82, 0.12], s: 0.66 },
      { p: [0.08, -0.05, 0.06], r: [0.13, 0.6, -0.03], s: 1 },
    ],
  },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number) {
  let delta = b - a;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return a + delta * t;
}

function ease(t: number) {
  return t * t * (3 - 2 * t);
}

function sample(t: number): Shot {
  const clamped = Math.min(1, Math.max(0, t));
  let index = 0;
  while (index < KEYS.length - 2 && KEYS[index + 1].t < clamped) index += 1;
  const from = KEYS[index];
  const to = KEYS[Math.min(KEYS.length - 1, index + 1)];
  const span = Math.max(0.0001, to.t - from.t);
  const u = ease(Math.min(1, Math.max(0, (clamped - from.t) / span)));
  return {
    t: clamped,
    cam: [
      lerp(from.cam[0], to.cam[0], u),
      lerp(from.cam[1], to.cam[1], u),
      lerp(from.cam[2], to.cam[2], u),
    ],
    look: [
      lerp(from.look[0], to.look[0], u),
      lerp(from.look[1], to.look[1], u),
      lerp(from.look[2], to.look[2], u),
    ],
    lens: u < 0.5 ? from.lens : to.lens,
    mix: lerp(from.mix, to.mix, u),
    phones: [0, 1, 2, 3].map((phone) => ({
      p: [
        lerp(from.phones[phone].p[0], to.phones[phone].p[0], u),
        lerp(from.phones[phone].p[1], to.phones[phone].p[1], u),
        lerp(from.phones[phone].p[2], to.phones[phone].p[2], u),
      ] as Vec3,
      r: [
        lerpAngle(from.phones[phone].r[0], to.phones[phone].r[0], u),
        lerpAngle(from.phones[phone].r[1], to.phones[phone].r[1], u),
        lerpAngle(from.phones[phone].r[2], to.phones[phone].r[2], u),
      ] as Vec3,
      s: lerp(from.phones[phone].s, to.phones[phone].s, u),
    })) as Shot["phones"],
  };
}

function shadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const gradient = ctx.createRadialGradient(128, 128, 16, 128, 128, 122);
  gradient.addColorStop(0, "rgba(11,31,58,0.5)");
  gradient.addColorStop(0.5, "rgba(11,31,58,0.16)");
  gradient.addColorStop(1, "rgba(11,31,58,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const room = new THREE.Scene();
  const panel = (width: number, height: number, color: string, position: Vec3) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color }),
    );
    mesh.position.set(position[0], position[1], position[2]);
    mesh.lookAt(0, 0.4, 0);
    room.add(mesh);
  };
  panel(12, 7, "#ffffff", [0, 4.2, -8]);
  panel(7, 9, "#f7f9fc", [-8, 1, 1]);
  panel(4.5, 8, "#1e4fd8", [7.5, 0.4, -1]);
  panel(5, 3, "#ffc53d", [1.5, 6.2, 4]);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(16, 32),
    new THREE.MeshBasicMaterial({ color: "#e7eef8" }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4;
  room.add(floor);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(room, 0.04);
  pmrem.dispose();
  room.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.geometry.dispose();
    if (!Array.isArray(obj.material)) obj.material.dispose();
  });
  return target.texture;
}

function mountPhones(
  canvas: HTMLCanvasElement,
  progressRef: { current: number },
  onReady: () => void,
) {
  const maxDpr = window.innerWidth < 800 ? 1.25 : 1.5;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 1.15;
  scene.add(new THREE.AmbientLight(0xffffff, 0.28));
  const key = new THREE.DirectionalLight(0xfff8f3, 1.7);
  key.position.set(4.5, 6.2, 5);
  const rim = new THREE.DirectionalLight(0xd7e4ff, 1.05);
  rim.position.set(-6, 2.4, -2);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(0.5, -1.5, 4);
  scene.add(key, rim, fill);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.04, 30);
  const lensWorld = new THREE.Vector3();
  const lensNormal = new THREE.Vector3();
  const lensPos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const cam = new THREE.Vector3();
  let phones: THREE.Group[] = [];
  let shadows: THREE.Mesh[] = [];
  let shadowMap: THREE.Texture | null = null;
  let textures: THREE.Texture[] = [];
  let disposed = false;
  let ready = false;
  let scheduled = false;
  let lastW = 0;
  let lastH = 0;
  let lastDpr = 0;

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width < 2 || height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    if (width === lastW && height === lastH && dpr === lastDpr) return;
    lastW = width;
    lastH = height;
    lastDpr = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const render = () => {
    if (disposed || phones.length === 0) return;
    resize();
    const shot = sample(progressRef.current);
    phones.forEach((phone, index) => {
      const pose = shot.phones[index];
      phone.position.set(pose.p[0], pose.p[1], pose.p[2]);
      phone.rotation.set(pose.r[0], pose.r[1], pose.r[2]);
      phone.scale.setScalar(Math.max(0.0001, pose.s));
      phone.visible = pose.s > 0.04;
      const shadow = shadows[index];
      if (!shadow) return;
      shadow.position.set(pose.p[0], -1.34, pose.p[2] + 0.12);
      shadow.scale.set(1.05 * pose.s, 1, 0.42 * Math.max(pose.s, 0.001));
      shadow.visible = pose.s > 0.04;
      if (!Array.isArray(shadow.material)) {
        shadow.material.opacity = Math.min(0.95, pose.s) * 0.9;
      }
    });

    look.set(shot.look[0], shot.look[1], shot.look[2]);
    cam.set(shot.cam[0], shot.cam[1], shot.cam[2]);
    const aspect = camera.aspect;
    const squeeze = canvas.clientHeight < 520 ? 1.18 : aspect < 0.92 ? 1.08 : 1;
    cam.sub(look).multiplyScalar(squeeze).add(look);

    if (shot.mix > 0.001 && shot.lens > 0) {
      const phone = phones[shot.lens - 1];
      const anchor = phone?.getObjectByName("lens-anchor");
      if (phone && anchor && phone.visible) {
        phone.updateWorldMatrix(true, true);
        anchor.getWorldPosition(lensWorld);
        lensNormal.set(0, 0, -1).applyQuaternion(phone.quaternion).normalize();
        lensPos.copy(lensWorld).addScaledVector(lensNormal, lerp(1.05, 0.46, shot.mix));
        const blend = shot.mix * shot.mix * (3 - 2 * shot.mix);
        cam.lerp(lensPos, blend);
        look.lerp(lensWorld, blend);
      }
    }

    camera.position.copy(cam);
    camera.lookAt(look);
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      onReady();
    }
  };

  const loader = new THREE.TextureLoader();
  void Promise.all(SCREENS.map((url) => loader.loadAsync(url))).then((loaded) => {
    if (disposed) {
      loaded.forEach((texture) => texture.dispose());
      return;
    }
    textures = loaded;
    shadowMap = shadowTexture();
    phones = loaded.map((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      return createFlagshipPhone(texture);
    });
    shadows = phones.map(() => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 2.4),
        new THREE.MeshBasicMaterial({
          map: shadowMap,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = -1;
      return mesh;
    });
    phones.forEach((phone) => scene.add(phone));
    shadows.forEach((shadow) => scene.add(shadow));
    render();
  });

  const requestRender = () => {
    if (disposed || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      render();
    });
  };

  const onResize = () => requestRender();
  window.addEventListener("resize", onResize);

  return {
    render: requestRender,
    dispose() {
      disposed = true;
      window.removeEventListener("resize", onResize);
      phones.forEach((phone) => {
        scene.remove(phone);
        disposeFlagshipPhone(phone);
      });
      shadows.forEach((shadow) => {
        scene.remove(shadow);
        shadow.geometry.dispose();
        if (!Array.isArray(shadow.material)) shadow.material.dispose();
      });
      shadowMap?.dispose();
      textures.forEach((texture) => texture.dispose());
      scene.environment?.dispose();
      renderer.dispose();
    },
  };
}

export function WaitlistPhones({
  progressRef,
  invalidateRef,
  onReady,
}: {
  progressRef: { current: number };
  invalidateRef: { current: () => void };
  onReady: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = mountPhones(canvas, progressRef, () => onReadyRef.current());
    invalidateRef.current = scene.render;
    const observer = new ResizeObserver(() => scene.render());
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      invalidateRef.current = () => {};
      scene.dispose();
    };
  }, [invalidateRef, progressRef]);

  return <canvas ref={canvasRef} />;
}
