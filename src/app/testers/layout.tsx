import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Testers",
  description: "Your tester commitments and check-ins on Dozen.",
  path: "/testers",
  index: false,
});

export default function TestersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
