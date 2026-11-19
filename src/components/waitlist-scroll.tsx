"use client";

import { useGSAP } from "@gsap/react";
import NextImage from "next/image";
import { useRef } from "react";

const FRAME_COUNT = 48;

const SHOTS = [
  {
    id: "testers",
    eyebrow: "Testers",
    title: "Twelve people. One clear signal.",
    body: "A tester run with slots, check-ins, and dots. Not a group chat.",
  },
  {
    id: "request",
    eyebrow: "The post",
    title: "Put the build in front of them.",
    body: "Platform, questions, and what you want tried. One post, then you wait.",
  },
  {
    id: "review",
    eyebrow: "The review",
    title: "Answers you can actually use.",
    body: "Structured notes instead of a pile of screenshots.",
  },
  {
    id: "feedback",
    eyebrow: "The board",
    title: "See what they found.",
    body: "Bugs, praise, and the questions you asked, in one place.",
  },
] as const;

type ShotId = (typeof SHOTS)[number]["id"];

function pad(index: number) {
  return String(index).padStart(3, "0");
}

function desktopFrame(id: ShotId, index: number) {
  return `/marketing/phones/desktop/${id}/${pad(index)}.webp`;
}

function mobileFrames(id: ShotId) {
  const frames: string[] = [];
  for (let index = 0; index < FRAME_COUNT; index += 3) {
    frames.push(`/marketing/phones/mobile/${id}/${pad(index)}.webp`);
  }
  const last = FRAME_COUNT - 1;
  if ((last % 3) !== 0) frames.push(`/marketing/phones/mobile/${id}/${pad(last)}.webp`);
  return frames;
}

function desktopFrames(id: ShotId) {
  return Array.from({ length: FRAME_COUNT }, (_, index) => desktopFrame(id, index));
}

const cache = new Map<string, HTMLImageElement>();

function warm(src: string, onReady?: () => void) {
  let image = cache.get(src);
  if (!image) {
    image = new window.Image();
    image.decoding = "async";
    image.src = src;
    cache.set(src, image);
  }
  if (image.complete && image.naturalWidth > 0) onReady?.();
  else if (onReady) image.addEventListener("load", () => onReady(), { once: true });
}

export function WaitlistScroll() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const copyRefs = useRef<Array<HTMLDivElement | null>>([]);
  const drawn = useRef("");

  useGSAP(
    () => {
      const root = rootRef.current;
      const pin = pinRef.current;
      const canvas = canvasRef.current;
      if (!root || !pin || !canvas) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        root.dataset.reduce = "true";
        return;
      }

      const small = window.matchMedia("(max-width: 760px)").matches;
      const sequences = SHOTS.map((shot) =>
        small ? mobileFrames(shot.id) : desktopFrames(shot.id),
      );
      sequences[0].slice(0, 8).forEach((src) => warm(src));

      const context = canvas.getContext("2d");
      if (!context) return;

      const paint = (src: string) => {
        const image = cache.get(src);
        if (!image || !image.complete || image.naturalWidth === 0) return false;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (width < 2 || height < 2) return false;
        const pixelWidth = Math.floor(width * dpr);
        const pixelHeight = Math.floor(height * dpr);
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
          canvas.width = pixelWidth;
          canvas.height = pixelHeight;
        }
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, height);
        const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = image.naturalWidth * scale;
        const drawHeight = image.naturalHeight * scale;
        context.drawImage(
          image,
          (width - drawWidth) / 2,
          (height - drawHeight) / 2,
          drawWidth,
          drawHeight,
        );
        if (posterRef.current) posterRef.current.style.opacity = "0";
        drawn.current = src;
        return true;
      };

      const showCopy = (index: number) => {
        copyRefs.current.forEach((node, nodeIndex) => {
          if (!node) return;
          const active = nodeIndex === index;
          node.style.opacity = active ? "1" : "0";
          node.setAttribute("aria-hidden", active ? "false" : "true");
        });
      };

      let cancelled = false;
      let trigger: { kill: () => void } | null = null;

      void (async () => {
        const gsap = (await import("gsap")).default;
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);

        let wanted = "";
      const renderProgress = (progress: number) => {
          const scaled = Math.min(0.9999, Math.max(0, progress)) * SHOTS.length;
          const shot = Math.min(SHOTS.length - 1, Math.floor(scaled));
          const frames = sequences[shot];
          const local = scaled - shot;
          const frame = Math.min(frames.length - 1, Math.floor(local * frames.length));
          const around = frames.slice(Math.max(0, frame - 2), frame + 6);
          around.forEach((src) => warm(src));
          if (shot + 1 < sequences.length) warm(sequences[shot + 1][0]);
          const src = frames[frame];
          wanted = src;
          const drawWanted = () => {
            if (wanted !== src) return;
            if (!paint(src) && drawn.current) paint(drawn.current);
          };
          warm(src, drawWanted);
          showCopy(shot);
        };

        trigger = ScrollTrigger.create({
          trigger: root,
          start: "top top",
          end: "+=320%",
          pin,
          pinType: "transform",
          scrub: 0.4,
          anticipatePin: 1,
          onUpdate: (self) => renderProgress(self.progress),
        });
        renderProgress(0);
      })();

      return () => {
        cancelled = true;
        trigger?.kill();
      };
    },
    { scope: rootRef },
  );

  const poster = desktopFrame("testers", 0);

  return (
    <section ref={rootRef} className="waitlist-story" aria-label="Dozen, opening soon">
      <div ref={pinRef} className="waitlist-pin">
        <div className="waitlist-copy">
          {SHOTS.map((shot, index) => (
            <div
              key={shot.id}
              ref={(node) => {
                copyRefs.current[index] = node;
              }}
              className="waitlist-copy-card"
              style={{ opacity: index === 0 ? 1 : 0 }}
              aria-hidden={index === 0 ? "false" : "true"}
            >
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-blue">
                {shot.eyebrow}
              </p>
              {index === 0 ? (
                <h1 className="hero-title mt-3">{shot.title}</h1>
              ) : (
                <p className="hero-title mt-3">{shot.title}</p>
              )}
              <p className="hero-lead mt-4">{shot.body}</p>
              <p className="mt-6 font-mono text-[13px] text-ink/55">Opening soon</p>
            </div>
          ))}
        </div>
        <div className="waitlist-stage">
          <NextImage
            ref={posterRef}
            src={poster}
            alt=""
            width={720}
            height={960}
            priority
            className="waitlist-poster"
          />
          <canvas ref={canvasRef} className="waitlist-canvas" />
        </div>
      </div>
      <div className="waitlist-static">
        {SHOTS.map((shot) => (
          <figure key={shot.id} className="waitlist-static-shot">
            <NextImage
              src={desktopFrame(shot.id, 0)}
              alt=""
              width={720}
              height={960}
              loading={shot.id === "testers" ? "eager" : "lazy"}
            />
            <figcaption>
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-blue">
                {shot.eyebrow}
              </p>
              <p className="mt-2 font-display text-[28px] font-semibold">{shot.title}</p>
              <p className="mt-2 text-ink/70">{shot.body}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
