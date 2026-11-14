import { assertProductAccess } from "@/lib/waitlist-guard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Board",
  description: "Open tester and feedback requests on Dozen.",
  path: "/board",
  index: false,
});

export default async function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertProductAccess();
  return children;
}
