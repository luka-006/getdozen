import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Wallet",
  description: "Credits and payouts on Dozen.",
  path: "/wallet",
  index: false,
});

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
