"use client";

import Image from "next/image";

type PhoneCard = {
  src: string;
  slot: "hero" | "tl" | "tr" | "bl" | "br";
  eyebrow: string;
  title: string;
  description: string;
};

const PHONES: PhoneCard[] = [
  {
    src: "/marketing/waitlist/board-testers.png",
    slot: "hero",
    eyebrow: "Test",
    title: "14-day runs",
    description: "Opt in once, check in every few days.",
  },
  {
    src: "/marketing/waitlist/board-feedback.png",
    slot: "tl",
    eyebrow: "Feedback",
    title: "Browse requests",
    description: "Pick an app or game and leave structured feedback.",
  },
  {
    src: "/marketing/waitlist/request-detail.png",
    slot: "tr",
    eyebrow: "Progress",
    title: "Track the run",
    description: "Check-ins, ratings, and tester slots live.",
  },
  {
    src: "/marketing/waitlist/review-form.png",
    slot: "br",
    eyebrow: "Earn",
    title: "Quality pays",
    description: "Thoughtful reviews earn Dots.",
  },
];

function PhoneDevice({ src, priority }: { src: string; priority?: boolean }) {
  return (
    <div className="waitlist-phone-device">
      <div className="waitlist-phone-shell">
        <div className="waitlist-phone-notch" aria-hidden />
        <div className="waitlist-phone-screen">
          <Image
            src={src}
            alt=""
            fill
            sizes="280px"
            className="waitlist-phone-shot"
            priority={priority}
            unoptimized
          />
        </div>
        <div className="waitlist-phone-shine" aria-hidden />
        <div className="waitlist-phone-scan" aria-hidden />
      </div>
      <div className="waitlist-phone-shadow" aria-hidden />
    </div>
  );
}

export function WaitlistPhoneShowcase() {
  return (
    <div className="waitlist-phone-showcase" aria-label="App preview">
      <div className="waitlist-3d-field">
        <div className="waitlist-3d-orb waitlist-3d-orb-a" aria-hidden />
        <div className="waitlist-3d-orb waitlist-3d-orb-b" aria-hidden />
        <div className="waitlist-3d-grid-floor" aria-hidden />
        <div className="waitlist-3d-scene">
          {PHONES.map((phone, i) => (
            <article
              key={phone.src}
              className={`waitlist-3d-unit waitlist-3d-unit--${phone.slot}`}
            >
              <PhoneDevice src={phone.src} priority={i === 0} />
              <div className={`waitlist-3d-caption waitlist-3d-caption--${phone.slot}`}>
                <p className="waitlist-phone-eyebrow">{phone.eyebrow}</p>
                <p className="waitlist-phone-title">{phone.title}</p>
                <p className="waitlist-phone-desc">{phone.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
