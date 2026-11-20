"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";

const WaitlistPhones = dynamic(
  () => import("@/components/waitlist-phones").then((mod) => mod.WaitlistPhones),
  { ssr: false },
);

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
  if (progress < 0.28) return 0;
  if (progress < 0.7) return 1;
  if (progress < 0.84) return 2;
  return 3;
}

class WebglBoundary extends Component<
  { onFail: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function WaitlistStage() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const progressRef = useRef(0);
  const invalidateRef = useRef<() => void>(() => {});
  const [show3d, setShow3d] = useState(false);
  const shown = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      root.dataset.reduce = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setShow3d(true);
      },
      { rootMargin: "240px" },
    );
    observer.observe(root);

    let dead = false;
    let trigger: { kill: () => void } | null = null;

    const paintCopy = (progress: number) => {
      const index = momentIndex(progress);
      if (index === shown.current) return;
      shown.current = index;
      const moment = MOMENTS[index];
      if (eyeRef.current) eyeRef.current.textContent = moment.eyebrow;
      if (titleRef.current) titleRef.current.textContent = moment.title;
      if (bodyRef.current) bodyRef.current.textContent = moment.body;
    };

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
          invalidateRef.current();
        },
      });
      progressRef.current = 0;
      invalidateRef.current();
    })();

    return () => {
      dead = true;
      observer.disconnect();
      trigger?.kill();
    };
  }, []);

  return (
    <section ref={rootRef} className="waitlist-stage" aria-label="Dozen, opening soon">
      <div ref={pinRef} className="waitlist-pin">
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
        <div className="waitlist-canvas-slot" aria-hidden="true">
          <picture className="waitlist-poster">
            <source
              media="(max-width: 800px)"
              srcSet="/marketing/waitlist/stills/review-mobile.webp"
            />
            <img
              src="/marketing/waitlist/stills/review.webp"
              alt=""
              width={960}
              height={1200}
              fetchPriority="low"
              decoding="async"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </picture>
          {show3d ? (
            <WebglBoundary
              onFail={() => {
                if (rootRef.current) rootRef.current.dataset.flat = "true";
              }}
            >
              <WaitlistPhones
                progressRef={progressRef}
                invalidateRef={invalidateRef}
                onReady={() => {
                  if (rootRef.current) rootRef.current.dataset.ready = "true";
                  void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
                    ScrollTrigger.refresh();
                  });
                }}
              />
            </WebglBoundary>
          ) : null}
        </div>
      </div>
      <div className="waitlist-stills">
        {MOMENTS.map((moment) => (
          <figure key={moment.id} className="waitlist-still">
            {/* Static phone renders. next/image would re-encode these WebP stills. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/marketing/waitlist/stills/${moment.id}.webp`}
              alt=""
              width={960}
              height={1200}
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
