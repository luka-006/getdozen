import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Request",
  description: "A Dozen tester or feedback request.",
  path: "/requests/new",
  index: false,
});

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
