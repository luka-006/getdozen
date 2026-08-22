import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Board",
  description: "Open tester and feedback requests on Dozen.",
  path: "/board",
  index: false,
});

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
