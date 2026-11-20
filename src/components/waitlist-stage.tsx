"use client";

import { useEffect, useRef } from "react";

const FRAME_COUNT = 16;

const MOMENTS = [
  {
    id: "review",
    eyebrow: "The review",
    title: "Answers you can actually use.",
    body: "Structured notes instead of a pile of screenshots.",
  },
  {
    id: "testers",
    eyebrow: "Testers",
    title: "Twelve people. One clear signal.",
    body: "A tester run with slots, check-ins, and dots. Not a group chat.",
  },
  {
    id: "wallet",
    eyebrow: "Dot economy",
    title: "Quality pays",
    body: "Thoughtful reviews earn Dots.",
  },
  {
    id: "referral",
    eyebrow: "Opening soon",
    title: "Get in at launch",
    body: "Enter your email. We will write at launch.",
  },
] as const;

function momentIndex(progress: number) {
  if (progress < 0.58) return 0;
  if (progress < 0.82) return 1;
  if (progress < 0.94) return 2;
  return 3;
}

function aspectOf(width: number) {
  return width < 800 ? "mobile" : "desktop";
}

function frameSrc(aspect: string, index: number) {
  return `/marketing/waitlist/frames/${aspect}/${String(index).padStart(2, "0")}.webp`;
}

export function WaitlistStage() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLImageElement>(null);
  const mobileRef = useRef<HTMLImageElement>(null);
  const eyeRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const shown = useRef(0);
  const progressRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    const desktop = desktopRef.current;
    const mobile = mobileRef.current;
    if (!root || !desktop || !mobile) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      root.dataset.reduce = "true";
      return;
    }

    let dead = false;
    let trigger: { kill: () => void } | null = null;
    let aspect = aspectOf(window.innerWidth);
    let shownFrame = -1;
    const ready = new Set<string>();

    const paintCopy = (progress: number) => {
      const index = momentIndex(progress);
      if (index === shown.current) return;
      shown.current = index;
      const moment = MOMENTS[index];
      if (eyeRef.current) eyeRef.current.textContent = moment.eyebrow;
      if (titleRef.current) titleRef.current.textContent = moment.title;
      if (bodyRef.current) bodyRef.current.textContent = moment.body;
    };

    const paintFrame = (progress: number) => {
      const index = Math.round(Math.min(1, Math.max(0, progress)) * (FRAME_COUNT - 1));
      aspect = aspectOf(window.innerWidth);
      if (index === shownFrame) return;
      shownFrame = index;
      const desktopSrc = frameSrc("desktop", index);
      const mobileSrc = frameSrc("mobile", index);
      if (desktop.getAttribute("src") !== desktopSrc) desktop.src = desktopSrc;
      if (mobile.getAttribute("src") !== mobileSrc) mobile.src = mobileSrc;
    };

    const preload = () => {
      const next = aspectOf(window.innerWidth);
      for (let index = 0; index < FRAME_COUNT; index += 1) {
        const src = frameSrc(next, index);
        if (ready.has(src)) continue;
        const image = new Image();
        image.decoding = "async";
        image.src = src;
        ready.add(src);
      }
    };

    const markReady = () => {
      root.dataset.ready = "true";
    };
    const visible = aspectOf(window.innerWidth) === "mobile" ? mobile : desktop;
    desktop.addEventListener("load", markReady);
    mobile.addEventListener("load", markReady);
    if (visible.complete && visible.naturalWidth > 0) markReady();
    preload();
    paintFrame(0);

    void (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (dead || !pinRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      trigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "+=240%",
        pin: pinRef.current,
        pinType: "transform",
        scrub: 0.45,
        anticipatePin: 1,
        onUpdate: (self) => {
          progressRef.current = self.progress;
          paintCopy(self.progress);
          paintFrame(self.progress);
        },
      });
    })();

    const onResize = () => {
      const next = aspectOf(window.innerWidth);
      if (next === aspect) return;
      aspect = next;
      shownFrame = -1;
      preload();
      paintFrame(progressRef.current);
    };
    window.addEventListener("resize", onResize);

    return () => {
      dead = true;
      desktop.removeEventListener("load", markReady);
      mobile.removeEventListener("load", markReady);
      window.removeEventListener("resize", onResize);
      trigger?.kill();
    };
  }, []);

  return (
    <section ref={rootRef} className="waitlist-stage" aria-label="Dozen, opening soon">
      <div ref={pinRef} className="waitlist-pin">
        {/* Two frames so a matching <source> cannot pin the poster and ignore scroll. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={desktopRef}
          className="waitlist-frame waitlist-frame-desktop"
          src={frameSrc("desktop", 0)}
          alt=""
          width={1440}
          height={900}
          fetchPriority="high"
          decoding="async"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={mobileRef}
          className="waitlist-frame waitlist-frame-mobile"
          src={frameSrc("mobile", 0)}
          alt=""
          width={780}
          height={1688}
          fetchPriority="high"
          decoding="async"
        />
        <div className="waitlist-copy">
          <p
            ref={eyeRef}
            className="font-mono text-[12px] uppercase tracking-[0.14em] text-blue"
          >
            {MOMENTS[0].eyebrow}
          </p>
          <h1 ref={titleRef} className="hero-title mt-3">
            {MOMENTS[0].title}
          </h1>
          <p ref={bodyRef} className="hero-lead mt-4">
            {MOMENTS[0].body}
          </p>
          <a href="#waitlist" className="btn btn-primary mt-6">
            Join waitlist
          </a>
        </div>
      </div>
      <div className="waitlist-stills">
        {MOMENTS.map((moment) => (
          <figure key={moment.id} className="waitlist-still">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/marketing/waitlist/stills/${moment.id}.webp`}
              alt=""
              width={960}
              height={600}
              loading={moment.id === "review" ? "eager" : "lazy"}
            />
            <figcaption>
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-blue">
                {moment.eyebrow}
              </p>
              <p className="mt-2 font-display text-[28px] font-semibold">{moment.title}</p>
              <p className="mt-2 text-ink/70">{moment.body}</p>
            </figcaption>
          </figure>
        ))}
        <a href="#waitlist" className="btn btn-primary">
          Join waitlist
        </a>
      </div>
    </section>
  );
}
