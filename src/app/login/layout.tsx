import { assertProductAccess } from "@/lib/waitlist-guard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to Dozen with Google or email.",
  path: "/login",
  index: false,
});

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertProductAccess();
  return children;
}
