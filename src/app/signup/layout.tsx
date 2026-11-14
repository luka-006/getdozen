import { assertProductAccess } from "@/lib/waitlist-guard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Create account",
  description: "Create a Dozen account to post apps and earn by testing.",
  path: "/signup",
  index: false,
});

export default async function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertProductAccess();
  return children;
}
