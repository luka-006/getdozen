"use client";

import Image from "next/image";

type PhoneCard = {
  src: string;
  placement: "tl" | "mr" | "bl";
  size: "sm" | "md" | "lg";
  eyebrow: string;
  title: string;
  description: string;
  captionSide: "left" | "right" | "below";
  objectPosition: string;
};

const PHONES: PhoneCard[] = [
  {
    src: "/marketing/waitlist/board-testers.png",
    placement: "tl",
    size: "md",
    eyebrow: "Test",
    title: "14-day runs",
    description: "Opt in once. Check in every few days.",
    captionSide: "right",
    objectPosition: "left top",
  },
  {
    src: "/marketing/waitlist/request-detail.png",
    placement: "mr",
    size: "lg",
    eyebrow: "Progress",
    title: "Track the run",
    description: "Check-ins, ratings, and tester slots live.",
    captionSide: "left",
    objectPosition: "left top",
  },
  {
    src: "/marketing/waitlist/review-form.png",
    placement: "bl",
    size: "sm",
    eyebrow: "Earn",
    title: "Quality pays",
    description: "Thoughtful reviews earn Dots.",
    captionSide: "below",
    objectPosition: "center top",
  },
];

function PhoneDevice({
  src,
  size,
  priority,
  objectPosition,
}: {
  src: string;
  size: PhoneCard["size"];
  priority?: boolean;
  objectPosition: string;
}) {
  return (
    <div className={`waitlist-phone-device waitlist-phone-device--${size}`}>
      <div className="waitlist-phone-shell">
        <div className="waitlist-phone-notch" aria-hidden />
        <div className="waitlist-phone-screen">
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 140px, 200px"
            className="waitlist-phone-shot"
            style={{ objectPosition }}
            priority={priority}
            unoptimized
          />
        </div>
        <div className="waitlist-phone-shine" aria-hidden />
      </div>
      <div className="waitlist-phone-shadow" aria-hidden />
    </div>
  );
}

function Caption({ phone }: { phone: PhoneCard }) {
  return (
    <div className="waitlist-phone-caption">
      <p className="waitlist-phone-eyebrow">{phone.eyebrow}</p>
      <p className="waitlist-phone-title">{phone.title}</p>
      <p className="waitlist-phone-desc">{phone.description}</p>
    </div>
  );
}

export function WaitlistPhoneShowcase() {
  return (
    <div className="waitlist-phone-showcase" aria-label="App preview">
      <div className="waitlist-spread-glow" aria-hidden />
      <div className="waitlist-spread">
        {PHONES.map((phone, i) => (
          <article
            key={phone.src}
            className={`waitlist-spread-card waitlist-spread-card--${phone.placement} waitlist-spread-card--caption-${phone.captionSide}`}
          >
            {phone.captionSide === "left" ? (
              <>
                <Caption phone={phone} />
                <PhoneDevice
                  src={phone.src}
                  size={phone.size}
                  objectPosition={phone.objectPosition}
                  priority={i === 1}
                />
              </>
            ) : phone.captionSide === "below" ? (
              <>
                <PhoneDevice
                  src={phone.src}
                  size={phone.size}
                  objectPosition={phone.objectPosition}
                  priority={i === 2}
                />
                <Caption phone={phone} />
              </>
            ) : (
              <>
                <PhoneDevice
                  src={phone.src}
                  size={phone.size}
                  objectPosition={phone.objectPosition}
                  priority={i === 0}
                />
                <Caption phone={phone} />
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
