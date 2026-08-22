import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Confirm",
  description: "Complete sign-in on Dozen.",
  path: "/auth/confirm",
  index: false,
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
