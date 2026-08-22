import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Setup",
  description: "Dozen environment status.",
  path: "/setup",
  index: false,
});

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
