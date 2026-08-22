import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Waitlist",
  description: "Dozen waitlist confirmation.",
  path: "/waitlist/confirmed",
  index: false,
});

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
