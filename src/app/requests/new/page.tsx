import {
  createComboRequest,
  createFeedbackRequest,
  createTesterRequest,
} from "@/actions/requests";
import { CreditIcon } from "@/components/icons";
import { ComboRequestForm } from "@/components/combo-request-form";
import { FeedbackRequestForm } from "@/components/feedback-request-form";
import { TesterRequestForm } from "@/components/tester-request-form";
import { TrackTabs } from "@/components/track-tabs";
import { requireProfile } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { formatCredits } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ type?: string; error?: string }>;
};

export const metadata = pageMetadata({
  title: "Post request",
  description: "Post a tester or feedback request on Dozen.",
  path: "/requests/new",
  index: false,
});

export default async function NewRequestPage({ searchParams }: Props) {
  const profile = await requireProfile();
  const params = await searchParams;
  const track =
    params.type === "feedback"
      ? "feedback"
      : params.type === "combo"
        ? "combo"
        : "tester";

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <div>
        <h1 className="font-display text-[32px] font-semibold">Post request</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-ink/65">
          <CreditIcon className="h-4 w-4 text-ink" />
          <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono text-ink">
            {formatCredits(profile.credits)}
          </span>
        </p>
      </div>

      <TrackTabs active={track} variant="post" />

      {track === "tester" ? (
        <TesterRequestForm action={createTesterRequest} />
      ) : track === "combo" ? (
        <ComboRequestForm
          balance={Number(profile.credits)}
          action={createComboRequest}
        />
      ) : (
        <FeedbackRequestForm
          balance={Number(profile.credits)}
          action={createFeedbackRequest}
        />
      )}
    </div>
  );
}
