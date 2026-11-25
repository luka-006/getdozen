import { currencyUnits } from "@/lib/currency";
import { REFERRAL_BONUS_DOTS, WAITLIST_BONUS_DOTS } from "@/lib/waitlist-rewards";

function JoinLink() {
  return (
    <a href="#waitlist" className="btn btn-primary mt-6">
      Join waitlist
    </a>
  );
}

function Figure({ value, unit }: { value: string; unit?: string }) {
  return (
    <p className="waitlist-figure">
      {value}
      {unit ? <span className="waitlist-figure-unit">{unit}</span> : null}
    </p>
  );
}

export function WaitlistReasons() {
  return (
    <div className="waitlist-reasons">
      <section id="reason-bonus" className="waitlist-reason waitlist-reason-lead" aria-labelledby="reason-bonus-title">
        <div>
          <h2 id="reason-bonus-title" className="font-mono text-[12px] uppercase tracking-[0.14em] text-blue">
            Waitlist bonus
          </h2>
          <Figure value={`+${WAITLIST_BONUS_DOTS}`} unit={currencyUnits(WAITLIST_BONUS_DOTS)} />
          <p className="hero-lead mt-4">Credited once when your account is created at launch.</p>
          <JoinLink />
        </div>
      </section>

      <section id="reason-referral" className="waitlist-reason waitlist-reason-lead waitlist-reason-split" aria-labelledby="reason-referral-title">
        <div>
          <h2 id="reason-referral-title" className="font-mono text-[12px] uppercase tracking-[0.14em] text-blue">
            Referrals
          </h2>
          <Figure value={`+${REFERRAL_BONUS_DOTS}`} unit={currencyUnits(REFERRAL_BONUS_DOTS)} />
          <p className="hero-lead mt-4">For each friend who joins from your link.</p>
          <JoinLink />
        </div>
        <div className="waitlist-reason-shot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="waitlist-reason-phone"
            src="/marketing/waitlist/frames/mobile/15.webp"
            alt=""
            width={780}
            height={1688}
          />
        </div>
      </section>

      <section id="reason-dots" className="waitlist-reason waitlist-reason-quiet" aria-labelledby="reason-dots-title">
        <h2 id="reason-dots-title" className="font-mono text-[12px] uppercase tracking-[0.14em] text-blue">
          Dots
        </h2>
        <div className="waitlist-reason-pair">
          <div>
            <Figure value="Earn" />
            <p className="hero-lead mt-3">Review other makers&apos; apps.</p>
          </div>
          <div>
            <Figure value="Spend" />
            <p className="hero-lead mt-3">Structured reviews of your own.</p>
          </div>
        </div>
        <JoinLink />
      </section>

      <section id="reason-get" className="waitlist-reason waitlist-reason-quiet" aria-labelledby="reason-get-title">
        <h2 id="reason-get-title" className="font-mono text-[12px] uppercase tracking-[0.14em] text-blue">
          What you get
        </h2>
        <div className="waitlist-reason-pair">
          <figure>
            <div className="waitlist-reason-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="waitlist-reason-phone"
                src="/marketing/waitlist/frames/mobile/00.webp"
                alt=""
                width={780}
                height={1688}
              />
            </div>
            <figcaption>
              <Figure value="Reviews" />
              <p className="hero-lead mt-3">Structured notes instead of a pile of screenshots.</p>
            </figcaption>
          </figure>
          <figure>
            <div className="waitlist-reason-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="waitlist-reason-phone"
                src="/marketing/waitlist/frames/mobile/10.webp"
                alt=""
                width={780}
                height={1688}
              />
            </div>
            <figcaption>
              <Figure value="Testers" />
              <p className="hero-lead mt-3">Real testers. Honest feedback.</p>
            </figcaption>
          </figure>
        </div>
        <JoinLink />
      </section>

      <section id="reason-early" className="waitlist-reason waitlist-reason-quiet" aria-labelledby="reason-early-title">
        <h2 id="reason-early-title" className="font-mono text-[12px] uppercase tracking-[0.14em] text-blue">
          Early access
        </h2>
        <Figure value="First" />
        <p className="hero-lead mt-4">First in at launch.</p>
        <JoinLink />
      </section>
    </div>
  );
}
