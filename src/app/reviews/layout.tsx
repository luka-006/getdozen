import { assertProductAccess } from "@/lib/waitlist-guard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Review",
  description: "Submit or confirm a Dozen review.",
  path: "/reviews",
  index: false,
});

export default async function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertProductAccess();
  return children;
}
