import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Review",
  description: "Submit or confirm a Dozen review.",
  path: "/reviews",
  index: false,
});

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
