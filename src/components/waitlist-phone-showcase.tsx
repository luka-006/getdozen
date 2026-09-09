"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDES = [
  {
    src: "/marketing/waitlist/board-feedback.png",
    eyebrow: "Feedback board",
    title: "Browse open requests",
    description: "Apps and games from indie makers — pick one and leave structured feedback.",
  },
  {
    src: "/marketing/waitlist/board-testers.png",
    eyebrow: "Tester runs",
    title: "Join a 14-day test",
    description: "Opt in, check in every few days, and help shape the product as it ships.",
  },
  {
    src: "/marketing/waitlist/request-detail.png",
    eyebrow: "Progress",
    title: "Track day by day",
    description: "Makers see tester check-ins, ratings, and how the run is filling up.",
  },
  {
    src: "/marketing/waitlist/review-form.png",
    eyebrow: "Reviews",
    title: "Earn Dots for quality",
    description: "Thoughtful answers beat one-liners — the loop rewards people who show up.",
  },
] as const;

const INTERVAL_MS = 3800;

export function WaitlistPhoneShowcase() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const t = window.setInterval(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      INTERVAL_MS,
    );
    return () => window.clearInterval(t);
  }, [reduceMotion]);

  const slide = SLIDES[index]!;

  return (
    <div className="waitlist-phone-showcase" aria-live="polite">
      <div className="waitlist-phone-glow" aria-hidden />
      <div className="waitlist-phone-stage">
        <div
          className={`waitlist-phone-device${reduceMotion ? " waitlist-phone-device-static" : ""}`}
        >
          <div className="waitlist-phone-shell">
            <div className="waitlist-phone-notch" aria-hidden />
            <div className="waitlist-phone-screen">
              {SLIDES.map((s, i) => (
                <div
                  key={s.src}
                  className={`waitlist-phone-slide${
                    i === index ? " waitlist-phone-slide-active" : ""
                  }`}
                  aria-hidden={i !== index}
                >
                  <Image
                    src={s.src}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 260px, 290px"
                    className="waitlist-phone-shot"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
            <div className="waitlist-phone-shine" aria-hidden />
          </div>
          <div className="waitlist-phone-shadow" aria-hidden />
        </div>
      </div>

      <div className="waitlist-phone-copy" key={slide.eyebrow}>
        <p className="waitlist-phone-eyebrow">{slide.eyebrow}</p>
        <p className="waitlist-phone-title">{slide.title}</p>
        <p className="waitlist-phone-desc">{slide.description}</p>
      </div>

      <div className="waitlist-phone-dots" role="tablist" aria-label="Preview screens">
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={s.title}
            className={`waitlist-phone-dot${i === index ? " waitlist-phone-dot-active" : ""}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
