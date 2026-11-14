import { assertProductAccess } from "@/lib/waitlist-guard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Testers",
  description: "Your tester commitments and check-ins on Dozen.",
  path: "/testers",
  index: false,
});

export default async function TestersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertProductAccess();
  return children;
}
