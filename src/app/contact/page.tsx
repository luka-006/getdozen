import type { Metadata } from "next";
import { SupportForm } from "@/components/support-form";
import { getProfile } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { SITE_EMAIL } from "@/lib/site-email";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `Contact Dozen at ${SITE_EMAIL}.`,
  path: "/contact",
});

export default async function ContactPage() {
  const profile = await getProfile();

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <h1 className="font-display text-[32px] font-semibold">Contact</h1>
      <p className="mt-2 text-[15px] text-ink/70">
        Reach us at{" "}
        <span className="font-medium text-ink">{SITE_EMAIL}</span>. Use the form
        below — it delivers straight to our inbox (no mail app required).
      </p>
      <div className="surface mt-8 p-5">
        <SupportForm email={profile?.email ?? ""} />
      </div>
    </div>
  );
}
