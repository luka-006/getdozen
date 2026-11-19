import { assertProductAccess } from "@/lib/waitlist-guard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Wallet",
  description: "Credits and payouts on Dozen.",
  path: "/wallet",
  index: false,
});

export default async function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertProductAccess();
  return children;
}
